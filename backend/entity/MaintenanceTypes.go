package entity

import "gorm.io/gorm"

// MaintenanceType คือ entity สำหรับประเภทงานซ่อม
type MaintenanceType struct {
	gorm.Model
	TypeName             string               `valid:"required~TypeName is required"`
	MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:MaintenanceTypeID"`
}
