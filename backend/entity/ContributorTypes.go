package entity

import "gorm.io/gorm"

type ContributorType struct {
	gorm.Model
	Name	string

	Contributor	[]Contributor	`gorm:"foreignKey:ContributorTypeID"`
}