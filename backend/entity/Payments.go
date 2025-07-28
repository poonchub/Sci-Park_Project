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
	Status        string    `gorm:"type:varchar(20);default:'pending'"` // pending, paid, cancelled
	UserID      uint
	User        User `gorm:"foreignKey:UserID"`
	BookingRoomID uint
	BookingRoom BookingRoom `gorm:"foreignKey:BookingRoomID"`
	
}