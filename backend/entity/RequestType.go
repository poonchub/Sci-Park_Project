package entity

import "gorm.io/gorm"

// RequestType คือ entity สำหรับประเภทของผู้ใช้หรือประเภทคำขอ
type RequestType struct {
	gorm.Model
	TypeName string `valid:"required~กรุณาระบุชื่อประเภทคำขอ"`
	Users    []User `gorm:"foreignKey:RequestTypeID"`
}
