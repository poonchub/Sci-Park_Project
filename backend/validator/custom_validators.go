package validator

import (
	"regexp"
	"unicode"

	"github.com/asaskevich/govalidator"
)

func init() {
	// Register custom validators
	govalidator.CustomTypeTagMap.Set("password", govalidator.CustomTypeValidator(func(i interface{}, context interface{}) bool {
		password, ok := i.(string)
		if !ok {
			return false
		}
		return validatePassword(password)
	}))

	govalidator.CustomTypeTagMap.Set("employeeid", govalidator.CustomTypeValidator(func(i interface{}, context interface{}) bool {
		employeeID, ok := i.(string)
		if !ok {
			return false
		}
		return validateEmployeeID(employeeID)
	}))

	govalidator.CustomTypeTagMap.Set("phone", govalidator.CustomTypeValidator(func(i interface{}, context interface{}) bool {
		phone, ok := i.(string)
		if !ok {
			return false
		}
		return validatePhone(phone)
	}))
}

// validatePassword checks if password meets requirements:
// - At least 8 characters
// - At least 1 lowercase letter
// - At least 1 uppercase letter
// - At least 1 number
// - At least 1 special character
func validatePassword(password string) bool {
	if len(password) < 8 {
		return false
	}

	var (
		hasLower   bool
		hasUpper   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case unicode.IsLower(char):
			hasLower = true
		case unicode.IsUpper(char):
			hasUpper = true
		case unicode.IsNumber(char):
			hasNumber = true
		case unicode.IsPunct(char) || unicode.IsSymbol(char):
			hasSpecial = true
		}
	}

	return hasLower && hasUpper && hasNumber && hasSpecial
}

// validateEmployeeID checks if employee ID is exactly 6 digits
func validateEmployeeID(employeeID string) bool {
	matched, _ := regexp.MatchString(`^\d{6}$`, employeeID)
	return matched
}

// validatePhone checks if phone number starts with 0 and has 10 digits total
func validatePhone(phone string) bool {
	matched, _ := regexp.MatchString(`^0\d{9}$`, phone)
	return matched
}
