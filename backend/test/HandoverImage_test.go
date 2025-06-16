package unit

import (
    "testing"

    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"

    "sci-park_web-application/entity"
)



func TestHandoverImageValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("Valid HandoverImage", func(t *testing.T) {
        handoverImage := entity.HandoverImage{
            FilePath: "https://example.com/image.jpg",
            TaskID:   1,
        }

        ok, err := govalidator.ValidateStruct(handoverImage)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("Missing Image URL", func(t *testing.T) {
        handoverImage := entity.HandoverImage{
            FilePath: "",
            TaskID:   1,
        }

        ok, err := govalidator.ValidateStruct(handoverImage)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Invalid Image URL", func(t *testing.T) {
        handoverImage := entity.HandoverImage{
            FilePath: "not-a-valid-url",
            TaskID:   1,
        }

        ok, err := govalidator.ValidateStruct(handoverImage)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })
}
