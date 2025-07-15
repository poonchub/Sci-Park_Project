package entity

import (
	"time"

	"gorm.io/gorm"
)

type News struct {
	gorm.Model
	Title			string
	Summary       	string
	FullContent		string
	DisplayStart	time.Time
	DisplayEnd		time.Time
	IsPinned      bool

	UserID			uint
	User        	User          `gorm:"foreignKey:UserID"`

	NewsImages     	[]NewsImage   `gorm:"foreignKey:NewsID"`
}