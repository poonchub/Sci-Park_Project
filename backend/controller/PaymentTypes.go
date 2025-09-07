package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /payment-types
func ListPaymentTypes(c *gin.Context) {
	var ptype []entity.PaymentType

	db := config.DB()

	db.Find(&ptype)

	c.JSON(http.StatusOK, &ptype)
}