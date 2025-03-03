package entity

import "gorm.io/gorm"

// User คือ entity สำหรับผู้ใช้ในระบบ
type User struct {
    gorm.Model
    CompanyName     string   `json:"company_name"`
    BusinessDetail  string   `json:"business_detail"`
    FirstName       string   `json:"first_name"`
    LastName        string   `json:"last_name"`
    Email           string   `json:"email"`
    Password        string   `json:"password"`
    Phone           string   `json:"phone"`
    ProfilePath     string   `json:"profile_path"`
    
    UserPackageID   *uint    `json:"userpackage_id"`
    RoleID          uint     `json:"role_id"`
    Role            Role     `gorm:"foreignKey:RoleID"`
    GenderID        uint     `json:"gender_id"`
    Gender          Gender   `gorm:"foreignKey:GenderID"`

    Inspections         []Inspection         `gorm:"foreignKey:UserID"`
    MaintenanceRequests []MaintenanceRequest `gorm:"foreignKey:UserID"`
    MaintenanceTasks    []MaintenanceTask    `gorm:"foreignKey:UserID"`
    ManagerApprovals    []ManagerApproval    `gorm:"foreignKey:UserID"`
}
