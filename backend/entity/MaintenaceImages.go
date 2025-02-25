package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type MaintenanceImage struct {
	gorm.Model
	FilePath       string `json:"file_path"`
	RequestID      uint   `json:"request_id"`
	Request        MaintenanceRequest `gorm:"foreignKey:RequestID"` // foreign key ไปที่ MaintenanceRequest
}
