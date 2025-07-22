package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type MaintenanceImage struct {
    gorm.Model
    FilePath string `valid:"required~Image URL is required,url~Invalid URL format (example: https://example.com/image.jpg)"`      
    RequestID uint     `valid:"required~RequestID is required"`    
    Request   MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
}
