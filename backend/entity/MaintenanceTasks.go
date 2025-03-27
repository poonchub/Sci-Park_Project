package entity

import "gorm.io/gorm"

// MaintenanceTask คือ entity สำหรับงานซ่อม
type MaintenanceTask struct {
    gorm.Model
    Description     string    
    UserID          uint     
    User            User          `gorm:"foreignKey:UserID"`
    RequestID       uint      
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID"`
    RequestStatusID uint      
    RequestStatus   RequestStatus `gorm:"foreignKey:RequestStatusID"`
}
