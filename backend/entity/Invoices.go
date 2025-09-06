package entity

import (
	"time"

	"gorm.io/gorm"
)

type Invoice struct {
	gorm.Model
	InvoiceNumber string		`valid:"required~InvoiceNumber is required"`
	IssueDate     time.Time		`valid:"required~IssueDate is required"`
	DueDate       time.Time		`valid:"required~DueDate is required"`
	BillingPeriod time.Time		`valid:"required~BillingPeriod is required"`
	TotalAmount   float64		`valid:"required~TotalAmount is required"`
	InvoicePDFPath string		

	// ✅ ผูกกับ BookingRoom (จำเป็นต่อ flow มัดจำ/งวดสุดท้าย)
	BookingRoomID uint         `gorm:"index"`                 // <-- ที่ทำให้ error หาย
	BookingRoom   BookingRoom  `gorm:"foreignKey:BookingRoomID" valid:"-"`

	// ✅ ระบุชนิดใบแจ้งหนี้ + ติดตามยอดที่จ่ายแล้ว + ธงไม่คืนเงิน
	InvoiceType     string  `gorm:"size:16;index"`           // "deposit" | "final" | "full"
	PaidAmount      float64 `gorm:"default:0"`
	IsNonRefundable bool    `gorm:"default:false"`

	RoomID     uint          `valid:"required~RoomID is required"`
	Room       Room          `gorm:"foreignKey:RoomID" valid:"-"`
	StatusID   uint          `valid:"required~StatusID is required"`
	Status     PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
	CreaterID  uint          `valid:"required~CreaterID is required"`
	Creater    User          `gorm:"foreignKey:CreaterID" valid:"-"`
	CustomerID uint          `valid:"required~CustomerID is required"`
	Customer   User          `gorm:"foreignKey:CustomerID" valid:"-"`
	Items      []InvoiceItem `gorm:"foreignKey:InvoiceID" valid:"-"`

	// ⛳️ เปลี่ยนจาก *Payment (ตัวเดียว) → เป็นหลายตัว ([]Payment)
	Payments      []Payment      `gorm:"foreignKey:InvoiceID" valid:"-"`
	Notifications []Notification `gorm:"foreignKey:InvoiceID" valid:"-"`
}
