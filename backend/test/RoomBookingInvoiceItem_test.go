package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestRoomBookingInvoiceItem_Validation(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Valid when all required present", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{
Description: "ห้องประชุม",
Quantity: 2,
UnitPrice: 1500,
Amount: 3000,
RoomBookingInvoiceID: 1,
}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Description is required", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{Quantity: 1, UnitPrice: 1000, Amount: 1000, RoomBookingInvoiceID: 1}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("Description is required"))
})


t.Run("Quantity is required", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{Description: "x", UnitPrice: 1000, Amount: 1000, RoomBookingInvoiceID: 1}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("Quantity is required"))
})


t.Run("UnitPrice is required", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{Description: "x", Quantity: 1, Amount: 1000, RoomBookingInvoiceID: 1}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("UnitPrice is required"))
})


t.Run("Amount is required", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{Description: "x", Quantity: 1, UnitPrice: 1000, RoomBookingInvoiceID: 1}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("Amount is required"))
})


t.Run("RoomBookingInvoiceID is required", func(t *testing.T) {
it := entity.RoomBookingInvoiceItem{Description: "x", Quantity: 1, UnitPrice: 1000, Amount: 1000}
ok, err := govalidator.ValidateStruct(it)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("RoomBookingInvoiceID is required"))
})
}