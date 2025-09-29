package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestRoomPrice_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
rp := entity.RoomPrice{}
ok, err := govalidator.ValidateStruct(rp)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
rp := entity.RoomPrice{Price: 2000, TimeSlotID: 1, RoomTypeID: 1}
ok, err := govalidator.ValidateStruct(rp)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}