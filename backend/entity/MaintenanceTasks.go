package entity

import "gorm.io/gorm"

// MaintenanceTask คือ entity สำหรับงานซ่อม
type MaintenanceTask struct {
	gorm.Model
	Description       string           `valid:"required~กรุณาระบุรายละเอียดงานซ่อม"`
	UserID            uint             `valid:"required~กรุณาระบุผู้รับผิดชอบ"`
	User              User             `gorm:"foreignKey:UserID" valid:"-"`
	RequestID         uint             `valid:"required~กรุณาระบุคำขอซ่อม"`
	MaintenanceRequest MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`
	RequestStatusID   uint             `valid:"required~กรุณาระบุสถานะ"`
	RequestStatus     RequestStatus    `gorm:"foreignKey:RequestStatusID" valid:"-"`
  
	HandoverImages    []HandoverImage  `gorm:"foreignKey:TaskID"`
  Notifications  	  []Notification 	`gorm:"foreignKey:TaskID"`
}