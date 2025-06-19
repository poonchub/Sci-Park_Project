package unit

import (
	"testing"
	"time"

	"github.com/asaskevich/govalidator"
	. "github.com/onsi/gomega"

	"sci-park_web-application/entity"
)

func TestMaintenanceRequestValidation(t *testing.T) {
	g := NewGomegaWithT(t)

	t.Run("Valid MaintenanceRequest", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "Building A",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RoomID:             2,
			RequestStatusID:    3,
			AreaID:             4,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Required Fields", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:  "",
			Description: "",
			// StartTime, EndTime are zero by default
			UserID:            0,
			RoomID:            0,
			RequestStatusID:   0,
			AreaID:            0,
			MaintenanceTypeID: 0,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})

	t.Run("Zero StartTime and EndTime", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "Lab Room",
			Description:        "Projector issue",
			IsAnytimeAvailable: false,
			StartTime:          time.Time{},
			EndTime:            time.Time{},
			UserID:             1,
			RoomID:             2,
			RequestStatusID:    3,
			AreaID:             4,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
	})
}
