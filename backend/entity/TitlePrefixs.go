package entity

import "gorm.io/gorm"

type TitlePrefix struct {
	gorm.Model
	PrefixTH    string
	PrefixEN    string

	Users 		[]User `gorm:"foreignKey:PrefixID"`
}