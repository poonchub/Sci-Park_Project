package entity

import "gorm.io/gorm"

type OrganizationInfo struct {
	gorm.Model
	NameTH      string
	NameEN      string
	Slogan      string
	LogoPath    string
	Description string
	Address     string
	Phone       string
	Email       string
	FacebookUrl string
}
