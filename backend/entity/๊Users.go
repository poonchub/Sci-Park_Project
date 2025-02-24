package entity

import (
	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	CompanyName    string `json:"company_name"`
	BusinessDetail string `json:"business_detail"`
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Email          string `gorm:"uniqueIndex" json:"email"` // กำหนดให้ email ไม่ซ้ำกัน
	Password       string `json:"password"`
	Phone          string `json:"phone"`
	ProfilePath    string `json:"profile_path"` // เก็บ path ของรูป profile
	LevelID        uint   `json:"level_id"`
	RoleID         uint   `json:"role_id"`
}
