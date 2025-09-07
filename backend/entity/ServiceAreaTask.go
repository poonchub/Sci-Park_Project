package entity

import "gorm.io/gorm"

// ServiceAreaTask คือ entity สำหรับงานพื้นที่บริการ
type ServiceAreaTask struct {
	gorm.Model
	Note                 string             `gorm:"type:text"`
	UserID               uint               `valid:"required~UserID is required"`
	User                 User               `gorm:"foreignKey:UserID" valid:"-"`
	RequestServiceAreaID uint               `valid:"required~RequestServiceAreaID is required"`
	RequestServiceArea   RequestServiceArea `gorm:"foreignKey:RequestServiceAreaID" valid:"-"`
	IsCancel             bool               `gorm:"default:false"` // แยกว่างานนี้เป็นงานสำหรับการร้องขอ (false) หรืองานยกเลิก (true)
}
