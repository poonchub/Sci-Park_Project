package entity

import "gorm.io/gorm"

// Role คือ entity สำหรับบทบาทของผู้ใช้
type Role struct {
	gorm.Model
	Name  string `json:"name" valid:"required~Name is required"`
	Users []User `gorm:"foreignKey:RoleID"`
}
