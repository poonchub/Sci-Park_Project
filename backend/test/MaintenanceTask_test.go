package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestMaintenanceTaskValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid MaintenanceTask", func(t *testing.T) {
		task := entity.MaintenanceTask{
			Note:       "Fix electrical panel",
			UserID:            1,
			RequestID:         2,
			RequestStatusID:   3,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing UserID", func(t *testing.T) {
		task := entity.MaintenanceTask{
			Note:       "Fix electrical panel",
			// UserID:            1,
			RequestID:         2,
			RequestStatusID:   3,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})

	t.Run("Missing RequestID", func(t *testing.T) {
		task := entity.MaintenanceTask{
			Note:       "Fix electrical panel",
			UserID:            1,
			// RequestID:         2,
			RequestStatusID:   3,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestID is required"))
	})

	t.Run("Missing RequestStatusID", func(t *testing.T) {
		task := entity.MaintenanceTask{
			Note:       "Fix electrical panel",
			UserID:            1,
			RequestID:         2,
			// RequestStatusID:   3,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestStatusID is required"))
	})
}
