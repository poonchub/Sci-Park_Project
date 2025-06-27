package entity

import "gorm.io/gorm"

// ManagerApproval คือ entity สำหรับการอนุมัติของผู้จัดการ
type ManagerApproval struct {
	gorm.Model
	Description     string           `valid:"required~กรุณาระบุคำอธิบาย"`
	UserID          uint             `valid:"required~กรุณาระบุผู้อนุมัติ"`
	User            User             `gorm:"foreignKey:UserID" valid:"-"`
	RequestID       uint             `valid:"required~กรุณาระบุคำขอซ่อม"`
	MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
	RequestStatusID uint             `valid:"required~กรุณาระบุสถานะคำขอ"`
	RequestStatus   RequestStatus    `gorm:"foreignKey:RequestStatusID" valid:"-"`
}
