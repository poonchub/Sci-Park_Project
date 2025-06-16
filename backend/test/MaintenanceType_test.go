package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestMaintenanceTypeValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid MaintenanceType", func(t *testing.T) {
		maintenanceType := entity.MaintenanceType{
			TypeName: "ระบบไฟฟ้า",
		}

		ok, err := govalidator.ValidateStruct(maintenanceType)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing TypeName", func(t *testing.T) {
		maintenanceType := entity.MaintenanceType{
			TypeName: "",
		}

		ok, err := govalidator.ValidateStruct(maintenanceType)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
