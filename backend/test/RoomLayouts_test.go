package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestRoomLayout_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
rl := entity.RoomLayout{}
ok, err := govalidator.ValidateStruct(rl)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
rl := entity.RoomLayout{LayoutName: "Classroom"}
ok, err := govalidator.ValidateStruct(rl)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}