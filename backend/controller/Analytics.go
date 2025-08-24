package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// POST /analytics/track
func TrackPageVisit(c *gin.Context) {
	var analytics entity.Analytics

	if err := c.ShouldBindJSON(&analytics); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate only the required fields manually to avoid User struct validation
	if analytics.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"validation_error": "User ID is required"})
		return
	}
	if analytics.PagePath == "" {
		c.JSON(http.StatusBadRequest, gin.H{"validation_error": "Page path is required"})
		return
	}

	// ตรวจสอบว่ามี duration หรือไม่ - ถ้าไม่มี (request ที่ 1 ตอนเข้า) ให้ข้าม
	// ถ้ามี duration (request ที่ 2 ตอนออก) ให้ตรวจสอบว่ามากกว่า 2 วินาทีหรือไม่
	if analytics.Duration == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "Skipping entry request (no duration), waiting for exit request"})
		return
	}

	// ตรวจสอบว่า duration มากกว่า 2 วินาทีหรือไม่
	if analytics.Duration <= 2 {
		c.JSON(http.StatusOK, gin.H{"message": "Skipping short visit (duration <= 2 seconds)"})
		return
	}

	// ตรวจสอบและตั้งค่า interaction_count ถ้าไม่มี
	if analytics.InteractionCount < 0 {
		analytics.InteractionCount = 0
	}

	// ตั้งค่าเวลาปัจจุบัน
	analytics.VisitTime = time.Now()

	db := config.DB()

	// ตรวจสอบว่าผู้ใช้มีอยู่จริง
	var user entity.User
	if err := db.First(&user, analytics.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// บันทึกข้อมูล Analytics
	if err := db.Create(&analytics).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// อัปเดต UserAnalyticsSummary
	updateUserAnalyticsSummary(analytics.UserID)

	// อัปเดต PageAnalytics
	updatePageAnalytics(analytics.PagePath, analytics.PageName)

	c.JSON(http.StatusCreated, gin.H{"message": "Analytics tracked successfully (exit request)", "data": analytics})
}

// GET /analytics/user/:user_id
func GetUserAnalytics(c *gin.Context) {
	userID := c.Param("user_id")

	db := config.DB()

	var analytics []entity.Analytics
	if err := db.Where("user_id = ?", userID).
		Preload("User").
		Order("visit_time DESC").
		Limit(100).
		Find(&analytics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch analytics"})
		return
	}

	var summary entity.UserAnalyticsSummary
	if err := db.Where("user_id = ?", userID).First(&summary).Error; err != nil {
		// ถ้าไม่มี summary ให้สร้างใหม่
		summary = entity.UserAnalyticsSummary{
			UserID: uint(parseUint(userID)),
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"analytics": analytics,
		"summary":   summary,
	})
}

// GET /analytics/page/:page_path
func GetPageAnalytics(c *gin.Context) {
	pagePath := c.Param("page_path")

	db := config.DB()

	var pageAnalytics entity.PageAnalytics
	if err := db.Where("page_path = ?", pagePath).First(&pageAnalytics).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Page analytics not found"})
		return
	}

	// ดึงข้อมูลการเยี่ยมชมล่าสุดของหน้านี้
	var recentVisits []entity.Analytics
	if err := db.Where("page_path = ?", pagePath).
		Preload("User").
		Order("visit_time DESC").
		Limit(50).
		Find(&recentVisits).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recent visits"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"page_analytics": pageAnalytics,
		"recent_visits":  recentVisits,
	})
}

// GET /analytics/system
func GetSystemAnalytics(c *gin.Context) {
	db := config.DB()

	// สถิติโดยรวม
	var totalUsers int64
	var totalVisits int64
	var totalPages int64

	db.Model(&entity.User{}).Count(&totalUsers)
	db.Model(&entity.Analytics{}).Count(&totalVisits)
	db.Model(&entity.PageAnalytics{}).Count(&totalPages)

	// หน้าที่ได้รับความนิยมมากที่สุด - รวมหน้าทั้งหมดที่ track
	keyPages := []string{"/", "/booking-room", "/maintenance/create-maintenance-request", "/create-maintenance-request", "/my-account", "/news", "/create-service-area-request"}
	var popularPages []entity.PageAnalytics
	if err := db.Where("page_path IN ?", keyPages).
		Order("total_visits DESC").
		Limit(10).
		Find(&popularPages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch popular pages"})
		return
	}

	// ผู้ใช้ที่ใช้งานมากที่สุด
	var activeUsers []entity.UserAnalyticsSummary
	if err := db.Order("total_visits DESC").Limit(10).Find(&activeUsers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch active users"})
		return
	}

	// สร้าง system analytics data จากข้อมูลที่มีอยู่
	systemAnalytics := entity.SystemAnalytics{
		Date:           time.Now(),
		TotalUsers:     int(totalUsers),
		ActiveUsers:    int(totalUsers), // ใช้ total users เป็น active users ชั่วคราว
		TotalVisits:    int(totalVisits),
		TotalPages:     int(totalPages),
		AverageSession: 0.0,                         // จะคำนวณในภายหลัง
		PeakHour:       0,                           // จะคำนวณในภายหลัง
		PeakDay:        time.Now().Format("Monday"), // วันปัจจุบัน
	}

	c.JSON(http.StatusOK, gin.H{
		"system_analytics": systemAnalytics,
		"total_users":      totalUsers,
		"total_visits":     totalVisits,
		"total_pages":      totalPages,
		"popular_pages":    popularPages,
		"active_users":     activeUsers,
	})
}

// GET /analytics/dashboard
func GetAnalyticsDashboard(c *gin.Context) {
	db := config.DB()

	// สถิติวันนี้
	today := time.Now().Truncate(24 * time.Hour)
	var todayVisits int64
	db.Model(&entity.Analytics{}).Where("visit_time >= ?", today).Count(&todayVisits)

	// สถิติสัปดาห์นี้
	weekAgo := time.Now().AddDate(0, 0, -7)
	var weekVisits int64
	db.Model(&entity.Analytics{}).Where("visit_time >= ?", weekAgo).Count(&weekVisits)

	// สถิติเดือนนี้
	monthAgo := time.Now().AddDate(0, -1, 0)
	var monthVisits int64
	db.Model(&entity.Analytics{}).Where("visit_time >= ?", monthAgo).Count(&monthVisits)

	// หน้าที่ได้รับความนิยมวันนี้ - รวมหน้าทั้งหมดที่ track
	keyPages := []string{"/", "/booking-room", "/maintenance/create-maintenance-request", "/create-maintenance-request", "/my-account", "/news", "/create-service-area-request"}
	var todayPopularPages []entity.PageAnalytics
	if err := db.Where("last_updated >= ? AND page_path IN ?", today, keyPages).
		Order("total_visits DESC").
		Limit(5).
		Find(&todayPopularPages).Error; err != nil {
		// ถ้าไม่มีข้อมูล ให้ส่ง array ว่าง
		todayPopularPages = []entity.PageAnalytics{}
	}

	// ผู้ใช้ที่ใช้งานมากที่สุดวันนี้
	var todayActiveUsers []entity.UserAnalyticsSummary
	if err := db.Where("updated_at >= ?", today).
		Order("total_visits DESC").
		Limit(5).
		Find(&todayActiveUsers).Error; err != nil {
		// ถ้าไม่มีข้อมูล ให้ส่ง array ว่าง
		todayActiveUsers = []entity.UserAnalyticsSummary{}
	}

	c.JSON(http.StatusOK, gin.H{
		"today_visits":        todayVisits,
		"week_visits":         weekVisits,
		"month_visits":        monthVisits,
		"popular_pages_today": todayPopularPages,
		"active_users_today":  todayActiveUsers,
	})
}

// GET /analytics/visits-range?start=YYYY-MM-DD&end=YYYY-MM-DD
func GetVisitsRange(c *gin.Context) {
	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end query params are required (YYYY-MM-DD)"})
		return
	}

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}
	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	if end.After(today) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End date cannot be in the future"})
		return
	}
	if end.Before(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End date must be after start date"})
		return
	}

	db := config.DB()
	results := []struct {
		Date        string
		TotalVisits int64
	}{}

	// Query: group by date, count visits per day
	db.Model(&entity.Analytics{}).
		Select("DATE(visit_time) as date, COUNT(*) as total_visits").
		Where("visit_time >= ? AND visit_time <= ?", start, end.Add(24*time.Hour-1)).
		Group("DATE(visit_time)").
		Order("date").
		Scan(&results)

	// Build a map for fast lookup
	visitMap := map[string]int64{}
	for _, r := range results {
		visitMap[r.Date] = r.TotalVisits
	}

	// Build full array for each day in range
	days := int(end.Sub(start).Hours()/24) + 1
	output := []gin.H{}
	for i := 0; i < days; i++ {
		date := start.AddDate(0, 0, i).Format("2006-01-02")
		output = append(output, gin.H{
			"date":         date,
			"total_visits": visitMap[date],
		})
	}

	c.JSON(http.StatusOK, output)
}

// GET /analytics/popular-pages-by-period?period=today|week|month|year
func GetPopularPagesByPeriod(c *gin.Context) {
	period := c.Query("period")

	// Validate period parameter
	validPeriods := map[string]bool{"today": true, "week": true, "month": true, "year": true}
	if !validPeriods[period] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid period. Use: today, week, month, year"})
		return
	}

	db := config.DB()

	// Calculate date range based on period
	var startDate time.Time
	today := time.Now().Truncate(24 * time.Hour)

	switch period {
	case "today":
		startDate = today
	case "week":
		startDate = today.AddDate(0, 0, -7)
	case "month":
		startDate = today.AddDate(0, -1, 0)
	case "year":
		startDate = today.AddDate(-1, 0, 0)
	}

	// Key pages to track - รวมหน้าทั้งหมดที่ track
	keyPages := []string{"/", "/booking-room", "/maintenance/create-maintenance-request", "/create-maintenance-request", "/my-account", "/news", "/create-service-area-request"}

	// Get total visits for the period
	var totalVisits int64
	db.Model(&entity.Analytics{}).
		Where("visit_time >= ? AND visit_time <= ?", startDate, today.Add(24*time.Hour-1)).
		Count(&totalVisits)

	// Get visits by page type for the period
	results := []struct {
		PagePath string
		Count    int64
	}{}

	db.Model(&entity.Analytics{}).
		Select("page_path, COUNT(*) as count").
		Where("visit_time >= ? AND visit_time <= ? AND page_path IN ?", startDate, today.Add(24*time.Hour-1), keyPages).
		Group("page_path").
		Scan(&results)

	// Add page-specific data
	pageData := make(map[string]int64)
	for _, r := range results {
		pageData[r.PagePath] = r.Count
	}

	// Get data for all tracked pages
	homeVisits := pageData["/"]
	bookingVisits := pageData["/booking-room"]
	maintenanceVisits := pageData["/maintenance/create-maintenance-request"]
	createMaintenanceVisits := pageData["/create-maintenance-request"]
	myAccountVisits := pageData["/my-account"]
	newsVisits := pageData["/news"]
	createServiceAreaVisits := pageData["/create-service-area-request"]

	// Calculate total from all tracked pages
	totalFromPages := homeVisits + bookingVisits + maintenanceVisits + createMaintenanceVisits + myAccountVisits + newsVisits + createServiceAreaVisits

	// Build response data with all tracked pages
	response := gin.H{
		"period":       period,
		"total_visits": totalFromPages,
		"data": []gin.H{
			{
				"name":   "Home",
				"visits": homeVisits,
				"color":  "#4caf50",
				"icon":   "home",
			},
			{
				"name":   "Booking Room",
				"visits": bookingVisits,
				"color":  "#ff9800",
				"icon":   "booking",
			},
			{
				"name":   "Maintenance",
				"visits": maintenanceVisits,
				"color":  "#9c27b0",
				"icon":   "maintenance",
			},
			{
				"name":   "Create Maintenance",
				"visits": createMaintenanceVisits,
				"color":  "#e91e63",
				"icon":   "maintenance",
			},
			{
				"name":   "My Account",
				"visits": myAccountVisits,
				"color":  "#2196f3",
				"icon":   "account",
			},
			{
				"name":   "News",
				"visits": newsVisits,
				"color":  "#ff5722",
				"icon":   "news",
			},
			{
				"name":   "Create Service Area",
				"visits": createServiceAreaVisits,
				"color":  "#795548",
				"icon":   "service",
			},
		},
	}

	c.JSON(http.StatusOK, response)
}

// GET /analytics/performance?start=YYYY-MM-DD&end=YYYY-MM-DD
func GetPerformanceAnalytics(c *gin.Context) {
	startStr := c.Query("start")
	endStr := c.Query("end")

	if startStr == "" || endStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "start and end query params are required (YYYY-MM-DD)"})
		return
	}

	start, err := time.Parse("2006-01-02", startStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start date format. Use YYYY-MM-DD"})
		return
	}
	end, err := time.Parse("2006-01-02", endStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end date format. Use YYYY-MM-DD"})
		return
	}

	today := time.Now().Truncate(24 * time.Hour)
	if end.After(today) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End date cannot be in the future"})
		return
	}
	if end.Before(start) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "End date must be after start date"})
		return
	}

	db := config.DB()

	// Key pages to track - รวมหน้าทั้งหมดที่ track
	keyPages := []string{"/", "/booking-room", "/maintenance/create-maintenance-request", "/create-maintenance-request", "/my-account", "/news", "/create-service-area-request"}

	// Page Performance (aggregate from Analytics table)
	type PagePerformance struct {
		PagePath        string  `json:"page_path"`
		PageName        string  `json:"page_name"`
		TotalVisits     int64   `json:"total_visits"`
		UniqueVisitors  int64   `json:"unique_visitors"`
		AverageDuration float64 `json:"average_duration"`
		EngagementScore float64 `json:"engagement_score"`
	}
	var pagePerformance []PagePerformance
	// Get raw data for engagement score calculation
	var rawData []struct {
		PagePath            string  `json:"page_path"`
		PageName            string  `json:"page_name"`
		TotalVisits         int64   `json:"total_visits"`
		UniqueVisitors      int64   `json:"unique_visitors"`
		AverageDuration     float64 `json:"average_duration"`
		AverageInteractions float64 `json:"average_interactions"`
	}
	db.Model(&entity.Analytics{}).
		Select("page_path, page_name, COUNT(*) as total_visits, COUNT(DISTINCT user_id) as unique_visitors, AVG(duration) as average_duration, AVG(interaction_count) as average_interactions").
		Where("page_path IN ? AND visit_time >= ? AND visit_time <= ?", keyPages, start, end.Add(24*time.Hour-1)).
		Group("page_path, page_name").
		Order("total_visits DESC").
		Scan(&rawData)

	// Calculate engagement score for each page
	for _, data := range rawData {
		// Engagement Score calculation
		durationWeight := 0.6
		interactionWeight := 0.4
		maxDuration := 600.0
		maxInteractions := 50.0

		durationScore := (data.AverageDuration / maxDuration) * durationWeight
		interactionScore := (data.AverageInteractions / maxInteractions) * interactionWeight

		engagementScore := (durationScore + interactionScore) * 100
		if engagementScore > 100 {
			engagementScore = 100
		}

		pagePerformance = append(pagePerformance, PagePerformance{
			PagePath:        data.PagePath,
			PageName:        data.PageName,
			TotalVisits:     data.TotalVisits,
			UniqueVisitors:  data.UniqueVisitors,
			AverageDuration: data.AverageDuration,
			EngagementScore: engagementScore,
		})
	}

	// Time slots (09:00-11:00, ... 21:00-23:00, Other)
	type TimeSlot struct {
		Slot   string `json:"slot"`
		Visits int64  `json:"visits"`
	}
	timeSlots := []struct {
		Start int
		End   int
		Label string
	}{
		{9, 11, "09:00-11:00"},
		{11, 13, "11:00-13:00"},
		{13, 15, "13:00-15:00"},
		{15, 17, "15:00-17:00"},
		{17, 19, "17:00-19:00"},
		{19, 21, "19:00-21:00"},
		{21, 23, "21:00-23:00"},
	}
	var timeSlotResults []TimeSlot
	for _, slot := range timeSlots {
		var count int64
		db.Model(&entity.Analytics{}).
			Where("visit_time >= ? AND visit_time <= ? AND CAST(strftime('%H', datetime(visit_time, '+7 hours')) AS INTEGER) >= ? AND CAST(strftime('%H', datetime(visit_time, '+7 hours')) AS INTEGER) < ?", start, end.Add(24*time.Hour-1), slot.Start, slot.End).
			Count(&count)
		timeSlotResults = append(timeSlotResults, TimeSlot{Slot: slot.Label, Visits: count})
	}
	// Other (before 9:00 or after 23:00)
	var otherCount int64
	db.Model(&entity.Analytics{}).
		Where("visit_time >= ? AND visit_time <= ? AND (CAST(strftime('%H', datetime(visit_time, '+7 hours')) AS INTEGER) < 9 OR CAST(strftime('%H', datetime(visit_time, '+7 hours')) AS INTEGER) >= 23)", start, end.Add(24*time.Hour-1)).
		Count(&otherCount)
	timeSlotResults = append(timeSlotResults, TimeSlot{Slot: "Other", Visits: otherCount})

	// Session Duration Distribution
	type DurationSlot struct {
		Range      string  `json:"range"`
		Count      int64   `json:"count"`
		Percentage float64 `json:"percentage"`
	}
	durationRanges := []struct {
		Label string
		Min   int
		Max   int // exclusive
	}{
		{"0-30s", 0, 30},
		{"30s-2m", 30, 120},
		{"2m-5m", 120, 300},
		{"5m-10m", 300, 600},
		{"10m+", 600, 1000000},
	}
	var totalSessions int64
	db.Model(&entity.Analytics{}).
		Where("visit_time >= ? AND visit_time <= ?", start, end.Add(24*time.Hour-1)).
		Count(&totalSessions)
	var durationResults []DurationSlot
	for _, dr := range durationRanges {
		var count int64
		db.Model(&entity.Analytics{}).
			Where("visit_time >= ? AND visit_time <= ? AND duration >= ? AND duration < ?", start, end.Add(24*time.Hour-1), dr.Min, dr.Max).
			Count(&count)
		percent := 0.0
		if totalSessions > 0 {
			percent = float64(count) * 100.0 / float64(totalSessions)
		}
		durationResults = append(durationResults, DurationSlot{Range: dr.Label, Count: count, Percentage: percent})
	}

	// Peak hour (timezone +7)
	peakHoursResult := []struct {
		Hour  int   `json:"hour"`
		Count int64 `json:"count"`
	}{}
	db.Model(&entity.Analytics{}).
		Select("CAST(strftime('%H', datetime(visit_time, '+7 hours')) AS INTEGER) as hour, COUNT(*) as count").
		Where("visit_time >= ? AND visit_time <= ?", start, end.Add(24*time.Hour-1)).
		Group("hour").
		Order("count DESC").
		Limit(1).
		Scan(&peakHoursResult)
	var peakHour int
	var peakHourVisits int64
	if len(peakHoursResult) > 0 {
		peakHour = peakHoursResult[0].Hour
		peakHourVisits = peakHoursResult[0].Count
	}

	// Peak day
	peakDayResult := []struct {
		Day   string `json:"day"`
		Count int64  `json:"count"`
	}{}
	db.Model(&entity.Analytics{}).
		Select("strftime('%w', visit_time) as day, COUNT(*) as count").
		Where("visit_time >= ? AND visit_time <= ?", start, end.Add(24*time.Hour-1)).
		Group("day").
		Order("count DESC").
		Limit(1).
		Scan(&peakDayResult)
	var peakDay string
	var peakDayVisits int64
	if len(peakDayResult) > 0 {
		dayNum := peakDayResult[0].Day
		peakDayVisits = peakDayResult[0].Count
		dayNames := []string{"Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"}
		if dayNumInt, err := strconv.Atoi(dayNum); err == nil && dayNumInt >= 0 && dayNumInt < 7 {
			peakDay = dayNames[dayNumInt]
		} else {
			peakDay = "Unknown"
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"page_performance":              pagePerformance,
		"time_slots":                    timeSlotResults,
		"session_duration_distribution": durationResults,
		"peak_hour": gin.H{
			"hour":   peakHour,
			"visits": peakHourVisits,
		},
		"peak_day": gin.H{
			"day":    peakDay,
			"visits": peakDayVisits,
		},
		"date_range": gin.H{
			"start": start.Format("2006-01-02"),
			"end":   end.Format("2006-01-02"),
		},
	})
}

// Helper functions
func updateUserAnalyticsSummary(userID uint) {
	db := config.DB()

	var analytics []entity.Analytics
	if err := db.Where("user_id = ?", userID).Find(&analytics).Error; err != nil {
		return
	}

	// คำนวณสถิติ
	totalVisits := len(analytics)
	uniquePages := make(map[string]bool)
	var totalDuration int
	var lastVisit time.Time
	pageCounts := make(map[string]int)

	for _, a := range analytics {
		uniquePages[a.PagePath] = true
		totalDuration += a.Duration
		if a.VisitTime.After(lastVisit) {
			lastVisit = a.VisitTime
		}
		pageCounts[a.PagePath]++
	}

	// หาหน้าที่เยี่ยมชมมากที่สุด
	var mostVisitedPage string
	maxCount := 0
	for page, count := range pageCounts {
		if count > maxCount {
			maxCount = count
			mostVisitedPage = page
		}
	}

	// คำนวณ bounce rate และ returning rate
	bounceCount := 0
	returningCount := 0
	for _, a := range analytics {
		if a.IsBounce {
			bounceCount++
		}
		if a.IsReturning {
			returningCount++
		}
	}

	bounceRate := 0.0
	returningRate := 0.0
	if totalVisits > 0 {
		bounceRate = float64(bounceCount) / float64(totalVisits) * 100
		returningRate = float64(returningCount) / float64(totalVisits) * 100
	}

	averageDuration := 0.0
	if totalVisits > 0 {
		averageDuration = float64(totalDuration) / float64(totalVisits)
	}

	// อัปเดตหรือสร้าง UserAnalyticsSummary
	var summary entity.UserAnalyticsSummary
	if err := db.Where("user_id = ?", userID).First(&summary).Error; err != nil {
		// สร้างใหม่
		summary = entity.UserAnalyticsSummary{
			UserID:          userID,
			TotalVisits:     totalVisits,
			UniquePages:     len(uniquePages),
			TotalDuration:   totalDuration,
			LastVisit:       lastVisit,
			MostVisitedPage: mostVisitedPage,
			AverageDuration: averageDuration,
			BounceRate:      bounceRate,
			ReturningRate:   returningRate,
			UpdatedAt:       time.Now(),
		}
		db.Create(&summary)
	} else {
		// อัปเดต
		summary.TotalVisits = totalVisits
		summary.UniquePages = len(uniquePages)
		summary.TotalDuration = totalDuration
		summary.LastVisit = lastVisit
		summary.MostVisitedPage = mostVisitedPage
		summary.AverageDuration = averageDuration
		summary.BounceRate = bounceRate
		summary.ReturningRate = returningRate
		summary.UpdatedAt = time.Now()
		db.Save(&summary)
	}
}

func updatePageAnalytics(pagePath, pageName string) {
	db := config.DB()

	var analytics []entity.Analytics
	if err := db.Where("page_path = ?", pagePath).Find(&analytics).Error; err != nil {
		return
	}

	totalVisits := len(analytics)
	uniqueVisitors := make(map[uint]bool)
	var totalDuration int
	var totalInteractions int
	bounceCount := 0

	for _, a := range analytics {
		uniqueVisitors[a.UserID] = true
		totalDuration += a.Duration
		totalInteractions += a.InteractionCount
		if a.IsBounce {
			bounceCount++
		}
	}

	averageDuration := 0.0
	averageInteractions := 0.0
	bounceRate := 0.0
	if totalVisits > 0 {
		averageDuration = float64(totalDuration) / float64(totalVisits)
		averageInteractions = float64(totalInteractions) / float64(totalVisits)
		bounceRate = float64(bounceCount) / float64(totalVisits) * 100
	}

	// คำนวณ Engagement Score (0-100)
	// Formula: (duration_weight * avg_duration + interaction_weight * avg_interactions) / max_score * 100
	// duration_weight = 0.6, interaction_weight = 0.4
	// max_duration = 600 seconds (10 minutes), max_interactions = 50
	durationWeight := 0.6
	interactionWeight := 0.4
	maxDuration := 600.0
	maxInteractions := 50.0

	durationScore := (averageDuration / maxDuration) * durationWeight
	interactionScore := (averageInteractions / maxInteractions) * interactionWeight

	engagementScore := (durationScore + interactionScore) * 100
	if engagementScore > 100 {
		engagementScore = 100
	}

	// อัปเดตหรือสร้าง PageAnalytics
	var pageAnalytics entity.PageAnalytics
	if err := db.Where("page_path = ?", pagePath).First(&pageAnalytics).Error; err != nil {
		// สร้างใหม่
		pageAnalytics = entity.PageAnalytics{
			PagePath:            pagePath,
			PageName:            pageName,
			TotalVisits:         totalVisits,
			UniqueVisitors:      len(uniqueVisitors),
			AverageDuration:     averageDuration,
			BounceRate:          bounceRate,
			EngagementScore:     engagementScore,
			AverageInteractions: averageInteractions,
			LastUpdated:         time.Now(),
		}
		db.Create(&pageAnalytics)
	} else {
		// อัปเดต
		pageAnalytics.TotalVisits = totalVisits
		pageAnalytics.UniqueVisitors = len(uniqueVisitors)
		pageAnalytics.AverageDuration = averageDuration
		pageAnalytics.BounceRate = bounceRate
		pageAnalytics.EngagementScore = engagementScore
		pageAnalytics.AverageInteractions = averageInteractions
		pageAnalytics.LastUpdated = time.Now()
		db.Save(&pageAnalytics)
	}
}

func parseUint(s string) uint64 {
	if i, err := strconv.ParseUint(s, 10, 32); err == nil {
		return i
	}
	return 0
}
