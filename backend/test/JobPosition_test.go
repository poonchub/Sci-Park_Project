package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestJobPositionValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid job position data", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "Software Engineer",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty job position name", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Name is required"))
	})

	t.Run("Test: Whitespace job position name", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "   ",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeTrue()) // govalidator doesn't trim whitespace automatically
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Long job position name", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "Head of Innovation and Key Account Services Unit (IKD) - Senior Level Position",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Job position name with special characters", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "IT Manager & System Administrator",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai job position name", func(t *testing.T) {
		jobPosition := entity.JobPosition{
			Name: "หัวหน้าแผนกพัฒนาระบบ",
		}

		ok, err := govalidator.ValidateStruct(jobPosition)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
