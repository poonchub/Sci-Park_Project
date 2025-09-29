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
    TimeSlots []TimeSlot `gorm:"many2many:booking_room_timeslots;" valid:"-"`

    StatusID           uint                `valid:"required~กรุณาระบุสถานะ"`
    Status             BookingStatus       `gorm:"foreignKey:StatusID" valid:"-"`
    Payments           []Payment           `gorm:"foreignKey:BookingRoomID" valid:"-"`
    CancelledAt        *time.Time          `gorm:"default:null"`
    CancelledNote      string              `gorm:"type:text" json:"cancelled_note"`
    BookingDates       []BookingDate       `gorm:"foreignKey:BookingRoomID" valid:"-"`
    RoomBookingInvoice *RoomBookingInvoice `gorm:"foreignKey:BookingRoomID" valid:"-"`

    PaymentOptionID uint
    PaymentOption   PaymentOption `gorm:"foreignKey:PaymentOptionID" valid:"-"`

    AdditionalInfo string `gorm:"type:text" json:"additional_info"`

    ConfirmedAt    *time.Time
    EventStartAt   time.Time
    EventEndAt     time.Time
    IsFullyPrepaid bool `gorm:"default:false"`
    CanReschedule  bool `gorm:"default:false"`

    DepositAmount  float64
    DiscountAmount float64
    TotalAmount    float64
    BaseTotal      float64 `json:"base_total"`
    TaxID          string
    Address        string
    Notifications  []Notification `gorm:"foreignKey:BookingRoomID" valid:"-"`

    ApproverID *uint `gorm:"index" json:"approver_id"`
    Approver   User  `gorm:"foreignKey:ApproverID" json:"approver" valid:"-"`

    CancelledByID *uint `gorm:"index" json:"cancelled_by_id"`
    CancelledBy   User  `gorm:"foreignKey:CancelledByID" json:"cancelled_by" valid:"-"`
}
