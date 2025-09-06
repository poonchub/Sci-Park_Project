package entity

import (
	"time"

	"gorm.io/gorm"
)

type RoomBookingInvoice struct {
	gorm.Model
	InvoiceNumber  string    `valid:"required~InvoiceNumber is required"`
	IssueDate      time.Time `valid:"required~IssueDate is required"`
	DueDate        time.Time `valid:"required~DueDate is required"`
	DepositAmount  float64   `valid:"required~DepositAmount is required"`
	DiscountAmount float64   `valid:"required~DiscountAmount is required"`
	TotalAmount    float64   `valid:"required~TotalAmount is required"`
	InvoicePDFPath string
	TaxID          string
	Address        string

	BookingRoomID uint                    `valid:"required~BookingRoomID is required"`
	BookingRoom   BookingRoom             `gorm:"foreignKey:BookingRoomID" valid:"-"`
	ApproverID    uint                    `valid:"required~ApproverID is required"`
	Approver      User                    `gorm:"foreignKey:ApproverID" valid:"-"`
	CustomerID    uint                    `valid:"required~CustomerID is required"`
	Customer      User                    `gorm:"foreignKey:CustomerID" valid:"-"`
	Items         []RentalRoomInvoiceItem `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`
}
