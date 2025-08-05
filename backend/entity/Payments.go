package entity

import (
	"gorm.io/gorm"
)

// Payment คือ entity สำหรับบันทึกการชำระเงิน
type Payment struct {
	gorm.Model

	PaymentDate string
	Amount       float64
	SlipPath     string
	Note         string

	StatusID      uint
	Status        PaymentStatus `gorm:"foreignKey:StatusID"`
	UserID        uint
	User          User `gorm:"foreignKey:UserID"`
	BookingRoomID uint
	BookingRoom   BookingRoom `gorm:"foreignKey:BookingRoomID"`
}
