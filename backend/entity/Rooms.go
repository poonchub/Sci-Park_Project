package entity

import (
	"gorm.io/gorm"
)

type Room struct {
    gorm.Model
    RoomNumber    string
    Capacity      int  

    RoomStatusID  uint     
    RoomStatus    RoomStatus `gorm:"foreignKey:RoomStatusID"`

    FloorID       uint     
    Floor         Floor      `gorm:"foreignKey:FloorID"`

    RoomTypeID    uint      
    RoomType      RoomType   `gorm:"foreignKey:RoomTypeID"`
}
