package entity

import "gorm.io/gorm"

type RentalRoomInvoiceItem struct {
	gorm.Model
	Description string		`valid:"required~Description is required"`
	Amount	  	float64		`valid:"required~Amount is required"`
	RentalRoomInvoiceID   uint		`valid:"required~RentalRoomInvoiceID is required"`
	RentalRoomInvoice     RentalRoomInvoice `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`
}