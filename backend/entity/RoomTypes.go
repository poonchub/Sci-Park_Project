package entity

import (
	"gorm.io/gorm"
)


type RoomType struct {
    gorm.Model
    TypeName    string  `json:"type_name"`
    HalfDayRate float64 `json:"half_day_rate"`
    FullDayRate float64 `json:"full_day_rate"`
    Rooms       []Room  `gorm:"foreignKey:RoomTypeID"`
}
