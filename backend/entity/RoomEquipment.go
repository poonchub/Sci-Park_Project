package entity

import (
	"gorm.io/gorm"
)

// Areas คือ entity สำหรับบทบาทของผู้ใช้
type RoomEquipment struct {
    gorm.Model
	Quantity 	int
	RoomTypeID 	uint
	RoomType 	RoomType `gorm:"foreignKey:RoomTypeID"`
	EquipmentID uint
	Equipment 	Equipment `gorm:"foreignKey:EquipmentID"`
}	