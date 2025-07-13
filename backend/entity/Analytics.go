package entity

import (
	"time"

	"gorm.io/gorm"
)

// Analytics คือ entity สำหรับเก็บข้อมูลการใช้งานของผู้ใช้
type Analytics struct {
	gorm.Model
	UserID      uint      `json:"user_id" valid:"required"`
	User        User      `gorm:"foreignKey:UserID"`
	PagePath    string    `json:"page_path" valid:"required"`
	PageName    string    `json:"page_name"`
	VisitTime   time.Time `json:"visit_time"`
	Duration    int       `json:"duration"`     // เวลาในการเยี่ยมชม (วินาที)
	IsBounce    bool      `json:"is_bounce"`    // ออกจากหน้าโดยไม่ดูหน้าอื่น
	IsReturning bool      `json:"is_returning"` // ผู้ใช้ที่กลับมาใหม่
}

// UserAnalyticsSummary คือ entity สำหรับสรุปข้อมูล Analytics ของผู้ใช้
type UserAnalyticsSummary struct {
	gorm.Model
	UserID          uint      `json:"user_id" valid:"required"`
	User            User      `gorm:"foreignKey:UserID"`
	TotalVisits     int       `json:"total_visits"`
	UniquePages     int       `json:"unique_pages"`
	TotalDuration   int       `json:"total_duration"` // รวมเวลา (วินาที)
	LastVisit       time.Time `json:"last_visit"`
	MostVisitedPage string    `json:"most_visited_page"`
	AverageDuration float64   `json:"average_duration"`
	BounceRate      float64   `json:"bounce_rate"`
	ReturningRate   float64   `json:"returning_rate"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// PageAnalytics คือ entity สำหรับเก็บสถิติของแต่ละหน้า
type PageAnalytics struct {
	gorm.Model
	PagePath        string    `json:"page_path" valid:"required"`
	PageName        string    `json:"page_name"`
	TotalVisits     int       `json:"total_visits"`
	UniqueVisitors  int       `json:"unique_visitors"`
	AverageDuration float64   `json:"average_duration"`
	BounceRate      float64   `json:"bounce_rate"`
	LastUpdated     time.Time `json:"last_updated"`
}

// SystemAnalytics คือ entity สำหรับเก็บสถิติระบบโดยรวม
type SystemAnalytics struct {
	gorm.Model
	Date           time.Time `json:"date"`
	TotalUsers     int       `json:"total_users"`
	ActiveUsers    int       `json:"active_users"`
	TotalVisits    int       `json:"total_visits"`
	TotalPages     int       `json:"total_pages"`
	AverageSession float64   `json:"average_session"` // เวลาเฉลี่ยต่อ session
	PeakHour       int       `json:"peak_hour"`       // ชั่วโมงที่มีผู้ใช้มากที่สุด
	PeakDay        string    `json:"peak_day"`        // วันที่มีผู้ใช้มากที่สุด
}
