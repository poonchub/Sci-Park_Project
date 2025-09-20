package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators
)

func TestCollaborationPlanValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	futureDate := time.Now().AddDate(0, 6, 0) // 6 months from now

	t.Run("Test: Valid collaboration plan data", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "Joint research and development project for innovative software solutions",
			CollaborationBudget:  250000.50,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty collaboration plan", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "",
			CollaborationBudget:  100000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Collaboration plan is required"))
	})

	t.Run("Test: Zero collaboration budget", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "Technology transfer initiative",
			CollaborationBudget:  0.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue()) // No budget validation
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Negative collaboration budget", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "Research partnership",
			CollaborationBudget:  -50000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue()) // No budget validation
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Large collaboration budget", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "Major enterprise collaboration program",
			CollaborationBudget:  5000000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Detailed collaboration plan", func(t *testing.T) {
		detailedPlan := "Comprehensive collaboration initiative involving joint research, technology transfer, knowledge sharing, training programs, and co-development of innovative solutions."

		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    detailedPlan,
			CollaborationBudget:  750000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Whitespace collaboration plan", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "   ",
			CollaborationBudget:  150000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue()) // govalidator doesn't trim whitespace by default
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Research collaboration plan", func(t *testing.T) {
		collaborationPlan := entity.CollaborationPlan{
			RequestServiceAreaID: 1,
			CollaborationPlan:    "Academic-industry research collaboration for sustainable technology development",
			CollaborationBudget:  300000.0,
			ProjectStartDate:     futureDate,
		}

		ok, err := govalidator.ValidateStruct(collaborationPlan)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
