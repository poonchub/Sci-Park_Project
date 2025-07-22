package entity

import "gorm.io/gorm"

type Floor struct {
    gorm.Model
    Number int    `gorm:"not null" valid:"required~Number is required"`
    Rooms  []Room `gorm:"foreignKey:FloorID" valid:"-"`
}
