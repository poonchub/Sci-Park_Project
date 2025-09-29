package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestBookingRoomValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("All required fields are valid", func(t *testing.T) {
		g := NewGomegaWithT(t)

		br := entity.BookingRoom{
			Purpose:      "ประชุมวางแผนไตรมาส",
			UserID:       1,
			StatusID:     1,
			EventStartAt: time.Date(2025, 9, 30, 10, 0, 0, 0, time.Local),
			EventEndAt:   time.Date(2025, 9, 30, 12, 0, 0, 0, time.Local),
		}

		ok, err := govalidator.ValidateStruct(br)
		if !ok && err != nil {
			t.Logf("validation error: %v", err) // <<<<<< ดูข้อความที่จริง ๆ fail
		}

		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Purpose is required", func(t *testing.T) {
		br := entity.BookingRoom{
			Purpose:  "",
			UserID:   1,
			StatusID: 1,
		}
		ok, err := govalidator.ValidateStruct(br)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุวัตถุประสงค์"))
	})

	t.Run("UserID is required", func(t *testing.T) {
		br := entity.BookingRoom{
			Purpose:  "อบรม",
			UserID:   0,
			StatusID: 1,
		}
		ok, err := govalidator.ValidateStruct(br)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุผู้รับผิดชอบ"))
	})

	t.Run("StatusID is required", func(t *testing.T) {
		br := entity.BookingRoom{
			Purpose: "สัมมนา",
			UserID:  99,
			// StatusID: 0,
		}
		ok, err := govalidator.ValidateStruct(br)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).To(HaveOccurred())
		g.Expect(err.Error()).To(ContainSubstring("กรุณาระบุสถานะ"))
	})
}
