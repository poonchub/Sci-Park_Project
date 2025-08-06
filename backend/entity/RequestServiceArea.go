package entity

import (
	"time"

	"gorm.io/gorm"
)

type RequestServiceArea struct {
	gorm.Model
	UserID                             uint
	User                               User          `gorm:"foreignKey:UserID"`
	RequestStatusID                    uint          `gorm:"default:2"`
	RequestStatus                      RequestStatus `gorm:"foreignKey:RequestStatusID"`
	PurposeOfUsingSpace                string        `gorm:"type:text"`
	NumberOfEmployees                  int
	ActivitiesInBuilding               string `gorm:"type:text"`
	CollaborationPlan                  string `gorm:"type:text"`
	CollaborationBudget                float64
	ProjectStartDate                   time.Time
	ProjectEndDate                     time.Time
	SupportingActivitiesForSciencePark string `gorm:"type:text"`
	ServiceRequestDocument             string `gorm:"type:varchar(255)"`

	// 1:1 relationship with ServiceAreaDocument
	ServiceAreaDocument *ServiceAreaDocument `gorm:"foreignKey:RequestServiceAreaID"`
}
