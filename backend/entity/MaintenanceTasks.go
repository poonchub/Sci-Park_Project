package entity

import (
	"gorm.io/gorm"
)

type MaintenanceTasks struct {
	gorm.Model
	Description   string `json:"description"`
	
}
