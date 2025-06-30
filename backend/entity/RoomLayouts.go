package entity

import (
	"gorm.io/gorm"
)

type RoomLayout struct {
    gorm.Model
    LayoutName  string
    RoomTypeLayouts       []RoomTypeLayout  `gorm:"foreignKey:RoomLayoutID"`
}