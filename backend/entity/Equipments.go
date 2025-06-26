package entity

import (
	"gorm.io/gorm"
)

// Areas คือ entity สำหรับบทบาทของผู้ใช้
type Equipment struct {
    gorm.Model
	EquipmentName string `valid:"required~กรุณาระบุชื่ออุปกรณ์"`

	RoomEquipment []RoomEquipment `gorm:"foreignKey:EquipmentID"`
}