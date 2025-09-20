package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestPackageValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Test: Valid Premium package data", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Premium Package",
			MeetingRoomLimit:       5,
			TrainingRoomLimit:      3,
			MultiFunctionRoomLimit: 2,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Empty package name", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "",
			MeetingRoomLimit:       2,
			TrainingRoomLimit:      1,
			MultiFunctionRoomLimit: 1,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("Package name is required"))
	})

	t.Run("Test: Silver package", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Silver",
			MeetingRoomLimit:       2,
			TrainingRoomLimit:      5,
			MultiFunctionRoomLimit: 3,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Gold package", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Gold",
			MeetingRoomLimit:       5,
			TrainingRoomLimit:      10,
			MultiFunctionRoomLimit: 5,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Diamond package", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Diamond",
			MeetingRoomLimit:       10,
			TrainingRoomLimit:      15,
			MultiFunctionRoomLimit: 19,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Negative limit values", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Basic",
			MeetingRoomLimit:       -1,
			TrainingRoomLimit:      -1,
			MultiFunctionRoomLimit: -1,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeFalse()) // Negative values are not in range 0-999999
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(ContainSubstring("must be between 0-999999"))
	})

	t.Run("Test: Zero limit values", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "None",
			MeetingRoomLimit:       0,
			TrainingRoomLimit:      0,
			MultiFunctionRoomLimit: 0,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue()) // Zero values are valid (e.g., None package)
		g.Expect(err).To(BeNil())
	})

	t.Run("Test: Thai package name", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "แพ็กเกจพรีเมี่ยม",
			MeetingRoomLimit:       8,
			TrainingRoomLimit:      12,
			MultiFunctionRoomLimit: 6,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
