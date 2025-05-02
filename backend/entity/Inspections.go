package entity

import "gorm.io/gorm"

// Inspection คือ entity สำหรับการตรวจสอบซ่อม
type Inspection struct {
    gorm.Model
    Description     string        
    UserID          uint      
    User            User           `gorm:"foreignKey:UserID"`
    RequestID       uint    
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID"`
    RequestStatusID uint        
    RequestStatus   RequestStatus  `gorm:"foreignKey:RequestStatusID"`
}
