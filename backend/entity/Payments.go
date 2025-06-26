package entity

import (
	"gorm.io/gorm"
)

// Areas คือ entity สำหรับบทบาทของผู้ใช้
type Payment struct {
    gorm.Model
	
	PaymentsDate string
	Amount      float64
	SlipPath    string
	Note    string
	UserID      uint
	User        User `gorm:"foreignKey:UserID"`
	BookingRoomID uint
	BookingRoom BookingRoom `gorm:"foreignKey:BookingRoomID"`
	
}