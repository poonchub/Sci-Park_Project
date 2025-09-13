package entity

import "gorm.io/gorm"

type Notification struct {
	gorm.Model
	IsRead bool

	RequestID uint
	Request   MaintenanceRequest `gorm:"foreignKey:RequestID" valid:"-"`

	TaskID uint
	Task   MaintenanceTask `gorm:"foreignKey:TaskID" valid:"-"`

	RentalRoomInvoiceID uint
	RentalRoomInvoice   RentalRoomInvoice `gorm:"foreignKey:RentalRoomInvoiceID" valid:"-"`

	// Service Area Notifications
	ServiceAreaRequestID uint
	ServiceAreaRequest   RequestServiceArea `gorm:"foreignKey:ServiceAreaRequestID" valid:"-"`

	// Service Area Task Notifications
	ServiceAreaTaskID uint
	ServiceAreaTask   ServiceAreaTask `gorm:"foreignKey:ServiceAreaTaskID" valid:"-"`

	// Service Area Cancellation Notifications
	CancelServiceAreaRequestID uint
	CancelServiceAreaRequest   CancelRequestServiceArea `gorm:"foreignKey:CancelServiceAreaRequestID" valid:"-"`

	BookingRoomID	uint
	BookingRoom 	BookingRoom 	`gorm:"foreignKey:BookingRoomID" valid:"-"`

	UserID uint `valid:"required~UserID is required"`
	User   User `gorm:"foreignKey:UserID" valid:"-"`
}
