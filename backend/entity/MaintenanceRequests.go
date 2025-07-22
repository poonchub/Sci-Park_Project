package entity

import (
	"time"

	"gorm.io/gorm"
)

// MaintenanceRequest คือ entity สำหรับคำขอซ่อม
type MaintenanceRequest struct {
	gorm.Model
	AreaDetail         string
	Description        string    `valid:"required~Description is required"`
	IsAnytimeAvailable bool
	StartTime          time.Time
	EndTime            time.Time
	OtherTypeDetail    string

	UserID            uint              `valid:"required~UserID is required"`
	User              User              `gorm:"foreignKey:UserID" valid:"-"`
	RoomID            uint              `valid:"required~RoomID is required"`
	Room              Room              `gorm:"foreignKey:RoomID" valid:"-"`
	RequestStatusID   uint              `valid:"required~RequestStatusID is required"`
	RequestStatus     RequestStatus     `gorm:"foreignKey:RequestStatusID" valid:"-"`
	AreaID            uint              `valid:"required~AreaID is required"`
	Area              Area              `gorm:"foreignKey:AreaID" valid:"-"`
	MaintenanceTypeID uint              `valid:"required~MaintenanceTypeID is required"`
	MaintenanceType   MaintenanceType   `gorm:"foreignKey:MaintenanceTypeID" valid:"-"`

	MaintenanceImages []MaintenanceImage `gorm:"foreignKey:RequestID"`
  	Notifications	  []Notification	 `gorm:"foreignKey:RequestID"`

	ManagerApproval *ManagerApproval `gorm:"foreignKey:RequestID"`
	MaintenanceTask *MaintenanceTask `gorm:"foreignKey:RequestID"`
	Inspection      *Inspection      `gorm:"foreignKey:RequestID"`
}