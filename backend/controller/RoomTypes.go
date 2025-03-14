package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /room-types
func ListRoomTypes(c *gin.Context) {
	var roomType []entity.RoomType

	db := config.DB()

	db.Find(&roomType)

	c.JSON(http.StatusOK, &roomType)
}