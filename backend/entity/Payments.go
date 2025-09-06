package entity

import (
	"time"

	"gorm.io/gorm"
)

// Payment คือ entity สำหรับบันทึกการชำระเงิน
type Payment struct {
	gorm.Model

	// --- ข้อมูลการจ่าย ---
	PaymentDate   time.Time `valid:"required~PaymentDate is required"`
	Amount        float64   `valid:"required~Amount is required"`
	SlipPath      string    `valid:"required~Slip file path is required"`
	Note          string
	ReceiptPath   string

	// ✅ แนะนำเพิ่ม: ช่องทางการจ่าย + อ้างอิงธุรกรรม (ช่วยตรวจสอบ/ค้นหา/ไล่สลิป)
	Method        string    `gorm:"size:32;index" valid:"required~Method is required"` // e.g. "transfer" | "qr" | "cash" | "credit_card"
	TransactionRef string   `gorm:"size:64;index"`                                     // เลขอ้างอิงธนาคาร/QR/TxnID

	// ✅ แนะนำเพิ่ม: บันทึกผลการตรวจสลิป (นอกเหนือจาก Status)
	VerifiedAt    *time.Time
	VerifierNote  string    `gorm:"type:text"`

	// --- ความสัมพันธ์และสถานะ ---
	StatusID      uint          `valid:"required~StatusID is required"`
	Status        PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
	PayerID       uint		`valid:"required~PayerID is required"`
	Payer         User 		`gorm:"foreignKey:PayerID" valid:"-"`
	ApproverID    uint		
	Approver      User 		`gorm:"foreignKey:ApproverID" valid:"-"`
	BookingRoomID uint		
	BookingRoom   BookingRoom `gorm:"foreignKey:BookingRoomID" valid:"-"`
	RentalRoomInvoiceID     uint		
	RentalRoomInvoice       RentalRoomInvoice `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`
}


// package entity

// import (
// 	"time"

// 	"gorm.io/gorm"
// )

// // Payment คือ entity สำหรับบันทึกการชำระเงิน
// type Payment struct {
// 	gorm.Model

// 	PaymentDate time.Time	`valid:"required~PaymentDate is required"`
// 	Amount      float64		`valid:"required~Amount is required"`
// 	SlipPath    string		`valid:"required~Slip file path is required"`
// 	Note        string		
// 	ReceiptPath string

// 	StatusID      uint		`valid:"required~StatusID is required"`
// 	Status        PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
// 	PayerID       uint		`valid:"required~PayerID is required"`
// 	Payer         User 		`gorm:"foreignKey:PayerID" valid:"-"`
// 	ApproverID    uint		
// 	Approver      User 		`gorm:"foreignKey:ApproverID" valid:"-"`
// 	BookingRoomID uint		
// 	BookingRoom   BookingRoom `gorm:"foreignKey:BookingRoomID" valid:"-"`
// 	InvoiceID     uint		
// 	Invoice       Invoice `gorm:"foreignKey:InvoiceID" valid:"-"`
// }
