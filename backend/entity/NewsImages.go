package entity

import "gorm.io/gorm"

type NewsImage struct {
	gorm.Model
	FilePath 	string		`valid:"required~Image file path is required"`

	NewsID		uint		`valid:"required~NewsID is required"`
	News       	News       	`gorm:"foreignKey:NewsID" valid:"-"`
}