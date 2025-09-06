package entity

import "time"

// CancelRequestServiceArea represents a cancellation request for a service area
type CancelRequestServiceArea struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	RequestServiceAreaID  uint       `gorm:"not null" json:"request_service_area_id"`
	UserID                uint       `gorm:"not null" json:"user_id"`
	PurposeOfCancellation string     `gorm:"not null" json:"purpose_of_cancellation"`
	ProjectActivities     string     `json:"project_activities"` // Optional field
	AnnualIncome          float64    `json:"annual_income"`
	CancellationDocument  string     `json:"cancellation_document"` // File path
	BankAccountDocument   string     `json:"bank_account_document"` // File path
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
	DeletedAt             *time.Time `gorm:"index" json:"deleted_at,omitempty"`

	// Relationships
	RequestServiceArea RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID" json:"request_service_area,omitempty"`
	User               User               `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
