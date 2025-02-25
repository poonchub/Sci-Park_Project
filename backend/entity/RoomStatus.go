package entity

import (
	"gorm.io/gorm"
)


type RoomStatus struct {
	gorm.Model
	StatusName string  `json:"status_name"` // ชื่อสถานะของห้อง เช่น "Reserved", "Not reserved"
	Rooms      []Room `gorm:"foreignKey:RoomStatusID"` // ความสัมพันธ์ 1 ต่อ หลายกับ Room
}
