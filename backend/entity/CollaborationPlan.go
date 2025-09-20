package entity

import (
	"time"

	"gorm.io/gorm"
)

type CollaborationPlan struct {
	gorm.Model

	// Foreign Key to RequestServiceArea (Many-to-One)
	RequestServiceAreaID uint               `gorm:"index"`
	RequestServiceArea   RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// Collaboration Plan fields
	CollaborationPlan   string `gorm:"type:text" valid:"required~Collaboration plan is required"`
	CollaborationBudget float64
	ProjectStartDate    time.Time
}
