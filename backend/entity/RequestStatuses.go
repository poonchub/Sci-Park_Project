package entity

import "gorm.io/gorm"

// RequestStatus คือ entity สำหรับสถานะของคำขอซ่อม
type RequestStatus struct {
	gorm.Model
	Name string `json:"name"` // ชื่อสถานะ เช่น Pending, Approved, Rejected, In Progress, Completed, Failed

	// 🔹 เพิ่มความสัมพันธ์ One-to-Many
	Inspections         []Inspection         `gorm:"foreignKey:RequestStatusID"`
	MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:RequestStatusID"`
	MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:RequestStatusID"`
	ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:RequestStatusID"`

}
