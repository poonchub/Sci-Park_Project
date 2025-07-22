package entity

import (
	"time"

	"gorm.io/gorm"
)

type News struct {
	gorm.Model
	Title			string	`valid:"required~Title is required"`
	Summary       	string	`valid:"required~Summary is required"`
	FullContent		string	`valid:"required~FullContent is required"`
	DisplayStart	time.Time	`valid:"required~DisplayStart is required"`
	DisplayEnd		time.Time	`valid:"required~DisplayEnd is required"`
	IsPinned      	bool

	UserID			uint		  `valid:"required~UserID is required"`
	User        	User          `gorm:"foreignKey:UserID" valid:"-"` 

	NewsImages     	[]NewsImage   `gorm:"foreignKey:NewsID"`
}