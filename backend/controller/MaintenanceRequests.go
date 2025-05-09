package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /maintenance-requests
func ListMaintenanceRequests(c *gin.Context) {
	var request []entity.MaintenanceRequest

	db := config.DB()

	results := db.Preload("User").Preload("Room.Floor").Preload("Room.RoomType").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType").Find(&request)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &request)
}

// GET /maintenance-request/:id
func GetMaintenanceRequestByID(c *gin.Context) {
	ID := c.Param("id")
	var request entity.MaintenanceRequest

	db := config.DB()
	results := db.
		Preload("User").
		Preload("Room.Floor").
		Preload("Room.RoomType").
		Preload("RequestStatus").
		Preload("Area").
		Preload("MaintenanceType").
		Preload("ManagerApproval.User").
		Preload("MaintenanceTask.User").
		Preload("MaintenanceTask.HandoverImages").
		Preload("MaintenanceTask.RequestStatus").
		Preload("MaintenanceImages").
		Preload("Inspection.User").
		First(&request, ID)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	if request.ID == 0 {
		c.JSON(http.StatusNoContent, gin.H{})
		return
	}
	c.JSON(http.StatusOK, request)
}

// GET /maintenance-request-user/:id
func GetMaintenanceRequestByUserID(c *gin.Context) {
	userID := c.Param("id")
	var requests []entity.MaintenanceRequest

	db := config.DB()
	results := db.
		Preload("User").
		Preload("Room.Floor").
		Preload("Room.RoomType").
		Preload("RequestStatus").
		Preload("Area").
		Preload("MaintenanceType").
		Preload("ManagerApproval.User").
		Preload("MaintenanceTask.User").
		Preload("MaintenanceTask.HandoverImages").
		Preload("MaintenanceTask.RequestStatus").
		Preload("MaintenanceImages").
		Preload("Inspection").
		Where("user_id = ?", userID).
		Find(&requests)

	if results.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": results.Error.Error()})
		return
	}

	if len(requests) == 0 {
		c.JSON(http.StatusNoContent, gin.H{})
		return
	}

	c.JSON(http.StatusOK, requests)
}

// POST /maintenance-request
func CreateMaintenanceRequest(c *gin.Context) {

	var request entity.MaintenanceRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&booking); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	db := config.DB()

	var user entity.User
	if err := db.First(&user, request.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var RequestStatusID = 2
	var status entity.RequestStatus
	if err := db.First(&status, RequestStatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
		return
	}

	var area entity.Area
	var room entity.Room
	if request.AreaID != 0 && request.RoomID != 0 {
		if err := db.First(&area, request.AreaID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "area not found"})
			return
		}
		if err := db.First(&room, request.RoomID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
			return
		}
	}

	rq := entity.MaintenanceRequest{
		AreaDetail:         request.AreaDetail,
		IsAnytimeAvailable: request.IsAnytimeAvailable,
		Description:        request.Description,
		StartTime:          request.StartTime,
		EndTime:            request.EndTime,
		OtherTypeDetail:    request.OtherTypeDetail,
		UserID:             request.UserID,
		RoomID:             request.RoomID,
		RequestStatusID:    uint(RequestStatusID),
		AreaID:             request.AreaID,
		MaintenanceTypeID:  request.MaintenanceTypeID,
	}

	if err := db.Create(&rq).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": rq})
}

// PATCH /maintenance-request/:id
func UpdateMaintenanceRequestByID(c *gin.Context) {
	ID := c.Param("id")

	var request entity.MaintenanceRequest

	db := config.DB()
	result := db.First(&request, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&request)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}

// DELETE /maintenance-request/:id
func DeleteMaintenanceRequestByID(c *gin.Context) {
	ID := c.Param("id")

	db := config.DB()

	var request entity.MaintenanceRequest
	if err := db.Where("booking_id = ?", ID).First(&request).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Maintenance request not found"})
		return
	}

	if err := db.Where("booking_id = ?", ID).Delete(&entity.MaintenanceRequest{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete Maintenance request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Maintenance request deleted successfully"})
}

// GET /maintenance-requests-option-for-user
func GetMaintenanceRequestsForUser(c *gin.Context) {
	db, start, end, err := buildBaseQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	page, limit, offset := getPagination(c)
	var maintenanceRequests []entity.MaintenanceRequest

	if err := db.
		Preload("User").
		Preload("Room.Floor").
		Preload("Room.RoomType").
		Preload("RequestStatus").
		Preload("Area").
		Preload("MaintenanceType").
		Order("maintenance_requests.created_at DESC").
		Limit(limit).Offset(offset).
		Find(&maintenanceRequests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	total := countMaintenanceRequests(db)
	userID, _ := strconv.Atoi(c.DefaultQuery("userId", "0"))

	c.JSON(http.StatusOK, gin.H{
		"data":         maintenanceRequests,
		"page":         page,
		"limit":        limit,
		"total":        total,
		"totalPages":   (total + int64(limit) - 1) / int64(limit),
		"statusCounts": fetchStatusCounts(start, end, userID, 0),
		"monthlyCounts":  fetchMonthlyCounts(start, end, userID, 0),
	})
}

// GET /maintenance-requests-option-for-admin
func GetMaintenanceRequestsForAdmin(c *gin.Context) {
	db, start, end, err := buildBaseQuery(c)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	page, limit, offset := getPagination(c)
	var maintenanceRequests []entity.MaintenanceRequest

	if err := db.
		Preload("User").
		Preload("Room.Floor").
		Preload("Room.RoomType").
		Preload("RequestStatus").
		Preload("Area").
		Preload("MaintenanceType").
		Order("maintenance_requests.created_at DESC").
		Limit(limit).Offset(offset).
		Find(&maintenanceRequests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	total := countMaintenanceRequests(db)
	userID, _ := strconv.Atoi(c.DefaultQuery("userId", "0"))
	maintenanceTypeID, _ := strconv.Atoi(c.DefaultQuery("maintenanceType", "0"))
	createdAt := c.DefaultQuery("createdAt", "")

	var counts interface{}
    if len(createdAt) == 7 { // If createdAt is in the format YYYY-MM
        counts = fetchDailyCounts(start, end, userID, maintenanceTypeID)
    } else {
        counts = fetchMonthlyCounts(start, end, userID, maintenanceTypeID)
    }

	c.JSON(http.StatusOK, gin.H{
		"data":         maintenanceRequests,
		"page":         page,
		"limit":        limit,
		"total":        total,
		"totalPages":   (total + int64(limit) - 1) / int64(limit),
		"statusCounts": fetchStatusCounts(start, end, userID, maintenanceTypeID),
		"counts":       counts,
	})
}

func parseDateRange(createdAt string) (start, end time.Time, err error) {
	if createdAt == "" {
		return
	}
	loc, _ := time.LoadLocation("Asia/Bangkok")
	switch len(createdAt) {
	case 10: // YYYY-MM-DD
		start, err = time.ParseInLocation("2006-01-02", createdAt, loc)
		end = start.Add(24*time.Hour - time.Second)
	case 7: // YYYY-MM
		start, err = time.ParseInLocation("2006-01", createdAt, loc)
		end = start.AddDate(0, 1, 0).Add(-time.Second)
	default:
		err = fmt.Errorf("invalid date string length")
	}
	return
}

func buildBaseQuery(c *gin.Context) (*gorm.DB, time.Time, time.Time, error) {
	db := config.DB()
	statusID, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	createdAt := c.DefaultQuery("createdAt", "")
	userID, _ := strconv.Atoi(c.DefaultQuery("userId", "0"))
	maintenanceTypeID, _ := strconv.Atoi(c.DefaultQuery("maintenanceType", "0"))
	requestType := c.DefaultQuery("requestType", "")

	var start, end time.Time
	var err error

	if createdAt != "" {
		start, end, err = parseDateRange(createdAt)
		if err != nil {
			return nil, start, end, err
		}
		db = db.Where("maintenance_requests.created_at BETWEEN ? AND ?", start, end)
	}

	if statusID > 0 {
		db = db.Where("request_status_id = ?", statusID)
	}
	if maintenanceTypeID > 0 {
		db = db.Where("maintenance_type_id = ?", maintenanceTypeID)
	}
	if userID > 0 {
		db = db.Where("user_id = ?", userID)
	}
	if requestType != "" {
		db = db.Joins("JOIN users ON users.id = maintenance_requests.user_id")
		if requestType == "Internal" {
			db = db.Where("users.is_employee = ?", true)
		} else if requestType == "External" {
			db = db.Where("users.is_employee = ?", false)
		}
	}

	return db, start, end, nil
}

func getPagination(c *gin.Context) (page, limit, offset int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}

	offset = (page - 1) * limit
	return
}

func countMaintenanceRequests(db *gorm.DB) int64 {
	var total int64
	db.Model(&entity.MaintenanceRequest{}).Count(&total)
	return total
}

func fetchStatusCounts(start, end time.Time, userID, maintenanceTypeID int) []struct {
	StatusID   uint   `json:"status_id"`
	StatusName string `json:"status_name"`
	Count      int    `json:"count"`
} {
	var statusCounts []struct {
		StatusID   uint   `json:"status_id"`
		StatusName string `json:"status_name"`
		Count      int    `json:"count"`
	}

	joinClause := `
		LEFT JOIN maintenance_requests 
		ON maintenance_requests.request_status_id = request_statuses.id
	`

	if !start.IsZero() && !end.IsZero() {
		joinClause += fmt.Sprintf(
			" AND maintenance_requests.created_at BETWEEN '%s' AND '%s'",
			start.Format("2006-01-02 15:04:05"),
			end.Format("2006-01-02 15:04:05"),
		)
	}
	if userID > 0 {
		joinClause += fmt.Sprintf(" AND maintenance_requests.user_id = %d", userID)
	}
	if maintenanceTypeID > 0 {
		joinClause += fmt.Sprintf(" AND maintenance_requests.maintenance_type_id = %d", maintenanceTypeID)
	}

	config.DB().Table("request_statuses").
		Select(`
			request_statuses.id as status_id,
			request_statuses.name as status_name,
			COALESCE(COUNT(maintenance_requests.id), 0) as count
		`).
		Joins(joinClause).
		Group("request_statuses.id, request_statuses.name").
		Scan(&statusCounts)

	return statusCounts
}

func fetchDailyCounts(start, end time.Time, userID, maintenanceTypeID int) []struct {
	Day   string `json:"day"`
	Count int    `json:"count"`
} {
	var dailyCounts []struct {
		Day   string `json:"day"`
		Count int    `json:"count"`
	}

	db := config.DB().Model(&entity.MaintenanceRequest{})

	if !start.IsZero() && !end.IsZero() {
		db = db.Where("created_at BETWEEN ? AND ?", start, end)
	}
	if userID > 0 {
		db = db.Where("user_id = ?", userID)
	}
	if maintenanceTypeID > 0 {
		db = db.Where("maintenance_type_id = ?", maintenanceTypeID)
	}

	db.Select(`
			STRFTIME('%Y-%m-%d', created_at) AS day,
			COUNT(id) AS count
		`).
		Group("day").
		Order("day ASC").
		Scan(&dailyCounts)

	return dailyCounts
}


func fetchMonthlyCounts(start, end time.Time, userID, maintenanceTypeID int) []struct {
	Month string `json:"month"`
	Count int    `json:"count"`
} {
	var monthlyCounts []struct {
		Month string `json:"month"`
		Count int    `json:"count"`
	}

	db := config.DB().Model(&entity.MaintenanceRequest{})

	if !start.IsZero() && !end.IsZero() {
		db = db.Where("created_at BETWEEN ? AND ?", start, end)
	}
	if userID > 0 {
		db = db.Where("user_id = ?", userID)
	}
	if maintenanceTypeID > 0 {
		db = db.Where("maintenance_type_id = ?", maintenanceTypeID)
	}

	db.Select(`
			STRFTIME('%Y-%m', created_at) AS month,
			COUNT(id) AS count
		`).
		Group("month").
		Order("month ASC").
		Scan(&monthlyCounts)

	return monthlyCounts
}
