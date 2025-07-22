package entity

import "gorm.io/gorm"

// RequestType คือ entity สำหรับประเภทของผู้ใช้หรือประเภทคำขอ
type RequestType struct {
	gorm.Model
	TypeName string `valid:"required~TypeName is required"`
	Users    []User `gorm:"foreignKey:RequestTypeID"`
}
