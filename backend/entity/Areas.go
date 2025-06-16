package entity

import "gorm.io/gorm"

// Areas คือ entity สำหรับบทบาทของผู้ใช้
type Area struct {
    gorm.Model
    Name                string               `gorm:"not null" valid:"required~Name is required"`
    MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:AreaID"`
}
