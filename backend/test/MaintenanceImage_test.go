package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestMaintenanceImageValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid MaintenanceImage", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "https://example.com/image.jpg",
			RequestID: 1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Image URL", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "",
			RequestID: 1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Invalid Image URL Format", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "not-a-valid-url",
			RequestID: 1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "https://example.com/image.jpg",
			RequestID: 0, // Zero = missing
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
