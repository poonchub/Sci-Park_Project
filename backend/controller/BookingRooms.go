package controller

import (
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"

	"time"
)

// GET /booking-rooms
func ListBookingRooms(c *gin.Context) {
	var booking []entity.BookingRoom

	db := config.DB()

	results := db.
		Preload("Room.Floor").
		Preload("TimeSlot").
		Preload("User").
		Find(&booking)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &booking)
}

func CreateBookingRoom(c *gin.Context) {
	db := config.DB()

	type BookingInput struct {
		UserID         uint     `json:"UserID"`
		RoomID         uint     `json:"RoomID"`
		TimeSlotID     uint     `json:"TimeSlotID"`
		Purpose        string   `json:"Purpose"`
		Dates          []string `json:"Dates"`
		AdditionalInfo string   `json:"AdditionalInfo"`
	}

	var bookings []entity.BookingRoom
	var inputs []BookingInput

	if err := c.ShouldBindJSON(&inputs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	for _, input := range inputs {
		// ดึงข้อมูล Room
		var room entity.Room
		if err := db.First(&room, input.RoomID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้องประชุม"})
			return
		}

		// ดึงข้อมูลผู้ใช้และ Role
		var user entity.User
		if err := db.Preload("Role").First(&user, input.UserID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
			return
		}

		log.Printf("🔍 UserID %d Role: %s", user.ID, user.Role.Name)


		// ✅ ตรวจสอบเงื่อนไขกรณีห้องใหญ่กว่า 20 และไม่ใช่ admin/manager
		if room.Capacity > 20 {
			// ดึง user พร้อม role
			var user entity.User
			if err := db.Preload("Role").First(&user, input.UserID).Error; err != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
				return
			}

			if user.Role.Name != "admin" && user.Role.Name != "Manager" {
				c.JSON(http.StatusForbidden, gin.H{
					"error": "ห้องนี้ต้องติดต่อเจ้าหน้าที่อุทยานวิทเท่านั้น ไม่สามารถจองด้วยตนเองได้",
				})
				return
			}
		}
		// ถ้า capacity <= 20 หรือ = 0 (ไม่มีจำกัด) ให้จองได้ปกติ

		for _, dateStr := range input.Dates {
			parsedDate, err := time.Parse("2006-01-02", dateStr)
			if err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง: " + dateStr})
				return
			}

			var existingCount int64
			err = db.Model(&entity.BookingRoom{}).
				Where("room_id = ? AND DATE(date) = ? AND time_slot_id = ? AND status != ?", input.RoomID, parsedDate.Format("2006-01-02"), input.TimeSlotID, "cancelled").
				Count(&existingCount).Error
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการตรวจสอบการจอง"})
				return
			}

			if existingCount > 0 {
				c.JSON(http.StatusConflict, gin.H{
					"error": "มีการจองซ้ำสำหรับห้องนี้ในวันที่ " + dateStr + " ช่วงเวลาที่เลือก",
				})
				return
			}

			bookings = append(bookings, entity.BookingRoom{
				Date:           parsedDate,
				Purpose:        input.Purpose,
				UserID:         input.UserID,
				RoomID:         input.RoomID,
				TimeSlotID:     input.TimeSlotID,
				Status:         "pending",
				AdditionalInfo: input.AdditionalInfo,
			})
		}
	}

	if len(bookings) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่มีข้อมูลการจองที่ถูกต้อง"})
		return
	}

	if err := db.Create(&bookings).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกการจองได้: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "จองห้องสำเร็จ",
		"count":   len(bookings),
	})
}

func CancelBookingRoom(c *gin.Context) {
	db := config.DB()
	bookingID := c.Param("id")

	var booking entity.BookingRoom
	if err := db.First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	// ป้องกันการยกเลิกซ้ำ
	if booking.Status == "cancelled" {
		c.JSON(http.StatusConflict, gin.H{"error": "รายการนี้ถูกยกเลิกไปแล้ว"})
		return
	}

	// ตรวจสอบว่ายกเลิกได้หรือไม่ (ต้องยกเลิกก่อนวันใช้งาน 2 วัน)
	today := time.Now().Truncate(24 * time.Hour)
	twoDaysLater := today.Add(48 * time.Hour)
	bookingDate := booking.Date.Truncate(24 * time.Hour)

	if bookingDate.Before(twoDaysLater) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สามารถยกเลิกได้อย่างน้อย 2 วันล่วงหน้าก่อนวันใช้งาน"})
		return
	}

	// ทำการยกเลิก
	now := time.Now()
	booking.Status = "cancelled"
	booking.CancelledAt = &now // ถ้ามีฟิลด์นี้

	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกการจองได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "ยกเลิกการจองเรียบร้อยแล้ว",
		"cancelledAt": now.Format("2006-01-02 15:04:05"),
	})
}
