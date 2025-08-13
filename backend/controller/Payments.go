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

// POST /payment
func CreatePayment(c *gin.Context) {
	db := config.DB()

	paymentDateStr := c.PostForm("PaymentDate")
	amountStr := c.PostForm("Amount")
	userIDStr := c.PostForm("UserID")
	bookingRoomIDStr := c.PostForm("BookingRoomID")

	// แปลง string เป็นค่าที่ต้องการ (เช่น float, uint)
	amount, err := strconv.ParseFloat(amountStr, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid amount"})
		return
	}
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid UserID"})
		return
	}
	bookingRoomID, err := strconv.ParseUint(bookingRoomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid BookingRoomID"})
		return
	}
	paymentDate, err := time.Parse(time.RFC3339Nano, paymentDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payment date format"})
		return
	}

	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var booking entity.BookingRoom
	if err := db.First(&booking, bookingRoomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	form, err := c.MultipartForm()
	var slipPath string
	if err == nil {
		files := form.File["files"]
		if len(files) > 0 {
			file := files[0]

			// เตรียมโฟลเดอร์
			folderPath := fmt.Sprintf("images/payment/user%d", user.ID)
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
				return
			}

			// สร้างชื่อไฟล์ใหม่
			ext := ".png"
			newFileName := fmt.Sprintf("slip_room_booking%d%s", booking.ID, ext)
			fullPath := path.Join(folderPath, newFileName)

			// บันทึกไฟล์
			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
				return
			}

			// บันทึก path ไฟล์ลงใน database
			slipPath = fullPath // หรือใช้ URL prefix ตามเว็บคุณ
		}
	}

	payment := entity.Payment{
		PaymentDate: paymentDate,
		Amount:      amount,
		SlipPath:    slipPath,
		// Note:          note,
		StatusID:      1,
		UserID:        uint(userID),
		BookingRoomID: uint(bookingRoomID),
	}

	var existing entity.Payment
	if err := db.Where("user_id = ? AND booking_room_id = ?", payment.UserID, payment.BookingRoomID).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Payment already exists for this user and booking"})
		return
	}

	if err := db.Create(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Payment created successfully", "payment": payment})
}

// PATCH  /payment:id
func UpdatePaymentByID(c *gin.Context) {
	ID := c.Param("id")

	db := config.DB()

	var payment entity.Payment
	if err := db.First(&payment, ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ID not found"})
		return
	}

	// ข้อมูล JSON ที่ไม่รวมไฟล์
	var input entity.Payment
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	// อัปเดต field ทีละตัว เพื่อไม่ให้ overwrite ด้วยค่า default
	payment.PaymentDate = input.PaymentDate
	payment.Amount = input.Amount
	payment.Note = input.Note
	payment.StatusID = input.StatusID

	// อัปโหลดไฟล์รูปภาพ
	form, err := c.MultipartForm()
	if err == nil {
		files := form.File["files"]
		if len(files) > 0 {
			file := files[0]

			// ลบไฟล์เดิมถ้ามี
			if payment.SlipPath != "" {
				os.Remove(payment.SlipPath)
			}

			// เตรียมโฟลเดอร์
			folderPath := fmt.Sprintf("images/payment/user%d", payment.UserID)
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
				return
			}

			// สร้างชื่อไฟล์ใหม่
			ext := ".png"
			newFileName := fmt.Sprintf("slip_room_booking%d%s", payment.BookingRoomID, ext)
			fullPath := path.Join(folderPath, newFileName)

			// บันทึกไฟล์
			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
				return
			}

			// บันทึก path ไฟล์ลงใน database
			payment.SlipPath = fullPath // หรือใช้ URL prefix ตามเว็บคุณ
		}
	}

	// บันทึกข้อมูลทั้งหมด
	if err := db.Save(&payment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update successful",
		"data":    payment,
	})
}
