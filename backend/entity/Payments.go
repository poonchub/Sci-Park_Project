package entity

import (
	"time"

	"gorm.io/gorm"
)

// Payment คือ entity สำหรับบันทึกการชำระเงิน
type Payment struct {
	gorm.Model

	PaymentDate time.Time `valid:"required~PaymentDate is required"`
	Amount      float64   `valid:"required~Amount is required"`
	SlipPath    string    `valid:"required~Slip file path is required"`
	Note        string
	ReceiptPath string

	StatusID            uint          `valid:"required~StatusID is required"`
	Status              PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
	PayerID             uint          `valid:"required~PayerID is required"`
	Payer               User          `gorm:"foreignKey:PayerID" valid:"-"`
	ApproverID          uint
	Approver            User `gorm:"foreignKey:ApproverID" valid:"-"`
	BookingRoomID       uint
	BookingRoom         BookingRoom `gorm:"foreignKey:BookingRoomID" valid:"-"`
	RentalRoomInvoiceID uint
	RentalRoomInvoice   RentalRoomInvoice `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`
	PaymentTypeID       uint
	PaymentType         PaymentType `gorm:"foreignKey:PaymentTypeID" valid:"-"`
}
