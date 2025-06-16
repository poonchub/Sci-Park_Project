package unit

import (
    "testing"
    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"
    "sci-park_web-application/entity"
)

func TestFloorValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("Valid Floor", func(t *testing.T) {
        floor := entity.Floor{
            Number: 1,
        }

        ok, err := govalidator.ValidateStruct(floor)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("Missing Floor Number", func(t *testing.T) {
        floor := entity.Floor{
            Number: 0, // ถือว่า invalid ถ้าคุณต้องการบังคับว่าห้ามเป็น 0
        }

        ok, err := govalidator.ValidateStruct(floor)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })
}
