package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators
)

func TestRequestServiceAreaValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid request service area data", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Office space for software development company",
			NumberOfEmployees:                  15,
			ActivitiesInBuilding:               "Software development, meetings, training sessions",
			SupportingActivitiesForSciencePark: "Technology innovation and startup mentoring programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty purpose of using space", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "",
			NumberOfEmployees:                  15,
			ActivitiesInBuilding:               "Software development, meetings",
			SupportingActivitiesForSciencePark: "Technology innovation programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Purpose of using space is required"))
	})

	t.Run("Test: Negative number of employees", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Office space for startup",
			NumberOfEmployees:                  -5,
			ActivitiesInBuilding:               "Research and development",
			SupportingActivitiesForSciencePark: "Innovation programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Number of employees must be greater than 0"))
	})

	t.Run("Test: Empty activities in building", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Office space for startup",
			NumberOfEmployees:                  10,
			ActivitiesInBuilding:               "",
			SupportingActivitiesForSciencePark: "Innovation programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Activities in building is required"))
	})

	t.Run("Test: Empty supporting activities", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Office space for startup",
			NumberOfEmployees:                  10,
			ActivitiesInBuilding:               "Software development",
			SupportingActivitiesForSciencePark: "",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Supporting activities for science park is required"))
	})

	t.Run("Test: Large number of employees", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Corporate headquarters",
			NumberOfEmployees:                  500,
			ActivitiesInBuilding:               "Management, R&D, manufacturing coordination",
			SupportingActivitiesForSciencePark: "Industry partnerships and knowledge transfer",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Very long purpose text", func(t *testing.T) {
		longPurpose := "This is a very detailed explanation of the purpose of using the space which includes multiple aspects of business operations, research and development activities, collaboration with other companies, hosting events and conferences, training programs for employees, and various other business-related activities that will be conducted in the requested space area within the science park facility."

		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                longPurpose,
			NumberOfEmployees:                  25,
			ActivitiesInBuilding:               "Multiple business activities",
			SupportingActivitiesForSciencePark: "Comprehensive support programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Single employee startup", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Solo entrepreneur workspace",
			NumberOfEmployees:                  1,
			ActivitiesInBuilding:               "Product development and client meetings",
			SupportingActivitiesForSciencePark: "Startup ecosystem participation",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Research organization request", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Research laboratory and office space for biotech research",
			NumberOfEmployees:                  8,
			ActivitiesInBuilding:               "Laboratory research, data analysis, scientific meetings",
			SupportingActivitiesForSciencePark: "Scientific collaboration and technology transfer",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Manufacturing company request", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Manufacturing facility and administrative offices",
			NumberOfEmployees:                  75,
			ActivitiesInBuilding:               "Product manufacturing, quality control, administration",
			SupportingActivitiesForSciencePark: "Industry collaboration and supply chain optimization",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Whitespace in required fields", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "   ",
			NumberOfEmployees:                  10,
			ActivitiesInBuilding:               "Software development",
			SupportingActivitiesForSciencePark: "Innovation programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue()) // govalidator doesn't trim whitespace by default
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Edge case - maximum reasonable employees", func(t *testing.T) {
		requestServiceArea := entity.RequestServiceArea{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Large enterprise headquarters",
			NumberOfEmployees:                  1000,
			ActivitiesInBuilding:               "Full corporate operations",
			SupportingActivitiesForSciencePark: "Enterprise partnership programs",
		}

		ok, err := govalidator.ValidateStruct(requestServiceArea)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
