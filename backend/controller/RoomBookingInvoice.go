package controller

import (
	"errors"
	"fmt"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"strings"

	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GET /room-booking-invoice/:id
func GetRoomBookingInvoiceByID(c *gin.Context) {
	id := c.Param("id")

	var invoice entity.RoomBookingInvoice

	db := config.DB()

	result := db.
		Preload("BookingRoom.BookingDates").
		Preload("BookingRoom.Room").
		Preload("Items").
		Preload("Customer.Prefix").
		Preload("Approver.Prefix").
		First(&invoice, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoice)
}

// GET /room-booking-invoice/next-number
func GetNextRoomBookingInvoiceNumber(c *gin.Context) {
	db := config.DB()

	nextNumber, err := GenerateNextRoomBookingInvoiceNumber(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"next_invoice_number": nextNumber,
	})
}

// POST /room-booking-invoice
func CreateRoomBookingInvoice(c *gin.Context) {
	var invoice entity.RoomBookingInvoice

	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	// var invoiceCheck entity.RoomBookingInvoice
	// if err := db.Where("invoice_number = ?", invoice.InvoiceNumber).First(&invoiceCheck).Error; err == nil {
	// 	c.JSON(http.StatusConflict, gin.H{"error": "Invoice number already exists"})
	// 	return
	// }

	if invoice.ApproverID != 0 {
		var approver entity.User
		if err := db.First(&approver, invoice.ApproverID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Approver not found"})
			return
		}
	}

	var customer entity.User
	if err := db.First(&customer, invoice.CustomerID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
		return
	}

	var booking entity.BookingRoom
	if err := db.First(&booking, invoice.BookingRoomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking not found"})
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")

	invoiceData := entity.RoomBookingInvoice{
		InvoiceNumber:  invoice.InvoiceNumber,
		IssueDate:      invoice.IssueDate.In(loc),
		DueDate:        invoice.DueDate.In(loc),
		DepositDueDate: invoice.DepositDueDate.In(loc),
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

	if err := db.Preload("Customer").Preload("Items").First(&invoiceData, invoiceData.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load invoice relations"})
		return
	}

	// services.NotifySocketEvent("invoice_created", invoiceData)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    invoiceData,
	})
}

// POST /room-booking-invoice/upload-pdf
func UploadRoomBookingInvoicePDF(c *gin.Context) {
	invoiceIDStr := c.PostForm("invoiceId")
	invoiceID, err := strconv.Atoi(invoiceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoiceId"})
		return
	}

	db := config.DB()
	var invoice entity.RoomBookingInvoice
	if err := db.First(&invoice, invoiceID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice ID not found"})
		return
	}

	file, err := c.FormFile("invoicePDF")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
		return
	}

	if invoice.InvoicePDFPath != "" {
		if err := os.Remove(invoice.InvoicePDFPath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to remove old file"})
			return
		}
	}

	// สร้าง path เก็บไฟล์
	folderPath := fmt.Sprintf("images/invoices/user_%d/room_booking", invoice.CustomerID)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
		return
	}

	safeName := strings.ReplaceAll(invoice.InvoiceNumber, "/", "_")
	filename := fmt.Sprintf("ใบแจ้งหนี้เลขที่_%s_%s.pdf", safeName, time.Now().Format("20060102"))
	fullPath := path.Join(folderPath, filename)

	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save invoice PDF"})
		return
	}

	invoice.InvoicePDFPath = fullPath
	if err := db.Save(&invoice).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update invoice"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "PDF uploaded successfully",
		"path":    fullPath,
	})
}

func GenerateNextRoomBookingInvoiceNumber(db *gorm.DB) (string, error) {
	var lastInvoice entity.RoomBookingInvoice
	// ดึง Invoice ล่าสุดที่ขึ้นต้นด้วย NE2/ ตามลำดับเลขมากที่สุด
	if err := db.Where("invoice_number LIKE ?", "NE2/%").
		Order("id DESC"). // หรือ order ตาม created_at ก็ได้
		First(&lastInvoice).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "NE2/001", nil // กรณีไม่มีข้อมูลเลย
		}
		return "", err
	}

	// แยกส่วนเลขจาก invoice_number
	parts := strings.Split(lastInvoice.InvoiceNumber, "/")
	if len(parts) != 2 {
		return "", fmt.Errorf("invalid invoice number format")
	}

	lastNum, err := strconv.Atoi(parts[1])
	if err != nil {
		return "", err
	}

	nextNum := lastNum + 1
	// ถ้าอยากให้มี leading zero เฉพาะเลข <= 999 ให้ใช้:
	if nextNum <= 999 {
		return fmt.Sprintf("NE2/%03d", nextNum), nil
	}
	// ถ้าเกิน 999 ก็ไม่ต้อง zero padding
	return fmt.Sprintf("NE2/%d", nextNum), nil
}