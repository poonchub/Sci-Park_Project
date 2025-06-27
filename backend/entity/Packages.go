package entity

import "gorm.io/gorm"

// Package คือ entity สำหรับแพ็กเกจการใช้งาน
type Package struct {
	gorm.Model
	PackageName            string        `json:"package_name" valid:"required~กรุณาระบุชื่อแพ็กเกจ"`
	MeetingRoomLimit       int           `json:"meeting_room_limit" valid:"required~กรุณาระบุจำนวนห้องประชุมขั้นต่ำ, int~ต้องเป็นตัวเลข"`
	TrainingRoomLimit      int           `json:"training_room_limit" valid:"required~กรุณาระบุจำนวนห้องฝึกอบรมขั้นต่ำ, int~ต้องเป็นตัวเลข"`
	MultiFunctionRoomLimit int           `json:"multi_function_room_limit" valid:"required~กรุณาระบุจำนวนห้องอเนกประสงค์ขั้นต่ำ, int~ต้องเป็นตัวเลข"`
	UserPackages           []UserPackage `gorm:"foreignKey:PackageID"`
}
