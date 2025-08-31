package entity

import "gorm.io/gorm"

type InvoiceItem struct {
	gorm.Model
	Description string		`valid:"required~Description is required"`
	Amount	  	float64		`valid:"required~Amount is required"`
	InvoiceID   uint		`valid:"required~InvoiceID is required"`
	Invoice     Invoice `gorm:"foreignKey:InvoiceID" valid:"-"`
}