package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /areas
func ListAreas(c *gin.Context) {
	var area []entity.Area

	db := config.DB()

	db.Find(&area)

	c.JSON(http.StatusOK, &area)
}