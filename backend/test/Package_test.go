package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestPackageValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid Package", func(t *testing.T) {
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

	t.Run("Missing Package Name", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "",
			MeetingRoomLimit:       2,
			TrainingRoomLimit:      1,
			MultiFunctionRoomLimit: 1,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Negative Room Limits", func(t *testing.T) {
		pkg := entity.Package{
			PackageName:            "Basic",
			MeetingRoomLimit:       -1,
			TrainingRoomLimit:      -1,
			MultiFunctionRoomLimit: -1,
		}

		ok, err := govalidator.ValidateStruct(pkg)
		g.Expect(ok).To(BeTrue()) // เนื่องจากยังไม่ได้ใส่เงื่อนไข > 0
		g.Expect(err).To(BeNil()) // ถ้าต้องการบังคับไม่ให้ติดลบ ให้เพิ่ม custom validator
	})
}
