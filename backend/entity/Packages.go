package entity

import "gorm.io/gorm"

// Package คือ entity สำหรับแพ็กเกจการใช้งาน
type Package struct {
	gorm.Model
	PackageName            string        `json:"package_name" valid:"required~Package name is required"`
	MeetingRoomLimit       int           `json:"meeting_room_limit" valid:"range(0|999999)~Meeting room limit must be between 0-999999"`
	TrainingRoomLimit      int           `json:"training_room_limit" valid:"range(0|999999)~Training room limit must be between 0-999999"`
	MultiFunctionRoomLimit int           `json:"multi_function_room_limit" valid:"range(0|999999)~Multi-function room limit must be between 0-999999"`
	UserPackages           []UserPackage `gorm:"foreignKey:PackageID"`
}
