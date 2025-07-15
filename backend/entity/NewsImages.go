package entity

import "gorm.io/gorm"

type NewsImage struct {
	gorm.Model
	FilePath 	string

	NewsID		uint
	News       	News          `gorm:"foreignKey:NewsID"`
}