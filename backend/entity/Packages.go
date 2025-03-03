package entity

import "gorm.io/gorm"

// Package คือ entity สำหรับแพ็กเกจการใช้งาน
type Package struct {
    gorm.Model
    PackageName           string        `json:"package_name"`
    MeetingRoomLimit      int           `json:"meeting_room_limit"`
    TrainingRoomLimit     int           `json:"training_room_limit"`
    MultiFunctionRoomLimit int          `json:"multi_function_room_limit"`
    UserPackages         []UserPackage `gorm:"foreignKey:PackageID"`
}
