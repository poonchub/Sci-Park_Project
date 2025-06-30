package entity

import "gorm.io/gorm"

// UserPackage คือ entity สำหรับการเชื่อมโยง User กับ Package
type UserPackage struct {
    gorm.Model
    UserID                *uint   `json:"user_id"`
    User                  User    `gorm:"foreignKey:UserID"`
    PackageID             uint    `json:"package_id"`
    Package               Package `gorm:"foreignKey:PackageID"`
    MeetingRoomUsed       int     `json:"meeting_room_used"`
    TrainingRoomUsed      int     `json:"training_room_used"`
    MultiFunctionRoomUsed int     `json:"multi_function_room_used"`
}
     