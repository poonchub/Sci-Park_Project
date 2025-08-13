package entity

import (
	"time"

	"gorm.io/gorm"
)

type BookingDate struct {
	gorm.Model
	BookingRoomID uint
	Date          time.Time
}
