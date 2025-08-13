package entity

import (
	"gorm.io/gorm"
)

type RoomType struct {
    gorm.Model
    TypeName    string
    RoomSize    float32
    ForRental   bool
    HasMultipleSizes bool

    Rooms               []Room  `gorm:"foreignKey:RoomTypeID"`
    RoomTypeLayouts     []RoomTypeLayout  `gorm:"foreignKey:RoomTypeID"`
    RoomTypeImages      []RoomTypeImage  `gorm:"foreignKey:RoomTypeID"`
    RoomPrices          []RoomPrice  `gorm:"foreignKey:RoomTypeID"`
    RoomEquipments      []RoomEquipment  `gorm:"foreignKey:RoomTypeID"`
}

