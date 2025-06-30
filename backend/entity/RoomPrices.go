package entity

import "gorm.io/gorm"

type RoomPrice struct {
    gorm.Model
   
	Price 		int
	TimeSlotID 	uint
	TimeSlot 	TimeSlot `gorm:"foreignKey:TimeSlotID"`
	RoomTypeID 	uint
	RoomType 	RoomType `gorm:"foreignKey:RoomTypeID"`
}