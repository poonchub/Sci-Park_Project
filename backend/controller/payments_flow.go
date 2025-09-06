// controller/payment.go
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

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"
)

func SubmitPaymentSlip(c *gin.Context) {
	db := config.DB()

	// (แนะนำใน setup router) c.Request.Body size guard:
	// r.MaxMultipartMemory = 12 << 20 // 12 MB

	bookingID := c.Param("id")

	// 1) ตรวจว่ามี booking จริง
	var booking entity.BookingRoom
	if err := db.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	// TODO: ตรวจสิทธิ์ว่าเป็นเจ้าของ booking หรือเป็น admin/manager

	// 2) รับไฟล์ + ตรวจขนาด/ชนิดไฟล์
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาแนบไฟล์สลิป"})
		return
	}
	if fileHeader.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไฟล์ใหญ่เกิน 10MB"})
		return
	}

	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	allowedExt := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".webp": true}
	if !allowedExt[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "อนุญาตเฉพาะไฟล์ JPG/PNG/WebP"})
		return
	}

	// sniff MIME
	f, _ := fileHeader.Open()
	defer f.Close()
	buf := make([]byte, 512)
	n, _ := f.Read(buf)
	mime := http.DetectContentType(buf[:n])
	allowedMime := map[string]bool{"image/jpeg": true, "image/png": true, "image/webp": true}
	if !allowedMime[mime] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ชนิดไฟล์ไม่ถูกต้อง"})
		return
	}

	// 3) พาร์สฟิลด์ที่จำเป็น
	amount, err := strconv.ParseFloat(c.PostForm("Amount"), 64)
	if err != nil || amount <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Amount ไม่ถูกต้อง"})
		return
	}
	payerIDu64, err := strconv.ParseUint(c.PostForm("PayerID"), 10, 64)
	if err != nil || payerIDu64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PayerID ไม่ถูกต้อง"})
		return
	}
	note := c.PostForm("Note")

	paymentDate := time.Now()
	if pd := c.PostForm("PaymentDate"); pd != "" {
		// คาดหวัง RFC3339 เช่น 2025-09-02T10:15:00+07:00
		if t, err := time.Parse(time.RFC3339, pd); err == nil {
			paymentDate = t
		}
	}

	// 4) บันทึกไฟล์ด้วยชื่อใหม่ (ลดความเสี่ยง และไม่ใช้ชื่อเดิม)
	baseDir := "images/payment/user_submitted"
	if err := os.MkdirAll(baseDir, 0o755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์อัปโหลดได้"})
		return
	}
	filename := fmt.Sprintf("booking_%s_%d%s", bookingID, time.Now().UnixNano(), ext)
	savePathFS := filepath.Join(baseDir, filename) // path ในไฟล์ระบบ
	if err := c.SaveUploadedFile(fileHeader, savePathFS); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	// ✅ เก็บ "เว็บพาธ" ให้แมตช์กับ r.Static("/images", "./images")
	// จะเข้าถึงได้ที่: http://<host>/images/payment/user_submitted/<filename>
	slipWebPath := "/images/payment/user_submitted/" + filename

	// 5) หา/สร้างสถานะ "Pending Verification" (ตั้งฝั่งเซิร์ฟเวอร์เสมอ)
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

	// 6) สร้าง Payment ใหม่ทุกครั้ง เพื่อเก็บประวัติการอัปโหลด
	payment := entity.Payment{
		BookingRoomID: booking.ID,
		Amount:        amount,
		SlipPath:      slipWebPath, // <-- ใช้เว็บพาธ
		Note:          note,
		StatusID:      ps.ID, // Pending Verification
		PaymentDate:   paymentDate,
		PayerID:       uint(payerIDu64),
	}
	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลการชำระเงินไม่สำเร็จ"})
		return
	}

	// (Option) สร้าง absolute URL เผื่อ FE ใช้ง่าย
	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}
	absURL := fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, slipWebPath)

	c.JSON(http.StatusCreated, gin.H{
		"message":  "อัปโหลดสลิปสำเร็จ",
		"payment":  payment, // payment.SlipPath = "/images/payment/user_submitted/<filename>"
		"slip_url": absURL,  // เช่น "http://localhost:8000/images/payment/user_submitted/<filename>"
	})
}

// func applyPaymentToInvoice(db *gorm.DB, invoiceID uint, amount float64, paidAt time.Time) error {
//     var inv entity.Invoice
//     if err := db.First(&inv, invoiceID).Error; err != nil { return err }

//     newPaid := inv.PaidAmount + amount
//     statusName := "Partially Paid"
//     if newPaid <= 0 {
//         statusName = "Unpaid"
//     } else if newPaid+1e-6 >= inv.TotalAmount { // กันพลาด float
//         statusName = "Paid"
//         newPaid = inv.TotalAmount
//     }
//     var st entity.PaymentStatus
//     if err := db.Where("LOWER(name)=?", strings.ToLower(statusName)).First(&st).Error; err != nil {
//         st = entity.PaymentStatus{Name: statusName}
//         if err := db.Create(&st).Error; err != nil { return err }
//     }

//     return db.Model(&entity.Invoice{}).
//         Where("id = ?", inv.ID).
//         Updates(map[string]any{
//             "paid_amount": newPaid,
//             "status_id":   st.ID,
//             "updated_at":  time.Now(),
//         }).Error
// }

// POST /payments/:id/approve
// func ApprovePayment(c *gin.Context) {
//     db := config.DB()
//     id := c.Param("id")

//     var p entity.Payment
//     if err := db.First(&p, id).Error; err != nil {
//         c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบ payment"}); return
//     }

//     // → เซ็ตสถานะ Paid ให้ payment
//     var ps entity.PaymentStatus
//     if err := db.Where("LOWER(name)=?","paid").First(&ps).Error; err != nil {
//         ps = entity.PaymentStatus{Name:"Paid"}; _ = db.Create(&ps).Error
//     }
//     p.StatusID = ps.ID
//     if err := db.Save(&p).Error; err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error":"อัปเดตสถานะไม่สำเร็จ"}); return
//     }

//     // → ตัดยอดเข้า invoice ถ้ามี
//     if p.InvoiceID != 0 && p.Amount > 0 {
//         if err := applyPaymentToInvoice(db, p.InvoiceID, p.Amount, p.PaymentDate); err != nil {
//             c.JSON(http.StatusInternalServerError, gin.H{"error":"ตัดยอดเข้าใบแจ้งหนี้ไม่สำเร็จ"}); return
//         }
//     }

//     c.JSON(http.StatusOK, gin.H{"message": "Payment approved", "payment": p})
// }


// func MarkPaymentPaid(c *gin.Context) {
// 	db := config.DB()
// 	id := c.Param("id")

// 	var payment entity.Payment
// 	if err := db.First(&payment, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ payment"})
// 		return
// 	}

// 	var ps entity.PaymentStatus
// 	if err := db.Where("LOWER(name) = ?", strings.ToLower("Paid")).First(&ps).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			ps = entity.PaymentStatus{Name: "Paid"}
// 			if err := db.Create(&ps).Error; err != nil {
// 				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Paid ไม่สำเร็จ"})
// 				return
// 			}
// 		} else {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Paid ไม่สำเร็จ"})
// 			return
// 		}
// 	}

// 	payment.StatusID = ps.ID
// 	if err := db.Save(&payment).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
// 		return
// 	}

// 	if payment.InvoiceID != 0 {
// 		if err := ApplyPaymentToInvoiceID(payment.InvoiceID, payment.Amount, payment.PaymentDate); err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "ปรับยอดใบแจ้งหนี้ไม่สำเร็จ"})
// 			return
// 		}
// 	}

// 	c.JSON(http.StatusOK, gin.H{"message": "Payment marked as Paid", "payment": payment})
// }

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
