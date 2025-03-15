package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type MaintenanceImage struct {
    gorm.Model
    FilePath  string        
    RequestID uint         
    Request   MaintenanceRequest `gorm:"foreignKey:RequestID"`
}
