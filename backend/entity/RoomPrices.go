package entity

import "gorm.io/gorm"

type RoomPrice struct {
    gorm.Model

    Price     int
    TimeSlotID uint
    TimeSlot   TimeSlot  `gorm:"foreignKey:TimeSlotID" valid:"-"` // << เพิ่ม
    RoomTypeID uint
    RoomType   RoomType  `gorm:"foreignKey:RoomTypeID" valid:"-"` // << เพิ่ม
}
