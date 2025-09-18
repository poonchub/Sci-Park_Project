package services

import (
	"log"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"time"
)

// UserPackageResetService จัดการการรีเซ็ต UserPackage
type UserPackageResetService struct{}

// NewUserPackageResetService สร้าง instance ใหม่
func NewUserPackageResetService() *UserPackageResetService {
	return &UserPackageResetService{}
}

// ResetUserPackages รีเซ็ตจำนวนครั้งที่ใช้ไปของ UserPackage ทั้งหมด
func (s *UserPackageResetService) ResetUserPackages() error {
	db := config.DB()

	// อัพเดท UserPackage ทั้งหมดให้ reset จำนวนครั้งที่ใช้ไป
	result := db.Model(&entity.UserPackage{}).Updates(map[string]interface{}{
		"meeting_room_used":        0,
		"training_room_used":       0,
		"multi_function_room_used": 0,
	})

	if result.Error != nil {
		log.Printf("Error resetting UserPackages: %v", result.Error)
		return result.Error
	}

	log.Printf("Successfully reset %d UserPackages", result.RowsAffected)
	return nil
}

// ResetUserPackagesForYear รีเซ็ต UserPackage สำหรับปีที่กำหนด
func (s *UserPackageResetService) ResetUserPackagesForYear(year int) error {
	db := config.DB()

	// สร้างวันที่เริ่มต้นและสิ้นสุดของปี
	startOfYear := time.Date(year, 1, 1, 0, 0, 0, 0, time.Local)
	endOfYear := time.Date(year, 12, 31, 23, 59, 59, 999999999, time.Local)

	log.Printf("Resetting UserPackages for year %d (from %s to %s)",
		year, startOfYear.Format("2006-01-02"), endOfYear.Format("2006-01-02"))

	// อัพเดท UserPackage ที่ถูกสร้างในปีนั้น
	result := db.Model(&entity.UserPackage{}).
		Where("created_at >= ? AND created_at <= ?", startOfYear, endOfYear).
		Updates(map[string]interface{}{
			"meeting_room_used":        0,
			"training_room_used":       0,
			"multi_function_room_used": 0,
		})

	if result.Error != nil {
		log.Printf("Error resetting UserPackages for year %d: %v", year, result.Error)
		return result.Error
	}

	log.Printf("Successfully reset %d UserPackages for year %d", result.RowsAffected, year)
	return nil
}

// CheckAndResetIfNewYear ตรวจสอบและรีเซ็ตหากเป็นปีใหม่
func (s *UserPackageResetService) CheckAndResetIfNewYear() error {
	now := time.Now()

	// ตรวจสอบว่าวันนี้เป็นวันที่ 1 มกราคมหรือไม่
	if now.Month() == time.January && now.Day() == 1 {
		log.Printf("New Year detected! Resetting UserPackages for year %d", now.Year())

		// รีเซ็ต UserPackage ทั้งหมด
		if err := s.ResetUserPackages(); err != nil {
			log.Printf("Failed to reset UserPackages for new year: %v", err)
			return err
		}

		log.Printf("UserPackages reset completed for year %d", now.Year())
	}

	return nil
}

// GetUserPackageUsageStats ดึงสถิติการใช้งาน UserPackage
func (s *UserPackageResetService) GetUserPackageUsageStats() (map[string]interface{}, error) {
	db := config.DB()

	var stats struct {
		TotalUserPackages          int64 `json:"total_user_packages"`
		TotalMeetingRoomUsed       int64 `json:"total_meeting_room_used"`
		TotalTrainingRoomUsed      int64 `json:"total_training_room_used"`
		TotalMultiFunctionRoomUsed int64 `json:"total_multi_function_room_used"`
	}

	// นับจำนวน UserPackage ทั้งหมด
	db.Model(&entity.UserPackage{}).Count(&stats.TotalUserPackages)

	// รวมจำนวนครั้งที่ใช้ไป
	db.Model(&entity.UserPackage{}).Select("SUM(meeting_room_used)").Scan(&stats.TotalMeetingRoomUsed)
	db.Model(&entity.UserPackage{}).Select("SUM(training_room_used)").Scan(&stats.TotalTrainingRoomUsed)
	db.Model(&entity.UserPackage{}).Select("SUM(multi_function_room_used)").Scan(&stats.TotalMultiFunctionRoomUsed)

	result := map[string]interface{}{
		"total_user_packages":            stats.TotalUserPackages,
		"total_meeting_room_used":        stats.TotalMeetingRoomUsed,
		"total_training_room_used":       stats.TotalTrainingRoomUsed,
		"total_multi_function_room_used": stats.TotalMultiFunctionRoomUsed,
		"reset_date":                     time.Now().Format("2006-01-02 15:04:05"),
	}

	return result, nil
}
