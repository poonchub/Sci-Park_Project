package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// GET /organization-info
func GetOrganizationInfo(c *gin.Context) {
	var organizationInfo entity.OrganizationInfo

	db := config.DB()

	db.Find(&organizationInfo)

	c.JSON(http.StatusOK, &organizationInfo)
}