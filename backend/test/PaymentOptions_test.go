package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"sci-park_web-application/entity"
)

// ปิด required-by-default กัน side-effects จากที่อื่น
func init() { govalidator.SetFieldsRequiredByDefault(false) }

func TestPaymentOption_NoValidationTags(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Zero value passes because no tags", func(t *testing.T) {
		po := entity.PaymentOption{} // OptionName ว่างก็ยังผ่าน
		ok, err := govalidator.ValidateStruct(po)
		if !ok && err != nil {
			t.Logf("validation error: %v", err)
		}
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Non-empty OptionName also passes", func(t *testing.T) {
		po := entity.PaymentOption{OptionName: "โอน/อัปสลิป"}
		ok, err := govalidator.ValidateStruct(po)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
