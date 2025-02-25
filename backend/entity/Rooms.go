package entity

import (
	"gorm.io/gorm"
)

type Room struct {
	gorm.Model
	Floor        int        `json:"floor"`           // ชั้นของห้อง
	Capacity     int        `json:"capacity"`        // ความจุของห้อง
	
	RoomStatusID uint       `json:"room_status_id"`  // foreign key จาก RoomStatus
	RoomTypeID   uint       `json:"room_type_id"`    // foreign key จาก RoomType
	RoomStatus   RoomStatus `gorm:"foreignKey:RoomStatusID" json:"room_status"` // เชื่อมโยงกับ RoomStatus
	RoomType     RoomType   `gorm:"foreignKey:RoomTypeID" json:"room_type"`     // เชื่อมโยงกับ RoomType
}
