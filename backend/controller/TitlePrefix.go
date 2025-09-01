package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
)

// ListTitlePrefixes แสดงรายการคำนำหน้าทั้งหมด
func ListTitlePrefixes(c *gin.Context) {
	var titlePrefixes []entity.TitlePrefix

	if err := config.DB().Find(&titlePrefixes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to fetch title prefixes",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   titlePrefixes,
	})
}

// GetTitlePrefixByID แสดงคำนำหน้าตาม ID
func GetTitlePrefixByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var titlePrefix entity.TitlePrefix

	if err := config.DB().First(&titlePrefix, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Title prefix not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   titlePrefix,
	})
}

// CreateTitlePrefix สร้างคำนำหน้าใหม่
func CreateTitlePrefix(c *gin.Context) {
	var titlePrefix entity.TitlePrefix

	if err := c.ShouldBindJSON(&titlePrefix); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid input data",
		})
		return
	}

	if err := config.DB().Create(&titlePrefix).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create title prefix",
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "Title prefix created successfully",
		"data":    titlePrefix,
	})
}

// UpdateTitlePrefixByID อัปเดตคำนำหน้าตาม ID
func UpdateTitlePrefixByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var titlePrefix entity.TitlePrefix

	if err := config.DB().First(&titlePrefix, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Title prefix not found",
		})
		return
	}

	if err := c.ShouldBindJSON(&titlePrefix); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid input data",
		})
		return
	}

	if err := config.DB().Save(&titlePrefix).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to update title prefix",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Title prefix updated successfully",
		"data":    titlePrefix,
	})
}

// DeleteTitlePrefixByID ลบคำนำหน้าตาม ID
func DeleteTitlePrefixByID(c *gin.Context) {
	id, _ := strconv.Atoi(c.Param("id"))
	var titlePrefix entity.TitlePrefix

	if err := config.DB().First(&titlePrefix, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Title prefix not found",
		})
		return
	}

	// ตรวจสอบว่ามี User ใช้ TitlePrefix นี้อยู่หรือไม่
	var userCount int64
	if err := config.DB().Model(&entity.User{}).Where("prefix_id = ?", id).Count(&userCount).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to check title prefix usage",
		})
		return
	}

	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Cannot delete title prefix. It is being used by users.",
		})
		return
	}

	if err := config.DB().Delete(&titlePrefix).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to delete title prefix",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Title prefix deleted successfully",
	})
}
