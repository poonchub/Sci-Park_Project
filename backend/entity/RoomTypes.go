package entity

import (
	"errors"
	"strings"
	"gorm.io/gorm"
)

type RoomType struct {
	gorm.Model
	TypeName         string  `gorm:"not null;uniqueIndex"`
	RoomSize         float32
	ForRental        bool
	HasMultipleSizes bool

	// เก็บเป็น string ธรรมดา (ไม่ใส่ default)
	Category string `json:"category" gorm:"type:text;not null"`

	EmployeeDiscount uint8 `json:"employee_discount" gorm:"default:0"`

	Rooms           []Room           `gorm:"foreignKey:RoomTypeID"`
	RoomTypeLayouts []RoomTypeLayout `gorm:"foreignKey:RoomTypeID"`
	RoomTypeImages  []RoomTypeImage  `gorm:"foreignKey:RoomTypeID"`
	RoomPrices      []RoomPrice      `gorm:"foreignKey:RoomTypeID"`
	RoomEquipments  []RoomEquipment  `gorm:"foreignKey:RoomTypeID"`
}

// บังคับให้ค่าหมวดถูกต้องเสมอ
func (rt *RoomType) BeforeSave(tx *gorm.DB) error {
	rt.Category = strings.ToLower(strings.TrimSpace(rt.Category))
	switch rt.Category {
	case "meetingroom", "trainingroom", "multifunctionroom":
		return nil
	default:
		return errors.New("invalid RoomType.Category (meetingroom|trainingroom|multifunctionroom)")
	}
}
func (rt *RoomType) BeforeCreate(tx *gorm.DB) error { return rt.BeforeSave(tx) }
