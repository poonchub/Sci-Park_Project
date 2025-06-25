package entity

import "gorm.io/gorm"

type BookingRoom struct {
    gorm.Model
	Date    		  string
	Purpose 		  string
	UserID            uint             `valid:"required~กรุณาระบุผู้รับผิดชอบ"`
	User              User             `gorm:"foreignKey:UserID" valid:"-"`
	RoomID			  uint
	Room              Room             `gorm:"foreignKey:RoomID" valid:"-"`
	TimeSlotID        uint             `valid:"required~กรุณาระบุสถานะ"`
	TimeSlot          TimeSlot         `gorm:"foreignKey:TimeSlotID" valid:"-"`
}