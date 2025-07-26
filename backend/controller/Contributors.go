package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// GET /contributors 
func ListContributors(c *gin.Context) {
	var devInfo []entity.Contributor

	db := config.DB()

	db.Preload("ContributorType").Find(&devInfo)

	c.JSON(http.StatusOK, &devInfo)
}