package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /booking-rooms
func ListBookingRooms(c *gin.Context) {
	var booking []entity.BookingRoom

	db := config.DB()

	results := db.
		Preload("Room.Floor").
		Preload("TimeSlot").
		Preload("User").
		Find(&booking)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}
	
	c.JSON(http.StatusOK, &booking)
}
