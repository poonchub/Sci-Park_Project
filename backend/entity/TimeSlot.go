package entity

import "gorm.io/gorm"

type TimeSlot struct {
    gorm.Model
	TimeSlotName string `valid:"required~กรุณาระบุช่วงเวลา"`
	StartTime    time.Time `valid:"required~กรุณาระบุเวลาเริ่มต้น"`
	EndTime      time.Time	`valid:"required~กรุณาระบุเวลาสิ้นสุด"` 
	BookingRoom []BookingRoom `gorm:"foreignKey:TimeSlotID"`
	Roomprice    []Roomprice `gorm:"foreignKey:TimeSlotID"`
}	