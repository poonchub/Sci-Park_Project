package entity

import "gorm.io/gorm"

// JobPosition คือ entity สำหรับตำแหน่งงานของผู้ใช้
type JobPosition struct {
	gorm.Model
	Name  string `json:"Name" valid:"required~Name is required"`
	NameTH string `json:"NameTH"`
	Users []User `gorm:"foreignKey:JobPositionID"`
}
