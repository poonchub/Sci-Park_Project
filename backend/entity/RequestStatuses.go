package entity

import "gorm.io/gorm"

// RequestStatus คือ entity สำหรับสถานะของคำขอซ่อม
type RequestStatus struct {
    gorm.Model
    Name                string
    Description         string
             
    Inspections         []Inspection         `gorm:"foreignKey:RequestStatusID"`
    MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:RequestStatusID"`
    MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:RequestStatusID"`
    ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:RequestStatusID"`
}
