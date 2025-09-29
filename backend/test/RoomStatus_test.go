package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


func TestRoomStatus_Validation(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Valid when StatusName provided", func(t *testing.T) {
rs := entity.RoomStatus{StatusName: "available", Code: "available"}
ok, err := govalidator.ValidateStruct(rs)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("StatusName is required", func(t *testing.T) {
rs := entity.RoomStatus{StatusName: "", Code: "maintenance"}
ok, err := govalidator.ValidateStruct(rs)
g.Expect(ok).To(BeFalse())
g.Expect(err).To(HaveOccurred())
g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุสถานะของห้อง"))
})
}