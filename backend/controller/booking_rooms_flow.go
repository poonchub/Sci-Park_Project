// controller/booking_rooms_flow.go
package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
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

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var b entity.BookingRoom
	if err := tx.Preload("Payments").First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}
	if b.CancelledAt != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "การจองถูกยกเลิกแล้ว"})
		return
	}

	// หา BookingStatus = "Confirmed" แบบ case-insensitive (ถ้าไม่มีให้สร้าง)
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "confirmed").First(&bs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			bs = entity.BookingStatus{StatusName: "Confirmed"}
			if err := tx.Create(&bs).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Confirmed ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Confirmed ไม่สำเร็จ"})
			return
		}
	}

	// อัปเดตสถานะการจอง
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{"status_id": bs.ID, "updated_at": time.Now()}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอนุมัติได้"})
		return
	}

	// หา PaymentStatus = "Pending Payment" (ถ้าไม่มีให้สร้าง)
	var ps entity.PaymentStatus
	if err := tx.Where("LOWER(name) = ?", strings.ToLower("Pending Payment")).First(&ps).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			ps = entity.PaymentStatus{Name: "Pending Payment"}
			if err := tx.Create(&ps).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Pending Payment ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Pending Payment ไม่สำเร็จ"})
			return
		}
	}

	// อัปเดต/สร้าง Payment
	if len(b.Payments) > 0 {
		latest := b.Payments[len(b.Payments)-1]
		if err := tx.Model(&entity.Payment{}).
			Where("id = ?", latest.ID).
			Updates(map[string]interface{}{
				"status_id":  ps.ID,
				"note":       "รอการชำระเงิน",
				"updated_at": time.Now(),
			}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "อัพเดท Payment ไม่สำเร็จ"})
			return
		}
	} else {
		newPayment := entity.Payment{
			BookingRoomID: b.ID,
			StatusID:      ps.ID,
			Amount:        0,
			SlipPath:      "",
			PaymentDate:   time.Now(),
			PayerID:       b.UserID,
			Note:          "รอการชำระเงิน",
		}
		if err := tx.Create(&newPayment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Payment ไม่สำเร็จ"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "อนุมัติสำเร็จ"})
}


// POST /booking-rooms/:id/reject
func RejectBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var b entity.BookingRoom
	if err := tx.First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	// หา BookingStatus = "Cancelled"
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "cancelled").First(&bs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			bs = entity.BookingStatus{StatusName: "Cancelled"}
			if err := tx.Create(&bs).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Cancelled ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Cancelled ไม่สำเร็จ"})
			return
		}
	}

	now := time.Now()
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{
			"status_id":   bs.ID,
			"cancelled_at": &now,
			"updated_at":  time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกได้"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกสำเร็จ"})
}


// POST /booking-rooms/:id/complete
func CompleteBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var b entity.BookingRoom
	if err := tx.First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}
	if b.CancelledAt != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "การจองถูกยกเลิกแล้ว"})
		return
	}

	// หา BookingStatus = "Completed"
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "completed").First(&bs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			bs = entity.BookingStatus{StatusName: "Completed"}
			if err := tx.Create(&bs).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Completed ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Completed ไม่สำเร็จ"})
			return
		}
	}

	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{"status_id": bs.ID, "updated_at": time.Now()}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถปิดงานได้"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ปิดงานสำเร็จ"})
}


