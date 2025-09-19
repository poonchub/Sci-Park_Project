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
	if err := db.Where("LOWER(name) = ?", strings.ToLower(name)).First(&ps).Error; err != nil {
		return 0, errors.New("payment status '" + name + "' not found")
	}
	return ps.ID, nil
}

func mustBookingStatusID(name string) (uint, error) {
	db := config.DB()
	var bs entity.BookingStatus
	if err := db.Where("LOWER(status_name) = ?", strings.ToLower(name)).First(&bs).Error; err != nil {
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

func getOrCreatePaymentType(tx *gorm.DB, name string) (entity.PaymentType, error) {
	var pt entity.PaymentType
	err := tx.Where("LOWER(name) = ?", strings.ToLower(name)).First(&pt).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			pt = entity.PaymentType{TypeName: name}
			if err := tx.Create(&pt).Error; err != nil {
				return pt, err
			}
		} else {
			return pt, err
		}
	}
	return pt, nil
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
	case "awaiting payment", "pending payment", "unpaid", "overdue":
		return "Awaiting payment"
	case "pending verification", "verifying", "waiting for verify", "submitted":
		return "Pending verification"
	case "paid", "approved", "completed":
		return "Paid"
	case "rejected", "failed":
		return "Rejected"
	case "refunded":
		return "Refunded"
	default:
		return "Awaiting payment"
	}
}

// ควรใช้ร่วมกันทั้ง ListBookingRooms และ ListBookingRoomsByUser
// ขั้นตอนที่ backend จะส่งให้ FE
// มีแค่: pending | confirmed | payment review | payment | completed | cancelled
func computeDisplayStatus(b entity.BookingRoom) string {
    status := strings.ToLower(strings.TrimSpace(b.Status.StatusName))

    // 1) ยกเลิก ชนะทุกกรณี
    if status == "cancelled" {
        return "cancelled"
    }
    // 2) จบงานจริง (จะตั้งจากปุ่ม Complete เท่านั้น)
    if status == "completed" {
        return "completed"
    }
    // 3) รออนุมัติ
    if status == "pending" {
        return "pending"
    }

    // 4) หลังอนุมัติแล้ว → ตัดสินขั้น Payment ด้วย "สถานะสลิป/การอนุมัติสลิป" เท่านั้น
    //    * ไม่พิจารณายอดเงิน รวมทั้ง IsFullyPaid/TotalAmount
    hasSlipPending := false
    hasApprovedPayment := false

    for _, p := range b.Payments {
        ps := strings.ToLower(strings.TrimSpace(p.Status.Name))
        if ps == "submitted" || ps == "pending verification" {
            hasSlipPending = true
        }
        if ps == "approved" || ps == "paid" {
            hasApprovedPayment = true
        }
        // **ไม่** ตีความ receipt/fully-paid ที่นี่
    }

    if hasSlipPending {
        return "payment review"
    }
    if hasApprovedPayment {
        // มีงวดอนุมัติเงินแล้ว → อยู่ขั้น Payment (รอจบงาน)
        return "payment"
    }

    // อนุมัติจองแล้ว แต่ยังไม่จ่าย/ยังไม่มีสลิป
    if status == "confirmed" || status == "approved" {
        return "confirmed"
    }

    // เผื่อสะกดอื่น ๆ
    return "pending"
}
