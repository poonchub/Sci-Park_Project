package entity

import "gorm.io/gorm"

// Inspection คือ entity สำหรับการตรวจสอบซ่อม
type Inspection struct {
    gorm.Model
    Note            string
    UserID          uint            `valid:"required~UserID is required"`
    User            User           `gorm:"foreignKey:UserID" valid:"-"`
    RequestID       uint           `valid:"required~RequestID is required"`
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
    RequestStatusID uint           `valid:"required~RequestStatusID is required"`
    RequestStatus   RequestStatus  `gorm:"foreignKey:RequestStatusID" valid:"-"`
}
