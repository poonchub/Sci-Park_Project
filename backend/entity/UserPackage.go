package entity

import "gorm.io/gorm"

// UserPackage คือ entity สำหรับการเชื่อมโยง User กับ Package
type UserPackage struct {
	gorm.Model
	UserID                *uint   `json:"user_id"`     // ใช้ *uint เพื่อให้สามารถเป็น null ได้
	User                  User    `gorm:"foreignKey:UserID"`    // เชื่อมโยงไปที่ User
	PackageID             uint    `json:"package_id"`           // ใช้ normal uint สำหรับ One-to-Many กับ Package
	Package               Package `gorm:"foreignKey:PackageID"` // เชื่อมโยงไปที่ Package
	MeetingRoomUsed       int     `json:"meeting_room_used"`
	TrainingRoomUsed      int     `json:"training_room_used"`
	MultiFunctionRoomUsed int     `json:"multi_function_room_used"`
}
     