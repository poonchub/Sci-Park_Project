// controller/payments_flow.go
package controller

import (
	"fmt"
	"net/http"
	"strconv"

	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
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

	// บันทึกไฟล์ไปใน server
	savePath := fmt.Sprintf("images/payment/user_submitted/%s", file.Filename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"})
		return
	}

	// รับฟิลด์อื่น ๆ จาก formData
	amount, _ := strconv.ParseFloat(c.PostForm("Amount"), 64)
	payerID, _ := strconv.ParseUint(c.PostForm("PayerID"), 10, 64)
	note := c.PostForm("Note")
	paymentDate := time.Now()

	// หา status "Pending Verification"
	psID, _ := mustPaymentStatusID("Pending Verification")

	// ❗ ถ้ามี payment เดิม → update, ถ้าไม่มีก็ create
	var payment entity.Payment
	if err := db.Where("booking_room_id = ?", booking.ID).First(&payment).Error; err == nil {
		// update
		payment.Amount = amount
		payment.SlipPath = "/" + savePath
		payment.Note = note
		payment.StatusID = psID
		payment.PaymentDate = paymentDate
		payment.PayerID = uint(payerID)

		db.Save(&payment)
	} else {
		// create
		payment = entity.Payment{
			BookingRoomID: booking.ID,
			Amount:        amount,
			SlipPath:      "/" + savePath,
			Note:          note,
			StatusID:      psID,
			PaymentDate:   paymentDate,
			PayerID:       uint(payerID),
		}
		db.Create(&payment)
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

	statusID, _ := mustPaymentStatusID("Paid") // ✅ ใช้ Paid แทน
	payment.StatusID = statusID
	payment.Note = "ชำระเงินแล้ว"
	db.Save(&payment)

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

	statusID, _ := mustPaymentStatusID("Paid")
	payment.StatusID = statusID
	db.Save(&payment)

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

	statusID, _ := mustPaymentStatusID("Rejected")
	payment.StatusID = statusID
	db.Save(&payment)

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

    latestPayment := booking.Payments[len(booking.Payments)-1]
    refundStatusID, _ := mustPaymentStatusID("Refunded")
    latestPayment.StatusID = refundStatusID

    if err := db.Save(&latestPayment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Refunded successfully"})
}
