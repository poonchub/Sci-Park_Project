package controller

import (
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	// "strconv"
	"time"

	"github.com/gin-gonic/gin"
	// "github.com/johnfercher/maroto/pkg/color"
	// "github.com/johnfercher/maroto/pkg/consts"
	// "github.com/johnfercher/maroto/pkg/pdf"
	// "github.com/johnfercher/maroto/pkg/props"

	"bytes"
	"context"
	"html/template"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
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


func add(a, b int) int {
    return a + b
}

// GET /invoice/:id/pdf
func GetInvoicePDF(c *gin.Context) {
    id := c.Param("id")
    db := config.DB()

    var invoice entity.Invoice
    result := db.Preload("Items").Preload("Customer").Preload("Creater").First(&invoice, id)
    if result.Error != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
        return
    }

    funcMap := template.FuncMap{
        "add":              add,
        "ThaiDateFull":     ThaiDateFull,
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

    allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
    defer cancel()

    ctx, cancel := chromedp.NewContext(allocCtx)
    defer cancel()

    // แปลง HTML เป็น URL-safe data URI
    encodedHTML := "data:text/html;charset=utf-8," + url.PathEscape(htmlBuf.String())

    var pdfBuf []byte
    err = chromedp.Run(ctx,
        chromedp.Navigate(encodedHTML),
        chromedp.WaitReady("body", chromedp.ByQuery), // รอให้ body พร้อม
        chromedp.Sleep(500*time.Millisecond),         // กันเหนียวเผื่อมี CSS/JS
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
// func GetInvoicePDF(c *gin.Context) {
// 	id := c.Param("id")

// 	db := config.DB()

// 	var invoice entity.Invoice
// 	result := db.
// 		Preload("Items").
// 		Preload("Customer").
// 		Preload("Creater").
// 		First(&invoice, id)

// 	if result.Error != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
// 		return
// 	}

// 	m := pdf.NewMaroto(consts.Portrait, consts.A4)
// 	// โหลดฟอนต์ Sarabun จากไฟล์ ttf (ฟอนต์ต้องอยู่ใน path นี้)
// 	m.AddUTF8Font("THSarabun", consts.Normal, "./fonts/THSarabun.ttf")
// 	m.AddUTF8Font("THSarabun", consts.Italic, "./fonts/THSarabun Italic.ttf")
// 	m.AddUTF8Font("THSarabun", consts.Bold, "./fonts/THSarabun Bold.ttf")
// 	m.AddUTF8Font("THSarabun", consts.BoldItalic, "./fonts/THSarabun Bold Italic.ttf")
// 	m.SetDefaultFontFamily("THSarabun")
// 	m.SetPageMargins(25, 15, 25)

// 	// หัวเรื่อง
// 	m.RegisterHeader(func() {
// 		m.Row(20, func() {
// 			m.Col(3, func() {
// 				m.Text("ใบแจ้งหนี้", props.Text{
// 					Style: consts.Bold,
// 					Size:  16,
// 					Align: consts.Left,
// 					// Extrapolate: false,
// 				})
// 				m.Text("ที่ "+invoice.InvoiceNumber, props.Text{
// 					Top:   12,
// 					Size:  14,
// 					Align: consts.Left,
// 				})
// 			})

// 			m.Col(6, func() {
// 				_ = m.FileImage("./images/organization/logo/logo_1.png", props.Rect{
// 					Center:  true,
// 					Percent: 80,
// 				})
// 			})

// 			m.ColSpace(3)
// 		})
// 	})

// 	m.Row(20, func() {
// 		m.Col(12, func() {
// 			m.Text("วันที่ "+ThaiDateFull(invoice.IssueDate), props.Text{
// 				Top:   8,
// 				Size:  16,
// 				Align: consts.Right,
// 			})
// 		})
// 	})

// 	m.Row(14, func() {
// 		m.Text("เรื่อง", props.Text{
// 			Size:  16,
// 			Style: consts.Bold, // ตัวหนาเฉพาะคำนี้
// 			Align: consts.Left,
// 		})
// 		m.Text("แจ้งค่าบริการอาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2", props.Text{
// 			Size:  16,
// 			Style: consts.Normal, // ส่วนที่เหลือเป็นปกติ
// 			Align: consts.Left,
// 			Left:  10,
// 		})
// 		m.Text("(จังหวัดนครราชสีมา)", props.Text{
// 			Size:  16,
// 			Style: consts.Normal, // ส่วนที่เหลือเป็นปกติ
// 			Align: consts.Left,
// 			Left:  10,
// 			Top:   6,
// 		})
// 	})

// 	m.Row(8, func() {
// 		m.Text("เรียน", props.Text{
// 			Size:  16,
// 			Style: consts.Bold,
// 			Align: consts.Left,
// 		})
// 		m.Text(invoice.Customer.CompanyName, props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Left:  10,
// 		})
// 	})

// 	m.Row(16, func() {
// 		m.Text("        อุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 (จังหวัดนครราชสีมา) ขอเรียนให้ท่านทราบ", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 		})
// 		m.Text("ถึงรายการค่าใช้จ่ายต่าง ๆ ต้องชำระดังต่อไปนี้", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 	})

// 	// ตาราง header
// 	m.SetBackgroundColor(color.Color{
// 		Red:   200,
// 		Green: 200,
// 		Blue:  200,
// 	})

// 	m.Row(10, func() {
// 		m.Col(6, func() {
// 			m.Text("  รายการ", props.Text{
// 				Size:  16,
// 				Style: consts.Bold,
// 				Align: consts.Left,
// 				Top: 1,
// 			})
// 		})
// 		m.Col(3, func() {
// 			m.Text("เดือน", props.Text{
// 				Size:  16,
// 				Style: consts.Bold,
// 				Align: consts.Center,
// 				Top: 1,
// 			})
// 		})
// 		m.Col(3, func() {
// 			m.Text("จำนวนเงิน (บาท)  ", props.Text{
// 				Size:  16,
// 				Style: consts.Bold,
// 				Align: consts.Right,
// 				Top: 1,
// 			})
// 		})
// 	})

// 	m.SetBackgroundColor(color.NewWhite())

// 	for i, item := range invoice.Items {
// 		index := strconv.Itoa(i+1) + ". "
// 		m.Row(10, func() {
// 			m.Col(6, func() {
// 				m.Text("  "+index+item.Description, props.Text{
// 					Size:  16,
// 					Align: consts.Left,
// 				})
// 			})
// 			m.Col(3, func() {
// 				m.Text(ThaiDateMonthYear(invoice.BillingPeriod), props.Text{
// 					Size:  16,
// 					Align: consts.Center,
// 				})
// 			})
// 			m.Col(3, func() {
// 				m.Text(strconv.FormatFloat(item.Amount, 'f', 2, 64)+"  ", props.Text{
// 					Size:  16,
// 					Align: consts.Right,
// 				})
// 			})
// 		})
// 	}

// 	m.Row(4, func() {})

// 	m.SetBackgroundColor(color.Color{
// 		Red:   200,
// 		Green: 200,
// 		Blue:  200,
// 	})

// 	// รวมยอด
// 	m.Row(10, func() {
// 		m.Col(9, func() {
// 			m.Text("รวมค่าใช้จ่ายประจำเดือน"+ThaiDateMonthYear(invoice.BillingPeriod)+" ทั้งสิ้น", props.Text{
// 				Size:  16,
// 				Style: consts.Bold,
// 				Align: consts.Right,
// 				Top: 1,
// 			})
// 		})
// 		m.Col(3, func() {
// 			m.Text(strconv.FormatFloat(invoice.TotalAmount, 'f', 2, 64)+"  ", props.Text{
// 				Size:  16,
// 				Style: consts.Bold,
// 				Align: consts.Right,
// 				Top: 1,
// 			})
// 		})
// 	})

// 	m.SetBackgroundColor(color.NewWhite())

// 	m.Row(16, func() {
// 		m.Text("        จึงขอให้ท่านโปรดชำระค่าบริการภายในวันที่ "+ThaiDateFull(invoice.DueDate)+" ที่หน่วยบริหารงานกลางและพัฒนา", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 		})
// 		m.Text("โครงสร้างพื้นฐาน อุทยานวิทยาศาสตร์ภาคตะวันออกเฉียงเหนือตอนล่าง (จ.นครราชสีมา) หรือโอนเงินเข้า", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 		m.Text("บัญชีธนาคารกรุงไทย สาขามหาวิทยาลัยเทคโนโลยีสุรนารี ชื่อบัญชี \"RSP นครราชสีมา โดย เทคโนธานี\"", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 		m.Text("เลขที่บัญชี 662-1-84151-5 และขอให้ท่านส่งหลักฐานการโอนเงินมาที่ หน่วยบริหารงานกลางและพัฒนา", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 		m.Text("โครงสร้างพื้นฐาน อีเมล office.ne2@gmail.com เบอร์โทร 099-629-5494 เพื่อออกใบเสร็จรับเงิน หาก", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 		m.Text("ท่านไม่ชำระเงินตามกำหนดดังกล่าว อุทยานวิทยาศาสตร์ฯ ขอสงวนสิทธิ์ดำเนินการปรับตามข้อตกลงตั้งแต่วัน", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 		m.Text("ผิดข้อตกลงจนกว่าจะชำระเสร็จสิ้น", props.Text{
// 			Size:  16,
// 			Style: consts.Normal,
// 			Align: consts.Left,
// 			Top:   6,
// 		})
// 	})

// 	m.Row(8, func() {
// 		m.Text("        จึงเรียนมาเพื่อโปรดพิจารณาดำเนินการ", props.Text{
// 			Size:  16,
// 			Style: consts.Bold,
// 			Align: consts.Left,
// 		})
// 	})

// 	m.Row(12, func() {})

// 	m.Row(8, func() {
// 		m.Text("ขอแสดงความนับถือ", props.Text{
// 			Size:  16,
// 			Style: consts.Bold,
// 			Align: consts.Left,
// 		})
// 	})

// 	// ส่ง header
// 	c.Header("Content-Type", "application/pdf")
// 	c.Header("Content-Disposition", "attachment; filename=invoice_"+invoice.InvoiceNumber+".pdf")
// 	c.Header("Content-Transfer-Encoding", "binary")
// 	c.Header("Expires", "0")

// 	// ส่ง PDF ออกไป
// 	buf, err := m.Output()
// 	if err != nil {
// 		log.Printf("PDF generation error: %v", err)
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate PDF"})
// 		return
// 	}

// 	_, err = buf.WriteTo(c.Writer)
// 	if err != nil {
// 		log.Printf("Failed to write PDF to response: %v", err)
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to write PDF"})
// 		return
// 	}
// }

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
