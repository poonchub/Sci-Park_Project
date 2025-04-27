package entity

import "gorm.io/gorm"

type RequestType struct {
	gorm.Model
	TypeName	string
	Users 		[]User `gorm:"foreignKey:RequestTypeID"`
}