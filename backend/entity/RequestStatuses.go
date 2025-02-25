package entity

import "gorm.io/gorm"

// RequestStatus คือ entity สำหรับสถานะของคำขอซ่อม
type RequestStatus struct {
	gorm.Model
	Name string `json:"name"` // ชื่อสถานะ เช่น Pending, Approved, Rejected, In Progress, Completed, Failed
}
