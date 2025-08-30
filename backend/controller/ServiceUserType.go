package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /service-user-types
func GetAllServiceUserTypes(c *gin.Context) {
	var serviceUserTypes []entity.ServiceUserType
	db := config.DB()

	// ดึงข้อมูล ServiceUserType ทั้งหมด
	if err := db.Find(&serviceUserTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// สร้าง response ที่มีเฉพาะข้อมูลที่จำเป็น
	var typeList []gin.H
	for _, userType := range serviceUserTypes {
		typeList = append(typeList, gin.H{
			"id":          userType.ID,
			"name":        userType.Name,
			"description": userType.Description,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   typeList,
	})
}

// GET /service-user-types/:id
func GetServiceUserTypeByID(c *gin.Context) {
	id := c.Param("id")
	var serviceUserType entity.ServiceUserType
	db := config.DB()

	if err := db.First(&serviceUserType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ServiceUserType not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "success",
		"data":   serviceUserType,
	})
}

// POST /service-user-types
func CreateServiceUserType(c *gin.Context) {
	var serviceUserType entity.ServiceUserType
	db := config.DB()

	if err := c.ShouldBindJSON(&serviceUserType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Create(&serviceUserType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"status":  "success",
		"message": "ServiceUserType created successfully",
		"data":    serviceUserType,
	})
}

// PUT /service-user-types/:id
func UpdateServiceUserType(c *gin.Context) {
	id := c.Param("id")
	var serviceUserType entity.ServiceUserType
	db := config.DB()

	if err := db.First(&serviceUserType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ServiceUserType not found"})
		return
	}

	if err := c.ShouldBindJSON(&serviceUserType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := db.Save(&serviceUserType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "ServiceUserType updated successfully",
		"data":    serviceUserType,
	})
}

// DELETE /service-user-types/:id
func DeleteServiceUserType(c *gin.Context) {
	id := c.Param("id")
	var serviceUserType entity.ServiceUserType
	db := config.DB()

	if err := db.First(&serviceUserType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ServiceUserType not found"})
		return
	}

	if err := db.Delete(&serviceUserType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "ServiceUserType deleted successfully",
	})
}
