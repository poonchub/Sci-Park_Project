package entity

import (
	"gorm.io/gorm"
)

type Inspections struct {
	gorm.Model
	Description   string `json:"description"`  
}
