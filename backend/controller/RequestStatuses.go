package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /request-statuses
func ListRequestStatuses(c *gin.Context) {
	var status []entity.RequestStatus

	db := config.DB()

	db.Find(&status)

	c.JSON(http.StatusOK, &status)
}
