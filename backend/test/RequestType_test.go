package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestRequestTypeValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid RequestType", func(t *testing.T) {
		rt := entity.RequestType{
			TypeName: "ผู้ดูแลระบบ",
		}

		ok, err := govalidator.ValidateStruct(rt)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing TypeName", func(t *testing.T) {
		rt := entity.RequestType{
			TypeName: "",
		}

		ok, err := govalidator.ValidateStruct(rt)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
