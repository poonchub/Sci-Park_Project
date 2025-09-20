package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestCancelRequestServiceAreaValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid cancellation request data", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Business restructuring requires relocating operations",
			ProjectActivities:     "Software development and consulting services",
			AnnualIncome:          500000.50,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty purpose of cancellation", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "",
			ProjectActivities:     "Software development",
			AnnualIncome:          300000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Purpose of cancellation is required"))
	})

	t.Run("Test: Negative annual income", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Company closure",
			ProjectActivities:     "Consulting services",
			AnnualIncome:          -50000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Annual income must be greater than or equal to 0"))
	})

	t.Run("Test: Zero annual income", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Startup with no revenue yet",
			ProjectActivities:     "Product development",
			AnnualIncome:          0.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty project activities", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Change of business direction",
			ProjectActivities:     "",
			AnnualIncome:          150000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue()) // ProjectActivities is optional
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: High annual income", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Expansion to larger facility",
			ProjectActivities:     "Manufacturing and R&D operations",
			AnnualIncome:          5000000.75,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Detailed cancellation purpose", func(t *testing.T) {
		longPurpose := "Due to significant changes in market conditions and strategic business realignment, our company has decided to consolidate operations into a single location. This decision was made after careful consideration of operational efficiency, cost optimization, and long-term sustainability factors."
		
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: longPurpose,
			ProjectActivities:     "Technology consulting and software development",
			AnnualIncome:          750000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Whitespace purpose of cancellation", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "   ",
			ProjectActivities:     "Research activities",
			AnnualIncome:          200000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Purpose of cancellation is required"))
	})

	t.Run("Test: Small annual income", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Early stage startup closure",
			ProjectActivities:     "Mobile app development",
			AnnualIncome:          1500.25,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Business pivot cancellation", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Strategic pivot to digital-only business model",
			ProjectActivities:     "E-commerce platform development and digital marketing",
			AnnualIncome:          425000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Financial difficulties cancellation", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Financial constraints require downsizing operations",
			ProjectActivities:     "Consulting and training services",
			AnnualIncome:          85000.0,
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Document paths validation", func(t *testing.T) {
		cancelRequest := entity.CancelRequestServiceArea{
			RequestServiceAreaID:  1,
			UserID:                1,
			PurposeOfCancellation: "Relocation to new facility",
			ProjectActivities:     "Manufacturing operations",
			AnnualIncome:          600000.0,
			CancellationDocument:  "./documents/cancellation_request.pdf",
			BankAccountDocument:   "./documents/bank_account_info.pdf",
		}

		ok, err := govalidator.ValidateStruct(cancelRequest)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
