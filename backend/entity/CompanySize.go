package entity

import (
	"gorm.io/gorm"
)

type CompanySize struct {
	gorm.Model
	Name string `gorm:"type:varchar(255);not null"`
}
