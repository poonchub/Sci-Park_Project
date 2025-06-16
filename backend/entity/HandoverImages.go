package entity

import "gorm.io/gorm"

// HandoverImage คือ entity สำหรับภาพเมื่อซ่อมเสร็จ
type HandoverImage struct {
    gorm.Model
   FilePath string `valid:"required~กรุณาระบุ URL ของภาพ เช่น https://example.com/image.jpg,url~URL ไม่ถูกต้อง"`
    TaskID uint         
    Task   MaintenanceTask `gorm:"foreignKey:TaskID" valid:"-"`
}
