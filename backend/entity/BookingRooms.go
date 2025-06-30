package entity

import (
	"time"

	"gorm.io/gorm"
)

type BookingRoom struct {
    gorm.Model
	Date    		  time.Time        `valid:"required~กรุณาระบุวันที่"`
	Purpose 		  string			`valid:"required~กรุณาระบุวัตถุประสงค์"`
	UserID            uint             `valid:"required~กรุณาระบุผู้รับผิดชอบ"`
	User              User             `gorm:"foreignKey:UserID" valid:"-"`
	RoomID			  uint				
	Room              Room             `gorm:"foreignKey:RoomID" valid:"-"`
	TimeSlotID        uint             `valid:"required~กรุณาระบุสถานะ"`
	TimeSlot          TimeSlot         `gorm:"foreignKey:TimeSlotID" valid:"-"`
	Payments           []Payment `gorm:"foreignKey:UserID"`
}