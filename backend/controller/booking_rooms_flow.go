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
		Preload("Payments", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id ASC").Preload("Status")
		}).
		Preload("Payments.Status").
		Preload("Payments.Invoice").
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

	// AdditionalInfo (ถ้ามี)
	var addInfo AdditionalInfo
	if booking.AdditionalInfo != "" {
		_ = json.Unmarshal([]byte(booking.AdditionalInfo), &addInfo)
	}

	// ค่าเริ่มต้นของ Payment
	resp := BookingRoomResponse{
		ID:              booking.ID,
		Room:            booking.Room,
		BookingDates:    booking.BookingDates,
		MergedTimeSlots: merged,
		User:            booking.User,
		Purpose:         booking.Purpose,
		AdditionalInfo:  addInfo,
		StatusName:      booking.Status.StatusName,
		Payment: &PaymentSummary{
			Status:     "unpaid",
			SlipImages: []string{},
		},
	}

	// ถ้ามี payment → ใช้ตัวล่าสุด
	if len(booking.Payments) > 0 {
		latest := booking.Payments[len(booking.Payments)-1]

		slipImages := []string{}
		if latest.SlipPath != "" {
			slipImages = append(slipImages, latest.SlipPath)
		}

		statusName := latest.Status.Name
		if statusName == "" {
			statusName = "unpaid"
		}

		// ต้องเป็น pointer เพื่อส่งใน JSON ได้สวย ๆ (omit ถ้า nil)
		payDate := latest.PaymentDate
		resp.Payment = &PaymentSummary{
			ID:          latest.ID,
			Status:      strings.ToLower(statusName),
			SlipImages:  slipImages,
			Note:        latest.Note,   // ✅ ส่งหมายเหตุออกไป
			Amount:      latest.Amount, // (option) เผื่ออยากแสดงยอด
			PaymentDate: &payDate,      // (option)
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

	// --- เซ็ตเวลายืนยันครั้งแรก ---
	if b.ConfirmedAt == nil {
		now := time.Now()
		if err := tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Update("confirmed_at", &now).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ตั้งเวลา ConfirmedAt ไม่สำเร็จ"})
			return
		}
	}

	// --- บันทึกวันเริ่ม/จบงานจาก BookingDates (ถ้ามีและยังว่าง) ---
	if err := tx.Preload("BookingDates").First(&b, b.ID).Error; err == nil && len(b.BookingDates) > 0 {
		first, _ := minBookingDate(b)
		last, _ := lastBookingDate(&b) // คุณเพิ่ม helper นี้ไปแล้วในขั้นก่อนหน้า
		updates := map[string]any{"updated_at": time.Now()}
		if b.EventStartAt.IsZero() {
			updates["event_start_at"] = first
		}
		if b.EventEndAt.IsZero() {
			updates["event_end_at"] = last
		}
		if len(updates) > 1 { // มีอย่างน้อย 1 ฟิลด์จริง ๆ
			if err := tx.Model(&entity.BookingRoom{}).
				Where("id = ?", b.ID).
				Updates(updates).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ตั้ง EventStart/End ไม่สำเร็จ"})
				return
			}
		}
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
			"status_id":    bs.ID,
			"cancelled_at": &now,
			"updated_at":   time.Now(),
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

	// ===== ออกใบแจ้งหนี้งวดสุดท้าย (ถ้ามียอดคงเหลือ) =====
	// รับยอดรวมทั้งงานจาก FE (หรือคุณจะคำนวณเองฝั่งเซิร์ฟเวอร์ก็ได้)
	var body struct {
		BookingTotal float64 `json:"booking_total"`
	}
	_ = c.ShouldBindJSON(&body)

	if body.BookingTotal > 0 {
		// รวมยอดที่จ่ายแล้วจากทุก invoice ของ booking นี้
		var invs []entity.Invoice
		if err := tx.Where("booking_room_id = ?", b.ID).Find(&invs).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "คำนวณยอดที่ชำระแล้วไม่สำเร็จ"})
			return
		}
		var paidSum float64
		for _, iv := range invs {
			paidSum += iv.PaidAmount
		}

		remain := body.BookingTotal - paidSum
		if remain > 0 {
			// วันสิ้นสุดกิจกรรม
			end := time.Now()
			if err := tx.Preload("BookingDates").First(&b, b.ID).Error; err == nil {
				if t, ok := lastBookingDate(&b); ok {
					end = t
				}
			}

			// หา/สร้างสถานะ Unpaid
			var unpaid entity.PaymentStatus
			if err := tx.Where("LOWER(name)=?", "unpaid").First(&unpaid).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					unpaid = entity.PaymentStatus{Name: "Unpaid"}
					if err := tx.Create(&unpaid).Error; err != nil {
						tx.Rollback()
						c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Unpaid ไม่สำเร็จ"})
						return
					}
				} else {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Unpaid ไม่สำเร็จ"})
					return
				}
			}

			finalInv := entity.Invoice{
				BookingRoomID: b.ID,
				InvoiceNumber: fmt.Sprintf("FIN-%d-%d", b.ID, time.Now().Unix()),
				IssueDate:     time.Now(),
				DueDate:       end.Add(7 * 24 * time.Hour), // +7 วันหลังจบกิจกรรม
				BillingPeriod: end,
				TotalAmount:   remain,
				InvoiceType:   "final",
				PaidAmount:    0,
				StatusID:      unpaid.ID,
				RoomID:        b.RoomID,
				CreaterID:     b.UserID,
				CustomerID:    b.UserID,
			}
			if err := tx.Create(&finalInv).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างใบแจ้งหนี้งวดสุดท้ายไม่สำเร็จ"})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ปิดงานสำเร็จ"})
}
