// controller/booking_rooms_flow.go
package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /booking-rooms/:id
// ส่งรายละเอียด 1 booking พร้อม map payment.status เป็นของ UI
// GetBookingRoomByID
func GetBookingRoomByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var booking entity.BookingRoom
	err := db.
		Preload("Room.Floor").
		Preload("BookingDates").
		Preload("User").
		Preload("TimeSlots").
		Preload("Status").
		Preload("Payments.Status"). // ✅ preload payments
		First(&booking, id).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	// รวม slot
	bookingDate := time.Now()
	if len(booking.BookingDates) > 0 {
		bookingDate = booking.BookingDates[0].Date
	}
	merged := mergeTimeSlots(booking.TimeSlots, bookingDate)

	// แปลง AdditionalInfo
	var addInfo AdditionalInfo
	if booking.AdditionalInfo != "" {
		if err := json.Unmarshal([]byte(booking.AdditionalInfo), &addInfo); err != nil {
			fmt.Println("Error parsing additional_info:", err)
		}
	}
	var slipImages []string
	for _, p := range booking.Payments {
		if p.SlipPath != "" {
			slipImages = append(slipImages, p.SlipPath)
		}
	}

	resp := BookingRoomResponse{
		ID:              booking.ID,
		Room:            booking.Room,
		BookingDates:    booking.BookingDates,
		MergedTimeSlots: merged,
		User:            booking.User,
		Purpose:         booking.Purpose,
		AdditionalInfo:  addInfo,
		StatusName:      booking.Status.StatusName,
		Payment: &PaymentSummary{ // ✅ ให้มีโครงสร้างเสมอ
			Status:     "unpaid",
			SlipImages: []string{},
		},
	}

	// ✅ ถ้ามี Payment จริง ๆ ค่อย override
	if len(booking.Payments) > 0 {
		latest := booking.Payments[len(booking.Payments)-1] // ✅ เอา payment ล่าสุด
		slipImages := []string{}
		if latest.SlipPath != "" {
			slipImages = append(slipImages, latest.SlipPath)
		}

		payStatus := "unpaid"
		if latest.Status.Name != "" {
			payStatus = latest.Status.Name
		}

		resp.Payment = &PaymentSummary{
			ID:         latest.ID,                  // ✅ ใส่ ID ของ payment
			Status:     strings.ToLower(payStatus), // "submitted" / "paid" / ...
			SlipImages: slipImages,
		}
	}

	c.JSON(http.StatusOK, resp)
}

// POST /booking-rooms/:id/approve
func ApproveBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	confirmedID, err := mustBookingStatusID("confirmed")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var b entity.BookingRoom
	if err := db.Preload("Payments").First(&b, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}
	if b.CancelledAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "การจองถูกยกเลิกแล้ว"})
		return
	}

	// ✅ อนุมัติ booking
	b.StatusID = confirmedID
	if err := db.Save(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอนุมัติได้"})
		return
	}

	// ✅ อัพเดท Payment → Pending Payment
	pendingPaymentID, _ := mustPaymentStatusID("Pending Payment")

	// ถ้ามี payment record อยู่แล้ว → update ตัวล่าสุด
	if len(b.Payments) > 0 {
		latestPayment := b.Payments[len(b.Payments)-1]
		latestPayment.StatusID = pendingPaymentID
		latestPayment.Note = "รอการชำระเงิน"
		if err := db.Save(&latestPayment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัพเดท Payment ไม่สำเร็จ"})
			return
		}
	} else {
		// ถ้าไม่มี payment record → สร้างใหม่
		newPayment := entity.Payment{
			BookingRoomID: b.ID,
			StatusID:      pendingPaymentID,
			Amount:        0,
			SlipPath:      "",
			PaymentDate:   time.Now(),
			PayerID:       b.UserID,
			Note:          "รอการชำระเงิน",
		}
		if err := db.Create(&newPayment).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Payment ไม่สำเร็จ"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "อนุมัติสำเร็จ"})
}


type rejectBody struct {
	Note string `json:"note"`
}

// POST /booking-rooms/:id/reject
func RejectBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	cancelledID, err := mustBookingStatusID("cancelled")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var b entity.BookingRoom
	if err := db.Preload("Payments").First(&b, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	now := time.Now()
	b.StatusID = cancelledID
	b.CancelledAt = &now
	if err := db.Save(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกสำเร็จ"})
}

// POST /booking-rooms/:id/complete
func CompleteBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	completedID, err := mustBookingStatusID("completed")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var b entity.BookingRoom
	if err := db.First(&b, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}
	if b.CancelledAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "การจองถูกยกเลิกแล้ว"})
		return
	}

	b.StatusID = completedID
	if err := db.Save(&b).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถปิดงานได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ปิดงานสำเร็จ"})
}


