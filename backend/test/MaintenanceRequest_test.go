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
			AreaID:             1,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeTrue())
		g.Expect(err).To(BeNil())
	})

	t.Run("Missing Description", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RoomID:             2,
			RequestStatusID:    3,
			AreaID:             1,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("Description is required"))
	})

	t.Run("Missing UserID", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			RoomID:             2,
			RequestStatusID:    3,
			AreaID:             1,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("UserID is required"))
	})

	t.Run("Missing RoomID", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RequestStatusID:    3,
			AreaID:             1,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RoomID is required"))
	})

	t.Run("Missing RequestStatusID", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RoomID:             2,
			AreaID:             1,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("RequestStatusID is required"))
	})

	t.Run("Missing AreaID", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RoomID:             2,
			RequestStatusID:    3,
			MaintenanceTypeID:  5,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("AreaID is required"))
	})

	t.Run("Missing MaintenanceTypeID", func(t *testing.T) {
		req := entity.MaintenanceRequest{
			AreaDetail:         "",
			Description:        "Air conditioner not working",
			IsAnytimeAvailable: true,
			StartTime:          time.Now().Add(1 * time.Hour),
			EndTime:            time.Now().Add(2 * time.Hour),
			UserID:             1,
			RoomID:             2,
			RequestStatusID:    3,
			AreaID:             1,
		}

		ok, err := govalidator.ValidateStruct(req)
		g.Expect(ok).To(BeFalse())
		g.Expect(err).NotTo(BeNil())
		g.Expect(err.Error()).To(Equal("MaintenanceTypeID is required"))
	})
}
