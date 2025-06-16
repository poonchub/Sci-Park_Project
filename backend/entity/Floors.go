package entity

import "gorm.io/gorm"

type Floor struct {
    gorm.Model
    Number int    `gorm:"not null" valid:"required~หมายเลขชั้นต้องไม่ว่าง"`
    Rooms  []Room `gorm:"foreignKey:FloorID" valid:"-"`
}
