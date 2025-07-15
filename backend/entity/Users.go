package entity

import (
	"time"
	"gorm.io/gorm"
)

// User คือ entity สำหรับผู้ใช้ในระบบ
type User struct {
    gorm.Model
    CompanyName     string `valid:"required"`
    EmployeeID      string `valid:"required"`
    BusinessDetail  string `valid:"required"`
    FirstName       string `valid:"required"`
    LastName        string `valid:"required"`
    Email           string `valid:"email,required"`
    Password        string `valid:"required,minstringlength(6)"`
    Phone           string `valid:"phone,required"`
    ProfilePath     string
    IsEmployee      bool
    
    UserPackageID   *uint
    RoleID          uint 
    Role            Role     `gorm:"foreignKey:RoleID"`
    GenderID        uint
    Gender          Gender   `gorm:"foreignKey:GenderID"`
    RequestTypeID   uint
    RequestType     RequestType `gorm:"foreignKey:RequestTypeID"`

    ResetToken       string
    ResetTokenExpiry time.Time

    Inspections         []Inspection         `gorm:"foreignKey:UserID"`
    MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:UserID"`
    MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:UserID"`
    ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:UserID"`
    UserPackages        []UserPackage        `gorm:"foreignKey:UserID"`
	Notifications 		[]Notification       `gorm:"foreignKey:UserID"`
    BookingRoom         []BookingRoom        `gorm:"foreignKey:UserID"`
    Payments            []Payment            `gorm:"foreignKey:UserID"`
    News                []News               `gorm:"foreignKey:UserID"`
}
