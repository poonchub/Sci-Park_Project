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

	results := db.Preload("User").Preload("Room.Floor").Preload("Room.RoomType").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType").Find(&request)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &request)
}

// GET /maintenance-request/:id
func GetMaintenanceRequestByID(c *gin.Context) {
	ID := c.Param("id")
	var request entity.MaintenanceRequest

	db := config.DB()
	results := db.Preload("User").Preload("Room").Preload("RequestStatus").Preload("Area").Preload("MaintenanceType").First(&request, ID)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	if request.ID == 0 {
		c.JSON(http.StatusNoContent, gin.H{})
		return
	}
	c.JSON(http.StatusOK, request)
}

// POST /maintenance-request
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

// PATCH /maintenance-request/:id
func UpdateMaintenanceRequestByID(c *gin.Context) {
	ID := c.Param("id")

	var request entity.MaintenanceRequest

	db := config.DB()
	result := db.First(&request, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&request)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}

// DELETE /maintenance-request/:id
func DeleteMaintenanceRequestByID(c *gin.Context) {
    ID := c.Param("id")

    db := config.DB()

    var bookingDetails entity.MaintenanceRequest
    if err := db.Where("booking_id = ?", ID).First(&bookingDetails).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Maintenance request not found"})
        return
    }

    if err := db.Where("booking_id = ?", ID).Delete(&entity.MaintenanceRequest{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete Maintenance request"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Maintenance request deleted successfully"})
}