package entity

import (
	"gorm.io/gorm"
)

type AboutCompany struct {
	gorm.Model
	UserID                      uint   `gorm:"uniqueIndex"`
	User                        User   `gorm:"foreignKey:UserID"`
	CorporateRegistrationNumber string `gorm:"type:varchar(255)"`
	BusinessGroup               string `gorm:"type:varchar(255)"`
	CompanySize                 string `gorm:"type:varchar(100)"`
	MainServices                string `gorm:"type:text"`
	RegisteredCapital           int
	HiringRate                  int
	ResearchInvestmentValue     int
	ThreeYearGrowthForecast     string `gorm:"type:text"`
}
