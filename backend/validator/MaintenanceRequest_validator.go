package validator

import (
	"errors"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strings"

	"github.com/asaskevich/govalidator"
)

func ValidateMaintenanceRequest(m *entity.MaintenanceRequest) error {

	_, err := govalidator.ValidateStruct(m)
	if err != nil {
		return err
	}

	db := config.DB()

	var otherArea entity.Area
	if err := db.Where("name = ?", "Other Areas").First(&otherArea).Error;
	err != nil {
		return errors.New("Area named 'Other Areas' was not found")
	}

	var otherMaintenanceType entity.MaintenanceType
	if err := db.Where("type_name = ?", "Other Work").First(&otherMaintenanceType).Error;
	err != nil {
		return errors.New("Area named 'Other Work' was not found")
	}

	if m.AreaID == otherArea.ID && strings.TrimSpace(m.AreaDetail) == "" {
		return errors.New("Please provide additional area details when selecting 'Other Areas'")
	}

	if m.MaintenanceTypeID == otherMaintenanceType.ID && strings.TrimSpace(m.OtherTypeDetail) == "" {
		return errors.New("Please provide additional other type details when selecting 'Other Work")
	}

	if !m.IsAnytimeAvailable {
		if m.StartTime.IsZero() {
			return errors.New("Start time is required when specific time is selected")
		}
		if m.EndTime.IsZero() {
			return errors.New("End time is required when specific time is selected")
		}
		if !m.EndTime.After(m.StartTime) {
			return errors.New("End time must be after start time")
		}
	}

	return nil
}