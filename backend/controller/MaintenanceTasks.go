package controller

import (
	"net/http"

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