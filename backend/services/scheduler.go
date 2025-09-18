package services

import (
	"log"
	"time"
)

// Scheduler จัดการการทำงานตามกำหนดเวลา
type Scheduler struct {
	userPackageResetService *UserPackageResetService
}

// NewScheduler สร้าง scheduler ใหม่
func NewScheduler() *Scheduler {
	return &Scheduler{
		userPackageResetService: NewUserPackageResetService(),
	}
}

// StartDailyCheck เริ่มการตรวจสอบทุกวัน
func (s *Scheduler) StartDailyCheck() {
	log.Println("Starting daily scheduler...")

	// ตรวจสอบทันทีเมื่อเริ่มต้น
	s.checkAndResetUserPackages()

	// ตั้งค่าให้ทำงานทุกวันเวลา 00:01
	ticker := time.NewTicker(24 * time.Hour)
	go func() {
		for range ticker.C {
			s.checkAndResetUserPackages()
		}
	}()

	log.Println("Daily scheduler started successfully")
}

// checkAndResetUserPackages ตรวจสอบและรีเซ็ต UserPackage หากจำเป็น
func (s *Scheduler) checkAndResetUserPackages() {
	log.Println("Checking for UserPackage reset...")

	if err := s.userPackageResetService.CheckAndResetIfNewYear(); err != nil {
		log.Printf("Error during UserPackage reset check: %v", err)
	} else {
		log.Println("UserPackage reset check completed")
	}
}

// StartManualReset เริ่มการรีเซ็ตแบบ manual (สำหรับทดสอบ)
func (s *Scheduler) StartManualReset() {
	log.Println("Starting manual UserPackage reset...")

	if err := s.userPackageResetService.ResetUserPackages(); err != nil {
		log.Printf("Error during manual UserPackage reset: %v", err)
	} else {
		log.Println("Manual UserPackage reset completed successfully")
	}
}

// GetUsageStats ดึงสถิติการใช้งาน
func (s *Scheduler) GetUsageStats() (map[string]interface{}, error) {
	return s.userPackageResetService.GetUserPackageUsageStats()
}
