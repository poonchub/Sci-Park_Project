package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type MaintenanceImage struct {
    gorm.Model
    FilePath  string  `valid:"required~กรุณาระบุ URL ของภาพ เช่น https://example.com/image.jpg,url~URL ไม่ถูกต้อง"`       
    RequestID uint     `valid:"required"`    
    Request   MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
}
