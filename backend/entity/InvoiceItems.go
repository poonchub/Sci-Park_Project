package entity

import "gorm.io/gorm"

type InvoiceItem struct {
	gorm.Model
	Description string
	UnitPrice   float64
	Amount	  float64
	InvoiceID   uint
	Invoice     Invoice `gorm:"foreignKey:InvoiceID" valid:"-"`
}