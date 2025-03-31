package entity

import "gorm.io/gorm"

// ManagerApproval คือ entity สำหรับการอนุมัติของผู้จัดการ
type ManagerApproval struct {
    gorm.Model
    Description     string
    UserID          uint
    User            User          `gorm:"foreignKey:UserID"`
    RequestID       uint       
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID"`
    RequestStatusID uint          
    RequestStatus   RequestStatus `gorm:"foreignKey:RequestStatusID"`
}