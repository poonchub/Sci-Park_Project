package entity

import "gorm.io/gorm"

type Notification struct{ 
	gorm.Model
	IsRead   	bool

	RequestID 	uint	
    Request   	MaintenanceRequest	`gorm:"foreignKey:RequestID" valid:"-"`

	TaskID 		uint   	
    Task   		MaintenanceTask	`gorm:"foreignKey:TaskID" valid:"-"`

	RentalRoomInvoiceID	uint  	
	RentalRoomInvoice  	RentalRoomInvoice	`gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`

	UserID 		uint	`valid:"required~UserID is required"`
	User        User    `gorm:"foreignKey:UserID" valid:"-"`
}