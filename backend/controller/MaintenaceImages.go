package controller

import (
	// "encoding/json"
	"fmt"
	"net/http"
	// "sci-park_web-application/config"
	// "sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// POST /create-maintenance-request
func CreateMaintenanceImages(c *gin.Context) {

	fmt.Println("Received Content-Type:", c.ContentType()) // ✅ Log

    if c.ContentType() != "multipart/form-data" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Content-Type"})
        return
    }

    fmt.Println("Parsing form data...") // ✅ Log เพิ่ม

    // ✅ อ่าน JSON จาก FormData
    jsonData := c.PostForm("jsonData")
    fmt.Println("Received JSON Data:", jsonData)

    // ✅ อ่านไฟล์จาก FormData
    form, err := c.MultipartForm()
    if err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form data"})
        return
    }

	files := form.File["files"]

    if len(files) == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "No image files provided"})
        return
    }

	// db := config.DB()

	// var user entity.User
	// if err := db.First(&user, jsonData.UserID).Error; err != nil {
	// 	c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
	// 	return
	// }

	// var room entity.Room
	// if err := db.First(&room, jsonData.RoomID).Error; err != nil {
	// 	c.JSON(http.StatusNotFound, gin.H{"error": "room not found"})
	// 	return
	// }

	// var status entity.RequestStatus
	// if err := db.First(&status, jsonData.RequestStatusID).Error; err != nil {
	// 	c.JSON(http.StatusNotFound, gin.H{"error": "request status not found"})
	// 	return
	// }

	// var area entity.Area
	// if err := db.First(&area, jsonData.AreaID).Error; err != nil {
	// 	c.JSON(http.StatusNotFound, gin.H{"error": "area not found"})
	// 	return
	// }

	// rq := entity.MaintenanceRequest{
	// 	Description:       requestData.Description,
	// 	UserID:            requestData.UserID,
	// 	RoomID:            requestData.RoomID,
	// 	RequestStatusID:   requestData.RequestStatusID,
	// 	AreaID:            requestData.AreaID,
	// 	MaintenanceTypeID: requestData.MaintenanceTypeID,
	// }

	// if err := db.Create(&rq).Error; err != nil {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
	// 	return
	// }

	// c.JSON(http.StatusCreated, gin.H{"message": "Created success", "data": rq})
}
