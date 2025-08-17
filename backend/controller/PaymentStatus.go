package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /payment-statuses
func ListPaymentStatuses(c *gin.Context) {
	var status []entity.PaymentStatus

	db := config.DB()

	db.Find(&status)

	c.JSON(http.StatusOK, &status)
}