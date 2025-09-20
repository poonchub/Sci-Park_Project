package controller

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"path"
	"strconv"
	"strings"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"

	"time"

	"github.com/asaskevich/govalidator"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"bytes"
	"context"
	"html/template"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// GET /invoces
func ListInvoices(c *gin.Context) {
	var invoces []entity.RentalRoomInvoice

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

	var invoice entity.RentalRoomInvoice

	db := config.DB()

	result := db.
		Preload("Payments.Status").
		Preload("Status").
		Preload("Items").
		Preload("Room.Floor").
		Preload("Customer.Prefix").
		Preload("Creater.Prefix").
		Preload("Creater.Role").
		Preload("Creater.JobPosition").
		Preload("Notifications").
		First(&invoice, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoice)
}

// GET /invoices/next-number
func GetNextInvoiceNumber(c *gin.Context) {
	db := config.DB()

	nextNumber, err := GenerateNextInvoiceNumber(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"next_invoice_number": nextNumber,
	})
}

// GET /room-invoice-option
func GetInvoiceByOption(c *gin.Context) {
	var invoices []entity.RentalRoomInvoice
	db := config.DB()

	roomID, _ := strconv.Atoi(c.DefaultQuery("roomId", "0"))
	statusID, _ := strconv.Atoi(c.DefaultQuery("statusId", "0"))
	customerID, _ := strconv.Atoi(c.DefaultQuery("customerId", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	query := db.Model(&entity.RentalRoomInvoice{})

	if statusID != 0 {
		query = query.Where("status_id = ?", statusID)
	}
	if roomID != 0 {
		query = query.Where("room_id = ?", roomID)
	}
	if customerID != 0 {
		query = query.Where("customer_id = ?", customerID)
	}

	query = query.
		Preload("Payments.Status").
		Preload("Status").
		Preload("Items").
		Preload("Room.Floor").
		Preload("Customer.Prefix").
		Preload("Creater.Prefix").
		Preload("Creater.Role").
		Preload("Creater.JobPosition").
		Preload("Notifications")

	if err := query.Limit(limit).Offset(offset).Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var total int64
	countQuery := db.Model(&entity.RentalRoomInvoice{})
	if statusID != 0 {
		countQuery = countQuery.Where("status_id = ?", statusID)
	}
	if roomID != 0 {
		countQuery = countQuery.Where("room_id = ?", roomID)
	}
	if customerID != 0 {
		countQuery = countQuery.Where("customer_id = ?", customerID)
	}
	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"data":       invoices,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}

// GET /invoices/by-date
func ListInvoiceByDateRange(c *gin.Context) {
	var invoice []entity.RentalRoomInvoice

	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	db := config.DB()

	query := db.
		Order("created_at ASC")

	layout := "2006-01-02"
	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load timezone"})
		return
	}

	if startDateStr != "" {
		startDate, errStart := time.ParseInLocation(layout, startDateStr, loc)
		if errStart != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format, expected YYYY-MM-DD"})
			return
		}

		if endDateStr == "" {
			startOfDay := startDate
			endOfDay := startDate.AddDate(0, 0, 1)
			query = query.Where("created_at >= ? AND created_at < ?", startOfDay, endOfDay)
		} else {
			endDate, errEnd := time.ParseInLocation(layout, endDateStr, loc)
			if errEnd != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format, expected YYYY-MM-DD"})
				return
			}
			endDate = endDate.AddDate(0, 0, 1)
			query = query.Where("created_at BETWEEN ? AND ?", startDate, endDate)
		}
	}

	results := query.Find(&invoice)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &invoice)
}

func GetInvoicePDF(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var invoice entity.RentalRoomInvoice
	result := db.
		Preload("Items").
		Preload("Creater.Role").
		Preload("Creater.Prefix").
		Preload("Customer").
		First(&invoice, id)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	funcMap := template.FuncMap{
		"add":               add,
		"ThaiDateFull":      ThaiDateFull,
		"ThaiDateMonthYear": ThaiDateMonthYear,
	}

	tmpl, err := template.New("invoice.html").Funcs(funcMap).ParseFiles("templates/invoice.html")
	if err != nil {
		log.Printf("Template load error: %v", err)
		c.String(http.StatusInternalServerError, "Template load error")
		return
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, invoice); err != nil {
		log.Printf("Template execute error: %v", err)
		c.String(http.StatusInternalServerError, "Template execute error")
		return
	}

	// หา Chrome ใน Windows
	chromePath := `C:\Program Files\Google\Chrome\Application\chrome.exe`
	if _, err := os.Stat(chromePath); os.IsNotExist(err) {
		chromePath = `C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`
	}

	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.ExecPath(chromePath),
		chromedp.NoFirstRun,
		chromedp.NoDefaultBrowserCheck,
		chromedp.Headless,
		chromedp.DisableGPU,
	)

	allocCtx, _ := chromedp.NewExecAllocator(context.Background(), opts...)
	chromeCtx, _ := chromedp.NewContext(allocCtx)

	ctx, cancel := context.WithTimeout(chromeCtx, 30*time.Second)
	defer cancel()

	// แปลง HTML เป็น URL-safe data URI
	encodedHTML := "data:text/html;charset=utf-8," + url.PathEscape(htmlBuf.String())

	var pdfBuf []byte
	err = chromedp.Run(ctx,
		chromedp.Navigate(encodedHTML),
		chromedp.WaitReady("body", chromedp.ByQuery),
		chromedp.Sleep(500*time.Millisecond),
		chromedp.ActionFunc(func(ctx context.Context) error {
			var err error
			pdfBuf, _, err = page.PrintToPDF().WithPrintBackground(true).Do(ctx)
			return err
		}),
	)
	if err != nil {
		log.Printf("PDF generation error: %v", err)
		c.String(http.StatusInternalServerError, "PDF generation error")
		return
	}

	// ส่ง PDF กลับ
	c.Header("Content-Type", "application/pdf")
	c.Header("Content-Disposition", "attachment; filename=invoice_"+invoice.InvoiceNumber+".pdf")
	c.Data(http.StatusOK, "application/pdf", pdfBuf)
}

// GET /invoices/previous-month-summary
func GetPreviousMonthInvoiceSummary(c *gin.Context) {
	db := config.DB()

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load timezone"})
		return
	}

	now := time.Now().In(loc)

	// หาวันสิ้นเดือนของเดือนก่อนหน้า
	firstOfCurrentMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	previousMonthEnd := firstOfCurrentMonth.Add(-time.Nanosecond)
	previousMonthStart := time.Date(previousMonthEnd.Year(), previousMonthEnd.Month(), 1, 0, 0, 0, 0, loc)

	// ดึง invoice ของเดือนนั้น
	var invoices []entity.RentalRoomInvoice
	if err := db.Preload("Status").
		Where("billing_period >= ? AND billing_period <= ?", previousMonthStart, previousMonthEnd).
		Find(&invoices).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// // คำนวณสถิติ
	// paidStatuses := map[string]bool{
	// 	"Awaiting Receipt": true,
	// 	"Paid":             true,
	// }

	paidCount, overdueCount := 0, 0
	var totalRevenue float64
	// nowTime := time.Now().In(loc)

	// for _, inv := range invoices {
	// 	switch strings.ToLower(inv.Status.Name) {
	// 	case "paid":
	// 		paidCount++
	// 		totalRevenue += inv.PaidAmount // ✅ นับตามที่จ่ายจริง
	// 	case "partially paid", "unpaid":
	// 		if inv.DueDate.Before(nowTime) {
	// 			overdueCount++
	// 		}
	// 	case "overdue":
	// 		overdueCount++
	// 	}
	// }

	c.JSON(http.StatusOK, gin.H{
		"billing_period":   previousMonthEnd.Format("2006-01-02"),
		"total_invoices":   len(invoices),
		"paid_invoices":    paidCount,
		"overdue_invoices": overdueCount,
		"total_revenue":    totalRevenue,
	})
}

// POST /invoice
func CreateInvoice(c *gin.Context) {
	var invoice entity.RentalRoomInvoice

	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var invoiceCheck entity.RentalRoomInvoice
	if err := db.Where("invoice_number = ?", invoice.InvoiceNumber).First(&invoiceCheck).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Invoice number already exists"})
		return
	}

	var status entity.PaymentStatus
	if err := db.Where("name = ?", "Pending Payment").First(&status).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Request status 'Pending Payment' not found"})
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
		return
	}

	var room entity.Room
	if err := db.First(&room, invoice.RoomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room not found"})
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")

	invoiceData := entity.RentalRoomInvoice{
		InvoiceNumber: invoice.InvoiceNumber,
		IssueDate:     invoice.IssueDate.In(loc),
		DueDate:       invoice.DueDate.In(loc),
		BillingPeriod: invoice.BillingPeriod.In(loc),
		TotalAmount:   invoice.TotalAmount,
		RoomID:        invoice.RoomID,
		StatusID:      invoice.StatusID,
		CreaterID:     invoice.CreaterID,
		CustomerID:    invoice.CustomerID,
	}

	if ok, err := govalidator.ValidateStruct(&invoiceData); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
		return
	}

	var exiting entity.RentalRoomInvoice
	if err := db.Where("billing_period = ? AND room_id = ?", invoiceData.BillingPeriod, invoiceData.RoomID).First(&exiting).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "An invoice for this billing period already exists."})
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

	services.NotifySocketEvent("invoice_created", invoiceData)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    invoiceData,
	})
}

// POST /invoice/upload-pdf
func UploadInvoicePDF(c *gin.Context) {
	invoiceIDStr := c.PostForm("invoiceId")
	invoiceID, err := strconv.Atoi(invoiceIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid invoiceId"})
		return
	}

	db := config.DB()
	var invoice entity.RentalRoomInvoice
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
	folderPath := fmt.Sprintf("images/invoices/user_%d", invoice.CustomerID)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
		return
	}

	filename := file.Filename
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

// PATCH /invoice/:id
func UpdateInvoiceByID(c *gin.Context) {
	ID := c.Param("id")

	var invoice entity.RentalRoomInvoice

	db := config.DB()
	result := db.First(&invoice, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&invoice); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&invoice)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	services.NotifySocketEvent("invoice_updated", invoice)

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}

// DELETE /invoice/:id
func DeleteInvoiceByID(c *gin.Context) {
	ID := c.Param("id")
	db := config.DB()

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var invoice entity.RentalRoomInvoice
	if err := tx.Where("id = ?", ID).First(&invoice).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Invoice not found"})
		return
	}

	if err := tx.Where("rental_room_invoice_id = ?", ID).Delete(&entity.RentalRoomInvoiceItem{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice items"})
		return
	}

	if invoice.InvoicePDFPath != "" {
		if err := os.Remove(invoice.InvoicePDFPath); err != nil && !os.IsNotExist(err) {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice PDF file"})
			return
		}
	}

	if err := tx.Delete(&entity.RentalRoomInvoice{}, ID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete invoice"})
		return
	}

	services.NotifySocketEvent("invoice_deleted", invoice)

	tx.Commit()
	c.JSON(http.StatusOK, gin.H{"message": "Invoice and its items deleted successfully"})
}

func add(a, b int) int {
	return a + b
}

func ThaiDateFull(t time.Time) string {
	months := []string{
		"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	day := t.Day()
	month := months[t.Month()-1]
	year := t.Year() + 543
	return fmt.Sprintf("%d %s %d", day, month, year)
}

func ThaiDateMonthYear(t time.Time) string {
	months := []string{
		"มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
		"กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
	}
	month := months[t.Month()-1]
	year := t.Year() + 543
	return fmt.Sprintf("%s %d", month, year)
}

func GenerateNextInvoiceNumber(db *gorm.DB) (string, error) {
	var lastInvoice entity.RentalRoomInvoice
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
