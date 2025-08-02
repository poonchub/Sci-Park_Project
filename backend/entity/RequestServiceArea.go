package entity

import (
	"gorm.io/gorm"
)

type RequestServiceArea struct {
	gorm.Model
	UserID                             uint
	User                               User   `gorm:"foreignKey:UserID"`
	PurposeOfUsingSpace                string `gorm:"type:text"`
	NumberOfEmployees                  int
	ActivitiesInBuilding               string `gorm:"type:text"`
	CollaborationPlan                  string `gorm:"type:text"`
	CollaborationBudget                float64
	ProjectDuration                    string
	SupportingActivitiesForSciencePark string `gorm:"type:text"`
	ServiceRequestDocument             string `gorm:"type:varchar(255)"`
}
