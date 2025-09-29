package unit

import (
    "testing"

    "github.com/asaskevich/govalidator"
    . "github.com/onsi/gomega"
    "sci-park_web-application/entity"
)

func TestBookingStatusValidation(t *testing.T) {
    g := NewGomegaWithT(t)

    t.Run("All fields are valid", func(t *testing.T) {
        bs := entity.BookingStatus{
            StatusName: "Approved",
        }
        ok, err := govalidator.ValidateStruct(bs)
        g.Expect(ok).To(BeTrue())
        g.Expect(err).To(BeNil())
    })

    t.Run("StatusName is required", func(t *testing.T) {
        bs := entity.BookingStatus{
            StatusName: "",
        }
        ok, err := govalidator.ValidateStruct(bs)
        g.Expect(ok).To(BeFalse())
        g.Expect(err).To(HaveOccurred())
        // ข้อความจาก valid tag: "กรุณาระบุชื่อสถานะ"
        g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุชื่อสถานะ"))
    })
}
