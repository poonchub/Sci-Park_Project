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
	CollaborationPlan   string    `gorm:"type:text" valid:"required~กรุณาระบุแผนการร่วมมือ"`
	CollaborationBudget float64   `valid:"required~กรุณาระบุงบประมาณการร่วมมือ"`
	ProjectStartDate    time.Time `valid:"required~กรุณาระบุวันที่เริ่มโครงการ"`
}
