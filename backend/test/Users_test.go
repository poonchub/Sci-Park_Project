package unit

import (
	"testing"
	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	
)

type LoginInput struct {
    Email    string `valid:"required,email"`
    Password string `valid:"required,minstringlength(6)"`
}


func TestUserLoginValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Email and Password", func(t *testing.T) {
		input := LoginInput{
			Email:    "user@example.com",
			Password: "password123",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Invalid Email Format", func(t *testing.T) {
		input := LoginInput{
			Email:    "useratexample.com", // invalid email
			Password: "password123",
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Short Password", func(t *testing.T) {
		input := LoginInput{
			Email:    "user@example.com",
			Password: "short", // too short
		}

		ok, err := govalidator.ValidateStruct(input)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
