package entity

import "gorm.io/gorm"

// ManagerApproval คือ entity สำหรับการอนุมัติของผู้จัดการ
type ManagerApproval struct {
    gorm.Model
    Description     string        `json:"description"`
    UserID          uint          `json:"user_id"`
    User            User          `gorm:"foreignKey:UserID"`
    RequestID       uint          `json:"request_id"`
    MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID"`
    RequestStatusID uint          `json:"request_status_id"`
    RequestStatus   RequestStatus `gorm:"foreignKey:RequestStatusID"`
}
