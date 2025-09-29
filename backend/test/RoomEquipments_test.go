package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


// ไม่มีแท็ก validate → ทั้งค่าว่างและมีค่า ผ่าน
func TestRoomEquipment_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
re := entity.RoomEquipment{}
ok, err := govalidator.ValidateStruct(re)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
re := entity.RoomEquipment{Quantity: 3, RoomTypeID: 1, EquipmentID: 2}
ok, err := govalidator.ValidateStruct(re)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}