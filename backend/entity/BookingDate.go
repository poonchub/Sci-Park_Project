package entity

import (
	"time"

	"gorm.io/gorm"
)

// entity/booking_date.go
type BookingDate struct {
	gorm.Model
    BookingRoomID uint      `valid:"required~BookingRoomID is required"`
    Date          time.Time `valid:"required~Date is required"`
}
