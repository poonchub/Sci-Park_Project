package entity

import "gorm.io/gorm"

// Role คือ entity สำหรับบทบาทของผู้ใช้
type Role struct {
	gorm.Model
	Name string `json:"name"` // ชื่อบทบาท เช่น Employee, Manager, Admin
	
	Users []User `gorm:"foreignKey:RoleID"` // ความสัมพันธ์ 1 ต่อ หลาย
}
