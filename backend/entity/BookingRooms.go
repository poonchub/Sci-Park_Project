package entity

import (
	"time"

	"gorm.io/gorm"
)

type BookingRoom struct {
	gorm.Model
	Purpose   string `valid:"required~กรุณาระบุวัตถุประสงค์"`
	UserID    uint   `valid:"required~กรุณาระบุผู้รับผิดชอบ"`
	User      User   `gorm:"foreignKey:UserID" valid:"-"`
	RoomID    uint
	Room      Room       `gorm:"foreignKey:RoomID" valid:"-"`
	TimeSlots []TimeSlot `gorm:"many2many:booking_room_timeslots;"`

	StatusID       uint          `valid:"required~กรุณาระบุสถานะ"`
	Status         BookingStatus `gorm:"foreignKey:StatusID" valid:"-"`
	Payments       []Payment     `gorm:"foreignKey:BookingRoomID"`
	CancelledAt    *time.Time    `gorm:"default:null"`                     // << เพิ่มอันนี้
	AdditionalInfo string        `gorm:"type:text" json:"additional_info"` // ข้อมูลเพิ่มเติม
	// ✅ เพิ่มความสัมพันธ์กับ BookingDate
	BookingDates []BookingDate `gorm:"foreignKey:BookingRoomID"`
}
