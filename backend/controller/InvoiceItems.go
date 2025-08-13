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
		UnitPrice:  invoiceItem.UnitPrice,
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

	c.JSON(http.StatusCreated, &invoiceItemData)
}