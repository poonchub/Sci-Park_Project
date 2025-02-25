package entity

import (
	"gorm.io/gorm"
)


type RoomType struct {
	gorm.Model
	TypeName    string  `json:"type_name"`        // ชื่อประเภทห้อง เช่น "Meeting Room", "Training Room"
	HalfDayRate float64 `json:"half_day_rate"`    // อัตราค่าเช่าครึ่งวัน
	FullDayRate float64 `json:"full_day_rate"`    // อัตราค่าเช่าทั้งวัน
	Rooms       []Room `gorm:"foreignKey:RoomTypeID"` // ความสัมพันธ์ 1 ต่อ หลายกับ Room
}
