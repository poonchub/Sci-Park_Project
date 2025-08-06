package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// ListBusinessGroups ดึงรายการ BusinessGroup ทั้งหมด
func ListBusinessGroups(c *gin.Context) {
	var businessGroups []entity.BusinessGroup
	if err := config.DB().Find(&businessGroups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch business groups"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": businessGroups,
	})
}

// GetBusinessGroupByID ดึงข้อมูล BusinessGroup ตาม ID
func GetBusinessGroupByID(c *gin.Context) {
	id := c.Param("id")
	var businessGroup entity.BusinessGroup
	if err := config.DB().First(&businessGroup, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Business group not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": businessGroup,
	})
}
