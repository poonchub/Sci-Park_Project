package entity

import (
	"time"

	"gorm.io/gorm"
)

type CollaborationPlan struct {
	gorm.Model

	// Foreign Key to RequestServiceArea (Many-to-One)
	RequestServiceAreaID uint               `gorm:"index"`
	RequestServiceArea   RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID"`

	// Collaboration Plan fields
	CollaborationPlan   string    `gorm:"type:text" valid:"required~Collaboration plan is required"`
	CollaborationBudget float64   `valid:"required~Collaboration budget is required,range(0.01|999999999)~Collaboration budget must be greater than 0"`
	ProjectStartDate    time.Time `valid:"required~Project start date is required"`
}
