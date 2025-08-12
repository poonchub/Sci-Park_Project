package controller

import (
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"

	// "os/exec"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	// "strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	// "github.com/johnfercher/maroto/pkg/color"
	// "github.com/johnfercher/maroto/pkg/consts"
	// "github.com/johnfercher/maroto/pkg/pdf"
	// "github.com/johnfercher/maroto/pkg/props"

	"bytes"
	"context"
	"html/template"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
	// wkhtmltopdf "github.com/SebastiaanKlippert/go-wkhtmltopdf"
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
// func GetInvoicePDF(c *gin.Context) {
//     id := c.Param("id")
//     db := config.DB()

//     var invoice entity.Invoice
//     result := db.Preload("Items").Preload("Customer").Preload("Creater").First(&invoice, id)
//     if result.Error != nil {
//         c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
//         return
//     }

//     funcMap := template.FuncMap{
//         "add":               add,
//         "ThaiDateFull":      ThaiDateFull,
//         "ThaiDateMonthYear": ThaiDateMonthYear,
//     }

//     tmpl, err := template.New("invoice.html").Funcs(funcMap).ParseFiles("templates/invoice.html")
//     if err != nil {
//         log.Printf("Template load error: %v", err)
//         c.String(http.StatusInternalServerError, "Template load error")
//         return
//     }

//     var htmlBuf bytes.Buffer
//     if err := tmpl.Execute(&htmlBuf, invoice); err != nil {
//         log.Printf("Template execute error: %v", err)
//         c.String(http.StatusInternalServerError, "Template execute error")
//         return
//     }

//     // สร้างตัวแปลง PDF
//     pdfg, err := wkhtmltopdf.NewPDFGenerator()
//     if err != nil {
//         log.Printf("Failed to create PDF generator: %v", err)
//         c.String(http.StatusInternalServerError, "PDF generator error")
//         return
//     }

//     // สร้าง page จาก HTML string
//     page := wkhtmltopdf.NewPageReader(bytes.NewReader(htmlBuf.Bytes()))
//     page.EnableLocalFileAccess.Set(true) // เปิดถ้าใช้รูปจากไฟล์ local

//     // ตั้งค่าต่างๆ เพิ่มเติมได้ เช่น
//     page.NoBackground.Set(false) // ต้องการ background
//     page.Zoom.Set(1.0)

//     pdfg.AddPage(page)

//     // สร้าง PDF (sync)
//     err = pdfg.Create()
//     if err != nil {
//         log.Printf("PDF creation error: %v", err)
//         c.String(http.StatusInternalServerError, "PDF creation error")
//         return
//     }

//     // ส่ง PDF กลับ client
//     c.Header("Content-Type", "application/pdf")
//     c.Header("Content-Disposition", "attachment; filename=invoice_"+invoice.InvoiceNumber+".pdf")
//     c.Data(http.StatusOK, "application/pdf", pdfg.Bytes())
// }

// func GetInvoicePDF(c *gin.Context) {
//     id := c.Param("id")
//     db := config.DB()

//     var invoice entity.Invoice
//     result := db.Preload("Items").Preload("Customer").Preload("Creater").First(&invoice, id)
//     if result.Error != nil {
//         c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
//         return
//     }

//     funcMap := template.FuncMap{
//         "add":               add,
//         "ThaiDateFull":      ThaiDateFull,
//         "ThaiDateMonthYear": ThaiDateMonthYear,
//     }

//     tmpl, err := template.New("invoice.html").Funcs(funcMap).ParseFiles("templates/invoice.html")
//     if err != nil {
//         log.Printf("Template load error: %v", err)
//         c.String(http.StatusInternalServerError, "Template load error")
//         return
//     }

//     var htmlBuf bytes.Buffer
//     if err := tmpl.Execute(&htmlBuf, invoice); err != nil {
//         log.Printf("Template execute error: %v", err)
//         c.String(http.StatusInternalServerError, "Template execute error")
//         return
//     }

//     // สร้างไฟล์ HTML ชั่วคราว
//     htmlFile, err := os.CreateTemp("", "invoice_*.html")
//     if err != nil {
//         log.Printf("Temp file create error: %v", err)
//         c.String(http.StatusInternalServerError, "Temp file error")
//         return
//     }
//     defer os.Remove(htmlFile.Name()) // ลบหลังใช้เสร็จ

//     if _, err := htmlFile.Write(htmlBuf.Bytes()); err != nil {
//         log.Printf("Write HTML error: %v", err)
//         c.String(http.StatusInternalServerError, "Write HTML error")
//         return
//     }
//     htmlFile.Close()

//     // สร้างไฟล์ PDF ชั่วคราว
//     pdfFile, err := os.CreateTemp("", "invoice_*.pdf")
//     if err != nil {
//         log.Printf("Temp PDF create error: %v", err)
//         c.String(http.StatusInternalServerError, "Temp file error")
//         return
//     }
//     defer os.Remove(pdfFile.Name())

//     // เรียก wkhtmltopdf
//     cmd := exec.Command("wkhtmltopdf",
//         "--enable-local-file-access", // ให้โหลดไฟล์ CSS/IMG จาก local ได้
//         htmlFile.Name(),
//         pdfFile.Name(),
//     )

//     if err := cmd.Run(); err != nil {
//         log.Printf("wkhtmltopdf error: %v", err)
//         c.String(http.StatusInternalServerError, "PDF generation error")
//         return
//     }

//     // โหลด PDF กลับมา
//     pdfData, err := os.ReadFile(pdfFile.Name())
//     if err != nil {
//         log.Printf("Read PDF error: %v", err)
//         c.String(http.StatusInternalServerError, "PDF read error")
//         return
//     }

//     // ส่ง PDF ให้ดาวน์โหลด
//     c.Header("Content-Type", "application/pdf")
//     c.Header("Content-Disposition", "attachment; filename=invoice_"+invoice.InvoiceNumber+".pdf")
//     c.Data(http.StatusOK, "application/pdf", pdfData)
// }

func GetInvoicePDF(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var invoice entity.Invoice
	result := db.Preload("Items").Preload("Customer").Preload("Creater.Role").Preload("Creater.Prefix").First(&invoice, id)
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

	// allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	// defer cancel()

	// ctx, cancel := chromedp.NewContext(allocCtx)
	// defer cancel()

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

	nextInvoiceNumber, err := GenerateNextInvoiceNumber(db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	invoice.InvoiceNumber = nextInvoiceNumber

	var status entity.PaymentStatus
	if err := db.Where("name = ?", "Pending").First(&status).Error; err != nil {
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

	var room entity.Room
	if err := db.First(&room, invoice.RoomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room not found"})
	}

	invoiceData := entity.Invoice{
		InvoiceNumber: invoice.InvoiceNumber,
		IssueDate:     invoice.IssueDate,
		DueDate:       invoice.DueDate,
		BillingPeriod: invoice.BillingPeriod,
		TotalAmount:   invoice.TotalAmount,
		RoomID: 	   invoice.RoomID,	
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

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    invoiceData,
	})

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
	var lastInvoice entity.Invoice
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
