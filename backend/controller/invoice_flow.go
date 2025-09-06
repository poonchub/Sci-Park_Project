// controller/invoice_flow.go
package controller

import (
	
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
	"strconv"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	
)

// ใช้ของเดิมที่คุณมีอยู่แล้ว
func firstBookingDate(b *entity.BookingRoom) (time.Time, bool) {
	return minBookingDate(*b)
}

func lastBookingDate(b *entity.BookingRoom) (time.Time, bool) {
	if len(b.BookingDates) == 0 {
		return time.Time{}, false
	}
	max := b.BookingDates[0].Date
	for _, d := range b.BookingDates {
		if d.Date.After(max) {
			max = d.Date
		}
	}
	// normalize ให้เป็น 00:00 ของวันนั้นเหมือน minBookingDate
	return time.Date(max.Year(), max.Month(), max.Day(), 0, 0, 0, 0, max.Location()), true
}

// -------- helpers --------
func invStatusID(name string) (uint, error) {
	db := config.DB()
	var s entity.PaymentStatus
	if err := db.Where("LOWER(name) = ?", strings.ToLower(name)).First(&s).Error; err != nil {
		return 0, err
	}
	return s.ID, nil
}
func invMustStatusID(name string) uint { id, _ := invStatusID(name); return id }

func sumInvoicePaidForBooking(bid uint) (float64, error) {
	db := config.DB()
	var invs []entity.Invoice
	if err := db.Where("booking_room_id = ?", bid).Find(&invs).Error; err != nil { return 0, err }
	var s float64
	for _, v := range invs { s += v.PaidAmount }
	return s, nil
}

func applyInvoiceStatus(iv *entity.Invoice) error {
	db := config.DB()
	switch {
	case iv.PaidAmount <= 0:
		iv.StatusID = invMustStatusID("Unpaid")
	case iv.PaidAmount < iv.TotalAmount:
		iv.StatusID = invMustStatusID("Partially Paid")
	default:
		iv.StatusID = invMustStatusID("Paid")
	}
	return db.Save(iv).Error
}

// -------- POST /booking-rooms/:id/invoices/deposit --------
// body: { "total_amount": 12345.67 }
func CreateDepositInvoiceHandler(c *gin.Context) {
	db := config.DB()
	bid := c.Param("id")

	var req struct{ TotalAmount float64 `json:"total_amount" binding:"required,gt=0"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"total_amount invalid"}); return
	}

	var b entity.BookingRoom
	if err := db.Preload("BookingDates").First(&b, bid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบการจอง"}); return
	}
	if b.CancelledAt != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"การจองถูกยกเลิกแล้ว"}); return
	}

	now := time.Now()
	if b.ConfirmedAt == nil {
		b.ConfirmedAt = &now
		if err := db.Save(&b).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error":"อัปเดตเวลายืนยันไม่สำเร็จ"}); return
		}
	}

	inv := entity.Invoice{
		BookingRoomID: b.ID,
		InvoiceNumber: fmt.Sprintf("DEP-%d-%d", b.ID, now.Unix()),
		IssueDate:     now,
		DueDate:       b.ConfirmedAt.Add(7*24*time.Hour),
		BillingPeriod: now,
		TotalAmount:   req.TotalAmount * 0.5,
		InvoiceType:   "deposit",
		PaidAmount:    0,
		StatusID:      invMustStatusID("Unpaid"),
		RoomID:        b.RoomID,
		CreaterID:     b.UserID,
		CustomerID:    b.UserID,
	}
	if err := db.Create(&inv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"สร้างใบแจ้งหนี้มัดจำไม่สำเร็จ"}); return
	}
	c.JSON(http.StatusCreated, gin.H{"message":"สร้างใบแจ้งหนี้มัดจำแล้ว", "invoice": inv})
}

// -------- POST /booking-rooms/:id/invoices/full --------
// body: { "total_amount": 12345.67, "paid_at_rfc3339": "2025-09-03T10:00:00+07:00" }
func CreateFullInvoiceHandler(c *gin.Context) {
	db := config.DB()
	bid := c.Param("id")

	var req struct{
		TotalAmount float64 `json:"total_amount" binding:"required,gt=0"`
		PaidAtRFC3339 string `json:"paid_at_rfc3339"` // optional
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"payload invalid"}); return
	}

	var b entity.BookingRoom
	if err := db.Preload("BookingDates").First(&b, bid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบการจอง"}); return
	}
	now := time.Now()
	paidAt := now
	if req.PaidAtRFC3339 != "" {
		if t, err := time.Parse(time.RFC3339, req.PaidAtRFC3339); err == nil {
			paidAt = t
		}
	}

	// วันเริ่มอีเวนต์: เอาวันที่น้อยที่สุดจาก BookingDates ถ้าไม่ได้เก็บ EventStartAt
	start := paidAt
	if t, ok := firstBookingDate(&b); ok { start = t }

	isPreEvent := paidAt.Before(start)

	inv := entity.Invoice{
		BookingRoomID:   b.ID,
		InvoiceNumber:   fmt.Sprintf("FUL-%d-%d", b.ID, now.Unix()),
		IssueDate:       paidAt,
		DueDate:         start,
		BillingPeriod:   start,
		TotalAmount:     req.TotalAmount,
		PaidAmount:      req.TotalAmount,
		InvoiceType:     "full",
		IsNonRefundable: isPreEvent,
		StatusID:        invMustStatusID("Paid"),
		RoomID:          b.RoomID,
		CreaterID:       b.UserID,
		CustomerID:      b.UserID,
	}
	if err := db.Create(&inv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"สร้างใบแจ้งหนี้เต็มจำนวนไม่สำเร็จ"}); return
	}

	// ธงสิทธิ์เลื่อน
	b.IsFullyPrepaid = isPreEvent
	b.CanReschedule  = isPreEvent
	_ = db.Save(&b)

	c.JSON(http.StatusCreated, gin.H{"message":"สร้างใบแจ้งหนี้เต็มจำนวนแล้ว", "invoice": inv})
}

// -------- POST /booking-rooms/:id/invoices/final --------
// body: { "booking_total": 12345.67 }
func CreateFinalInvoiceHandler(c *gin.Context) {
	db := config.DB()
	bid := c.Param("id")

	var req struct{ BookingTotal float64 `json:"booking_total" binding:"required,gt=0"` }
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error":"booking_total invalid"}); return
	}

	var b entity.BookingRoom
	if err := db.Preload("BookingDates").First(&b, bid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบการจอง"}); return
	}

	paidSum, err := sumInvoicePaidForBooking(b.ID)
	if err != nil { c.JSON(http.StatusInternalServerError, gin.H{"error":"คำนวณยอดที่จ่ายแล้วไม่สำเร็จ"}); return }
	remain := req.BookingTotal - paidSum
	if remain <= 0 {
		c.JSON(http.StatusOK, gin.H{"message":"ไม่มียอดค้างชำระ"}); return
	}

	end := time.Now()
	if t, ok := lastBookingDate(&b); ok { end = t }

	inv := entity.Invoice{
		BookingRoomID: b.ID,
		InvoiceNumber: fmt.Sprintf("FIN-%d-%d", b.ID, time.Now().Unix()),
		IssueDate:     time.Now(),
		DueDate:       end.Add(7*24*time.Hour),
		BillingPeriod: end,
		TotalAmount:   remain,
		InvoiceType:   "final",
		PaidAmount:    0,
		StatusID:      invMustStatusID("Unpaid"),
		RoomID:        b.RoomID,
		CreaterID:     b.UserID,
		CustomerID:    b.UserID,
	}
	if err := db.Create(&inv).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"สร้างใบแจ้งหนี้งวดสุดท้ายไม่สำเร็จ"}); return
	}
	c.JSON(http.StatusCreated, gin.H{"message":"สร้างใบแจ้งหนี้งวดสุดท้ายแล้ว", "invoice": inv})
}

// -------- POST /invoices/mark-overdue --------
func MarkOverdueInvoicesHandler(c *gin.Context) {
	db := config.DB()
	var invs []entity.Invoice
	if err := db.Where("due_date < ? AND status_id IN (?)",
		time.Now(),
		[]uint{invMustStatusID("Unpaid"), invMustStatusID("Partially Paid")},
	).Find(&invs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error":"ดึงรายการใบแจ้งหนี้ล้มเหลว"}); return
	}
	overID := invMustStatusID("Overdue")
	for i := range invs {
		invs[i].StatusID = overID
		_ = db.Save(&invs[i]).Error
	}
	c.JSON(http.StatusOK, gin.H{"marked": len(invs)})
}

// -------- POST /invoices/:invoiceId/upload-slip --------
// multipart: file (image), fields: Amount, PayerID, PaymentDate(optional RFC3339)
// POST /invoices/:id/upload-slip
func UploadInvoiceSlip(c *gin.Context) {
    db := config.DB()
    invIDParam := c.Param("id")

    // 1) โหลด Invoice
    var inv entity.Invoice
    if err := db.First(&inv, invIDParam).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบใบแจ้งหนี้"}); return
    }

    // 2) รับไฟล์
    fileHeader, err := c.FormFile("file")
    if err != nil { c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาแนบไฟล์สลิป"}); return }
    if fileHeader.Size > 10*1024*1024 { c.JSON(http.StatusBadRequest, gin.H{"error": "ไฟล์ใหญ่เกิน 10MB"}); return }

    // 3) อ่านฟิลด์สำคัญจาก form-data (ระวังตัวพิมพ์)
    amtStr := c.PostForm("Amount")   // <- ต้องใช้ "A" ใหญ่ตามนี้
    payerStr := c.PostForm("PayerID")
    if amtStr == "" || payerStr == "" {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Amount / PayerID จำเป็น"}); return
    }
    amount, err := strconv.ParseFloat(amtStr, 64)
    if err != nil || amount <= 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Amount ไม่ถูกต้อง (> 0)"}); return
    }
    payerU64, err := strconv.ParseUint(payerStr, 10, 64)
    if err != nil || payerU64 == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "PayerID ไม่ถูกต้อง"}); return
    }

    // (option) PaymentDate
    payAt := time.Now()
    if pd := c.PostForm("PaymentDate"); pd != "" {
        if t, err := time.Parse(time.RFC3339, pd); err == nil { payAt = t }
    }

    // 4) เซฟไฟล์ → ได้ web path
    baseDir := "images/payment/user_submitted"
    _ = os.MkdirAll(baseDir, 0o755)
    filename := fmt.Sprintf("invoice_%d_%d%s", inv.ID, time.Now().UnixNano(), filepath.Ext(fileHeader.Filename))
    saveFS := filepath.Join(baseDir, filename)
    if err := c.SaveUploadedFile(fileHeader, saveFS); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกไฟล์ไม่สำเร็จ"}); return
    }
    slipWebPath := "/images/payment/user_submitted/" + filename

    // 5) สถานะ Pending Verification
    var ps entity.PaymentStatus
    if err := db.Where("LOWER(name)=?","pending verification").First(&ps).Error; err != nil {
        ps = entity.PaymentStatus{Name: "Pending Verification"}
        _ = db.Create(&ps).Error
    }

    // 6) Create Payment (ผูกกับทั้ง Invoice และ BookingRoom ของใบนี้)
    p := entity.Payment{
        PaymentDate:   payAt,
        Amount:        amount,
        SlipPath:      slipWebPath,
        StatusID:      ps.ID,
        PayerID:       uint(payerU64),
        InvoiceID:     inv.ID,
        BookingRoomID: inv.BookingRoomID,
        Note:          c.PostForm("Note"),
    }
    if err := db.Create(&p).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกข้อมูลการชำระเงินไม่สำเร็จ"}); return
    }

    // (แนะนำ) เติมข้อมูลประกอบให้ response
    _ = db.Preload("Status").Preload("Invoice").First(&p, p.ID)

    // absolute URL
    scheme := "http"; if c.Request.TLS != nil { scheme = "https" }
    absURL := fmt.Sprintf("%s://%s%s", scheme, c.Request.Host, slipWebPath)

    c.JSON(http.StatusCreated, gin.H{
        "message":  "อัปโหลดสลิปสำเร็จ",
        "payment":  p,
        "slip_url": absURL,
    })
}


// -------- helper: เรียกตอนอนุมัติสลิป --------
func ApplyPaymentToInvoiceID(invoiceID uint, amount float64, paidAt time.Time) error {
	db := config.DB()
	var inv entity.Invoice
	if err := db.First(&inv, invoiceID).Error; err != nil { return err }
	inv.PaidAmount += amount
	return applyInvoiceStatus(&inv)
}
