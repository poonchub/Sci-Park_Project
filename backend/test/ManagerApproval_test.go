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
			Description:     "อนุมัติให้ดำเนินการซ่อมได้",
			UserID:          1,
			RequestID:       2,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Description", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Description:     "",
			UserID:          1,
			RequestID:       2,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing UserID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Description:     "ทดสอบ",
			UserID:          0,
			RequestID:       2,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Description:     "ทดสอบ",
			UserID:          1,
			RequestID:       0,
			RequestStatusID: 3,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Missing RequestStatusID", func(t *testing.T) {
		approval := entity.ManagerApproval{
			Description:     "ทดสอบ",
			UserID:          1,
			RequestID:       2,
			RequestStatusID: 0,
		}

		ok, err := govalidator.ValidateStruct(approval)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
