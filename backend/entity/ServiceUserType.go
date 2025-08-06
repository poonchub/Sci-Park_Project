package entity

import (
	"gorm.io/gorm"
)

type ServiceUserType struct {
	gorm.Model
	Name        string `gorm:"type:varchar(255);not null"`
	Description string `gorm:"type:text"`
}
