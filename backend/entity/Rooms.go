package entity

import (
	"gorm.io/gorm"
)

type Room struct {
    gorm.Model
    FloorID       uint       `json:"floor_id"`
    Floor         Floor      `gorm:"foreignKey:FloorID"`
    Capacity      int        `json:"capacity"`
    RoomStatusID  uint       `json:"room_status_id"`
    RoomStatus    RoomStatus `gorm:"foreignKey:RoomStatusID"`
    RoomTypeID    uint       `json:"room_type_id"`
    RoomType      RoomType   `gorm:"foreignKey:RoomTypeID"`
}
