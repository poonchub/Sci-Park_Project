package entity

import (
	"time"

	"gorm.io/gorm"
)

// MaintenanceRequest คือ entity สำหรับคำขอซ่อม
type MaintenanceRequest struct {
    gorm.Model
    AreaDetail      string
    Description     string  
    IsAnytimeAvailable  bool   
    StartTime       time.Time       
	EndTime         time.Time     
        
    UserID          uint              
    User            User              `gorm:"foreignKey:UserID"`
    RoomID          uint              
    Room            Room              `gorm:"foreignKey:RoomID"`
    RequestStatusID uint             
    RequestStatus   RequestStatus     `gorm:"foreignKey:RequestStatusID"`
    AreaID          uint             
    Area            Area              `gorm:"foreignKey:AreaID"`
    MaintenanceTypeID   uint          
    MaintenanceType     MaintenanceType   `gorm:"foreignKey:MaintenanceTypeID"`
    MaintenanceImages []MaintenanceImage `gorm:"foreignKey:RequestID"`

    ManagerApproval     *ManagerApproval `gorm:"foreignKey:RequestID"`
    MaintenanceTask     *MaintenanceTask `gorm:"foreignKey:RequestID"`
}