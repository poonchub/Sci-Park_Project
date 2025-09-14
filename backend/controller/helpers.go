// controller/helpers.go
package controller

import (
	"encoding/json"
	"errors"
	"math"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"
)

func mustPaymentStatusID(name string) (uint, error) {
	db := config.DB()
	var ps entity.PaymentStatus
	if err := db.Where("name = ?", name).First(&ps).Error; err != nil {
		return 0, errors.New("payment status '" + name + "' not found")
	}
	return ps.ID, nil
}

func mustBookingStatusID(name string) (uint, error) {
	db := config.DB()
	var bs entity.BookingStatus
	if err := db.Where("status_name = ?", name).First(&bs).Error; err != nil {
		return 0, errors.New("booking status '" + name + "' not found")
	}
	return bs.ID, nil
}

// สร้างห้อง 1 ห้องให้ RoomType ที่ยังไม่มีห้องเลย (กันพลาดในข้อมูล)
func ensureTypeHasRoom(db *gorm.DB, roomTypeID uint, roomNumber string, floorID uint) error {
	var count int64
	if err := db.Model(&entity.Room{}).Where("room_type_id = ?", roomTypeID).Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		r := entity.Room{RoomNumber: roomNumber, FloorID: floorID, RoomStatusID: 1, RoomTypeID: roomTypeID}
		return db.Create(&r).Error
	}
	return nil
}

// ใช้แบบนี้สักครั้งตอน seed:
// _ = ensureTypeHasRoom(db, LARGE_ROOM_TYPE_ID, "LARGE-01", 1)

func getOrCreatePaymentStatus(tx *gorm.DB, name string) (entity.PaymentStatus, error) {
    var ps entity.PaymentStatus
    err := tx.Where("LOWER(name) = ?", strings.ToLower(name)).First(&ps).Error
    if err != nil {
        if errors.Is(err, gorm.ErrRecordNotFound) {
            ps = entity.PaymentStatus{Name: name} // ถ้า struct ใช้ StatusName ให้เปลี่ยนเป็น StatusName: name
            if err := tx.Create(&ps).Error; err != nil {
                return ps, err
            }
        } else {
            return ps, err
        }
    }
    return ps, nil
}

func round2(v float64) float64 {
	return math.Round(v*100) / 100
}

func minBookingDate(b entity.BookingRoom) (time.Time, error) {
	if len(b.BookingDates) == 0 {
		return time.Time{}, errors.New("no booking dates")
	}
	dates := make([]time.Time, 0, len(b.BookingDates))
	for _, d := range b.BookingDates {
		dates = append(dates, d.Date)
	}
	sort.Slice(dates, func(i, j int) bool { return dates[i].Before(dates[j]) })
	return dates[0], nil
}

func lastBookingDate(b *entity.BookingRoom) (time.Time, error) {
	if b == nil || len(b.BookingDates) == 0 {
		return time.Time{}, errors.New("no booking dates")
	}
	dates := make([]time.Time, 0, len(b.BookingDates))
	for _, d := range b.BookingDates {
		dates = append(dates, d.Date)
	}
	sort.Slice(dates, func(i, j int) bool { return dates[i].After(dates[j]) })
	return dates[0], nil
}

type AdditionalInfo struct {
	SetupStyle     string   `json:"SetupStyle"`
	Equipment      []string `json:"Equipment"`
	AdditionalNote string   `json:"AdditionalNote"`
}

func parseAdditionalInfo(s string) AdditionalInfo {
	var a AdditionalInfo
	if s != "" {
		_ = json.Unmarshal([]byte(s), &a)
	}
	return a
}

func uiPaymentStatus(s string) string {
	switch strings.ToLower(strings.TrimSpace(s)) {
	case "pending payment", "unpaid", "overdue":
		return "unpaid"
	case "pending verification", "verifying", "waiting for verify":
		return "pending verification"
	case "rejected", "failed":
		return "rejected"
	case "approved", "paid", "completed", "deposit paid":
		return "approved"
	default:
		return "unpaid"
	}
}

// ควรใช้ร่วมกันทั้ง ListBookingRooms และ ListBookingRoomsByUser
func computeDisplayStatus(b entity.BookingRoom) string {
	// 1) Cancelled ชนะทุกกรณี
	if b.CancelledAt != nil || strings.EqualFold(b.Status.StatusName, "Cancelled") {
		return "cancelled"
	}

	// 2) ยอดที่ต้องจ่าย
	totalDue := b.TotalAmount - b.DiscountAmount
	if totalDue < 0 {
		totalDue = 0
	}

	// 3) รวมยอดที่ Approved แล้ว และเช็คว่า Approved ทุกก้อนมี receipt ครบไหม
	var sumApproved float64
	var hasSubmitted bool
	var approvedMissingReceipt bool

	for _, p := range b.Payments {
		s := strings.ToLower(p.Status.Name)
		switch s {
		case "approved", "paid":
			sumApproved += p.Amount
			if strings.TrimSpace(p.ReceiptPath) == "" {
				approvedMissingReceipt = true
			}
		case "pending verification", "submitted":
			hasSubmitted = true
		}
	}

	// 4) ถ้าจ่ายครบแล้ว
	if sumApproved >= totalDue && totalDue > 0 {
		if approvedMissingReceipt {
			return "awaiting receipt" // ✅ รอแนบใบเสร็จ
		}
		return "completed" // ✅ มีใบเสร็จครบ → เสร็จสมบูรณ์
	}

	// 5) ยังไม่ครบ: มีสลิปที่รอตรวจ?
	if hasSubmitted {
		return "payment review"
	}

	// 6) มีการชำระบ้าง แต่อาจยังไม่ครบ → อยู่โซน payment
	if len(b.Payments) > 0 {
		return "payment"
	}

	// 7) ยังไม่ชำระ ให้ยึดสถานะ booking เดิม
	if strings.EqualFold(b.Status.StatusName, "Confirmed") {
		return "confirmed"
	}
	return "pending"
}
