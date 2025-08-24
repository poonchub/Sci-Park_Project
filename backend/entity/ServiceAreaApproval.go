package entity

import "gorm.io/gorm"

// ServiceAreaApproval คือ entity สำหรับการอนุมัติพื้นที่บริการ
type ServiceAreaApproval struct {
	gorm.Model
	Note                string `gorm:"type:text"`
	UserID              uint   `valid:"required~UserID is required"`
	User                User   `gorm:"foreignKey:UserID" valid:"-"`
	RequestServiceAreaID uint   `valid:"required~RequestServiceAreaID is required"`
	RequestServiceArea  RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`
}
