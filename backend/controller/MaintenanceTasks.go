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

// POST /maintenance-task
func CreateMaintenanceTask(c *gin.Context) {

	var task entity.MaintenanceTask

	if err := c.ShouldBindJSON(&task); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&booking); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	db := config.DB()

	var user entity.User
	if err := db.First(&user, task.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var request entity.MaintenanceRequest
	if err := db.First(&request, task.RequestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance request not found"})
		return
	}

	var RequestStatusID = 4
	var status entity.RequestStatus
	if err := db.First(&status, RequestStatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
		return
	}

	tsk := entity.MaintenanceTask{
		Description: task.Description,
		UserID: task.UserID,
		RequestID: task.RequestID,
		RequestStatusID: uint(RequestStatusID),
	}

	if err := db.FirstOrCreate(&tsk, entity.MaintenanceTask{
		RequestID: task.RequestID,
	}).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": tsk})
}

// GET maintenance-tasks-option-id
func GetMaintenanceTasksByOperatorID(c *gin.Context) {
    // รับค่าจาก Query Parameters
    operatorID, _ := strconv.Atoi(c.DefaultQuery("operator", "0"))
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
    var maintenanceTasks []entity.MaintenanceTask
    db := config.DB()

    if operatorID > 0 {
        db = db.Where("user_id = ?", operatorID)
    }

    if maintenanceTypeID > 0 {
        db = db.Where("maintenance_type_id = ?", maintenanceTypeID)
    }

    var startOfDay time.Time
    var endOfDay time.Time

    // คำนวณเวลาเริ่มต้นและสิ้นสุดของวันที่ที่ต้องการค้นหา
    if createdAt != "" {
        // แปลงวันที่ที่รับมาให้เป็นเวลาที่เขตเวลา Asia/Bangkok
        loc, _ := time.LoadLocation("Asia/Bangkok")
        parsedTime, err := time.ParseInLocation("2006-01-02", createdAt, loc)
        if err != nil {
            fmt.Println("Error parsing time:", err)
            c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
            return
        }

        // กำหนดเวลาเริ่มต้น (00:00) และสิ้นสุด (23:59)
        startOfDay = parsedTime
        endOfDay = parsedTime.Add(24 * time.Hour).Add(-time.Second)

        // ใช้ timestamp สำหรับการเปรียบเทียบ
        db = db.Where("created_at >= ? AND created_at <= ?", startOfDay, endOfDay)
    }

    // ✅ ใช้ Preload() เพื่อโหลดข้อมูลสัมพันธ์
    query := db.Preload("User").Preload("Room.Floor").Preload("Room.RoomType").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType")

    // ✅ ใช้ Find() ร่วมกับ Limit() และ Offset()
    if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&maintenanceTasks).Error; err != nil {
        fmt.Println("Error:", err)
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้"})
        return
    }

    // ✅ นับจำนวนทั้งหมดแยกออกจาก Query หลัก
    var total int64
    countQuery := config.DB().Model(&entity.MaintenanceTask{})

    if operatorID > 0 {
        countQuery = countQuery.Where("user_id = ?", operatorID)
    }

    if maintenanceTypeID > 0 {
        countQuery = countQuery.Where("maintenance_type_id = ?", maintenanceTypeID)
    }

    if createdAt != "" {
        // ใช้ timestamp ในการนับจำนวน
        countQuery = countQuery.Where("created_at >= ? AND created_at <= ?", startOfDay, endOfDay)
    }

    countQuery.Count(&total)

    // ✅ ส่ง JSON Response
    c.JSON(http.StatusOK, gin.H{
        "data":       maintenanceTasks,
        "page":       page,
        "limit":      limit,
        "total":      total,
        "totalPages": (total + int64(limit) - 1) / int64(limit), // คำนวณจำนวนหน้าทั้งหมด
    })
}