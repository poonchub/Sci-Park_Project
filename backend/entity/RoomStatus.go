package entity

import (
	"gorm.io/gorm"
)


type RoomStatus struct {
    gorm.Model
    StatusName string  `json:"status_name"`
    Rooms      []Room  `gorm:"foreignKey:RoomStatusID"`
}
