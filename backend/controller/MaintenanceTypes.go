package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /maintenance-types
func ListMaintenanceTypes(c *gin.Context) {
	var maintenanceType []entity.MaintenanceType

	db := config.DB()

	db.Find(&maintenanceType)

	c.JSON(http.StatusOK, &maintenanceType)
}