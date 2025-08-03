package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"sci-park_web-application/entity"
)

func TestRoomTypeValidation(t *testing.T) {
	g := NewWithT(t)



	t.Run("ValidRoomType", func(t *testing.T) {
		roomType := entity.RoomType{
			TypeName:    "ห้องประชุม",
			// FullDayRate: 1000,
			// HalfDayRate: 500,
		}

		
		ok, err := govalidator.ValidateStruct(roomType)

		if !ok {
			t.Logf("Validation failed: %v", err)
		}

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("MissingTypeName", func(t *testing.T) {
		roomType := entity.RoomType{
			TypeName:    "",
			// FullDayRate: 1000,
			// HalfDayRate: 500,
		}

		ok, err := govalidator.ValidateStruct(roomType)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
	})

	t.Run("MissingFullDayRate", func(t *testing.T) {
		roomType := entity.RoomType{
			TypeName:    "ห้องบรรยาย",
			// HalfDayRate: 300,
		}

		ok, err := govalidator.ValidateStruct(roomType)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
	})

	t.Run("MissingHalfDayRate", func(t *testing.T) {
		roomType := entity.RoomType{
			TypeName:    "ห้องเรียน",
			// FullDayRate: 900,
		}

		ok, err := govalidator.ValidateStruct(roomType)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
	})
}
