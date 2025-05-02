package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// POST /inspection
func CreateInspection(c *gin.Context) {

	var inspection entity.Inspection

	if err := c.ShouldBindJSON(&inspection); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&booking); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	db := config.DB()

	var user entity.User
	if err := db.First(&user, inspection.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var request entity.MaintenanceRequest
	if err := db.First(&request, inspection.RequestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance request not found"})
		return
	}

	var status entity.RequestStatus
	if err := db.First(&status, inspection.RequestStatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
		return
	}

	tsk := entity.Inspection{
		Description:     inspection.Description,
		UserID:          inspection.UserID,
		RequestID:       inspection.RequestID,
		RequestStatusID: inspection.RequestStatusID,
	}

	if err := db.FirstOrCreate(&tsk, entity.Inspection{
		RequestID: inspection.RequestID,
	}).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": tsk})
}