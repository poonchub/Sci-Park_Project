package entity

import "gorm.io/gorm"

type PaymentStatus struct {
	gorm.Model
	Name string `valid:"required~Name is required"`

	Payments []Payment `gorm:"foreignKey:StatusID"`
	Invoices []Invoice `gorm:"foreignKey:StatusID"`
}