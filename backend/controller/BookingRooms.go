package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sort"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"time"
)

// ===== Struct สำหรับ Response =====
type TimeSlotMerged struct {
	TimeSlotName string    `json:"time_slot_name"`
	StartTime    time.Time `json:"start_time"`
	EndTime      time.Time `json:"end_time"`
}

type PaymentSummary struct {
	ID         uint     `json:"id"`
	Status     string   `json:"status"`
	SlipImages []string `json:"slipImages"`
}

type BookingRoomResponse struct {
	ID              uint                 `json:"ID"`
	Room            entity.Room          `json:"Room"`
	BookingDates    []entity.BookingDate `json:"BookingDates"`
	MergedTimeSlots []TimeSlotMerged     `json:"Merged_time_slots"`
	User            entity.User          `json:"User"`
	Purpose         string               `json:"Purpose"`
	AdditionalInfo  AdditionalInfo       `json:"AdditionalInfo"`
	StatusName      string               `json:"StatusName"`
	Payment       *PaymentSummary `json:"Payment,omitempty"`
	DisplayStatus string          `json:"DisplayStatus"`
}

type AdditionalInfo struct {
	SetupStyle     string   `json:"SetupStyle"`
	Equipment      []string `json:"Equipment"`
	AdditionalNote string   `json:"AdditionalNote"`
}

// ===== Helper: รวม TimeSlot =====
func mergeTimeSlots(slots []entity.TimeSlot, bookingDate time.Time) []TimeSlotMerged {
	sort.Slice(slots, func(i, j int) bool {
		return slots[i].StartTime.Before(slots[j].StartTime)
	})

	var merged []TimeSlotMerged
	for _, s := range slots {
		start := time.Date(
			bookingDate.Year(),
			bookingDate.Month(),
			bookingDate.Day(),
			s.StartTime.Hour(),
			s.StartTime.Minute(),
			s.StartTime.Second(),
			0,
			time.Local,
		)

		end := time.Date(
			bookingDate.Year(),
			bookingDate.Month(),
			bookingDate.Day(),
			s.EndTime.Hour(),
			s.EndTime.Minute(),
			s.EndTime.Second(),
			0,
			time.Local,
		)

		merged = append(merged, TimeSlotMerged{
			TimeSlotName: s.TimeSlotName,
			StartTime:    start,
			EndTime:      end,
		})
	}
	return merged
}

func computeDisplayStatus(b entity.BookingRoom) string {
	if b.CancelledAt != nil {
		return "cancelled"
	}

	if len(b.Payments) == 0 {
		return "pending" // จองแต่ยังไม่มี payment record
	}

	latest := b.Payments[len(b.Payments)-1]
	pay := strings.ToLower(latest.Status.Name)
	booking := strings.ToLower(b.Status.StatusName)

	if booking == "pending" {
		return "pending" // รออนุมัติ booking
	}

	if booking == "confirmed" {
		switch pay {
		case "pending payment":
			return "approved" // จองผ่านแล้ว แต่ยังไม่อัปโหลดสลิป
		case "pending verification":
			return "payment review"
		case "awaiting receipt", "paid":
			return "payment"
		case "rejected":
			return "rejected"
		case "refunded":
			return "refunded"
		}
	}

	if booking == "completed" {
		return "completed"
	}

	return "unknown"
}

// ===== Controller: แสดงรายการ Booking ทั้งหมด =====
func ListBookingRooms(c *gin.Context) {
	db := config.DB()
	var bookings []entity.BookingRoom

	err := db.
		Preload("Room.Floor").
		Preload("BookingDates").
		Preload("User").
		Preload("TimeSlots").
		Preload("Status").
		Preload("Payments.Status").
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []BookingRoomResponse
	for _, b := range bookings {
		// ===== 1) รวม slot =====
		bookingDate := time.Now()
		if len(b.BookingDates) > 0 {
			bookingDate = b.BookingDates[0].Date
		}
		merged := mergeTimeSlots(b.TimeSlots, bookingDate)

		// ===== 2) สถานะ Booking =====
		status := b.Status.StatusName
		if b.CancelledAt != nil {
			status = "cancelled"
		}

		// ===== 3) AdditionalInfo =====
		var addInfo AdditionalInfo
		if b.AdditionalInfo != "" {
			if err := json.Unmarshal([]byte(b.AdditionalInfo), &addInfo); err != nil {
				fmt.Println("Error parsing additional_info:", err)
			}
		}

		// ===== 4) Payment Summary (เอาล่าสุดมา) =====
		var paySummary *PaymentSummary
		if len(b.Payments) > 0 {
			latest := b.Payments[len(b.Payments)-1] // เอา payment ล่าสุด

			statusName := ""
			if latest.Status.ID != 0 {
				statusName = latest.Status.Name
			}

			slipImages := []string{}
			if latest.SlipPath != "" {
				slipImages = append(slipImages, latest.SlipPath)
			}

			paySummary = &PaymentSummary{
				ID:         latest.ID, // ✅ ใช้ latest.ID
				Status:     uiPaymentStatus(statusName),
				SlipImages: slipImages,
			}
		}

		// ===== 5) Append เข้า response =====
		result = append(result, BookingRoomResponse{
			ID:              b.ID,
			Room:            b.Room,
			BookingDates:    append([]entity.BookingDate{}, b.BookingDates...),
			MergedTimeSlots: merged,
			User:            b.User,
			Purpose:         b.Purpose,
			AdditionalInfo:  addInfo,
			StatusName:      status,
			Payment:         paySummary,
			DisplayStatus:   computeDisplayStatus(b), // ✅
		})

	}

	// ป้องกัน null
	if result == nil {
		result = []BookingRoomResponse{}
	}

	fmt.Println(result)

	c.JSON(http.StatusOK, result)
}

// controller/BookingRooms.go

func ListBookingRoomsByUser(c *gin.Context) {
	db := config.DB()
	userID := c.Param("id") // ดึง user id จาก path เช่น /booking-rooms/user/3

	var bookings []entity.BookingRoom

	err := db.
		Preload("Room.Floor").
		Preload("BookingDates").
		Preload("User").
		Preload("TimeSlots").
		Preload("Status").
		Preload("Payments", func(db *gorm.DB) *gorm.DB {
			return db.Order("id desc").Limit(1) // 👈 ดึง payment ล่าสุด
		}).
		Preload("Payments.Status").
		Where("user_id = ?", userID).
		Find(&bookings).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []BookingRoomResponse
	for _, b := range bookings {
		// ===== 1) รวม slot =====
		bookingDate := time.Now()
		if len(b.BookingDates) > 0 {
			bookingDate = b.BookingDates[0].Date
		}
		merged := mergeTimeSlots(b.TimeSlots, bookingDate)

		// ===== 2) สถานะ Booking =====
		status := b.Status.StatusName
		if b.CancelledAt != nil {
			status = "cancelled"
		}

		// ===== 3) AdditionalInfo =====
		var addInfo AdditionalInfo
		if b.AdditionalInfo != "" {
			if err := json.Unmarshal([]byte(b.AdditionalInfo), &addInfo); err != nil {
				fmt.Println("Error parsing additional_info:", err)
			}
		}

		// ===== 4) Payment Summary (เอาล่าสุดมา) =====
		var paySummary *PaymentSummary
		if len(b.Payments) > 0 {
			latest := b.Payments[len(b.Payments)-1] // เอา payment ล่าสุด

			statusName := ""
			if latest.Status.ID != 0 {
				statusName = latest.Status.Name
			}

			slipImages := []string{}
			if latest.SlipPath != "" {
				slipImages = append(slipImages, latest.SlipPath)
			}

			paySummary = &PaymentSummary{
				ID:         latest.ID, // ✅ ใช้ latest.ID
				Status:     uiPaymentStatus(statusName),
				SlipImages: slipImages,
			}
		}

		// ===== 5) Append เข้า response =====
		result = append(result, BookingRoomResponse{
			ID:              b.ID,
			Room:            b.Room,
			BookingDates:    append([]entity.BookingDate{}, b.BookingDates...),
			MergedTimeSlots: merged,
			User:            b.User,
			Purpose:         b.Purpose,
			AdditionalInfo:  addInfo,
			StatusName:      status,
			Payment:         paySummary,
			DisplayStatus:   computeDisplayStatus(b), // ✅
		})
	}

	// ป้องกัน null
	if result == nil {
		result = []BookingRoomResponse{}
	}

	c.JSON(http.StatusOK, result)
}

func CreateBookingRoom(c *gin.Context) {
	db := config.DB()

	type BookingInput struct {
		UserID         uint     `json:"UserID" binding:"required"`
		RoomID         uint     `json:"RoomID" binding:"required"`
		TimeSlotIDs    []uint   `json:"TimeSlotIDs" binding:"required"`
		Purpose        string   `json:"Purpose" binding:"required"`
		Dates          []string `json:"Dates" binding:"required"`
		AdditionalInfo string   `json:"AdditionalInfo"`
	}

	// อ่าน raw body log เพื่อ debug
	bodyBytes, _ := ioutil.ReadAll(c.Request.Body)
	log.Println("Raw request body:", string(bodyBytes))
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	var input BookingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	// โหลดข้อมูลห้อง พร้อม RoomStatus
	var room entity.Room
	if err := db.Preload("RoomStatus").First(&room, input.RoomID).Error; err != nil {
		log.Println("Error fetching room data:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้องประชุม"})
		return
	}

	// ตรวจสอบสถานะห้อง
	if room.RoomStatus.Code != "available" {
		log.Println("Room is not available")
		c.JSON(http.StatusForbidden, gin.H{"error": "ห้องนี้ไม่พร้อมใช้งานในขณะนี้"})
		return
	}

	// โหลดข้อมูลผู้ใช้ + Role
	var user entity.User
	if err := db.Preload("Role").First(&user, input.UserID).Error; err != nil {
		log.Println("Error fetching user data:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	// ตรวจสอบสิทธิ์การจองห้องขนาดใหญ่
	// โหลดข้อมูลห้อง พร้อม RoomStatus + RoomType + RoomTypeLayouts
	if err := db.Preload("RoomType.RoomTypeLayouts").
		First(&room, input.RoomID).Error; err != nil {
		log.Println("Error fetching room data:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้องประชุม"})
		return
	}

	// ตรวจสอบสิทธิ์การจองห้องขนาดใหญ่
	if len(room.RoomType.RoomTypeLayouts) > 0 {
		largestCapacity := 0
		for _, layout := range room.RoomType.RoomTypeLayouts {
			if layout.Capacity > largestCapacity {
				largestCapacity = layout.Capacity
			}
		}

		if largestCapacity > 20 && user.Role.ID != 4 && user.Role.ID != 5 {
			log.Println("User does not have permission to book large rooms")
			c.JSON(http.StatusForbidden, gin.H{
				"error": "ห้องนี้ต้องติดต่อเจ้าหน้าที่อุทยานวิทย์เท่านั้น ไม่สามารถจองด้วยตนเองได้",
			})
			return
		}
	}

	// โหลด TimeSlots ตาม TimeSlotIDs ด้วย where id IN ?
	var timeSlots []entity.TimeSlot
	if err := db.Where("id IN ?", input.TimeSlotIDs).Find(&timeSlots).Error; err != nil {
		log.Println("Error fetching time slots:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ช่วงเวลาที่เลือกไม่ถูกต้อง"})
		return
	}

	if len(timeSlots) == 0 {
		log.Printf("❌ ไม่พบ TimeSlotIDs ใน DB: %+v", input.TimeSlotIDs)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบช่วงเวลาที่เลือก"})
		return
	}

	// ตรวจสอบความซ้ำของวันที่ + TimeSlot
	for _, dateStr := range input.Dates {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง: " + dateStr})
			return
		}

		var existingCount int64
		const cancelledStatusID = 2 // กำหนดตามข้อมูลจริงใน DB

		err = db.Model(&entity.BookingRoom{}).
			Joins("JOIN booking_room_timeslots ON booking_rooms.id = booking_room_timeslots.booking_room_id").
			Joins("JOIN booking_dates ON booking_rooms.id = booking_dates.booking_room_id").
			Where("booking_rooms.room_id = ? AND booking_dates.date = ? AND booking_room_timeslots.time_slot_id IN ? AND booking_rooms.status_id != ?",
				input.RoomID, parsedDate.Format("2006-01-02"), input.TimeSlotIDs, cancelledStatusID).
			Count(&existingCount).Error

		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการตรวจสอบการจอง"})
			return
		}

		if existingCount > 0 {
			c.JSON(http.StatusConflict, gin.H{
				"error": "มีการจองซ้ำในวันที่ " + dateStr + " ช่วงเวลาที่เลือกแล้ว",
			})
			return
		}
	}

	// สร้าง BookingRoom พร้อมเชื่อม TimeSlots (many-to-many)
	booking := entity.BookingRoom{
		Purpose:        input.Purpose,
		UserID:         input.UserID,
		RoomID:         input.RoomID,
		TimeSlots:      timeSlots,
		StatusID:       1, // สมมติ status "confirmed"
		AdditionalInfo: input.AdditionalInfo,
	}

	if err := db.Create(&booking).Error; err != nil {
		log.Println("Error creating booking:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก BookingRoom ได้"})
		return
	}

	// ✅ เพิ่ม Payment record เริ่มต้นเลย
	pendingStatusID, _ := mustPaymentStatusID("Pending Payment")

	payment := entity.Payment{
		BookingRoomID: booking.ID,
		StatusID:      pendingStatusID,
		Amount:        0,              // ยังไม่จ่าย → 0 ไปก่อน
		SlipPath:      "",             // ยังไม่มีสลิป
		PaymentDate:   time.Now(),     // หรือ null ได้ถ้าคุณไม่อยากใส่
		PayerID:       booking.UserID, // default ผู้จองคือคนจ่าย
		Note:          "Waiting for slip upload",
	}

	if err := db.Create(&payment).Error; err != nil {
		log.Println("Error creating initial payment:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Payment เริ่มต้นได้"})
		return
	}

	// เพิ่ม BookingDate หลายวัน
	var bookingDates []entity.BookingDate
	for _, dateStr := range input.Dates {
		parsedDate, _ := time.Parse("2006-01-02", dateStr)
		bookingDates = append(bookingDates, entity.BookingDate{
			BookingRoomID: booking.ID,
			Date:          parsedDate,
		})
	}

	if err := db.Create(&bookingDates).Error; err != nil {
		log.Println("Error creating booking dates:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก BookingDate ได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    "จองห้องสำเร็จ",
		"booking_id": booking.ID,
	})
}

func CancelBookingRoom(c *gin.Context) {
	db := config.DB()
	bookingID := c.Param("id")

	var booking entity.BookingRoom
	if err := db.
		Preload("BookingDates").
		First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	if len(booking.BookingDates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบวันจองในรายการนี้"})
		return
	}

	// ป้องกันการยกเลิกซ้ำ
	if booking.StatusID == 3 {
		c.JSON(http.StatusConflict, gin.H{"error": "รายการนี้ถูกยกเลิกไปแล้ว"})
		return
	}

	// ใช้วันที่แรกสุดใน booking เพื่อตรวจสอบ
	firstDate := booking.BookingDates[0].Date.Truncate(24 * time.Hour)
	today := time.Now().Truncate(24 * time.Hour)
	twoDaysLater := today.Add(48 * time.Hour)

	if firstDate.Before(twoDaysLater) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สามารถยกเลิกได้อย่างน้อย 2 วันล่วงหน้าก่อนวันใช้งาน"})
		return
	}

	// ทำการยกเลิก
	now := time.Now()
	booking.StatusID = 3
	booking.CancelledAt = &now

	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกการจองได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":     "ยกเลิกการจองเรียบร้อยแล้ว",
		"cancelledAt": now.Format("2006-01-02 15:04:05"),
	})
}

// GET /booking-room/by-date
func ListBookingRoomByDateRange(c *gin.Context) {
	var booking []entity.BookingRoom

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	db := config.DB()

	query := db.
		Preload("Status").
		Order("created_at ASC")

	layout := "2006-01-02"
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load timezone"})
		return
	}

	if startDateStr != "" {
		startDate, errStart := time.ParseInLocation(layout, startDateStr, loc)
		if errStart != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format, expected YYYY-MM-DD"})
			return
		}

		if endDateStr == "" {
			startOfDay := startDate
			endOfDay := startDate.AddDate(0, 0, 1)
			query = query.Where("created_at >= ? AND created_at < ?", startOfDay, endOfDay)
		} else {
			endDate, errEnd := time.ParseInLocation(layout, endDateStr, loc)
			if errEnd != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format, expected YYYY-MM-DD"})
				return
			}

			endDate = endDate.AddDate(0, 0, 1)

			query = query.Where("created_at >= ? AND created_at < ?", startDate, endDate)
		}
	}

	results := query.Find(&booking)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &booking)
}
