package entity

import "gorm.io/gorm"

type NewsImage struct {
	gorm.Model
	FilePath 	string		`valid:"required~Image URL is required,url~Invalid URL format (example: https://example.com/image.jpg)"`

	NewsID		uint		`valid:"required~NewsID is required"`
	News       	News       	`gorm:"foreignKey:NewsID" valid:"-"`
}