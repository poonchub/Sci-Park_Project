package entity

import "gorm.io/gorm"

type Contributor struct {
	gorm.Model
	Name        string
	Email       string
	GithubUrl   string
	FacebookUrl string
	Phone       string
	ProfilePath string
	Role        string
	Bio			string

	ContributorTypeID	uint
	ContributorType		ContributorType	`gorm:"foreignKey:ContributorTypeID"`
}
