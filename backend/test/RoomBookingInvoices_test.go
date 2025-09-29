package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


// ไม่มีแท็ก validate → ตรวจรูปแบบตามตัวอย่าง: ทั้งค่าว่างและมีค่า ควรผ่าน
func TestRoomBookingInvoice_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
inv := entity.RoomBookingInvoice{}
ok, err := govalidator.ValidateStruct(inv)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
inv := entity.RoomBookingInvoice{InvoiceNumber: "INV-001"}
ok, err := govalidator.ValidateStruct(inv)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}