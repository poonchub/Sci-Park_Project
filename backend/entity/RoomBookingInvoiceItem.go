package entity

import "gorm.io/gorm"

type RoomBookingInvoiceItem struct {
	gorm.Model
	Description          string             `valid:"required~Description is required"`
	Quantity             int                `valid:"required~Quantity is required"`
	UnitPrice            float64            `valid:"required~UnitPrice is required"`
	Amount               float64            `valid:"required~Amount is required"`
	RoomBookingInvoiceID uint               `valid:"required~RoomBookingInvoiceID is required"`
	RoomBookingInvoice   RoomBookingInvoice `gorm:"foreignKey:RoomBookingInvoiceID" valid:"-"`
}