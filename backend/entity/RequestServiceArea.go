package entity

import (
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
	SupportingActivitiesForSciencePark string `gorm:"type:text"`
	ServiceRequestDocument             string `gorm:"type:varchar(255)"`

	// 1:1 relationship with ServiceAreaDocument
	ServiceAreaDocument *ServiceAreaDocument `gorm:"foreignKey:RequestServiceAreaID"`

	// 1:Many relationship with CollaborationPlan
	CollaborationPlans []CollaborationPlan `gorm:"foreignKey:RequestServiceAreaID"`

	// 1:1 relationship with ServiceAreaApproval
	ServiceAreaApproval *ServiceAreaApproval `gorm:"foreignKey:RequestServiceAreaID"`

	// 1:1 relationship with ServiceAreaTask
	ServiceAreaTask *ServiceAreaTask `gorm:"foreignKey:RequestServiceAreaID"`

	// 1:1 relationship with CancelRequestServiceArea
	CancelRequest *CancelRequestServiceArea `gorm:"foreignKey:RequestServiceAreaID"`
}
