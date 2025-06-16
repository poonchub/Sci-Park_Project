package unit

import (
    "testing"
    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"
    "sci-park_web-application/entity"
)

func TestGender(t *testing.T) {
	g:= NewGomegaWithT(t)

	t.Run("Valid Gender", func(t *testing.T) {
		gender := entity.Gender{
			Name: "Male",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Gender Name", func(t *testing.T) {
		gender := entity.Gender{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
	
	// t.Run("Invalid Gender Name", func(t *testing.T) {
	// 	gender := entity.Gender{
	// 		Name: "Invalid",
	// 	}

	// 	ok, err := govalidator.ValidateStruct(gender)
	// 	g.Expect(ok).To(BeFalse())
	// 	g.Expect(err).NotTo(BeNil())
	// })
}