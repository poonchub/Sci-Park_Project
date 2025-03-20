package controller

import (
	"net/http"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// POST /manager-approval
func CreateManagerApproval(c *gin.Context) {

	var manager entity.ManagerApproval

	if err := c.ShouldBindJSON(&manager); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&booking); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	db := config.DB()

	var user entity.User
	if err := db.First(&user, manager.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var request entity.MaintenanceRequest
	if err := db.First(&request, manager.RequestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "maintenance request not found"})
		return
	}

	var status entity.RequestStatus
	if err := db.First(&status, request.RequestStatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
		return
	}

	mg := entity.ManagerApproval{
		Description: manager.Description,
		UserID: manager.UserID,
		RequestID: manager.RequestID,
		RequestStatusID: manager.RequestStatusID,
	}

	if err := db.Create(&mg).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": mg})
}