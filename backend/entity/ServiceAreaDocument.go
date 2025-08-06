package entity

import (
	"gorm.io/gorm"
)

type ServiceAreaDocument struct {
	gorm.Model
	RequestServiceAreaID uint               `gorm:"uniqueIndex"` // 1:1 relationship
	RequestServiceArea   RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID"`

	// เอกสารต่างๆ (เก็บเป็น file path)
	ServiceContractDocument string `gorm:"type:varchar(500)"` // แนบเอกสารสัญญาการใช้บริการพื้นที่
	AreaHandoverDocument    string `gorm:"type:varchar(500)"` // แนบเอกสารส่งมอบพื้นที่
	QuotationDocument       string `gorm:"type:varchar(500)"` // แนบใบเสนอราคา (หลักประกัน)

	// Foreign Keys
	RoomID uint `gorm:"index"`
	Room   Room `gorm:"foreignKey:RoomID"`

	ServiceUserTypeID uint            `gorm:"index"`
	ServiceUserType   ServiceUserType `gorm:"foreignKey:ServiceUserTypeID"`
}
