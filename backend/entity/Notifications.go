package entity

import "gorm.io/gorm"

type Notification struct{ 
	gorm.Model
	IsRead   	bool

	RequestID 	uint	`valid:"required~RequestID is required"`
    Request   	MaintenanceRequest	`gorm:"foreignKey:RequestID" valid:"-"`

	TaskID 		uint   	`valid:"required~TaskID is required"`  
    Task   		MaintenanceTask	`gorm:"foreignKey:TaskID" valid:"-"`

	UserID 		uint	`valid:"required~UserID is required"`
	User        User          `gorm:"foreignKey:UserID" valid:"-"`
}