package controller

import (
	"bytes"
	"fmt"
	"io/ioutil"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// GetCollaborationPlansByRequestID ดึงข้อมูล Collaboration Plans ตาม RequestServiceAreaID
func GetCollaborationPlansByRequestID(c *gin.Context) {
	requestIDStr := c.Query("request_service_area_id")
	if requestIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "request_service_area_id is required"})
		return
	}

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	var collaborationPlans []entity.CollaborationPlan
	if err := config.DB().Where("request_service_area_id = ?", uint(requestID)).Find(&collaborationPlans).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch collaboration plans"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": collaborationPlans,
	})
}

// CollaborationPlanRequest struct สำหรับรับข้อมูลจาก frontend
type CollaborationPlanRequest struct {
	ID                  *uint   `json:"ID"`
	CollaborationPlan   string  `json:"CollaborationPlan" binding:"required"`
	CollaborationBudget float64 `json:"CollaborationBudget" binding:"required"`
	ProjectStartDate    string  `json:"ProjectStartDate" binding:"required"`
}

// UpdateCollaborationPlans อัปเดต Collaboration Plans สำหรับ RequestServiceAreaID
func UpdateCollaborationPlans(c *gin.Context) {
	// Debug: Print raw request body
	body, _ := c.GetRawData()
	fmt.Printf("Raw request body: %s\n", string(body))

	// Reset body for binding
	c.Request.Body = ioutil.NopCloser(bytes.NewBuffer(body))

	var request struct {
		RequestServiceAreaID uint                       `json:"request_service_area_id" binding:"required"`
		CollaborationPlans   []CollaborationPlanRequest `json:"collaboration_plans" binding:"required"`
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		fmt.Printf("Binding error: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	fmt.Printf("Parsed request: %+v\n", request)

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ลบ CollaborationPlans เดิม
	if err := tx.Where("request_service_area_id = ?", request.RequestServiceAreaID).Delete(&entity.CollaborationPlan{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing collaboration plans"})
		return
	}

	// สร้าง CollaborationPlans ใหม่
	for _, planReq := range request.CollaborationPlans {
		// แปลง string เป็น time.Time
		projectStartDate, err := time.Parse("2006-01-02", planReq.ProjectStartDate)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Expected YYYY-MM-DD"})
			return
		}

		plan := entity.CollaborationPlan{
			RequestServiceAreaID: request.RequestServiceAreaID,
			CollaborationPlan:    planReq.CollaborationPlan,
			CollaborationBudget:  planReq.CollaborationBudget,
			ProjectStartDate:     projectStartDate,
		}

		if err := tx.Create(&plan).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create collaboration plan"})
			return
		}
	}

	// commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update collaboration plans"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Collaboration plans updated successfully",
		"data":    request.CollaborationPlans,
	})
}
