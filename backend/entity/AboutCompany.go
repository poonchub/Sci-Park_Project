package entity

import (
	"gorm.io/gorm"
)

type AboutCompany struct {
	gorm.Model
	UserID                      uint           `gorm:"uniqueIndex"`
	User                        User           `gorm:"foreignKey:UserID"`
	CorporateRegistrationNumber string         `gorm:"type:varchar(255)"`
	BusinessGroupID             *uint          `gorm:"index"`
	BusinessGroup               *BusinessGroup `gorm:"foreignKey:BusinessGroupID"`
	CompanySizeID               *uint          `gorm:"index"`
	CompanySize                 *CompanySize   `gorm:"foreignKey:CompanySizeID"`
	MainServices                string         `gorm:"type:text"`
	RegisteredCapital           float64
	HiringRate                  int
	ResearchInvestmentValue     float64
	ThreeYearGrowthForecast     string `gorm:"type:text"`
}
