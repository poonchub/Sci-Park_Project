package entity

import (
	"gorm.io/gorm"
)


type RoomType struct {
    gorm.Model
    TypeName    string
    HalfDayRate float64
    FullDayRate float64
    Rooms       []Room  `gorm:"foreignKey:RoomTypeID"`
}
