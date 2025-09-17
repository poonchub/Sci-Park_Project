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
	AdditionalInfo     string              `gorm:"type:text" json:"additional_info"`
	BookingDates       []BookingDate       `gorm:"foreignKey:BookingRoomID"`
	RoomBookingInvoice *RoomBookingInvoice `gorm:"foreignKey:BookingRoomID"`
	PaymentOptionID    uint
	PaymentOption      PaymentOption `gorm:"foreignKey:PaymentOptionID" valid:"-"`

	// 🔹 เพิ่มเพื่อรองรับเดดไลน์ 7 วันและเงื่อนไขเลื่อน/คืน
	ConfirmedAt    *time.Time
	EventStartAt   time.Time
	EventEndAt     time.Time
	IsFullyPrepaid bool `gorm:"default:false"` // จ่ายครบก่อนเริ่มงาน
	CanReschedule  bool `gorm:"default:false"` // เปิดสิทธิ์เลื่อนเมื่อ fully prepaid

	DepositAmount  float64
	DiscountAmount float64
	TotalAmount    float64
	TaxID          string
	Address        string
	Notifications  []Notification `gorm:"foreignKey:BookingRoomID"`

	// ✅ เพิ่มฟิลด์ผู้อนุมัติ
	ApproverID *uint `gorm:"index" json:"approver_id"`
	Approver   User  `gorm:"foreignKey:ApproverID" json:"approver"`
}
