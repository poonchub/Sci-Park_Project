package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// ListCompanySizes ดึงรายการ CompanySize ทั้งหมด
func ListCompanySizes(c *gin.Context) {
	var companySizes []entity.CompanySize
	if err := config.DB().Find(&companySizes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch company sizes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": companySizes,
	})
}

// GetCompanySizeByID ดึงข้อมูล CompanySize ตาม ID
func GetCompanySizeByID(c *gin.Context) {
	id := c.Param("id")
	var companySize entity.CompanySize
	if err := config.DB().First(&companySize, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Company size not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": companySize,
	})
}
