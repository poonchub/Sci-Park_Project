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

	t.Run("Missing Required Fields", func(t *testing.T) {
		task := entity.MaintenanceTask{
			Note:       "",
			UserID:            0,
			RequestID:         0,
			RequestStatusID:   0,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
