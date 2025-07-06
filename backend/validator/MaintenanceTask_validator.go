package validator

import (
	"errors"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strings"

	"github.com/asaskevich/govalidator"
)

func ValidateMaintenanceTask(m *entity.MaintenanceTask) error {

	_, err := govalidator.ValidateStruct(m)
	if err != nil {
		return err
	}

	db := config.DB()

	var requestStatus entity.RequestStatus
	if err := db.Where("name = ?", "Unsuccessful").First(&requestStatus).Error; err != nil {
		return errors.New("Request status named 'Unsuccessful' was not found")
	}

	if m.RequestStatusID == requestStatus.ID && strings.TrimSpace(m.Note) == "" {
		return errors.New("A note is required when setting the request status to 'Unsuccessful'")
	}

	return nil
}
