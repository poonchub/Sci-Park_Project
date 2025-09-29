package unit


import (
"testing"
"github.com/asaskevich/govalidator"
. "github.com/onsi/gomega"
"sci-park_web-application/entity"
)


// ไม่มีแท็ก validate → ยืนยันตามพฤติกรรมเดิม
func TestUserPackage_NoValidationTags(t *testing.T) {
g := NewGomegaWithT(t)


t.Run("Zero value passes", func(t *testing.T) {
up := entity.UserPackage{}
ok, err := govalidator.ValidateStruct(up)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})


t.Run("Filled values pass", func(t *testing.T) {
up := entity.UserPackage{PackageID: 1}
ok, err := govalidator.ValidateStruct(up)
g.Expect(ok).To(BeTrue())
g.Expect(err).To(BeNil())
})
}