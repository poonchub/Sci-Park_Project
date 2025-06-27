package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	"sci-park_web-application/entity"
	. "github.com/onsi/gomega"
)

func TestAreaValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("All fields are valid", func(t *testing.T) {
		area := entity.Area{
			Name: "Zone A",
		}

		ok, err := govalidator.ValidateStruct(area)

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Name is required", func(t *testing.T) {
		area := entity.Area{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(area)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})
}
