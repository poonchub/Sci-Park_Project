package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestRequestStatusValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid RequestStatus", func(t *testing.T) {
		status := entity.RequestStatus{
			Name:        "Pending",
			Description: "คำขอรอการอนุมัติ",
		}

		ok, err := govalidator.ValidateStruct(status)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Name", func(t *testing.T) {
		status := entity.RequestStatus{
			Name:        "",
			Description: "ไม่มีชื่อสถานะ",
		}

		ok, err := govalidator.ValidateStruct(status)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run("Missing Description", func(t *testing.T) {
		status := entity.RequestStatus{
			Name:        "Approved",
			Description: "",
		}

		ok, err := govalidator.ValidateStruct(status)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})
}
