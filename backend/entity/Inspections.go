package entity

import "gorm.io/gorm"

// Inspection คือ entity สำหรับการตรวจสอบซ่อม
type Inspection struct {
    gorm.Model
    Description     string       `valid:"required"` 
    UserID          uint            `valid:"required"`
    User            User           `gorm:"foreignKey:UserID" valid:"-"`
    RequestID       uint           `valid:"required"`
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
    RequestStatusID uint           `valid:"required"`
    RequestStatus   RequestStatus  `gorm:"foreignKey:RequestStatusID" valid:"-"`
}
