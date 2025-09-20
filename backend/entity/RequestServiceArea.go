package entity

import (
	"gorm.io/gorm"
)

type RequestServiceArea struct {
	gorm.Model
	UserID                             uint
	User                               User          `gorm:"foreignKey:UserID" valid:"-"`
	RequestStatusID                    uint          `gorm:"default:2"`
	RequestStatus                      RequestStatus `gorm:"foreignKey:RequestStatusID" valid:"-"`
	PurposeOfUsingSpace                string        `gorm:"type:text" valid:"required~Purpose of using space is required"`
	NumberOfEmployees                  int           `valid:"employeecount~Number of employees must be greater than 0"`
	ActivitiesInBuilding               string        `gorm:"type:text" valid:"required~Activities in building is required"`
	SupportingActivitiesForSciencePark string        `gorm:"type:text" valid:"required~Supporting activities for science park is required"`
	ServiceRequestDocument             string        `gorm:"type:varchar(255)"`

	// 1:1 relationship with ServiceAreaDocument
	ServiceAreaDocument *ServiceAreaDocument `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// 1:Many relationship with CollaborationPlan
	CollaborationPlans []CollaborationPlan `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// 1:1 relationship with ServiceAreaApproval
	ServiceAreaApproval *ServiceAreaApproval `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// 1:1 relationship with ServiceAreaTask
	ServiceAreaTask *ServiceAreaTask `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// 1:1 relationship with CancelRequestServiceArea
	CancelRequest *CancelRequestServiceArea `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`

	// 1:Many relationship with Notifications
	Notifications []Notification `gorm:"foreignKey:ServiceAreaRequestID" valid:"-"`
}
