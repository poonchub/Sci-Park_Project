// controller/helpers.go
package controller

import (
	"errors"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strings"

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

// แปลง PaymentStatus.Name -> frontend Payment.status
func uiPaymentStatus(dbName string) string {
    switch strings.ToLower(dbName) {
    case "pending payment":
        return "unpaid"
    case "pending verification":
        return "submitted"
    case "awaiting receipt":
        return "paid"
    case "paid":
        return "paid"
    case "refunded":
        return "paid"  // ✅ ให้ refund นับรวม payment
    default:
        return "unpaid"
    }
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
