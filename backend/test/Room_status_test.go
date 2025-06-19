package unit

import (
	"testing"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"
	"sci-park_web-application/entity"
)

func TestRoomStatusValidation(t *testing.T) {
	g := NewWithT(t)

	t.Run("ValidRoomStatus", func(t *testing.T) {
		roomStatus := entity.RoomStatus{
			StatusName: "Available", // Valid
		}

		ok, err := govalidator.ValidateStruct(roomStatus)

		if !ok {
			t.Logf("Validation failed: %v", err)
		}

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("MissingStatusName", func(t *testing.T) {
		roomStatus := entity.RoomStatus{
			StatusName: "", // Missing StatusName
		}

		ok, err := govalidator.ValidateStruct(roomStatus)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
	})

	t.Run("InvalidStatusName", func(t *testing.T) {
		roomStatus := entity.RoomStatus{
			StatusName: "12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890", // Exceeds length limit (assuming the limit is 100 characters)
		}

		ok, err := govalidator.ValidateStruct(roomStatus)

		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
	})
}
