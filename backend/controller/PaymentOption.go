package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /payment-options
func ListPaymentOptions(c *gin.Context) {
	var option []entity.PaymentOption

	db := config.DB()

	db.Find(&option)

	c.JSON(http.StatusOK, &option)
}