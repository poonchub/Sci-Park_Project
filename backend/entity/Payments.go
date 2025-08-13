package entity

import (
	"time"

	"gorm.io/gorm"
)

// Payment คือ entity สำหรับบันทึกการชำระเงิน
type Payment struct {
	gorm.Model

	PaymentDate  time.Time
	Amount       float64
	SlipPath     string
	Note         string

	StatusID      uint
	Status        PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
	UserID        uint
	User          User `gorm:"foreignKey:UserID" valid:"-"`
	BookingRoomID uint
	BookingRoom   BookingRoom `gorm:"foreignKey:BookingRoomID" valid:"-"`
	InvoiceID     uint
	Invoice       Invoice `gorm:"foreignKey:InvoiceID" valid:"-"`
}
