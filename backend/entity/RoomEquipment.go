package entity

import (
	"gorm.io/gorm"
)

// Areas คือ entity สำหรับบทบาทของผู้ใช้
type RoomEquipment struct {
    gorm.Model
	Quantity 	int
	RoomID 		uint
	Room 		Room `gorm:"foreignKey:RoomID"`
	EquipmentID uint
	Equipment 	Equipment `gorm:"foreignKey:EquipmentID"`
}	