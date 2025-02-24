package entity

import (
	"gorm.io/gorm"
)

type ManagerApprovals struct {
	gorm.Model
	Description   string `json:"description"`
}
