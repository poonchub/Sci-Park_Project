package entity

import "gorm.io/gorm"

// MaintenanceType คือ entity สำหรับประเภทงานซ่อม
type MaintenanceType struct {
	gorm.Model
	TypeName             string               `valid:"required~กรุณาระบุชื่อประเภทงานซ่อม"`
	MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:MaintenanceTypeID"`
}
