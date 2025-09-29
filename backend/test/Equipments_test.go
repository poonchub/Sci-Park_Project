package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

// ปิดโหมด required-by-default เพื่อไม่ให้ฟิลด์อื่น ๆ (รวมทั้ง gorm.Model) โดนบังคับค่า
func init() {
	govalidator.SetFieldsRequiredByDefault(false)
}

func TestEquipmentValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("All fields are valid", func(t *testing.T) {
		eq := entity.Equipment{
			EquipmentName: "Projector",
		}
		ok, err := govalidator.ValidateStruct(eq)
		if !ok && err != nil {
			t.Logf("validation error: %v", err)
		}
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("EquipmentName is required", func(t *testing.T) {
		eq := entity.Equipment{
			EquipmentName: "",
		}
		ok, err := govalidator.ValidateStruct(eq)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุชื่ออุปกรณ์"))
	})

	// (ออปชัน) กรณี pointer ก็ต้องผ่าน validation เช่นกัน
	t.Run("Pointer struct is valid", func(t *testing.T) {
		eq := &entity.Equipment{EquipmentName: "Whiteboard"}
		ok, err := govalidator.ValidateStruct(eq)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})
}
