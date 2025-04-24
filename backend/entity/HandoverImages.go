package entity

import "gorm.io/gorm"

// HandoverImage คือ entity สำหรับภาพเมื่อซ่อมเสร็จ
type HandoverImage struct {
    gorm.Model
    FilePath  string        
    TaskID uint         
    Task   MaintenanceTask `gorm:"foreignKey:TaskID"`
}
