package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// POST /room-booking-invoice-item
func CreateRoomBookingInvoiceItem(c *gin.Context) {
	var invoiceItem entity.RoomBookingInvoiceItem

	db := config.DB()
	if err := c.ShouldBindJSON(&invoiceItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// if ok, err := govalidator.ValidateStruct(&invoiceItem); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	var invoice entity.RoomBookingInvoice
	if err := db.First(&invoice, invoiceItem.RoomBookingInvoiceID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice not found"})
		return
	}

	invoiceItemData := entity.RoomBookingInvoiceItem{
		Description: invoiceItem.Description,
		Quantity: invoiceItem.Quantity,
		UnitPrice: invoiceItem.UnitPrice,
		Amount:     invoiceItem.Amount,
		RoomBookingInvoiceID:  invoiceItem.RoomBookingInvoiceID,
	}

	var exiting entity.RoomBookingInvoiceItem
	if err := db.Where("description = ? and room_booking_invoice_id = ?", invoiceItem.Description, invoiceItem.RoomBookingInvoiceID).First(&exiting).Error; err == nil {
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