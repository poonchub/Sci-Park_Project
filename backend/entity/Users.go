package entity

import ("gorm.io/gorm"
        "time"
    )

// User คือ entity สำหรับผู้ใช้ในระบบ
type User struct {
    gorm.Model
    CompanyName     string
    BusinessDetail  string
    FirstName       string
    LastName        string
    Email           string
    Password        string
    Phone           string
    ProfilePath     string
    
    UserPackageID   *uint
    RoleID          uint 
    Role            Role     `gorm:"foreignKey:RoleID"`
    GenderID        uint
    Gender          Gender   `gorm:"foreignKey:GenderID"`

    ResetToken       string
    ResetTokenExpiry time.Time

    Inspections         []Inspection         `gorm:"foreignKey:UserID"`
    MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:UserID"`
    MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:UserID"`
    ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:UserID"`
}
