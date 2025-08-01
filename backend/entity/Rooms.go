package entity

import (
	

	"gorm.io/gorm"
)

type Room struct {
    gorm.Model

    RoomNumber string `valid:"required~กรุณาระบุหมายเลขห้อง"`
    Capacity   int    `valid:"required~กรุณาระบุความจุ"`

    RoomStatusID uint       `valid:"required~กรุณาระบุสถานะของห้อง"`
    RoomStatus   RoomStatus `gorm:"foreignKey:RoomStatusID" valid:"-"`

    FloorID     uint     `valid:"required~กรุณาระบุชั้นของห้อง"`
    Floor       Floor    `gorm:"foreignKey:FloorID" valid:"-"`

    RoomTypeID  uint     `valid:"required~กรุณาระบุประเภทของห้อง"`
    RoomType    RoomType `gorm:"foreignKey:RoomTypeID" valid:"-"`

    BookingRoom []BookingRoom `gorm:"foreignKey:RoomID"`
    
}
