package unit

import (
	"testing"

	_ "sci-park_web-application/validator" // Import to register custom validators

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

// TestValidationInput เป็น struct สำหรับทดสอบ validation
type TestValidationInput struct {
	Password string `valid:"required,password"`
	Phone    string `valid:"phone,required"`
	Email    string `valid:"email,required"`
}

func TestCustomValidators(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Password Validation - Should Fail", func(t *testing.T) {
		input := TestValidationInput{
			Password: "112233", // Invalid: too short, no uppercase, no special char
			Phone:    "0812345678",
			Email:    "test@example.com",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(Not(BeNil()))
		t.Logf("Password validation error: %v", err)
	})

	t.Run("Password Validation - Should Pass", func(t *testing.T) {
		input := TestValidationInput{
			Password: "SecurePass123!",
			Phone:    "0812345678",
			Email:    "test@example.com",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Phone Validation - Should Fail", func(t *testing.T) {
		input := TestValidationInput{
			Password: "SecurePass123!",
			Phone:    "1812345678", // Invalid: doesn't start with 0
			Email:    "test@example.com",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(Not(BeNil()))
		t.Logf("Phone validation error: %v", err)
	})

	t.Run("Phone Validation - Should Pass", func(t *testing.T) {
		input := TestValidationInput{
			Password: "SecurePass123!",
			Phone:    "0812345678",
			Email:    "test@example.com",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
