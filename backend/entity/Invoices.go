package entity

import (
	"time"

	"gorm.io/gorm"
)

type Invoice struct {
	gorm.Model
	InvoiceNumber  string
	IssueDate     time.Time
	DueDate       time.Time
	BillingPeriod time.Time
	TotalAmount   float64

	StatusID   uint
	Status     PaymentStatus `gorm:"foreignKey:StatusID" valid:"-"`
	CreaterID  uint
	Creater    User `gorm:"foreignKey:CreaterID" valid:"-"`
	CustomerID uint
	Customer   User          `gorm:"foreignKey:CustomerID" valid:"-"`
	Items      []InvoiceItem `gorm:"foreignKey:InvoiceID" valid:"-"`
	Payments   []Payment     `gorm:"foreignKey:InvoiceID" valid:"-"`
}
