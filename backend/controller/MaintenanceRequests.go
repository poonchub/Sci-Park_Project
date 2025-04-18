package controller

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
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
	results := db.Preload("User").Preload("Room.Floor").Preload(("Room.RoomType")).Preload("RequestStatus").Preload("Area").Preload("MaintenanceType").Preload("ManagerApproval.User").Preload("MaintenanceTask.User").Preload("MaintenanceTask.HandoverImages").Preload("MaintenanceTask.RequestStatus").Preload("MaintenanceImages").First(&request, ID)
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

	var RequestStatusID = 1
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

// GET /maintenance-requests-option
func GetMaintenanceRequests(c *gin.Context) {
	// รับค่าจาก Query Parameters
	statusID, _ := strconv.Atoi(c.DefaultQuery("status", "0"))
	maintenanceTypeID, _ := strconv.Atoi(c.DefaultQuery("maintenanceType", "0"))
	createdAt := c.DefaultQuery("createdAt", "") // รูปแบบ YYYY-MM-DD

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	// ตรวจสอบค่าที่ส่งมา
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// ดึงข้อมูลแบบมีเงื่อนไข
	var maintenanceRequests []entity.MaintenanceRequest
	db := config.DB()

	if statusID > 0 {
		db = db.Where("request_status_id = ?", statusID)
	}

	if maintenanceTypeID > 0 {
		db = db.Where("maintenance_type_id = ?", maintenanceTypeID)
	}

	var startOfDay time.Time
	var endOfDay time.Time

	// คำนวณเวลาเริ่มต้นและสิ้นสุดของวันที่ที่ต้องการค้นหา
	if createdAt != "" {
		loc, _ := time.LoadLocation("Asia/Bangkok")

		if len(createdAt) == 10 {
			// Format: YYYY-MM-DD
			parsedTime, err := time.ParseInLocation("2006-01-02", createdAt, loc)
			if err != nil {
				fmt.Println("Error parsing date:", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
				return
			}

			startOfDay = parsedTime
			endOfDay = parsedTime.Add(24 * time.Hour).Add(-time.Second)

		} else if len(createdAt) == 7 {
			// Format: YYYY-MM → filter ทั้งเดือน
			parsedTime, err := time.ParseInLocation("2006-01", createdAt, loc)
			if err != nil {
				fmt.Println("Error parsing month:", err)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid month format"})
				return
			}

			// เริ่มต้นวันที่ 1 ของเดือนนั้น
			startOfDay = time.Date(parsedTime.Year(), parsedTime.Month(), 1, 0, 0, 0, 0, loc)

			// คำนวณวันสุดท้ายของเดือนนั้น
			endOfDay = startOfDay.AddDate(0, 1, 0).Add(-time.Second)

		} else {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date string length"})
			return
		}

		// Apply to query
		db = db.Where("created_at >= ? AND created_at <= ?", startOfDay, endOfDay)
	}

	// ✅ ใช้ Preload() เพื่อโหลดข้อมูลสัมพันธ์
	query := db.Preload("User").Preload("Room.Floor").Preload("Room.RoomType").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType")

	// ✅ ใช้ Find() ร่วมกับ Limit() และ Offset()
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&maintenanceRequests).Error; err != nil {
		fmt.Println("Error:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
		return
	}

	// ✅ นับจำนวนทั้งหมดแยกออกจาก Query หลัก
	var total int64
	countQuery := config.DB().Model(&entity.MaintenanceRequest{})

	if statusID > 0 {
		countQuery = countQuery.Where("request_status_id = ?", statusID)
	}

	if maintenanceTypeID > 0 {
		countQuery = countQuery.Where("maintenance_type_id = ?", maintenanceTypeID)
	}

	if createdAt != "" {
		countQuery = countQuery.Where("created_at >= ? AND created_at <= ?", startOfDay, endOfDay)
	}

	countQuery.Count(&total)

	var statusCounts []struct {
		StatusID   uint   `json:"status_id"`
		StatusName string `json:"status_name"`
		Count      int    `json:"count"`
	}

	// สร้าง JOIN clause แบบ dynamic เพื่อใช้ใน LEFT JOIN
	joinClause := `
		LEFT JOIN maintenance_requests
		ON maintenance_requests.request_status_id = request_statuses.id
	`

	if maintenanceTypeID > 0 {
		joinClause += fmt.Sprintf(" AND maintenance_requests.maintenance_type_id = %d", maintenanceTypeID)
	}
	if createdAt != "" {
		joinClause += fmt.Sprintf(
			" AND maintenance_requests.created_at >= '%s' AND maintenance_requests.created_at <= '%s'",
			startOfDay.Format("2006-01-02 15:04:05"),
			endOfDay.Format("2006-01-02 15:04:05"),
		)
	}

	statusCountQuery := config.DB().Table("request_statuses").
		Select(`
			request_statuses.id as status_id,
			request_statuses.name as status_name,
			COALESCE(COUNT(maintenance_requests.id), 0) as count
		`).
		Joins(joinClause).
		Group("request_statuses.id, request_statuses.name")

	statusCountQuery.Scan(&statusCounts)

	// ✅ ส่ง JSON Response
	c.JSON(http.StatusOK, gin.H{
		"data":         maintenanceRequests,
		"page":         page,
		"limit":        limit,
		"total":        total,
		"totalPages":   (total + int64(limit) - 1) / int64(limit), // คำนวณจำนวนหน้าทั้งหมด
		"statusCounts": statusCounts,
	})
}
