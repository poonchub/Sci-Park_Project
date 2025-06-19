package entity

import "gorm.io/gorm"

type Notification struct{ 
	gorm.Model
	IsRead    bool

	RequestID 	uint
    Request   	MaintenanceRequest	`gorm:"foreignKey:RequestID"`

	TaskID 		uint         
    Task   		MaintenanceTask	`gorm:"foreignKey:TaskID"`

	UserID 		uint
	User        User          `gorm:"foreignKey:UserID"`
}