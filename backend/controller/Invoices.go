package controller

import (
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/johnfercher/maroto/pkg/consts"
	"github.com/johnfercher/maroto/pkg/pdf"
	"github.com/johnfercher/maroto/pkg/props"
)

// GET /invoces
func ListInvoices(c *gin.Context) {
	var invoces []entity.Invoice

	db := config.DB()

	result := db.Find(&invoces)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoces)
}

// GET /invoice/:id
func GetInvoiceByID(c *gin.Context) {
	id := c.Param("id")

	var invoice entity.Invoice

	db := config.DB()

	result := db.First(&invoice, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoice)
}

// GET /invoice/:id/pdf
func GetInvoicePDF(c *gin.Context) {
	id := c.Param("id")

	db := config.DB()

	var invoice entity.Invoice
	result := db.
		Preload("Items").
		Preload("Customer").
		Preload("Creater").
		First(&invoice, id)

	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	m := pdf.NewMaroto(consts.Portrait, consts.A4)
	// โหลดฟอนต์ Sarabun จากไฟล์ ttf (ฟอนต์ต้องอยู่ใน path นี้)
	m.AddUTF8Font("THSarabun", consts.Normal, "./fonts/THSarabun.ttf")
	m.AddUTF8Font("THSarabun", consts.Italic, "./fonts/THSarabun Italic.ttf")
	m.AddUTF8Font("THSarabun", consts.Bold, "./fonts/THSarabun Bold.ttf")
	m.AddUTF8Font("THSarabun", consts.BoldItalic, "./fonts/THSarabun Bold Italic.ttf")
	m.SetDefaultFontFamily("THSarabun")
	m.SetPageMargins(10, 15, 10)

	// หัวเรื่อง
	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("ที่ "+invoice.InvoiceNumber, props.Text{
				Size:  14,
				Style: consts.Bold,
				Align: consts.Right,
			})
		})
	})

	m.Row(10, func() {
		m.Col(12, func() {
			m.Text("Customer: "+invoice.Customer.FirstName, props.Text{
				Size: 12,
			})
		})
	})

	// ตาราง header
	m.Row(10, func() {
		m.Col(6, func() {
			m.Text("Description", props.Text{Align: consts.Left})
		})
		m.Col(3, func() {
			m.Text("Unit Price", props.Text{Align: consts.Right})
		})
		m.Col(3, func() {
			m.Text("Amount", props.Text{Align: consts.Right})
		})
	})

	// ตารางรายการสินค้า
	for _, item := range invoice.Items {
		m.Row(10, func() {
			m.Col(6, func() {
				m.Text(item.Description, props.Text{Align: consts.Left})
			})
			m.Col(3, func() {
				m.Text(strconv.FormatFloat(item.UnitPrice, 'f', 2, 64), props.Text{Align: consts.Right})
			})
			m.Col(3, func() {
				m.Text(strconv.FormatFloat(item.Amount, 'f', 2, 64), props.Text{Align: consts.Right})
			})
		})
	}

	// รวมยอด
	m.Row(10, func() {
		m.Col(9, func() {
			m.Text("Total", props.Text{Align: consts.Right})
		})
		m.Col(3, func() {
			m.Text(strconv.FormatFloat(invoice.TotalAmount, 'f', 2, 64), props.Text{Align: consts.Right})
		})
	})

	// ส่ง header
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=invoice_"+invoice.InvoiceNumber+".pdf")
	c.Header("Content-Transfer-Encoding", "binary")
	c.Header("Expires", "0")

	// ส่ง PDF ออกไป
	buf, err := m.Output()
	if err != nil {
		log.Printf("PDF generation error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
		return
	}

	_, err = buf.WriteTo(c.Writer)
	if err != nil {
		log.Printf("Failed to write PDF to response: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write PDF"})
		return
	}
}

// POST /invoice
func CreateInvoice(c *gin.Context) {
	var invoice entity.Invoice

	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var status entity.PaymentStatus
	if err := db.First(&status, "Pending").Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request status 'Pending' not found"})
		return
	}

	invoice.StatusID = status.ID

	var creater entity.User
	if err := db.First(&creater, invoice.CreaterID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Creater not found"})
		return
	}

	var customer entity.User
	if err := db.First(&customer, invoice.CustomerID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Customer not found"})
	}

	result := db.Create(&invoice)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	invoiceData := entity.Invoice{
		InvoiceNumber: invoice.InvoiceNumber,
		IssueDate:     invoice.IssueDate,
		DueDate:       invoice.DueDate,
		BillingPeriod: invoice.BillingPeriod,
		TotalAmount:   invoice.TotalAmount,
		StatusID:      invoice.StatusID,
		CreaterID:     invoice.CreaterID,
		CustomerID:    invoice.CustomerID,
	}

	var exiting entity.Invoice
	if err := db.Where("invoice_number = ?", invoiceData.InvoiceNumber).First(&exiting).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Invoice with this number already exists"})
		return
	}

	if err := db.Create(&invoiceData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, &invoice)

}
