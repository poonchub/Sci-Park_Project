package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators
)

func TestServiceAreaDocumentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	futureDate := time.Now().AddDate(1, 0, 0) // 1 year from now
	pastDate := time.Now().AddDate(-1, 0, 0)  // 1 year ago

	t.Run("Test: Valid service area document data", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024-001",
			FinalContractNumber:  "FSA-2024-001",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty contract numbers", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "",
			FinalContractNumber:  "",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Contract numbers are optional
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Contract start date in the past", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2023-001",
			FinalContractNumber:  "FSA-2023-001",
			ContractStartAt:      pastDate,
			ContractEndAt:        time.Now(),
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Past dates are allowed
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Long contract numbers", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024-VERY-LONG-CONTRACT-NUMBER-WITH-MANY-DETAILS-001",
			FinalContractNumber:  "FSA-2024-FINAL-VERY-LONG-CONTRACT-NUMBER-WITH-DETAILS-001",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Contract with special characters", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024/001-A&B",
			FinalContractNumber:  "FSA-2024/001-A&B-FINAL",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Zero room ID", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024-002",
			FinalContractNumber:  "FSA-2024-002",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               0,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Zero room ID might be valid in some cases
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Zero service user type ID", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024-003",
			FinalContractNumber:  "FSA-2024-003",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    0,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Zero service user type ID might be valid
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Same start and end dates", func(t *testing.T) {
		sameDate := time.Now()
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "SA-2024-004",
			FinalContractNumber:  "FSA-2024-004",
			ContractStartAt:      sameDate,
			ContractEndAt:        sameDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Same dates are allowed
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Minimum required fields", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue()) // Only required fields
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai contract numbers", func(t *testing.T) {
		document := entity.ServiceAreaDocument{
			RequestServiceAreaID: 1,
			ContractNumber:       "สัญญา-2567-001",
			FinalContractNumber:  "สัญญาสุดท้าย-2567-001",
			ContractStartAt:      time.Now(),
			ContractEndAt:        futureDate,
			RoomID:               1,
			ServiceUserTypeID:    1,
		}

		ok, err := govalidator.ValidateStruct(document)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
