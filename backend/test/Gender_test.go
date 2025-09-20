package unit

import (
	"sci-park_web-application/entity"
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
)

func TestGenderValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid Male gender", func(t *testing.T) {
		gender := entity.Gender{
			Name: "Male",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Valid Female gender", func(t *testing.T) {
		gender := entity.Gender{
			Name: "Female",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty gender name", func(t *testing.T) {
		gender := entity.Gender{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run("Test: Whitespace gender name", func(t *testing.T) {
		gender := entity.Gender{
			Name: "   ",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue()) // govalidator doesn't trim whitespace
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai Male gender name", func(t *testing.T) {
		gender := entity.Gender{
			Name: "ชาย",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai Female gender name", func(t *testing.T) {
		gender := entity.Gender{
			Name: "หญิง",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Other gender type", func(t *testing.T) {
		gender := entity.Gender{
			Name: "Other",
		}

		ok, err := govalidator.ValidateStruct(gender)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
