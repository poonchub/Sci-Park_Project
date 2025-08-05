package entity

import "gorm.io/gorm"

// HandoverImage คือ entity สำหรับภาพเมื่อซ่อมเสร็จ
type HandoverImage struct {
    gorm.Model
    FilePath string `valid:"required~Image file path is required"`
    TaskID uint     `valid:"required~TaskID is required"`
    Task   MaintenanceTask `gorm:"foreignKey:TaskID" valid:"-"`
}
