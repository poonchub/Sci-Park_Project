package entity

import (
	"gorm.io/gorm"
    "unicode"
    "github.com/asaskevich/govalidator"

)

type RoomStatus struct {
    gorm.Model
    StatusName string `json:"status_name" valid:"required~กรุณาระบุสถานะของห้อง"`
    Code       string `json:"code"` // เช่น "available", "maintenance", "closed"
    Rooms      []Room `gorm:"foreignKey:RoomStatusID"`
}


func init() {
	// Register custom validator under the tag "customstring"
	govalidator.CustomTypeTagMap.Set("customstring", govalidator.CustomTypeValidator(func(i interface{}, context interface{}) bool {
		s, ok := i.(string)
		if !ok {
			return false
		}
		// Return false if any digit is found
		for _, r := range s {
			if unicode.IsDigit(r) {
				return false
			}
		}
		return true
	}))
}
