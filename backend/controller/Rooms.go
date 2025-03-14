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