package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /invoice-items
func ListInvoiceItems(c *gin.Context) {
	var invoiceItems []entity.InvoiceItem

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

	var invoiceItem entity.InvoiceItem

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
	var invoiceItem entity.InvoiceItem

	db := config.DB()
	if err := c.ShouldBindJSON(&invoiceItem); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var invoice entity.Invoice
	if err := db.First(&invoice, invoiceItem.InvoiceID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invoice not found"})
		return
	}

	invoiceItemData := entity.InvoiceItem{
		Description: invoiceItem.Description,
		Amount:     invoiceItem.Amount,
		InvoiceID:  invoiceItem.InvoiceID,
	}

	var exiting entity.InvoiceItem
	if err := db.Where("description = ? and invoice_id = ?", invoiceItem.Description, invoiceItem.InvoiceID).First(&exiting).Error; err == nil {
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

	var invoiceItem entity.InvoiceItem

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

	var invoiceItem entity.InvoiceItem
	if err := db.Where("id = ?", ID).First(&invoiceItem).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice item not found"})
		return
	}

	if err := db.Where("id = ?", ID).Delete(&entity.InvoiceItem{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice item"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Invoice item deleted successfully"})
}