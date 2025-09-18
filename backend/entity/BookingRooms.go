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

	StatusID           uint                `valid:"required~กรุณาระบุสถานะ"`
	Status             BookingStatus       `gorm:"foreignKey:StatusID" valid:"-"`
	Payments           []Payment           `gorm:"foreignKey:BookingRoomID"`
	CancelledAt        *time.Time          `gorm:"default:null"`
	CancelledNote      string              `gorm:"type:text" json:"cancelled_note"` // ← เพิ่ม
	BookingDates       []BookingDate       `gorm:"foreignKey:BookingRoomID"`
	RoomBookingInvoice *RoomBookingInvoice `gorm:"foreignKey:BookingRoomID"`
	PaymentOptionID    uint
	PaymentOption      PaymentOption `gorm:"foreignKey:PaymentOptionID" valid:"-"`

	// ข้อมูลเพิ่มเติมที่ผู้จองกรอก
	AdditionalInfo string `gorm:"type:text" json:"additional_info"`

	// เดดไลน์/เงื่อนไขเลื่อน-คืน
	ConfirmedAt    *time.Time
	EventStartAt   time.Time
	EventEndAt     time.Time
	IsFullyPrepaid bool `gorm:"default:false"`
	CanReschedule  bool `gorm:"default:false"`

	DepositAmount  float64
	DiscountAmount float64
	TotalAmount    float64
	TaxID          string
	Address        string
	Notifications  []Notification `gorm:"foreignKey:BookingRoomID"`

	// ผู้อนุมัติ
	ApproverID *uint `gorm:"index" json:"approver_id"`
	Approver   User  `gorm:"foreignKey:ApproverID" json:"approver"`

	// (ออปชัน) เก็บผู้ที่ “ยกเลิก”
	CancelledByID *uint `gorm:"index" json:"cancelled_by_id"`
	CancelledBy   User  `gorm:"foreignKey:CancelledByID" json:"cancelled_by"`
}
