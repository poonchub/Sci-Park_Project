package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestNewsImageValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid NewsImage", func(t *testing.T) {
		image := entity.NewsImage{
			FilePath: "https://example.com/image.jpg",
			NewsID:   1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Image URL", func(t *testing.T) {
		image := entity.NewsImage{
			FilePath: "",
			NewsID:   1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Image URL is required"))
	})

	t.Run("Invalid Image URL", func(t *testing.T) {
		image := entity.NewsImage{
			FilePath: "not-a-valid-url",
			NewsID:   1,
		}

		ok, err := govalidator.ValidateStruct(image)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Invalid URL format (example: https://example.com/image.jpg)"))
	})

	t.Run("Missing NewsID", func(t *testing.T) {
        image := entity.NewsImage{
            FilePath: "https://example.com/image.jpg",
        }

        ok, err := govalidator.ValidateStruct(image)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
        g.Expect(err.Error()).To(Equal("NewsID is required"))
    })
}
