package entity

import (
	"gorm.io/gorm"
)

type BusinessGroup struct {
	gorm.Model
	Name string `gorm:"type:varchar(255);not null"`
}
