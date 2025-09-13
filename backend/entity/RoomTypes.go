package entity

import "gorm.io/gorm"

type RoomCategory string

const (
    RoomCatMeeting       RoomCategory = "meetingroom"
    RoomCatTraining      RoomCategory = "trainingroom"
    RoomCatMultiFunction RoomCategory = "multifunctionroom"
)

type RoomType struct {
    gorm.Model
    TypeName        string
    RoomSize        float32
    ForRental       bool
    HasMultipleSizes bool
    Category         RoomCategory `gorm:"size:32;default:'meetingroom'" json:"category"`
    EmployeeDiscount uint8        `gorm:"default:0" json:"employee_discount"` // 0–100 (%)
    Rooms           []Room            `gorm:"foreignKey:RoomTypeID"`
    RoomTypeLayouts []RoomTypeLayout  `gorm:"foreignKey:RoomTypeID"`
    RoomTypeImages  []RoomTypeImage   `gorm:"foreignKey:RoomTypeID"`
    RoomPrices      []RoomPrice       `gorm:"foreignKey:RoomTypeID"`
    RoomEquipments  []RoomEquipment   `gorm:"foreignKey:RoomTypeID"`
}
