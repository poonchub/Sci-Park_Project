package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestRoomTypeImage_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
rti := entity.RoomTypeImage{}
ok, err := govalidator.ValidateStruct(rti)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
rti := entity.RoomTypeImage{FilePath: "path/to/image.jpg", RoomTypeID: 1}
ok, err := govalidator.ValidateStruct(rti)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}