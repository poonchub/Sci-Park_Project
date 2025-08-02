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

	t.Run("Missing File Path", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "",
			RequestID: 1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Image file path is required"))
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		image := entity.MaintenanceImage{
			FilePath:  "https://example.com/image.jpg",
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestID is required"))
	})
}
