package entity

import "gorm.io/gorm"

// MaintenanceRequest คือ entity สำหรับคำขอซ่อม
type MaintenanceRequest struct {
	gorm.Model
	Description    string `json:"description"`
	UserID         uint   `json:"user_id"` 
	User           User   `gorm:"foreignKey:UserID"` // foreign key ไปที่ User
	RoomID         uint   `json:"room_id"`
	Room           Room   `gorm:"foreignKey:RoomID"` // foreign key ไปที่ Room
	RequestStatusID uint   `json:"request_status_id"`
	RequestStatus  RequestStatus `gorm:"foreignKey:RequestStatusID"` // foreign key ไปที่ RequestStatus

	MaintenanceImages []MaintenanceImage `gorm:"foreignKey:RequestID"`
}
