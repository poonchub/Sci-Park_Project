package entity

import "gorm.io/gorm"


type Gender struct {
    gorm.Model
    Name  string `json:"name" valid:"required~กรุณาระบุชื่อเพศ "`
    Users []User `gorm:"foreignKey:GenderID"`
}

