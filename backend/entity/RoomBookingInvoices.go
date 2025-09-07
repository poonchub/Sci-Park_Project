package entity

import (
	"time"

	"gorm.io/gorm"
)

type RoomBookingInvoice struct {
	gorm.Model
	InvoiceNumber  string
	IssueDate      time.Time
	DueDate        time.Time
	DepositDueDate time.Time
	InvoicePDFPath string

	BookingRoomID uint
	BookingRoom   BookingRoom `gorm:"foreignKey:BookingRoomID" valid:"-"`
	ApproverID    uint
	Approver      User `gorm:"foreignKey:ApproverID" valid:"-"`
	CustomerID    uint
	Customer      User                    `gorm:"foreignKey:CustomerID" valid:"-"`
	Items         []RentalRoomInvoiceItem `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`
}
