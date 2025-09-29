package unit

import (
    "testing"

    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"
    "sci-park_web-application/entity"
)

// ปิด required-by-default กัน side-effects จากที่อื่น
func init() { govalidator.SetFieldsRequiredByDefault(false) }

func TestRoomTypeLayout_NoValidationTags(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("Zero value passes", func(t *testing.T) {
        rtl := entity.RoomTypeLayout{}
        ok, err := govalidator.ValidateStruct(rtl)
        if !ok && err != nil {
            t.Logf("validation error: %v", err)
        }
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("Filled values pass", func(t *testing.T) {
        rtl := entity.RoomTypeLayout{
            Capacity:     40,
            Note:         "Classroom layout",
            RoomLayoutID: 1,
            RoomTypeID:   2,
        }
        ok, err := govalidator.ValidateStruct(rtl)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })
}
