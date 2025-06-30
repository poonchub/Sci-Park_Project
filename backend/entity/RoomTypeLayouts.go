package entity

import (
	"gorm.io/gorm"
)

type RoomTypeLayout struct {
    gorm.Model
	Capacity      	int  
	Note			string

    RoomLayoutID  uint     
    RoomLayout    RoomLayout `gorm:"foreignKey:RoomLayoutID"`

	RoomTypeID  uint     
    RoomType    RoomLayout `gorm:"foreignKey:RoomTypeID"`
}