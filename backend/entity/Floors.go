package entity

import "gorm.io/gorm"

type Floor struct {
    gorm.Model
    Number int    `gorm:"not null"`
    Rooms  []Room `gorm:"foreignKey:FloorID"`
}
