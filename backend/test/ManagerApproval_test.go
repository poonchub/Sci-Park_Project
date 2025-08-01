package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestManagerApprovalValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid ManagerApproval", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Note:     "อนุมัติให้ดำเนินการซ่อมได้",
			UserID:          1,
			RequestID:       2,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing UserID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Note:     "ทดสอบ",
			UserID:          0,
			RequestID:       2,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Note:     "ทดสอบ",
			UserID:          1,
			RequestID:       0,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestID is required"))
	})

	t.Run("Missing RequestStatusID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Note:     "ทดสอบ",
			UserID:          1,
			RequestID:       2,
			RequestStatusID: 0,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestStatusID is required"))
	})
}
