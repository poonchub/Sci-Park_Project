package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /floors
func ListFloors(c *gin.Context) {
	var floor []entity.Floor

	db := config.DB()

	db.Find(&floor)

	c.JSON(http.StatusOK, &floor)
}