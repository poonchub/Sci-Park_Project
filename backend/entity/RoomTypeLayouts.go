package entity

import (
	"gorm.io/gorm"
)

type RoomTypeLayout struct {
    gorm.Model
    Capacity     int
    Note         string

    RoomLayoutID uint
    RoomLayout   RoomLayout `gorm:"foreignKey:RoomLayoutID" valid:"-"`

    RoomTypeID   uint
    RoomType     RoomType   `gorm:"foreignKey:RoomTypeID" valid:"-"`
}
