package entity

import (
	"time"

	"gorm.io/gorm"
)

// User คือ entity สำหรับผู้ใช้ในระบบ
type User struct {
	gorm.Model
	CompanyName     string
	EmployeeID      string `valid:"employeeid"`
	BusinessDetail  string
	FirstName       string `valid:"required"`
	LastName        string `valid:"required"`
	Email           string `valid:"email,required"`
	Password        string `valid:"required,password"`
	Phone           string `valid:"phone,required"`
	ProfilePath     string
	SignaturePath   string
	IsEmployee      bool
	IsBusinessOwner bool

	UserPackageID *uint
	RoleID        uint
	Role          Role `gorm:"foreignKey:RoleID" valid:"-"`
	JobPositionID uint
	JobPosition   JobPosition `gorm:"foreignKey:JobPositionID" valid:"-"`
	GenderID      uint
	Gender        Gender `gorm:"foreignKey:GenderID" valid:"-"`
	RequestTypeID uint
	RequestType   RequestType `gorm:"foreignKey:RequestTypeID" valid:"-"`
	PrefixID      uint
	Prefix        TitlePrefix `gorm:"foreignKey:PrefixID" valid:"-"`

	ResetToken       string
	ResetTokenExpiry time.Time

	Inspections                   []Inspection               `gorm:"foreignKey:UserID" valid:"-"`
	MaintenanceRequests           []MaintenanceRequest       `gorm:"foreignKey:UserID" valid:"-"`
	MaintenanceTasks              []MaintenanceTask          `gorm:"foreignKey:UserID" valid:"-"`
	ManagerApprovals              []ManagerApproval          `gorm:"foreignKey:UserID" valid:"-"`
	UserPackages                  []UserPackage              `gorm:"foreignKey:UserID" valid:"-"`
	Notifications                 []Notification             `gorm:"foreignKey:UserID" valid:"-"`
	BookingRoom                   []BookingRoom              `gorm:"foreignKey:UserID" valid:"-"`
	PaymentsAsPayer               []Payment                  `gorm:"foreignKey:PayerID" valid:"-"`
	PaymentsAsApprover            []Payment                  `gorm:"foreignKey:ApproverID" valid:"-"`
	News                          []News                     `gorm:"foreignKey:UserID" valid:"-"`
	RequestServiceAreas           []RequestServiceArea       `gorm:"foreignKey:UserID" valid:"-"`
	CancelRequestServiceAreas     []CancelRequestServiceArea `gorm:"foreignKey:UserID" valid:"-"`
	AboutCompany                  *AboutCompany              `gorm:"foreignKey:UserID" valid:"-"`
	RentalRoomInvoicesAsCreator   []RentalRoomInvoice        `gorm:"foreignKey:CreaterID" valid:"-"`
	RoomBookingInvoicesAsCustomer []RentalRoomInvoice        `gorm:"foreignKey:CustomerID" valid:"-"`
	RoomBookingInvoicesAsApprover []RoomBookingInvoice       `gorm:"foreignKey:ApproverID" valid:"-"`
	RentalRoomInvoicesAsCustomer  []RoomBookingInvoice       `gorm:"foreignKey:CustomerID" valid:"-"`
	ServiceAreaApprovals          []ServiceAreaApproval      `gorm:"foreignKey:UserID" valid:"-"`
	ServiceAreaTasks              []ServiceAreaTask          `gorm:"foreignKey:UserID" valid:"-"`
}
