package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /rooms
func ListRooms(c *gin.Context) {
	var room []entity.Room

	db := config.DB()

	db.Find(&room)

	c.JSON(http.StatusOK, &room)
}


func ListRooms1(c *gin.Context) {
	var rooms []entity.Room

	db := config.DB()

	db.Preload("RoomStatus").Preload("RoomType").Preload("Floor").Find(&rooms)

	c.JSON(http.StatusOK, &rooms)
}

// Get room by ID
func GetRoom(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room
	db := config.DB()

	if err := db.Preload("RoomStatus").Preload("RoomType").Preload("Floor").First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}
	c.JSON(http.StatusOK, room)
}

// Create a new room
func CreateRoom(c *gin.Context) {
	var room entity.Room
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	db := config.DB()

	if err := db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, room)
}

// Update room details
func UpdateRoom(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room
	db := config.DB()

	if err := db.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db.Save(&room)
	c.JSON(http.StatusOK, room)
}

// Delete room
func DeleteRoom(c *gin.Context) {
	id := c.Param("id")
	var room entity.Room
	db := config.DB()

	if err := db.First(&room, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	db.Delete(&room)
	c.JSON(http.StatusOK, gin.H{"message": "Room deleted successfully"})
}
