package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /payments
func ListPayments(c *gin.Context) {
	var payments []entity.Payment

	db := config.DB()

	results := db.Find(&payments)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
	}

	c.JSON(http.StatusOK, &payments)
}

// GET /payment/:id
func GetPaymentByID(c *gin.Context) {
	ID := c.Param("id")
	var payment entity.Payment

	db := config.DB()

	result := db.First(&payment, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
	}

	c.JSON(http.StatusOK, &payment)
}

// POST /payment
func CreatePayennt(c *gin.Context) {
	
}