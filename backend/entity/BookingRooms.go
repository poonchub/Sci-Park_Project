package entity

import (
	"time"

	"gorm.io/gorm"
)

type BookingRoom struct {
	gorm.Model
	Date           time.Time `valid:"required~กรุณาระบุวันที่"`
	Purpose        string    `valid:"required~กรุณาระบุวัตถุประสงค์"`
	UserID         uint      `valid:"required~กรุณาระบุผู้รับผิดชอบ"`
	User           User      `gorm:"foreignKey:UserID" valid:"-"`
	RoomID         uint
	Room           Room       `gorm:"foreignKey:RoomID" valid:"-"`
	TimeSlotID     uint       `valid:"required~กรุณาระบุสถานะ"`
	TimeSlot       TimeSlot   `gorm:"foreignKey:TimeSlotID" valid:"-"`
	Status         string     `gorm:"default:'pending'"` // สถานะ เช่น pending, confirmed, cancelled
	Payments       []Payment  `gorm:"foreignKey:BookingRoomID"`
	CancelledAt    *time.Time `gorm:"default:null"`                               // << เพิ่มอันนี้
	AdditionalInfo string     `gorm:"type:text" json:"additional_info"` // ข้อมูลเพิ่มเติม
}
