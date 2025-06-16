package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestRoleValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Role", func(t *testing.T) {
		role := entity.Role{
			Name: "Admin",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Role Name", func(t *testing.T) {
		role := entity.Role{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
