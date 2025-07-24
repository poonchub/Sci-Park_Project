package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// GET /developer-info
func GetDevaloperInfo(c *gin.Context) {
	var devInfo []entity.DevaloperInfo

	db := config.DB()

	db.Find(&devInfo)

	c.JSON(http.StatusOK, &devInfo)
}