package entity

import "gorm.io/gorm"

type PaymentType struct {
	gorm.Model
	TypeName string `valid:"required~Type is required"`

	Payments []Payment `gorm:"foreignKey:PaymentTypeID"`
}