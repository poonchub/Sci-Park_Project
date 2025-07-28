package unit

import (
	"testing"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestUserValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid User Data with all fields", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "123456",
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Valid User Data without optional fields", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Valid User Data with empty EmployeeID", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "", // Empty EmployeeID should be valid
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Invalid Email Format", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "invalid-email-format",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Employee ID - Not 6 digits (when provided)", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "12345", // Only 5 digits
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Employee ID - Contains letters (when provided)", func(t *testing.T) {
		user := entity.User{
			CompanyName:    "Test Company",
			EmployeeID:     "12345A", // Contains letter
			BusinessDetail: "Software Development",
			FirstName:      "John",
			LastName:       "Doe",
			Email:          "john.doe@example.com",
			Password:       "SecurePass123!",
			Phone:          "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Phone Number - Doesn't start with 0", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "1812345678", // Starts with 1 instead of 0
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Phone Number - Wrong length", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "081234567", // Only 9 digits total
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Password - Too short", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "Short1!", // Only 7 characters
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Password - No uppercase", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "securepass123!", // No uppercase
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Password - No lowercase", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SECUREPASS123!", // No lowercase
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Password - No number", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass!", // No number
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Password - No special character", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123", // No special character
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Valid Password with different special characters", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123@", // Using @ as special character
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing required FirstName", func(t *testing.T) {
		user := entity.User{
			LastName: "Doe",
			Email:    "john.doe@example.com",
			Password: "SecurePass123!",
			Phone:    "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing required LastName", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing required Email", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Password:  "SecurePass123!",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing required Password", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Phone:     "0812345678",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing required Phone", func(t *testing.T) {
		user := entity.User{
			FirstName: "John",
			LastName:  "Doe",
			Email:     "john.doe@example.com",
			Password:  "SecurePass123!",
		}

		ok, err := govalidator.ValidateStruct(user)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
