package entity

import "gorm.io/gorm"

// MaintenanceRequest คือ entity สำหรับคำขอซ่อม
type MaintenanceRequest struct {
    gorm.Model
    Description     string            `json:"description"`
    UserID          uint              `json:"user_id"`
    User            User              `gorm:"foreignKey:UserID"`
    RoomID          uint              `json:"room_id"`
    Room            Room              `gorm:"foreignKey:RoomID"`
    RequestStatusID uint              `json:"request_status_id"`
    RequestStatus   RequestStatus     `gorm:"foreignKey:RequestStatusID"`
    AreaID          uint              `json:"area_id"`
    Area            Area              `gorm:"foreignKey:AreaID"`
    MaintenanceImages []MaintenanceImage `gorm:"foreignKey:RequestID"`
}
