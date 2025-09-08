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
	ID          uint       `json:"id"`
	Status      string     `json:"status"`
	SlipImages  []string   `json:"slipImages"`
	Note        string     `json:"note,omitempty"`        // ✅ หมายเหตุที่ผู้ใช้กรอก
	Amount      float64    `json:"amount,omitempty"`      // (เผื่ออยากแสดงยอดด้วย)
	PaymentDate *time.Time `json:"paymentDate,omitempty"` // (เผื่อเอาวันที่โอนไปแสดง)
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
	Payment         *PaymentSummary      `json:"Payment,omitempty"`
	DisplayStatus   string               `json:"DisplayStatus"`
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
			return "confirmed" // จองผ่านแล้ว แต่ยังไม่อัปโหลดสลิป
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

func minBookingDate(b entity.BookingRoom) (time.Time, bool) {
	if len(b.BookingDates) == 0 {
		return time.Time{}, false
	}
	min := b.BookingDates[0].Date
	for _, d := range b.BookingDates {
		if d.Date.Before(min) {
			min = d.Date
		}
	}
	// strip time component to compare by day
	return time.Date(min.Year(), min.Month(), min.Day(), 0, 0, 0, 0, min.Location()), true
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
		Preload("Payments", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("id ASC").Preload("Status")
		}).
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var result []BookingRoomResponse
	for _, b := range bookings {
		// slot
		bookingDate := time.Now()
		if len(b.BookingDates) > 0 {
			bookingDate = b.BookingDates[0].Date
		}
		merged := mergeTimeSlots(b.TimeSlots, bookingDate)

		status := b.Status.StatusName
		if b.CancelledAt != nil {
			status = "cancelled"
		}

		var addInfo AdditionalInfo
		if b.AdditionalInfo != "" {
			_ = json.Unmarshal([]byte(b.AdditionalInfo), &addInfo)
		}

		// payment summary (ล่าสุด)
		var paySummary *PaymentSummary
		if len(b.Payments) > 0 {
			latest := b.Payments[len(b.Payments)-1]
			img := []string{}
			if latest.SlipPath != "" {
				img = append(img, latest.SlipPath)
			}

			statusName := latest.Status.Name
			if statusName == "" {
				statusName = "unpaid"
			}
			payDate := latest.PaymentDate
			paySummary = &PaymentSummary{
				ID:          latest.ID,
				Status:      strings.ToLower(statusName), // หรือ uiPaymentStatus(statusName)
				SlipImages:  img,
				Note:        latest.Note,   // ✅ รวมหมายเหตุไปด้วย
				Amount:      latest.Amount, // (option)
				PaymentDate: &payDate,      // (option)
			}
		}

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
			DisplayStatus:   computeDisplayStatus(b),
		})
	}

	if result == nil {
		result = []BookingRoomResponse{}
	}

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
		TaxID          string   `json:"TaxID"`
		Address        string   `json:"Address"`
		DepositAmount  float64  `json:"DepositAmount"`
		DiscountAmount float64  `json:"DiscountAmount"`
		TotalAmount    float64  `json:"TotalAmount"`
		PaymentOptionID	uint 	`json:"PaymentOptionID"`
	}

	// อ่าน raw body log เพื่อ debug (ไม่บังคับ)
	bodyBytes, _ := ioutil.ReadAll(c.Request.Body)
	log.Println("Raw request body:", string(bodyBytes))
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(bodyBytes))

	var input BookingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		log.Println("Error binding JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}

	// โหลดห้อง + สถานะ + RoomType + Layouts
	var room entity.Room
	if err := db.
		Preload("RoomStatus").
		Preload("RoomType").
		Preload("RoomType.RoomTypeLayouts").
		First(&room, input.RoomID).Error; err != nil {
		log.Println("Error fetching room data:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้องประชุม"})
		return
	}

	// ห้องต้อง available
	if strings.ToLower(room.RoomStatus.Code) != "available" {
		c.JSON(http.StatusForbidden, gin.H{"error": "ห้องนี้ไม่พร้อมใช้งานในขณะนี้"})
		return
	}

	// ผู้ใช้ + Role
	var user entity.User
	if err := db.Preload("Role").First(&user, input.UserID).Error; err != nil {
		log.Println("Error fetching user data:", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	// ===== จำกัดสิทธิ์จอง "ห้องใหญ่"
	// เงื่อนไขความเป็นห้องใหญ่: มี layout ที่จุ >20 หรือ ขนาดห้อง/ประเภท >= 200 ตร.ม.
	isLarge := false
	largestCapacity := 0
	for _, l := range room.RoomType.RoomTypeLayouts {
		if l.Capacity > largestCapacity {
			largestCapacity = l.Capacity
		}
	}
	if largestCapacity > 20 || room.RoomSize >= 200 || room.RoomType.RoomSize >= 200 {
		isLarge = true
	}
	if isLarge {
		rn := strings.ToLower(strings.TrimSpace(user.Role.Name))
		if rn != "manager" && rn != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "ห้องนี้ต้องติดต่อเจ้าหน้าที่อุทยานวิทย์เท่านั้น ไม่สามารถจองด้วยตนเองได้",
			})
			return
		}
	}

	// โหลด TimeSlots
	var timeSlots []entity.TimeSlot
	if err := db.Where("id IN ?", input.TimeSlotIDs).Find(&timeSlots).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ช่วงเวลาที่เลือกไม่ถูกต้อง"})
		return
	}
	if len(timeSlots) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบช่วงเวลาที่เลือก"})
		return
	}

	// ตรวจซ้ำ (Room + Date + TimeSlot) ยกเว้นสถานะยกเลิก (ตั้งค่าให้ตรงกับระบบจริงถ้าไม่ใช่ 2)
	const cancelledStatusID = 3 // จาก seed: 1 Pending, 2 Confirmed, 3 Cancelled, 4 Completed
	for _, dateStr := range input.Dates {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง: " + dateStr})
			return
		}

		var existingCount int64
		err = db.Model(&entity.BookingRoom{}).
			Joins("JOIN booking_room_timeslots ON booking_rooms.id = booking_room_timeslots.booking_room_id").
			Joins("JOIN booking_dates ON booking_rooms.id = booking_dates.booking_room_id").
			Where(`booking_rooms.room_id = ? 
			       AND booking_dates.date = ? 
			       AND booking_room_timeslots.time_slot_id IN ? 
			       AND booking_rooms.status_id != ?`,
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

	// หา BookingStatus "Confirmed" แบบ inline (ไม่ใช้ helper)
	var bs entity.BookingStatus
	if err := db.Where("LOWER(status_name) = ?", "pending").First(&bs).Error; err != nil {
		// fallback ถ้าไม่พบ ให้ใช้ 2 (ตาม seed)
		bs.ID = 1
	}

	// สร้าง BookingRoom + M2M TimeSlots
	booking := entity.BookingRoom{
		Purpose:        input.Purpose,
		UserID:         input.UserID,
		RoomID:         input.RoomID,
		TimeSlots:      timeSlots,
		StatusID:       bs.ID,
		AdditionalInfo: input.AdditionalInfo,
		DepositAmount:  input.DepositAmount,
		DiscountAmount: input.DiscountAmount,
		TotalAmount:    input.TotalAmount,
		Address:        input.Address,
		TaxID:          input.TaxID,
		PaymentOptionID: input.PaymentOptionID,
	}
	if err := db.Create(&booking).Error; err != nil {
		log.Println("Error creating booking:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก BookingRoom ได้"})
		return
	}

	// ===== ตรวจ "รายชั่วโมง" → ทุกช่วงต้องยาว 1 ชั่วโมง
	isHourly := true
	for _, ts := range timeSlots {
		if ts.EndTime.Sub(ts.StartTime) != time.Hour {
			isHourly = false
			break
		}
	}

	// ===== Payment: พนักงาน (IsEmployee) + รายชั่วโมง ⇒ Paid(0)
	var payStatusName string
	var amount float64
	var note string

	if user.IsEmployee && isHourly {
		payStatusName = "Paid"
		amount = 0
		note = "Free for employee hourly booking"
	} else {
		payStatusName = "Pending Payment"
		amount = 0 // ถ้ามีสูตรคิดเงิน ให้แทนที่ตรงนี้
		note = "Waiting for slip upload"
	}

	// หา PaymentStatus จากชื่อ (ไม่ใช้ helper)
	var ps entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower(payStatusName)).First(&ps).Error; err != nil {
		// fallback: ถ้าไม่เจอ ให้เดา id จาก seed ของคุณ
		switch payStatusName {
		case "Paid":
			ps.ID = 4
		default: // Pending Payment
			ps.ID = 1
		}
	}

	payment := entity.Payment{
		BookingRoomID: booking.ID,
		StatusID:      ps.ID,
		Amount:        amount,
		SlipPath:      "",
		PaymentDate:   time.Now(),
		PayerID:       booking.UserID,
		Note:          note,
	}
	if err := db.Create(&payment).Error; err != nil {
		log.Println("Error creating payment:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง Payment เริ่มต้นได้"})
		return
	}

	// บันทึก BookingDate หลายวัน
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

// ห้ามยกเลิกถ้าเหลือน้อยกว่า 2 วันก่อนวันใช้งานแรก
// (ยังคงเก็บประวัติ: เปลี่ยนสถานะเป็น cancelled ไม่ลบข้อมูล)
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

	// หา status "cancelled"
	var cancelledStatus entity.BookingStatus
	if err := db.
		Where("LOWER(code) = ?", "cancelled").
		Or("LOWER(name) = ?", "cancelled").
		First(&cancelledStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบสถานะ cancelled"})
		return
	}

	// ป้องกันการยกเลิกซ้ำ
	if booking.StatusID == cancelledStatus.ID {
		c.JSON(http.StatusConflict, gin.H{"error": "รายการนี้ถูกยกเลิกไปแล้ว"})
		return
	}

	// ตรวจ policy: ต้องยกเลิกล่วงหน้าอย่างน้อย 2 วันก่อนวันใช้งานแรก
	firstDate, _ := minBookingDate(booking)

	today := time.Now()
	// เปรียบเทียบแบบรายวัน: ตัดเวลาออก
	todayDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	twoDaysLater := todayDay.Add(48 * time.Hour)

	if firstDate.Before(twoDaysLater) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สามารถยกเลิกได้อย่างน้อย 2 วันล่วงหน้าก่อนวันใช้งาน"})
		return
	}

	// ทำการยกเลิก (เปลี่ยนสถานะ ไม่ลบ)
	now := time.Now()
	booking.StatusID = cancelledStatus.ID
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

// ==========================
// AUTO-CANCEL (Policy B)
// ==========================
// ยกเลิกการจองอัตโนมัติ หากข้าม "00:00 ของวันก่อนใช้งานจริง" มาแล้วและยังไม่มีการชำระที่ยืนยัน
// - deadline = startOfUsageDay(00:00) - 24h  ==> เท่ากับ 00:00 ของ "วันก่อนใช้งาน"
// - ถ้า now >= deadline และยังไม่ confirmed/approved → ยกเลิก
func AutoCancelUnpaidBookings(deadlineHours int) (int, error) {
	db := config.DB()

	// ไม่ใช้ deadlineHours แบบชั่วโมงแล้ว (นโยบาย B กำหนดชัดเป็น 00:00 ของวันก่อนหน้า)
	now := time.Now()

	// resolve cancelled status
	var cancelledStatus entity.BookingStatus
	if err := db.
		Where("LOWER(code) = ?", "cancelled").
		Or("LOWER(name) = ?", "cancelled").
		First(&cancelledStatus).Error; err != nil {
		return 0, err
	}

	// candidates: booking ที่ยังไม่ถูกยกเลิก และมี BookingDates
	var bookings []entity.BookingRoom
	if err := db.
		Preload("BookingDates").
		Where("status_id <> ?", cancelledStatus.ID).
		Find(&bookings).Error; err != nil {
		return 0, err
	}

	cancelled := 0

	for _, b := range bookings {
		firstDate, ok := minBookingDate(b)
		if !ok {
			continue // ไม่มีวันจอง
		}

		// startOfUsageDay = 00:00 ของวันใช้งานแรก
		startOfUsageDay := time.Date(firstDate.Year(), firstDate.Month(), firstDate.Day(), 0, 0, 0, 0, firstDate.Location())
		// deadline = 00:00 ของ "วันก่อนใช้งาน"
		deadline := startOfUsageDay.Add(-24 * time.Hour)

		// ยังไม่ถึง 00:00 ของวันก่อนหน้า → ยังไม่ออโต้ยกเลิก
		if now.Before(deadline) {
			continue
		}

		// ตรวจว่ามี payment ยืนยันหรือยัง
		var cnt int64
		if err := db.Table("payments").
			Joins("JOIN payment_statuses ON payment_statuses.id = payments.status_id").
			Where("payments.booking_room_id = ?", b.ID).
			Where("LOWER(payment_statuses.name) IN (?)", []string{"confirmed", "approved"}).
			Count(&cnt).Error; err != nil {
			log.Println("count payments error for booking", b.ID, ":", err)
			continue
		}
		if cnt > 0 {
			// จ่าย/อนุมัติแล้ว ไม่ยกเลิก
			continue
		}

		// ออโต้ยกเลิก (เปลี่ยนสถานะ ไม่ลบ)
		tx := db.Begin()
		nowTs := time.Now()
		if err := tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]any{
				"status_id":    cancelledStatus.ID,
				"cancelled_at": &nowTs,
				"updated_at":   nowTs,
			}).Error; err != nil {
			tx.Rollback()
			log.Println("update cancelled failed id=", b.ID, "err:", err)
			continue
		}
		if err := tx.Commit().Error; err != nil {
			log.Println("commit failed id=", b.ID, "err:", err)
			continue
		}
		cancelled++
		log.Println("auto-cancel (Policy B) booking id=", b.ID)
	}

	return cancelled, nil
}

func AutoCancelUnpaidBookingsHandler(c *gin.Context) {
	// นโยบาย B: fixed ตาม 00:00 ของวันก่อนใช้งาน → พารามิเตอร์ชั่วโมงไม่ถูกใช้ แต่คง signature ไว้
	n, err := AutoCancelUnpaidBookings(24)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": "เกิดข้อผิดพลาดระหว่างยกเลิกอัตโนมัติ (Policy B)",
			"error":   err.Error(),
		})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"message":              "ยกเลิกอัตโนมัติสำหรับการจองที่ไม่ชำระภายในกำหนด (Policy B) แล้ว",
		"auto_cancelled_count": n,
	})
}

// GET /booking-room/by-date
func ListBookingRoomByDateRange(c *gin.Context) {
	var bookings []entity.BookingRoom

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")
	roomIDStr := c.Query("room_id")

	db := config.DB()

	query := db.
		Preload("Status").
		Preload("BookingDates").
		Joins("JOIN booking_dates ON booking_dates.booking_room_id = booking_rooms.id").
		Order("booking_dates.date ASC").
		Model(&entity.BookingRoom{}).
		Distinct("booking_rooms.id")

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
			query = query.Where("booking_dates.date >= ? AND booking_dates.date < ?", startOfDay, endOfDay)
		} else {
			endDate, errEnd := time.ParseInLocation(layout, endDateStr, loc)
			if errEnd != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format, expected YYYY-MM-DD"})
				return
			}
			endDate = endDate.AddDate(0, 0, 1)
			query = query.Where("booking_dates.date >= ? AND booking_dates.date < ?", startDate, endDate)
		}
	}

	if roomIDStr != "" {
		query = query.Where("booking_rooms.room_id = ?", roomIDStr)
	}

	results := query.Find(&bookings)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"bookings": bookings,
	})
}

// GET /booking-rooms/summary-current-month
func GetBookingRoomSummary(c *gin.Context) {
	type StatusCount struct {
		StatusName string
		Count      int64
	}

	var statusCounts []StatusCount
	var totalBookings int64

	db := config.DB()

	// กำหนด timezone Asia/Bangkok
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load timezone"})
		return
	}

	now := time.Now().In(loc)
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	// Query นับตามสถานะ
	db.
		Table("booking_statuses").
		Select("booking_statuses.status_name, COUNT(DISTINCT booking_rooms.id) as count").
		Joins("LEFT JOIN booking_rooms ON booking_rooms.status_id = booking_statuses.id").
		Joins("LEFT JOIN booking_dates ON booking_dates.booking_room_id = booking_rooms.id AND booking_dates.date >= ? AND booking_dates.date <= ?", startOfMonth, endOfMonth).
		Group("booking_statuses.status_name").
		Scan(&statusCounts)

	// Query นับ total bookings ในเดือน
	db.
		Model(&entity.BookingRoom{}).
		Joins("JOIN booking_dates ON booking_dates.booking_room_id = booking_rooms.id").
		Where("booking_dates.date >= ? AND booking_dates.date <= ?", startOfMonth, endOfMonth).
		Distinct("booking_rooms.id").
		Count(&totalBookings)

	c.JSON(http.StatusOK, gin.H{
		"status_summary": statusCounts,
		"total_bookings": totalBookings,
	})
}
