// controller/payments_flow.go
package controller

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// POST /booking-rooms/:id/payments (multipart)  fields: Amount, PayerID, PaymentDate, slip(file)
// SubmitPaymentSlip รับ JSON แทน form-data
func SubmitPaymentSlip(c *gin.Context) {
	db := config.DB()
	id := c.Param("id") // booking_id

	// ตรวจ booking
	var booking entity.BookingRoom
	if err := db.First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	// รับไฟล์
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาแนบไฟล์สลิป"})
		return
	}

	// เตรียม path และสร้างโฟลเดอร์ถ้ายังไม่มี
	baseDir := "images/payment/user_submitted"
	if err := os.MkdirAll(baseDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์อัพโหลดได้"})
		return
	}

	ext := filepath.Ext(file.Filename)
	name := strings.TrimSuffix(file.Filename, ext)
	if name == "" {
		name = "slip"
	}
	uniqueName := fmt.Sprintf("booking_%d_%d_%s%s", booking.ID, time.Now().Unix(), name, ext)
	savePath := filepath.Join(baseDir, uniqueName)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	// รับฟิลด์อื่น ๆ จาก formData
	amount, _ := strconv.ParseFloat(c.PostForm("Amount"), 64)
	payerIDu64, _ := strconv.ParseUint(c.PostForm("PayerID"), 10, 64)
	note := c.PostForm("Note")
	paymentDate := time.Now()

	// หา/สร้าง PaymentStatus = "Pending Verification"
	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower("Pending Verification")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Pending Verification"}
			if err := db.Create(&ps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Pending Verification ไม่สำเร็จ"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Pending Verification ไม่สำเร็จ"})
			return
		}
	}

	// อัปเดต/สร้าง payment ล่าสุดของ booking นี้
	var payment entity.Payment
	tx := db.Begin()
	if err := tx.Where("booking_room_id = ?", booking.ID).
		Order("id DESC").
		First(&payment).Error; err == nil {
		// update
		payment.Amount = amount
		payment.SlipPath = "/" + savePath
		payment.Note = note
		payment.StatusID = ps.ID
		payment.PaymentDate = paymentDate
		payment.PayerID = uint(payerIDu64)

		if err := tx.Save(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตข้อมูลการชำระเงินไม่สำเร็จ"})
			return
		}
	} else if errors.Is(err, gorm.ErrRecordNotFound) {
		// create
		payment = entity.Payment{
			BookingRoomID: booking.ID,
			Amount:        amount,
			SlipPath:      "/" + savePath,
			Note:          note,
			StatusID:      ps.ID,
			PaymentDate:   paymentDate,
			PayerID:       uint(payerIDu64),
		}
		if err := tx.Create(&payment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลการชำระเงินไม่สำเร็จ"})
			return
		}
	} else {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ค้นหาข้อมูลการชำระเงินไม่สำเร็จ"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "อัปโหลดสลิปสำเร็จ",
		"payment": payment,
	})
}


// POST /payments/:id/approve
func ApprovePayment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id") // payment id

	var payment entity.Payment
	if err := db.First(&payment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ payment"})
		return
	}

	// หา/สร้าง "Paid"
	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower("Paid")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Paid"}
			if err := db.Create(&ps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Paid ไม่สำเร็จ"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Paid ไม่สำเร็จ"})
			return
		}
	}

	payment.StatusID = ps.ID
	payment.Note = "ชำระเงินแล้ว"

	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment approved", "payment": payment})
}


func MarkPaymentPaid(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var payment entity.Payment
	if err := db.First(&payment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ payment"})
		return
	}

	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower("Paid")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Paid"}
			if err := db.Create(&ps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Paid ไม่สำเร็จ"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Paid ไม่สำเร็จ"})
			return
		}
	}

	payment.StatusID = ps.ID
	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment marked as Paid", "payment": payment})
}


// POST /payments/:id/reject
func RejectPayment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var payment entity.Payment
	if err := db.First(&payment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ payment"})
		return
	}

	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower("Rejected")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Rejected"}
			if err := db.Create(&ps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Rejected ไม่สำเร็จ"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Rejected ไม่สำเร็จ"})
			return
		}
	}

	payment.StatusID = ps.ID
	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Payment rejected", "payment": payment})
}


func RefundedBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id") // booking id

	var booking entity.BookingRoom
	if err := db.Preload("Payments").First(&booking, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}

	if len(booking.Payments) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No payment to refund"})
		return
	}

	// ใช้รายการล่าสุด
	latestPayment := booking.Payments[len(booking.Payments)-1]

	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower("Refunded")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Refunded"}
			if err := db.Create(&ps).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Refunded ไม่สำเร็จ"})
				return
			}
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Refunded ไม่สำเร็จ"})
			return
		}
	}

	latestPayment.StatusID = ps.ID
	if err := db.Save(&latestPayment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Refunded successfully"})
}
