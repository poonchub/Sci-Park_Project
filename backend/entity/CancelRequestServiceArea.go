package entity

import (
	"gorm.io/gorm"
)

// CancelRequestServiceArea represents a user's request to cancel the service area usage
// Company information can be derived via UserID -> AboutCompany
type CancelRequestServiceArea struct {
	gorm.Model

	// Relations
	UserID uint `gorm:"index"`
	User   User `gorm:"foreignKey:UserID"`

	// เชื่อมกับคำขอบริการพื้นที่ (1:1)
	RequestServiceAreaID uint               `gorm:"uniqueIndex"`
	RequestServiceArea   RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID"`

	// 1) วัตถุประสงค์ของการขอยกเลิกใช้บริการพื้นที่
	CancellationPurpose string `gorm:"type:varchar(500)"`

	// 2) โครงการ กิจกรรม หรือผลิตภัณฑ์ ที่เกี่ยวข้องกับการยกเลิก
	RelatedProjectOrProduct string `gorm:"type:varchar(500)"`

	// 3) รายได้ระหว่างการให้บริการในอุทยานวิทยาศาสตร์ (รายปี)
	AnnualRevenue float64 `gorm:"type:decimal(18,2)"`

	// 4) แนบเอกสารแสดงความประสงค์ (เก็บเป็น path)
	IntentDocumentPath string `gorm:"type:varchar(500)"`

	// 5) แนบสำเนาบัญชีธนาคาร (เก็บเป็น path)
	BankAccountCopyPath string `gorm:"type:varchar(500)"`
}
