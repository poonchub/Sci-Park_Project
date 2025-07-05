package unit

import (
    "testing"

    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"

    "sci-park_web-application/entity"
)

func TestInspectionValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("Valid Inspection", func(t *testing.T) {
        inspection := entity.Inspection{
            Note:      "ตรวจสอบการเปลี่ยนอะไหล่",
            UserID:           1,
            RequestID:        1,
            RequestStatusID:  1,
        }

        ok, err := govalidator.ValidateStruct(inspection)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("Missing Description", func(t *testing.T) {
        inspection := entity.Inspection{
            Note:      "", // Missing required field
            UserID:           1,
            RequestID:        1,
            RequestStatusID:  1,
        }

        ok, err := govalidator.ValidateStruct(inspection)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Missing UserID", func(t *testing.T) {
        inspection := entity.Inspection{
            Note:      "ตรวจสอบ",
            RequestID:        1,
            RequestStatusID:  1,
        }

        ok, err := govalidator.ValidateStruct(inspection)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Missing RequestID", func(t *testing.T) {
        inspection := entity.Inspection{
            Note:      "ตรวจสอบ",
            UserID:           1,
            RequestStatusID:  1,
        }

        ok, err := govalidator.ValidateStruct(inspection)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })

    t.Run("Missing RequestStatusID", func(t *testing.T) {
        inspection := entity.Inspection{
            Note:      "ตรวจสอบ",
            UserID:           1,
            RequestID:        1,
        }

        ok, err := govalidator.ValidateStruct(inspection)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).NotTo(BeNil())
    })
}
