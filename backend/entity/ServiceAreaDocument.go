package entity

import (
	"time"

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

	// เอกสารและข้อมูลเพิ่มเติมเกี่ยวกับสัญญา
	RefundGuaranteeDocument string `gorm:"type:varchar(500)"` // เอกสารคืนหลักประกัน (path)

	ContractNumber      string `gorm:"type:varchar(100)"` // เลขที่สัญญา
	FinalContractNumber string `gorm:"type:varchar(100)"` // เลขที่สัญญาสุดท้าย

	ContractStartAt time.Time // วันเริ่มต้นสัญญา

	ContractEndAt time.Time // วันสิ้นสุดสัญญา

	// Foreign Keys
	RoomID uint `gorm:"index"`
	Room   Room `gorm:"foreignKey:RoomID"`

	ServiceUserTypeID uint            `gorm:"index"`
	ServiceUserType   ServiceUserType `gorm:"foreignKey:ServiceUserTypeID"`
}
