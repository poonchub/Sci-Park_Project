package controller

import (
	"net/http"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /maintenance-requests
func ListMaintenanceRequests(c *gin.Context) {
	var request []entity.MaintenanceRequest

	db := config.DB()

	db.Preload("User").Preload("Room").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType").Find(&request)

	c.JSON(http.StatusOK, &request)
}

// POST /create-maintenance-request
func CreateMaintenanceRequest(c *gin.Context) {

	var request entity.MaintenanceRequest

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&booking); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	db := config.DB()

	var user entity.User
	if err := db.First(&user, request.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	var room entity.Room
	if err := db.First(&room, request.RoomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
		return
	}

	var status entity.RequestStatus
	if err := db.First(&status, request.RequestStatusID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
		return
	}

	var area entity.Area
	if err := db.First(&area, request.AreaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "area not found"})
		return
	}

	rq := entity.MaintenanceRequest{
		Description:      	request.Description,
		StartTime: 		 	request.StartTime,
		EndTime: 			request.EndTime,			
		UserID:            	request.UserID,
		RoomID:            	request.RoomID,
		RequestStatusID:   	request.RequestStatusID,
		AreaID:            	request.AreaID,
		MaintenanceTypeID: 	request.MaintenanceTypeID,
	}

	if err := db.Create(&rq).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": rq})
}
