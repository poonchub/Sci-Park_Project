package entity

import "gorm.io/gorm"

// Inspection คือ entity สำหรับการตรวจสอบซ่อม
type Inspection struct {
	gorm.Model
	Description    string `json:"description"`
	UserID         uint   `json:"user_id"`
	User           User   `gorm:"foreignKey:UserID"` // foreign key ไปที่ User
	RequestID      uint   `json:"request_id"`
	RequestStatusID uint  `json:"request_status_id"`
	RequestStatus  RequestStatus `gorm:"foreignKey:RequestStatusID"` // foreign key ไปที่ RequestStatus
}
