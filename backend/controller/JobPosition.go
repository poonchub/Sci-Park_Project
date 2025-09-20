package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
)

// ListJobPositions แสดงรายการตำแหน่งงานทั้งหมด
func ListJobPositions(c *gin.Context) {
	var jobPositions []entity.JobPosition

	if err := config.DB().Find(&jobPositions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job positions"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   jobPositions,
	})
}

// GetJobPositionByID แสดงตำแหน่งงานตาม ID
func GetJobPositionByID(c *gin.Context) {
	id := c.Param("id")
	var jobPosition entity.JobPosition

	if err := config.DB().First(&jobPosition, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job position not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   jobPosition,
	})
}

// CreateJobPosition สร้างตำแหน่งงานใหม่
func CreateJobPosition(c *gin.Context) {
	var jobPosition entity.JobPosition

	if err := c.ShouldBindJSON(&jobPosition); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate job position data using govalidator
	ok, err := govalidator.ValidateStruct(jobPosition)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"details": err.Error(),
		})
		return
	}

	if err := config.DB().Create(&jobPosition).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job position"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Job position created successfully",
		"data":    jobPosition,
	})
}

// UpdateJobPositionByID อัปเดตตำแหน่งงานตาม ID
func UpdateJobPositionByID(c *gin.Context) {
	id := c.Param("id")
	var jobPosition entity.JobPosition

	// ตรวจสอบว่าตำแหน่งงานมีอยู่หรือไม่
	if err := config.DB().First(&jobPosition, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job position not found"})
		return
	}

	// รับข้อมูลใหม่
	if err := c.ShouldBindJSON(&jobPosition); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Validate job position data using govalidator
	ok, err := govalidator.ValidateStruct(jobPosition)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Validation failed",
			"details": err.Error(),
		})
		return
	}

	// อัปเดตข้อมูล
	if err := config.DB().Save(&jobPosition).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Job position updated successfully",
		"data":    jobPosition,
	})
}

// DeleteJobPositionByID ลบตำแหน่งงานตาม ID
func DeleteJobPositionByID(c *gin.Context) {
	id := c.Param("id")
	var jobPosition entity.JobPosition

	// ตรวจสอบว่าตำแหน่งงานมีอยู่หรือไม่
	if err := config.DB().First(&jobPosition, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job position not found"})
		return
	}

	// ตรวจสอบว่ามีผู้ใช้ใช้ตำแหน่งงานนี้อยู่หรือไม่
	var userCount int64
	if err := config.DB().Model(&entity.User{}).Where("job_position_id = ?", id).Count(&userCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check job position usage"})
		return
	}

	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete job position that is currently in use"})
		return
	}

	// ลบตำแหน่งงาน
	if err := config.DB().Delete(&jobPosition).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Job position deleted successfully",
	})
}
