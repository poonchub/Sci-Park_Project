package entity

import "gorm.io/gorm"

type BookingStatus struct {
	gorm.Model
	StatusName string `gorm:"uniqueIndex" valid:"required~กรุณาระบุชื่อสถานะ"`
	BookingRooms []BookingRoom `gorm:"foreignKey:StatusID"`
}
