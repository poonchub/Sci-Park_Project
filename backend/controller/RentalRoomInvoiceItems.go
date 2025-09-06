package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
)

// GET /invoice-items
func ListInvoiceItems(c *gin.Context) {
	var invoiceItems []entity.RentalRoomInvoiceItem

	db := config.DB()

	result := db.Find(&invoiceItems)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoiceItems)
}

// GET /invoice-item/:id
func GetInvoiceItemByID(c *gin.Context) {
	id := c.Param("id")

	var invoiceItem entity.RentalRoomInvoiceItem

	db := config.DB()

	result := db.First(&invoiceItem, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoiceItem)
}

// POST /invoice-item
func CreateInvoiceItem(c *gin.Context) {
	var invoiceItem entity.RentalRoomInvoiceItem

	db := config.DB()
	if err := c.ShouldBindJSON(&invoiceItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if ok, err := govalidator.ValidateStruct(&invoiceItem); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
		return
	}

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

// PATCH /invoice-item/:id
func UpdateInvoiceItemsByID(c *gin.Context) {
	ID := c.Param("id")

	var invoiceItem entity.RentalRoomInvoiceItem

	db := config.DB()
	result := db.Find(&invoiceItem, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&invoiceItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&invoiceItem)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}

// DELETE /invoicce-item/:id
func DeleteInvoiceItemByID(c *gin.Context) {
	ID := c.Param("id")

	db := config.DB()

	var invoiceItem entity.RentalRoomInvoiceItem
	if err := db.Where("id = ?", ID).First(&invoiceItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice item not found"})
		return
	}

	if err := db.Where("id = ?", ID).Delete(&entity.RentalRoomInvoiceItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice item deleted successfully"})
}