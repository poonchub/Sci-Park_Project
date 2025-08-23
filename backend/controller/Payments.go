package controller

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"time"

	"github.com/gin-gonic/gin"
)

func GetPendingPayments(c *gin.Context) {
	db := config.DB()

	var bookings []entity.BookingRoom

	// ดึง BookingRoom ที่ยังไม่มี Payment ที่สถานะ Confirmed
	err := db.Preload("User").
		Preload("Room").
		Preload("TimeSlot").
		Preload("Payments", "status != ?", "confirmed"). // ดึง payment ที่ยังไม่ confirm
		Where("id IN (?)", db.Model(&entity.Payment{}).
			Select("booking_room_id").
			Where("status != ?", "confirmed")).
		Find(&bookings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"pending_bookings": bookings,
	})
}

type PaymentUpdateInput struct {
	PaymentID uint   `json:"payment_id" binding:"required"`
	Status    string `json:"status" binding:"required,oneof=pending confirmed cancelled"`
}

func UpdatePaymentStatus(c *gin.Context) {
	db := config.DB()

	var input PaymentUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	var payment entity.Payment
	if err := db.First(&payment, input.PaymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการชำระเงินนี้"})
		return
	}

	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตสถานะได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตสถานะสำเร็จ"})
}

func CancelExpiredBookings() {
	db := config.DB()
	expiryDuration := 15 * time.Minute
	cutoffTime := time.Now().Add(-expiryDuration)

	var expiredBookings []entity.BookingRoom

	// ดึง BookingRoom ที่สร้างเก่ากว่า cutoffTime
	err := db.Where("created_at <= ?", cutoffTime).Find(&expiredBookings).Error
	if err != nil {
		log.Println("Error fetching expired bookings:", err)
		return
	}

	for _, booking := range expiredBookings {
		var confirmedPayments []entity.Payment
		err := db.Joins("JOIN payment_statuses ON payment_statuses.id = payments.status_id").
			Where("payments.booking_room_id = ? AND payment_statuses.name = ?", booking.ID, "confirmed").
			Find(&confirmedPayments).Error
		if err != nil {
			log.Println("Error fetching payments for booking", booking.ID, err)
			continue
		}

		if len(confirmedPayments) == 0 {
			log.Println("Booking", booking.ID, "ไม่มี payment confirmed")
			if err := db.Delete(&booking).Error; err != nil {
				log.Println("Error cancelling booking ID", booking.ID, err)
			} else {
				log.Println("Cancelled expired booking ID", booking.ID)
			}
		} else {
			log.Println("Booking", booking.ID, "มี payment แล้ว ไม่ลบ")
		}
	}
}

func CancelExpiredBookingsHandler(c *gin.Context) {
	CancelExpiredBookings() // เรียกฟังก์ชันเดิม
	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกการจองที่หมดอายุแล้วเรียบร้อย"})
}

// GET /payment/:userId
func GetPaymentByUserID(c *gin.Context) {
	ID := c.Param("userId")
	var payment entity.Payment

	db := config.DB()

	result := db.Where("payer_id = ?", ID).Find(&payment)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
	}

	c.JSON(http.StatusOK, payment)
}

// GET /payment-option
func GetPaymentByOption(c *gin.Context) {
	var payment []entity.Payment
	db := config.DB()

	payerID, _ := strconv.Atoi(c.DefaultQuery("payerID", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := db.Model(&entity.Payment{})

	if payerID != 0 {
		query = query.Where("payer_id = ?", payerID)
	}

	query = query.
		Preload("Status")

	if err := query.Limit(limit).Offset(offset).Find(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var total int64
	countQuery := db.Model(&entity.Payment{})

	if payerID != 0 {
		countQuery = countQuery.Where("payer_id = ?", payerID)
	}
	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"data":       payment,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// POST /payment
func CreatePayment(c *gin.Context) {
	db := config.DB()

	paymentDateStr := c.PostForm("PaymentDate")
	amountStr := c.PostForm("Amount")
	payerIDStr := c.PostForm("PayerID")
	bookingRoomIDStr := c.PostForm("BookingRoomID")
	invoiceIDStr := c.PostForm("InvoiceID")

	// แปลง string เป็นค่าที่ต้องการ
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid amount"})
		return
	}

	payerID, err := strconv.ParseUint(payerIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}

	paymentDate, err := time.Parse(time.RFC3339Nano, paymentDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment date format"})
		return
	}

	var payer entity.User
	if err := db.First(&payer, payerID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var bookingRoomID, invoiceID uint
	if bookingRoomIDStr != "" {
		brID, err := strconv.ParseUint(bookingRoomIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BookingRoomID"})
			return
		}
		bookingRoomID = uint(brID)

		var booking entity.BookingRoom
		if err := db.First(&booking, bookingRoomID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
	}

	if invoiceIDStr != "" {
		invID, err := strconv.ParseUint(invoiceIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid InvoiceID"})
			return
		}
		invoiceID = uint(invID)

		var invoice entity.Invoice
		if err := db.First(&invoice, invoiceID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "invoice not found"})
			return
		}
	}

	// ตรวจสอบว่ามีการส่งมาอย่างน้อย 1 อย่าง
	if bookingRoomID == 0 && invoiceID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "BookingRoomID or InvoiceID must be provided"})
		return
	}

	// อัปโหลดไฟล์ slip
	form, err := c.MultipartForm()
	var slipPath string
	if err == nil {
		files := form.File["slip"]
		if len(files) > 0 {
			file := files[0]
			folderPath := fmt.Sprintf("images/payment/user%d/slips", payer.ID)
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
				return
			}

			ext := ".png"
			newFileName := "slip_" + strconv.FormatInt(time.Now().Unix(), 10) + ext
			fullPath := path.Join(folderPath, newFileName)

			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
				return
			}

			slipPath = fullPath
		}
	}

	var status entity.PaymentStatus
	if err := db.Where("name = ?", "Pending Verification").First(&status).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request status 'Paid' not found"})
		return
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	payment := entity.Payment{
		PaymentDate:   paymentDate.In(loc),
		Amount:        amount,
		SlipPath:      slipPath,
		StatusID:      status.ID,
		PayerID:       uint(payerID),
		BookingRoomID: bookingRoomID,
		InvoiceID:     invoiceID,
	}

	// ตรวจสอบว่ามี payment ซ้ำหรือไม่
	var existing entity.Payment
	if bookingRoomID != 0 {
		if err := db.Where("payer_id = ? AND booking_room_id = ?", payment.PayerID, payment.BookingRoomID).
			First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Payment already exists for this booking."})
			return
		}
	}
	if invoiceID != 0 {
		if err := db.Where("payer_id = ? AND invoice_id = ?", payment.PayerID, payment.InvoiceID).
			First(&existing).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Payment already exists for this invoice."})
			return
		}
	}

	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Payment created successfully", "payment": payment})
}

// PATCH /payment/:id
func UpdatePaymentByID(c *gin.Context) {
	type PaymentUpdateInput struct {
		PaymentDate *time.Time
		StatusID    *uint
		Note        *string
		ApproverID  *uint
		Amount      *float64
	}

	ID := c.Param("id")
	db := config.DB()

	var payment entity.Payment
	if err := db.First(&payment, ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ID not found"})
		return
	}

	// JSON ที่มากับ request
	var input PaymentUpdateInput
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	// อัปเดต field ทีละตัว
	if input.PaymentDate != nil {
		payment.PaymentDate = *input.PaymentDate
	}
	if input.Amount != nil {
		payment.Amount = *input.Amount
	}
	if input.Note != nil {
		payment.Note = *input.Note
	}
	if input.StatusID != nil {
		payment.StatusID = *input.StatusID
	}
	if input.ApproverID != nil {
		payment.ApproverID = *input.ApproverID
	}

	// ตรวจสอบไฟล์แนบ
	form, err := c.MultipartForm()
	if err == nil {
		// ✅ อัปโหลด Slip (รูปภาพ)
		if slipFiles, ok := form.File["slip"]; ok && len(slipFiles) > 0 {
			file := slipFiles[0]

			// ลบไฟล์เดิมถ้ามี
			if payment.SlipPath != "" {
				os.Remove(payment.SlipPath)
			}

			folderPath := fmt.Sprintf("images/payment/user%d/slips", payment.PayerID)
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder for slip"})
				return
			}

			ext := ".png"
			newFileName := "slip_" + strconv.FormatInt(time.Now().Unix(), 10) + ext
			fullPath := path.Join(folderPath, newFileName)

			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save slip file"})
				return
			}
			payment.SlipPath = fullPath
		}

		// ✅ อัปโหลด Receipt (PDF)
		if receiptFiles, ok := form.File["receipt"]; ok && len(receiptFiles) > 0 {
			file := receiptFiles[0]

			// ลบไฟล์เดิมถ้ามี
			if payment.ReceiptPath != "" {
				os.Remove(payment.ReceiptPath)
			}

			folderPath := fmt.Sprintf("images/payment/user%d/receipts", payment.PayerID)
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder for receipt"})
				return
			}

			// บังคับเป็น .pdf
			newFileName := "receipt_" + strconv.FormatInt(time.Now().Unix(), 10) + ".pdf"
			fullPath := path.Join(folderPath, newFileName)

			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save receipt file"})
				return
			}
			payment.ReceiptPath = fullPath
		}
	}

	// บันทึกข้อมูล
	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update successful",
		"data":    payment,
	})
}

// DELETE /payment-receipt/:id
func DeletePaymentReceiptByID(c *gin.Context) {
	ID := c.Param("id")
	db := config.DB()

	var payment entity.Payment
	if err := db.First(&payment, ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ID not found"})
		return
	}

	if payment.ReceiptPath != "" {
		if err := os.Remove(payment.ReceiptPath); err != nil {
			fmt.Println("Warning: file not found on disk:", err)
		}
		payment.ReceiptPath = ""
	}

	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Receipt deleted successfully",
		"data":    payment,
	})
}