package entity

import "gorm.io/gorm"

type PaymentOption struct {
	gorm.Model
	OptionName	string

	BookingRooms []BookingRoom `gorm:"foreignKey:PaymentOptionID"`
}