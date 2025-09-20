package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestRoleValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid role data", func(t *testing.T) {
		role := entity.Role{
			Name: "Admin",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty role name", func(t *testing.T) {
		role := entity.Role{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run("Test: User role", func(t *testing.T) {
		role := entity.Role{
			Name: "User",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Manager role", func(t *testing.T) {
		role := entity.Role{
			Name: "Manager",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Maintenance Operator role", func(t *testing.T) {
		role := entity.Role{
			Name: "Maintenance Operator",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Whitespace role name", func(t *testing.T) {
		role := entity.Role{
			Name: "   ",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue()) // govalidator doesn't trim whitespace
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai role name", func(t *testing.T) {
		role := entity.Role{
			Name: "ผู้ดูแลระบบ",
		}

		ok, err := govalidator.ValidateStruct(role)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
