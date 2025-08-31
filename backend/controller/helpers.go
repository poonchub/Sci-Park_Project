// controller/helpers.go
package controller

import (
	"errors"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strings"
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


