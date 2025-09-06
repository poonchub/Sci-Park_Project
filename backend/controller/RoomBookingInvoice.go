package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"time"

	"github.com/gin-gonic/gin"
)

// POST /room-booking-invoice
func CreateRoomBookingInvoice(c *gin.Context) {
	var invoice entity.RoomBookingInvoice

	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var invoiceCheck entity.RoomBookingInvoice
	if err := db.Where("invoice_number = ?", invoice.InvoiceNumber).First(&invoiceCheck).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Invoice number already exists"})
		return
	}

	var approver entity.User
	if err := db.First(&approver, invoice.ApproverID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Approver not found"})
		return
	}

	var customer entity.User
	if err := db.First(&customer, invoice.CustomerID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
		return
	}

	var booking entity.BookingRoom
	if err := db.First(&booking, invoice.BookingRoomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room not found"})
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")

	invoiceData := entity.RoomBookingInvoice{
		InvoiceNumber:  invoice.InvoiceNumber,
		IssueDate:      invoice.IssueDate.In(loc),
		DueDate:        invoice.DueDate.In(loc),
		DepositAmount:  invoice.DepositAmount,
		DiscountAmount: invoice.DiscountAmount,
		TotalAmount:    invoice.TotalAmount,
		TaxID:          invoice.TaxID,
		Address:        invoice.Address,
		BookingRoomID:  invoice.BookingRoomID,
		ApproverID:     invoice.ApproverID,
		CustomerID:     invoice.CustomerID,
	}

	// if ok, err := govalidator.ValidateStruct(&invoiceData); !ok {
	// 	c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
	// 	return
	// }

	var exiting entity.RoomBookingInvoice
	if err := db.Where("booking_room_id = ?", invoiceData.BookingRoomID).First(&exiting).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "An invoice for this room booking already exists."})
		return
	}

	if err := db.Create(&invoiceData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	if err := db.Preload("Creater").Preload("Customer").Preload("Items").First(&invoiceData, invoiceData.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load invoice relations"})
		return
	}

	// services.NotifySocketEvent("invoice_created", invoiceData)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    invoiceData,
	})
}
