package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type MaintenanceImage struct {
    gorm.Model
    FilePath string `valid:"required~Image file path is required"`      
    RequestID uint     `valid:"required~RequestID is required"`    
    Request   MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
}
