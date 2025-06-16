package entity

import "gorm.io/gorm"

// MaintenanceImage คือ entity สำหรับภาพการซ่อม
type RoomTypeImage struct {
    gorm.Model
    FilePath  string        
    
	RoomTypeID  uint     
    RoomType    RoomLayout `gorm:"foreignKey:RoomTypeID"`
}
