package entity

import (
	"time"

	"gorm.io/gorm"
)

// User คือ entity สำหรับผู้ใช้ในระบบ
type User struct {
	gorm.Model
	CompanyName    string
	EmployeeID     string `valid:"employeeid"`
	BusinessDetail string
	FirstName      string `valid:"required"`
	LastName       string `valid:"required"`
	Email          string `valid:"email,required"`
	Password       string `valid:"required,password"`
	Phone          string `valid:"phone,required"`
	ProfilePath    string
	IsEmployee     bool

	UserPackageID *uint
	RoleID        uint
	Role          Role `gorm:"foreignKey:RoleID" valid:"-"`
	GenderID      uint
	Gender        Gender `gorm:"foreignKey:GenderID" valid:"-"`
	RequestTypeID uint
	RequestType   RequestType `gorm:"foreignKey:RequestTypeID" valid:"-"`

	ResetToken       string
	ResetTokenExpiry time.Time

	Inspections         []Inspection         `gorm:"foreignKey:UserID" valid:"-"`
	MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:UserID" valid:"-"`
	MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:UserID" valid:"-"`
	ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:UserID" valid:"-"`
	UserPackages        []UserPackage        `gorm:"foreignKey:UserID" valid:"-"`
	Notifications       []Notification       `gorm:"foreignKey:UserID" valid:"-"`
	BookingRoom         []BookingRoom        `gorm:"foreignKey:UserID" valid:"-"`
	Payments            []Payment            `gorm:"foreignKey:UserID" valid:"-"`
	News                []News               `gorm:"foreignKey:UserID" valid:"-"`
	RequestServiceAreas []RequestServiceArea `gorm:"foreignKey:UserID" valid:"-"`
	AboutCompany        *AboutCompany        `gorm:"foreignKey:UserID" valid:"-"`
}
