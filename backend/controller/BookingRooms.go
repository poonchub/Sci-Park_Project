package controller

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
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

// ช่วยให้ค่าศูนย์/ค่าว่าง "ยังคงถูกส่ง" ได้เมื่อเราตั้ง pointer ให้ != nil
// ช่วยคำนวณฝั่ง Booking (เงินคิดที่นี่)
type BookingFinance struct {
	DepositAmount    float64 `json:"DepositAmount"`
	DiscountAmount   float64 `json:"DiscountAmount"`
	TotalAmount      float64 `json:"TotalAmount"`
	PaidApproved     float64 `json:"PaidApproved"`     // รวมยอดที่สถานะอนุมัติแล้ว
	PaidPending      float64 `json:"PaidPending"`      // รวมยอดที่รออนุมัติ
	PaidRejected     float64 `json:"PaidRejected"`     // รวมยอดที่ถูกปฏิเสธ
	Remaining        float64 `json:"Remaining"`        // ยอดคงค้าง (= Total - PaidApproved)
	DepositRemaining float64 `json:"DepositRemaining"` // ยอดคงค้างของ "มัดจำ"
	IsFullyPaid      bool    `json:"IsFullyPaid"`      // true เมื่อ Remaining == 0
	NextDue          string  `json:"NextDue"`          // "deposit" | "balance" | "none"
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

// helper
func minF(a, b float64) float64 {
	if a < b {
		return a
	}
	return b
}

func computeBookingFinance(b entity.BookingRoom) BookingFinance {
	// 1) รวมยอดจากสถานะการจ่าย
	var paidApproved, paidPending, paidRejected float64
	for _, p := range b.Payments {
		st := strings.ToLower(p.Status.Name)
		switch st {
		case "approved", "paid", "success":
			paidApproved += p.Amount
		case "pending verification", "pending", "processing":
			paidPending += p.Amount
		case "rejected", "failed":
			paidRejected += p.Amount
		}
	}

	// 2) ยอดรวม
	total := b.TotalAmount
	if total < 0 {
		total = 0
	}

	// 3) แผนที่เลือกจากตอนจอง (อ้างอิงจาก PaymentOption)
	plan := "deposit"
	if (b.PaymentOption.ID != 0 && strings.EqualFold(b.PaymentOption.OptionName, "full")) ||
		(b.PaymentOptionID != 0 && strings.EqualFold(b.PaymentOption.OptionName, "full")) {
		plan = "full"
	}

	// Fallback: ถ้าไม่มี PaymentOption ให้เดาจาก deposit amount
	if b.PaymentOption.ID == 0 && b.PaymentOptionID == 0 {
		if b.DepositAmount <= 0 {
			plan = "full"
		}
	}

	// 4) คิด depositTarget ตามแผน
	var depositTarget float64
	if plan == "full" {
		depositTarget = 0 // ✅ แผน Full ไม่ถือว่ามีมัดจำ
	} else { // deposit
		depositTarget = b.DepositAmount
		if depositTarget < 0 {
			depositTarget = 0
		}
		if depositTarget > total {
			depositTarget = total
		}
	}

	// 5) ยอดคงเหลือ
	remaining := total - paidApproved
	if remaining < 0 {
		remaining = 0
	}

	// 6) ยอดคงเหลือของ "มัดจำ" (เฉพาะแผน deposit)
	depositRemaining := depositTarget - paidApproved
	if depositRemaining < 0 {
		depositRemaining = 0
	}
	if plan == "full" {
		depositRemaining = 0 // ✅ ตัดทิ้งให้ชัดเจน
	}

	// 7) NextDue (อะไรที่ต้องจ่ายถัดไป) อิงตามแผนที่เลือกจริง
	next := "none"
	if plan == "deposit" {
		if depositRemaining > 0 {
			next = "deposit"
		} else if remaining > 0 {
			next = "balance"
		}
	} else { // full
		if remaining > 0 {
			next = "balance"
		}
	}

	return BookingFinance{
		DepositAmount:    b.DepositAmount,
		DiscountAmount:   b.DiscountAmount,
		TotalAmount:      total,
		PaidApproved:     paidApproved,
		PaidPending:      paidPending,
		PaidRejected:     paidRejected,
		Remaining:        remaining,
		DepositRemaining: depositRemaining,
		IsFullyPaid:      remaining == 0,
		NextDue:          next,
	}
}

// ====== อยู่ระดับ package (อย่าไปประกาศซ้ำในฟังก์ชัน) ======
type PaymentSummary struct {
	ID            uint       `json:"ID"`
	Status        string     `json:"Status"`
	SlipPath      []string   `json:"SlipPath"`
	Note          *string    `json:"Note"`
	Amount        *float64   `json:"Amount"`
	PaymentDate   *time.Time `json:"PaymentDate"`
	ReceiptPath   *string    `json:"ReceiptPath"`
	PaymentTypeID *uint      `json:"PaymentTypeID"`
	PayerID       *uint      `json:"PayerID"`
	ApproverID    *uint      `json:"ApproverID"`
}

type BookingRoomResponse struct {
	ID             uint                 `json:"ID"`
	Room           entity.Room          `json:"Room"`
	BookingDates   []entity.BookingDate `json:"BookingDates"`
	TimeSlotMerged []TimeSlotMerged     `json:"Merged_time_slots"`
	User           entity.User          `json:"User"`
	Purpose        string               `json:"Purpose"`
	AdditionalInfo AdditionalInfo       `json:"AdditionalInfo"`
	StatusName     string               `json:"StatusName"`
	// ❗ไม่ใส่ omitempty เพื่อให้แม้จะเป็น null/[] ก็ยังมี key โผล่ใน JSON
	Payment            *PaymentSummary            `json:"Payment"`  // งวดที่ active
	Payments           []PaymentSummary           `json:"Payments"` // งวดทั้งหมด (deposit จะมี 2)
	RoomBookingInvoice *entity.RoomBookingInvoice `json:"RoomBookingInvoice,omitempty"`
	DisplayStatus      string                     `json:"DisplayStatus"`
	InvoicePDFPath     *string                    `json:"InvoicePDFPath,omitempty"`
	Finance            BookingFinance             `json:"Finance"`
	PaymentOption      *entity.PaymentOption      `json:"PaymentOption,omitempty"`
}

// ===== helper: map payments ทั้งหมด + หา active =====
func buildPaymentSummaries(src []entity.Payment) ([]PaymentSummary, *PaymentSummary) {
	norm := func(p string) string { return strings.ReplaceAll(p, "\\", "/") }

	list := make([]PaymentSummary, 0, len(src))
	for _, p := range src {
		slip := []string{}
		if strings.TrimSpace(p.SlipPath) != "" {
			slip = append(slip, norm(p.SlipPath))
		}
		ui := uiPaymentStatus(p.Status.Name)

		note := p.Note
		amt := p.Amount
		pd := p.PaymentDate

		var rcpt *string
		if strings.TrimSpace(p.ReceiptPath) != "" {
			r := norm(p.ReceiptPath)
			rcpt = &r
		}

		payer := p.PayerID
		approver := p.ApproverID
		payType := p.PaymentTypeID

		list = append(list, PaymentSummary{
			ID:            p.ID,
			Status:        ui,
			SlipPath:      slip,
			Note:          &note,
			Amount:        &amt,
			PaymentDate:   &pd,
			ReceiptPath:   rcpt,
			PaymentTypeID: &payType,
			PayerID:       &payer,
			ApproverID:    &approver,
		})
	}

	// active: ถ้ามีรายการที่ยัง pending/pending verification/awaiting receipt ให้เลือกอันนั้น
	var active *PaymentSummary
	for i := range list {
		switch list[i].Status {
		case "pending payment", "pending verification", "awaiting receipt":
			active = &list[i]
			
		}
	}
	// ถ้าไม่มีก็ใช้อันล่าสุด (ปลายสุดของ list ที่เรียงเก่า→ใหม่)
	if active == nil && len(list) > 0 {
		active = &list[len(list)-1]
	}
	return list, active
}

func ListBookingRooms(c *gin.Context) {
	db := config.DB()
	var bookings []entity.BookingRoom

	err := db.
		Preload("Room.Floor").
		Preload("BookingDates").
		Preload("User").
		Preload("TimeSlots").
		Preload("Status").
		Preload("PaymentOption").
		Preload("RoomBookingInvoice").
		Preload("RoomBookingInvoice.Approver").
		Preload("RoomBookingInvoice.Customer").
		Preload("RoomBookingInvoice.Items").
		// เรียงเก่า→ใหม่ ให้ deposit=index 0, balance=index 1
		Preload("Payments", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("payments.created_at ASC").Order("payments.id ASC")
		}).
		Preload("Payments.Status").
		Preload("Payments.Payer").
		Preload("Payments.Approver").
		Preload("Payments.PaymentType").
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]BookingRoomResponse, 0, len(bookings))
	for _, b := range bookings {
		// merge slot
		bookingDate := time.Now()
		if len(b.BookingDates) > 0 {
			bookingDate = b.BookingDates[0].Date
		}
		merged := mergeTimeSlots(b.TimeSlots, bookingDate)

		// booking status
		status := b.Status.StatusName
		if b.CancelledAt != nil {
			status = "cancelled"
		}

		// additional info
		var addInfo AdditionalInfo
		if b.AdditionalInfo != "" {
			_ = json.Unmarshal([]byte(b.AdditionalInfo), &addInfo)
		}

		// payments
		pList, pActive := buildPaymentSummaries(b.Payments)
		if pList == nil {
			pList = []PaymentSummary{} // บังคับไม่ให้เป็น nil
		}

		// invoice pdf
		var invoicePDFPath *string
		if b.RoomBookingInvoice != nil && b.RoomBookingInvoice.InvoicePDFPath != "" {
			p := strings.ReplaceAll(b.RoomBookingInvoice.InvoicePDFPath, "\\", "/")
			invoicePDFPath = &p
		}

		// finance + display
		fin := computeBookingFinance(b)
		disp := computeDisplayStatus(b)

		result = append(result, BookingRoomResponse{
			ID:                 b.ID,
			Room:               b.Room,
			BookingDates:       append([]entity.BookingDate{}, b.BookingDates...),
			TimeSlotMerged:     merged,
			User:               b.User,
			Purpose:            b.Purpose,
			AdditionalInfo:     addInfo,
			StatusName:         status,
			Payment:            pActive, // งวด active (หรือ null ถ้าไม่มี)
			Payments:           pList,   // ทุกงวด (deposit จะ 2)
			RoomBookingInvoice: b.RoomBookingInvoice,
			DisplayStatus:      disp,
			InvoicePDFPath:     invoicePDFPath,
			Finance:            fin,
			PaymentOption:      &b.PaymentOption,
		})
	}

	if result == nil {
		result = []BookingRoomResponse{}
	}
	c.JSON(http.StatusOK, result)
}

func ListBookingRoomsByUser(c *gin.Context) {
	db := config.DB()
	userID := c.Param("id")

	var bookings []entity.BookingRoom
	err := db.
		Preload("Room.Floor").
		Preload("BookingDates").
		Preload("User").
		Preload("TimeSlots").
		Preload("Status").
		Preload("PaymentOption").
		Preload("RoomBookingInvoice").
		Preload("RoomBookingInvoice.Approver").
		Preload("RoomBookingInvoice.Customer").
		Preload("RoomBookingInvoice.Items").
		Preload("Payments", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("payments.created_at ASC").Order("payments.id ASC")
		}).
		Preload("Payments.Status").
		Preload("Payments.Payer").
		Preload("Payments.Approver").
		Preload("Payments.PaymentType").
		Where("user_id = ?", userID).
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]BookingRoomResponse, 0, len(bookings))
	for _, b := range bookings {
		bookingDate := time.Now()
		if len(b.BookingDates) > 0 {
			bookingDate = b.BookingDates[0].Date
		}
		merged := mergeTimeSlots(b.TimeSlots, bookingDate)

		status := b.Status.StatusName
		if b.CancelledAt != nil {
			status = "cancelled"
		}

		pList, pActive := buildPaymentSummaries(b.Payments)
		if pList == nil {
			pList = []PaymentSummary{}
		}

		var invoicePDFPath *string
		if b.RoomBookingInvoice != nil && b.RoomBookingInvoice.InvoicePDFPath != "" {
			p := strings.ReplaceAll(b.RoomBookingInvoice.InvoicePDFPath, "\\", "/")
			invoicePDFPath = &p
		}

		addInfo := parseAdditionalInfo(b.AdditionalInfo)
		fin := computeBookingFinance(b)
		disp := computeDisplayStatus(b)

		result = append(result, BookingRoomResponse{
			ID:                 b.ID,
			Room:               b.Room,
			BookingDates:       append([]entity.BookingDate{}, b.BookingDates...),
			TimeSlotMerged:     merged,
			User:               b.User,
			Purpose:            b.Purpose,
			AdditionalInfo:     addInfo,
			StatusName:         status,
			Payment:            pActive,
			Payments:           pList,
			RoomBookingInvoice: b.RoomBookingInvoice,
			DisplayStatus:      disp,
			InvoicePDFPath:     invoicePDFPath,
			Finance:            fin,
			PaymentOption:      &b.PaymentOption,
		})
	}

	if result == nil {
		result = []BookingRoomResponse{}
	}
	c.JSON(http.StatusOK, result)
}
/* ============================================================
   Helpers / Types
   ============================================================ */

// FE ใส่มาใน AdditionalInfo
type additionalInfoPayload struct {
	Discounts struct {
		UsedFreeCredit  bool `json:"usedFreeCredit"`
		AppliedMember50 bool `json:"appliedMember50"`
	} `json:"discounts"`
	// Fallback แพ็กเกจจาก FE (กรณี user ยังไม่มีแถวใน user_packages)
	Package struct {
		Name                   string `json:"name"`
		MeetingRoomLimit       int    `json:"meeting_room_limit"`
		TrainingRoomLimit      int    `json:"training_room_limit"`
		MultiFunctionRoomLimit int    `json:"multi_function_room_limit"`
	} `json:"package"`
	QuotaConsumed bool `json:"quota_consumed"`
}

// โครงแพ็กเกจแบบบาง ๆ (อ่านจากฐาน)
type packageLite struct {
	PackageName            string `json:"package_name" gorm:"column:package_name"`
	MeetingRoomLimit       int    `json:"meeting_room_limit" gorm:"column:meeting_room_limit"`
	TrainingRoomLimit      int    `json:"training_room_limit" gorm:"column:training_room_limit"`
	MultiFunctionRoomLimit int    `json:"multi_function_room_limit" gorm:"column:multi_function_room_limit"`
}

// ===== สิทธิ์ที่สรุปจากแพ็กเกจ (สมาชิก) =====
type pkgBenefits struct {
	meetingFreePerYear int
	meetingHalf        bool
	trainingHalf       bool
	hallHalf           bool
}

// สมาชิกทุกแพ็กเกจ: training/hall ลด 50% ไม่จำกัดครั้ง,
// meeting ลด 50% ได้ (โดยเฉพาะหลังหมดโควต้าฟรี)
func benefitsFromPackage(p *packageLite) pkgBenefits {
	if p == nil {
		return pkgBenefits{}
	}
	meetLimit := p.MeetingRoomLimit
	if meetLimit < 0 {
		meetLimit = 0
	}
	return pkgBenefits{
		meetingFreePerYear: meetLimit,
		meetingHalf:        true,
		trainingHalf:       true,
		hallHalf:           true,
	}
}

// จัดหมวดห้องจาก RoomType.Category (เข้ม: ไม่ fallback)
func classifyPolicyRoom(r *entity.Room) (string, error) {
	c := strings.ToLower(strings.TrimSpace(r.RoomType.Category))
	switch c {
	case "meetingroom":
		return "meeting", nil
	case "trainingroom":
		return "training", nil
	case "multifunctionroom":
		return "hall", nil
	default:
		return "", fmt.Errorf("unknown RoomType.Category: %s", r.RoomType.Category)
	}
}

/* ============================================================
   Handler
   ============================================================ */

func CreateBookingRoom(c *gin.Context) {
	db := config.DB()

	type BookingInput struct {
		UserID          uint     `json:"UserID" binding:"required"`
		RoomID          uint     `json:"RoomID" binding:"required"`
		TimeSlotIDs     []uint   `json:"TimeSlotIDs" binding:"required"`
		Purpose         string   `json:"Purpose" binding:"required"`
		Dates           []string `json:"Dates" binding:"required"`
		AdditionalInfo  string   `json:"AdditionalInfo"`
		TaxID           string   `json:"TaxID"`
		Address         string   `json:"Address"`
		DepositAmount   float64  `json:"DepositAmount"`
		DiscountAmount  float64  `json:"DiscountAmount"`
		TotalAmount     float64  `json:"TotalAmount"`
		PaymentOptionID uint     `json:"PaymentOptionID"`
	}

	// (optional) debug raw body
	bodyBytes, _ := io.ReadAll(c.Request.Body)
	log.Println("Raw request body:", string(bodyBytes))
	c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

	var input BookingInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
		return
	}
	if len(input.TimeSlotIDs) == 0 || len(input.Dates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาเลือกวันและช่วงเวลา"})
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ----- ห้อง + ราคา -----
	var room entity.Room
	if err := tx.
		Preload("RoomStatus").
		Preload("RoomType").
		Preload("RoomType.RoomPrices").
		First(&room, input.RoomID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลห้อง"})
		return
	}
	if strings.ToLower(room.RoomStatus.Code) != "available" {
		tx.Rollback()
		c.JSON(http.StatusForbidden, gin.H{"error": "ห้องนี้ไม่พร้อมใช้งานในขณะนี้"})
		return
	}

	// ----- ผู้ใช้ -----
	var user entity.User
	if err := tx.Preload("Role").First(&user, input.UserID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลผู้ใช้"})
		return
	}

	// ----- TimeSlots -----
	var timeSlots []entity.TimeSlot
	if err := tx.Where("id IN ?", input.TimeSlotIDs).Find(&timeSlots).Error; err != nil || len(timeSlots) == 0 {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "ช่วงเวลาที่เลือกไม่ถูกต้อง"})
		return
	}

	// ----- กันจองซ้ำ (ยกเว้นสถานะยกเลิก) -----
	const cancelledStatusID = 3
	for _, dateStr := range input.Dates {
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "รูปแบบวันที่ไม่ถูกต้อง: " + dateStr})
			return
		}
		var existing int64
		if err := tx.Model(&entity.BookingRoom{}).
			Joins("JOIN booking_room_timeslots ON booking_rooms.id = booking_room_timeslots.booking_room_id").
			Joins("JOIN booking_dates ON booking_rooms.id = booking_dates.booking_room_id").
			Where(`
				booking_rooms.room_id = ? AND
				booking_dates.date = ? AND
				booking_room_timeslots.time_slot_id IN ? AND
				booking_rooms.status_id != ?
			`, input.RoomID, parsedDate.Format("2006-01-02"), input.TimeSlotIDs, cancelledStatusID).
			Count(&existing).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "เกิดข้อผิดพลาดในการตรวจสอบการจอง"})
			return
		}
		if existing > 0 {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "มีการจองซ้ำในวันที่ " + dateStr + " ช่วงเวลาที่เลือกแล้ว"})
			return
		}
	}

	// ----- สถานะตั้งต้น = Pending -----
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "pending").First(&bs).Error; err != nil {
		bs.ID = 1 // fallback ให้ตรงกับ seed
	}

	// ----- AdditionalInfo (ส่วนลดที่ FE ติ๊ก) -----
	var addInfo additionalInfoPayload
	if input.AdditionalInfo != "" {
		_ = json.Unmarshal([]byte(input.AdditionalInfo), &addInfo)
	}

	// ----- Map ราคา timeSlot -> ราคา -----
	priceByTimeSlot := make(map[uint]float64)
	for _, rp := range room.RoomType.RoomPrices {
		priceByTimeSlot[rp.TimeSlotID] = float64(rp.Price)
	}

	// ----- baseTotal = ผลรวมราคา slot ที่เลือก * จำนวนวัน -----
	baseTotal := 0.0
	for _, tsID := range input.TimeSlotIDs {
		baseTotal += priceByTimeSlot[tsID]
	}
	baseTotal *= float64(len(input.Dates))

	// ----- ดึงแพ็กเกจของผู้ใช้ผ่าน user_packages -----
	var up entity.UserPackage
	_ = tx.Preload("Package").
		Where("user_id = ?", user.ID).
		Order("created_at DESC").
		First(&up).Error // เงียบไว้ ใช้ fallback จาก FE ด้านล่างได้

	// สร้าง packageLite จากฐาน (ถ้ามี) หรือ fallback จาก FE
	pl := packageLite{}
	if up.Package.ID != 0 {
		pl = packageLite{
			PackageName:            up.Package.PackageName,
			MeetingRoomLimit:       up.Package.MeetingRoomLimit,
			TrainingRoomLimit:      up.Package.TrainingRoomLimit,
			MultiFunctionRoomLimit: up.Package.MultiFunctionRoomLimit,
		}
	}
	if strings.TrimSpace(pl.PackageName) == "" && strings.TrimSpace(addInfo.Package.Name) != "" {
		pl.PackageName = addInfo.Package.Name
		pl.MeetingRoomLimit = addInfo.Package.MeetingRoomLimit
		pl.TrainingRoomLimit = addInfo.Package.TrainingRoomLimit
		pl.MultiFunctionRoomLimit = addInfo.Package.MultiFunctionRoomLimit
	}

	// ----- policy/หมวดจาก RoomType.Category (ห้าม fallback) -----
	policy, err := classifyPolicyRoom(&room)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "ประเภทห้องไม่ถูกต้อง"})
		return
	}

	// ----- ส่วนลด/โควตา -----
	benefit := benefitsFromPackage(&pl)

	nz := func(x int) int { if x < 0 { return 0 }; return x }
	meetingRemaining := nz(pl.MeetingRoomLimit - nz(up.MeetingRoomUsed))
	// training/hall ไม่จำกัดครั้งสำหรับส่วนลด 50% -> ไม่ต้องคิด remaining

	appliedFree := false
	applied50 := false

	switch policy {
	case "meeting":
		// ฟรีถ้าเลือกใช้และยังมีโควตา
		if addInfo.Discounts.UsedFreeCredit && meetingRemaining > 0 {
			appliedFree = true
		} else if meetingRemaining <= 0 && benefit.meetingHalf {
			// โควต้าหมด -> ลด 50% อัตโนมัติ
			applied50 = true
		} else if addInfo.Discounts.AppliedMember50 && benefit.meetingHalf {
			// เผื่อกรณีอยากบังคับติ๊กเอง
			applied50 = true
		}
	case "training":
		// สมาชิก: ลด 50% ไม่จำกัดครั้ง
		if benefit.trainingHalf {
			applied50 = true
		}
	case "hall":
		// สมาชิก: ลด 50% ไม่จำกัดครั้ง
		if benefit.hallHalf {
			applied50 = true
		}
	}

	finalTotal := baseTotal
	if appliedFree {
		finalTotal = 0
	} else if applied50 {
		finalTotal = baseTotal * 0.5
	}
	if finalTotal < 0 {
		finalTotal = 0
	}
	discountAmount := baseTotal - finalTotal
	if discountAmount < 0 {
		discountAmount = 0
	}

	// ----- ตรวจวิธีจ่าย และ normalize มัดจำ -----
	var opt entity.PaymentOption
	if err := tx.First(&opt, input.PaymentOptionID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบตัวเลือกวิธีชำระเงิน (PaymentOption) ที่ระบุ"})
		return
	}
	plan := strings.ToLower(strings.TrimSpace(opt.OptionName))

	deposit := input.DepositAmount
	switch plan {
	case "full":
		deposit = 0
	case "deposit":
		if deposit < 0 {
			deposit = 0
		}
		if deposit > finalTotal {
			deposit = finalTotal
		}
	default:
		if deposit < 0 {
			deposit = 0
		}
		if deposit > finalTotal {
			deposit = finalTotal
		}
	}

	// ----- บันทึก Booking -----
	booking := entity.BookingRoom{
		Purpose:         input.Purpose,
		UserID:          input.UserID,
		RoomID:          input.RoomID,
		TimeSlots:       timeSlots,
		StatusID:        bs.ID,
		AdditionalInfo:  input.AdditionalInfo,
		DepositAmount:   deposit,
		DiscountAmount:  discountAmount,
		TotalAmount:     finalTotal,
		Address:         input.Address,
		TaxID:           input.TaxID,
		PaymentOptionID: input.PaymentOptionID,
	}
	if err := tx.Create(&booking).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก BookingRoom ได้"})
		return
	}

	// ----- บันทึก BookingDate -----
	var bds []entity.BookingDate
	for _, dateStr := range input.Dates {
		parsedDate, _ := time.Parse("2006-01-02", dateStr)
		bds = append(bds, entity.BookingDate{
			BookingRoomID: booking.ID,
			Date:          parsedDate,
		})
	}
	if err := tx.Create(&bds).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึก BookingDate ได้"})
		return
	}

	// ไม่สร้าง Payment ที่นี่ — ไปสร้างตอน ApproveBookingRoom
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "จองห้องสำเร็จ",
		"booking_id":       booking.ID,
		"category":         policy,
		"base_total":       baseTotal,
		"final_total":      finalTotal,
		"discount":         discountAmount,
		"appliedFree":      appliedFree,
		"applied50pct":     applied50,
		"payment_creation": "deferred_to_approval",
	})
}

func CancelBookingRoom(c *gin.Context) {
	db := config.DB()
	bookingID := c.Param("id")

	var booking entity.BookingRoom
	if err := db.Preload("BookingDates").First(&booking, bookingID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}
	if len(booking.BookingDates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบวันจองในรายการนี้"})
		return
	}

	var cancelledStatus entity.BookingStatus
	if err := db.
		Where("LOWER(status_name) = ?", "cancelled").
		First(&cancelledStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบสถานะ cancelled"})
		return
	}

	if booking.StatusID == cancelledStatus.ID {
		c.JSON(http.StatusConflict, gin.H{"error": "รายการนี้ถูกยกเลิกไปแล้ว"})
		return
	}

	firstDate, err := minBookingDate(booking)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลวันจองไม่ถูกต้อง"})
		return
	}

	today := time.Now()
	todayDay := time.Date(today.Year(), today.Month(), today.Day(), 0, 0, 0, 0, today.Location())
	twoDaysLater := todayDay.Add(48 * time.Hour)
	if firstDate.Before(twoDaysLater) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "สามารถยกเลิกได้อย่างน้อย 2 วันล่วงหน้าก่อนวันใช้งาน"})
		return
	}

	now := time.Now()
	booking.StatusID = cancelledStatus.ID
	booking.CancelledAt = &now

	if err := db.Save(&booking).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกการจองได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกการจองเรียบร้อยแล้ว", "cancelledAt": now.Format("2006-01-02 15:04:05")})
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
		firstDate, err := minBookingDate(b)
		if err != nil {
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
