package entity

import (
	"time"

	"gorm.io/gorm"
)

// MaintenanceRequest คือ entity สำหรับคำขอซ่อม
type MaintenanceRequest struct {
	gorm.Model
	AreaDetail         string    `valid:"required~กรุณาระบุพื้นที่"`
	Description        string    `valid:"required~กรุณาระบุคำอธิบาย"`
	IsAnytimeAvailable bool      // ไม่ต้องใช้ tag เพราะเป็น bool
	StartTime          time.Time `valid:"required~กรุณาระบุเวลาเริ่มต้น"`
	EndTime            time.Time `valid:"required~กรุณาระบุเวลาสิ้นสุด"`
	OtherTypeDetail    string

	UserID            uint              `valid:"required~กรุณาระบุผู้แจ้ง"`
	User              User              `gorm:"foreignKey:UserID" valid:"-"`
	RoomID            uint              `valid:"required~กรุณาระบุห้อง"`
	Room              Room              `gorm:"foreignKey:RoomID" valid:"-"`
	RequestStatusID   uint              `valid:"required~กรุณาระบุสถานะคำขอ"`
	RequestStatus     RequestStatus     `gorm:"foreignKey:RequestStatusID" valid:"-"`
	AreaID            uint              `valid:"required~กรุณาระบุพื้นที่"`
	Area              Area              `gorm:"foreignKey:AreaID" valid:"-"`
	MaintenanceTypeID uint              `valid:"required~กรุณาระบุประเภทการซ่อม"`
	MaintenanceType   MaintenanceType   `gorm:"foreignKey:MaintenanceTypeID" valid:"-"`

	MaintenanceImages []MaintenanceImage `gorm:"foreignKey:RequestID"`
  	Notifications	  []Notification	 `gorm:"foreignKey:RequestID"`

	ManagerApproval *ManagerApproval `gorm:"foreignKey:RequestID"`
	MaintenanceTask *MaintenanceTask `gorm:"foreignKey:RequestID"`
	Inspection      *Inspection      `gorm:"foreignKey:RequestID"`
}