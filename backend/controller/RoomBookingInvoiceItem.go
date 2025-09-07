package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// POST /room-booking-invoice-item
func CreateRoomBookingInvoiceItem(c *gin.Context) {
	var invoiceItem entity.RentalRoomInvoiceItem

	db := config.DB()
	if err := c.ShouldBindJSON(&invoiceItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&invoiceItem); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	var invoice entity.RentalRoomInvoice
	if err := db.First(&invoice, invoiceItem.RentalRoomInvoiceID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice not found"})
		return
	}

	invoiceItemData := entity.RentalRoomInvoiceItem{
		Description: invoiceItem.Description,
		Amount:     invoiceItem.Amount,
		RentalRoomInvoiceID:  invoiceItem.RentalRoomInvoiceID,
	}

	var exiting entity.RentalRoomInvoiceItem
	if err := db.Where("description = ? and rental_room_invoice_id = ?", invoiceItem.Description, invoiceItem.RentalRoomInvoiceID).First(&exiting).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice item already exists"})
		return
	}

	if err := db.Create(&invoiceItemData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    invoiceItemData,
	})
}