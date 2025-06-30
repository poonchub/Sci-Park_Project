package entity

import (
	"gorm.io/gorm"
)

type RoomType struct {
    gorm.Model
    TypeName    string
    RoomSize    float32
    HalfDayRate float64
    FullDayRate float64

    Rooms       []Room  `gorm:"foreignKey:RoomTypeID"`
    RoomTypeLayouts       []RoomTypeLayout  `gorm:"foreignKey:RoomTypeID"`
    RoomTypeImages      []RoomTypeImage  `gorm:"foreignKey:RoomTypeID"`
    RoomPrices     []RoomPrice  `gorm:"foreignKey:RoomTypeID"`
   
}

