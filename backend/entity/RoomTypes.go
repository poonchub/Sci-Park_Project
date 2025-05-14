package entity

import (
	"gorm.io/gorm"
)


type RoomType struct {
    gorm.Model

    TypeName    string  `valid:"required~กรุณาระบุชื่อประเภทของห้อง"`
    FullDayRate float64 `valid:"required~กรุณาระบุราคาเต็มวัน"`
    HalfDayRate float64 `valid:"required~กรุณาระบุราคาครึ่งวัน"`
    Rooms       []Room  `gorm:"foreignKey:RoomTypeID" valid:"-"`
}

