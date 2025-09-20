package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
	_ "sci-park_web-application/validator" // Import to register custom validators
)

func TestServiceAreaTaskValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid service area task data", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Please complete the area inspection and provide detailed report",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Missing user ID", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Task without user assignment",
			UserID:               0,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("UserID is required"))
	})

	t.Run("Test: Missing request service area ID", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Task without service area reference",
			UserID:               1,
			RequestServiceAreaID: 0,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("RequestServiceAreaID is required"))
	})

	t.Run("Test: Empty note", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue()) // Note is optional
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Cancellation task", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Process cancellation request and update status accordingly",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             true,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Long detailed note", func(t *testing.T) {
		longNote := "This is a comprehensive task that requires multiple steps including initial assessment, documentation review, site inspection, stakeholder consultation, compliance verification, quality assurance checks, final reporting, and follow-up actions to ensure all requirements are met according to the established protocols and standards."

		task := entity.ServiceAreaTask{
			Note:                 longNote,
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Task with special characters in note", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Review contract #SA-2024-001 & verify compliance (100% completion required!)",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai language note", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "กรุณาตรวจสอบพื้นที่และจัดทำรายงานให้เสร็จสิ้นภายในกำหนด",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Whitespace only note", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "   ",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue()) // Whitespace note is allowed
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: High priority inspection task", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "URGENT: Complete safety inspection before occupancy approval",
			UserID:               1,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Maintenance task", func(t *testing.T) {
		task := entity.ServiceAreaTask{
			Note:                 "Schedule routine maintenance and equipment calibration",
			UserID:               2,
			RequestServiceAreaID: 1,
			IsCancel:             false,
		}

		ok, err := govalidator.ValidateStruct(task)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
