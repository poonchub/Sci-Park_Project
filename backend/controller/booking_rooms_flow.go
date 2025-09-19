// controller/booking_rooms_flow.go
package controller

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"reflect"
	"strconv"
	"strings"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/* =======================
 * Utilities / Helpers
 * ======================= */

// ดึง/สร้าง BookingStatus แบบ case-insensitive
func getOrCreateBookingStatus(tx *gorm.DB, name string) (*entity.BookingStatus, error) {
	var st entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", strings.ToLower(strings.TrimSpace(name))).First(&st).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			st = entity.BookingStatus{StatusName: name}
			if err := tx.Create(&st).Error; err != nil {
				return nil, err
			}
		} else {
			return nil, err
		}
	}
	return &st, nil
}

func setBookingStatus(tx *gorm.DB, bookingID uint, statusName string) error {
	st, err := getOrCreateBookingStatus(tx, statusName)
	if err != nil {
		return err
	}
	return tx.Model(&entity.BookingRoom{}).
		Where("id = ?", bookingID).
		Updates(map[string]interface{}{"status_id": st.ID, "updated_at": time.Now()}).
		Error
}

// ปลอดภัย: พยายามหา PaymentStatus ID ถ้าไม่มีให้สร้าง

// ปลอดภัย: หาประเภท PaymentType (Deposit/Balance/Full) ถ้าไม่มีให้สร้าง
// ใช้กับตาราง payment_types (คอลัมน์: type_name) — แก้จุดพังตรงนี้
func ensurePaymentType(tx *gorm.DB, name string) (entity.PaymentType, error) {
	n := strings.TrimSpace(name)
	if n == "" {
		return entity.PaymentType{}, fmt.Errorf("empty payment type")
	}

	var pt entity.PaymentType
	// ✅ ต้องค้นด้วย type_name ไม่ใช่ name
	if err := tx.Where("LOWER(type_name) = ?", strings.ToLower(n)).First(&pt).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			pt = entity.PaymentType{TypeName: n}
			if err := tx.Create(&pt).Error; err != nil {
				return pt, err
			}
			return pt, nil
		}
		return pt, err
	}
	return pt, nil
}

// แยกยอด deposit/balance ตามลำดับความสำคัญ: DepositAmount > DepositPercent > 50/50
// แยกยอด deposit/balance:
// 1) ถ้ามี DepositAmount บน booking → ใช้อันนั้น
// 2) มิฉะนั้น → กติกา default 50/50
func splitDepositBalance(b *entity.BookingRoom) (deposit, balance float64) {
	total := b.TotalAmount - b.DiscountAmount
	if total < 0 {
		total = 0
	}

	if b.DepositAmount > 0 && b.DepositAmount < total {
		deposit = round2(b.DepositAmount)
	} else {
		// default: 50/50
		deposit = round2(total / 2.0)
	}
	balance = round2(total - deposit)
	return
}

func currentApproverID(c *gin.Context) *uint {
	if v, ok := c.Get("userID"); ok {
		switch t := v.(type) {
		case uint:
			return &t
		case int:
			u := uint(t)
			return &u
		case float64:
			u := uint(t)
			return &u
		}
	}
	if s := c.GetHeader("X-User-ID"); s != "" {
		if id, err := strconv.ParseUint(s, 10, 64); err == nil {
			u := uint(id)
			return &u
		}
	}
	if q := c.Query("approver_id"); q != "" {
		if id, err := strconv.ParseUint(q, 10, 64); err == nil {
			u := uint(id)
			return &u
		}
	}
	return nil
}

/* =======================
 * Response builder
 * ======================= */

type userLite struct {
	ID         uint   `json:"ID"`
	FirstName  string `json:"FirstName"`
	LastName   string `json:"LastName"`
	EmployeeID string `json:"EmployeeID"`
}

// ใช้สร้าง response ของ BookingRoom ให้ตรงรูปแบบหน้า All/My
func buildBookingRoomResponse(b entity.BookingRoom) BookingRoomResponse {
	bookingDate := time.Now()
	if len(b.BookingDates) > 0 {
		bookingDate = b.BookingDates[0].Date
	}
	merged := mergeTimeSlots(b.TimeSlots, bookingDate)

	status := b.Status.StatusName
	if b.CancelledAt != nil {
		status = "Cancelled"
	}

	var addInfo AdditionalInfo
	if b.AdditionalInfo != "" {
		_ = json.Unmarshal([]byte(b.AdditionalInfo), &addInfo)
	}

	pList, pActive := buildPaymentSummaries(b.Payments)
	if pList == nil {
		pList = []PaymentSummary{}
	}

	var invoicePDFPath *string
	if b.RoomBookingInvoice != nil && b.RoomBookingInvoice.InvoicePDFPath != "" {
		p := normalizeSlashes(b.RoomBookingInvoice.InvoicePDFPath)
		invoicePDFPath = &p
	}

	var ap *userLite
	switch {
	case b.ApproverID != nil && b.Approver.ID != 0:
		ap = &userLite{
			ID:         b.Approver.ID,
			FirstName:  b.Approver.FirstName,
			LastName:   b.Approver.LastName,
			EmployeeID: b.Approver.EmployeeID,
		}
	case b.RoomBookingInvoice != nil && b.RoomBookingInvoice.Approver.ID != 0:
		ap = &userLite{
			ID:         b.RoomBookingInvoice.Approver.ID,
			FirstName:  b.RoomBookingInvoice.Approver.FirstName,
			LastName:   b.RoomBookingInvoice.Approver.LastName,
			EmployeeID: b.RoomBookingInvoice.Approver.EmployeeID,
		}
	}

	fin := computeBookingFinance(b)
	disp := computeDisplayStatus(b)

	return BookingRoomResponse{
		ID:                 b.ID,
		Room:               b.Room,
		BookingDates:       append([]entity.BookingDate{}, b.BookingDates...),
		TimeSlotMerged:     merged,
		User:               b.User,
		Purpose:            b.Purpose,
		AdditionalInfo:     addInfo,
		StatusName:         status,
		Payment:            pActive,
		Payments:           pList,
		RoomBookingInvoice: b.RoomBookingInvoice,
		DisplayStatus:      disp,
		InvoicePDFPath:     invoicePDFPath,
		Finance:            fin,
		PaymentOption:      &b.PaymentOption,
		Approver:           ap,
		ConfirmedAt:        b.ConfirmedAt,
	}
}

/* =======================
 * GET /booking-rooms/:id
 * ======================= */

func GetBookingRoomByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var b entity.BookingRoom
	if err := db.First(&b, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load booking failed"})
		return
	}

	if err := db.
		Model(&entity.BookingRoom{}).
		Preload("Room.Floor").
		Preload("User").
		Preload("Approver").
		Preload("BookingDates").
		Preload("TimeSlots").
		Preload("Status").
		Preload("PaymentOption").
		Preload("RoomBookingInvoice").
		Preload("RoomBookingInvoice.Approver").
		Preload("RoomBookingInvoice.Customer").
		Preload("RoomBookingInvoice.Items").
		Preload("Payments", func(tx *gorm.DB) *gorm.DB {
			return tx.Order("payments.created_at ASC").Order("payments.id ASC")
		}).
		Preload("Payments.Status").
		Preload("Payments.Payer").
		Preload("Payments.Approver").
		Preload("Payments.PaymentType").
		Preload("Notifications").
		First(&b, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load relations failed"})
		return
	}

	resp := buildBookingRoomResponse(b)
	c.JSON(http.StatusOK, resp)
}

/* =======================
 * Approve / Reject
 * ======================= */

// POST /booking-rooms/:id/approve
// Flow ใหม่:
// - Booking → "Pending Payment" (จากเดิมบางที่ใช้ "Confirmed")
// - ถ้า PaymentOption = deposit → สร้าง 2 payments (Deposit/Balance) สถานะ "Awaiting payment" ทั้งคู่
// - ถ้า full → สร้าง 1 payment (Full) สถานะ "Awaiting payment"
// - Idempotent: ถ้ามี payment แล้วจะไม่สร้างซ้ำ
func ApproveBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var b entity.BookingRoom
	if err := tx.
		Preload("Payments.Status").
		Preload("BookingDates").
		Preload("TimeSlots").
		Preload("User").
		Preload("PaymentOption").
		Preload("Room.RoomType").
		Preload("Approver").
		First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}
	if b.CancelledAt != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "booking has been cancelled"})
		return
	}

	aid := currentApproverID(c)

	// Set confirmed_at & event window (ครั้งแรกเท่านั้น)
	if b.ConfirmedAt == nil {
		now := time.Now()
		if err := tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Update("confirmed_at", &now).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set confirmed time"})
			return
		}
	}
	if len(b.BookingDates) > 0 {
		first, _ := minBookingDate(b)
		last, _ := lastBookingDate(&b)
		updates := map[string]interface{}{"updated_at": time.Now()}
		if b.EventStartAt.IsZero() {
			updates["event_start_at"] = first
		}
		if b.EventEndAt.IsZero() {
			updates["event_end_at"] = last
		}
		if len(updates) > 1 {
			if err := tx.Model(&entity.BookingRoom{}).
				Where("id = ?", b.ID).
				Updates(updates).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set event start/end"})
				return
			}
		}
	}

	// Booking → Pending Payment (+ approver_id ถ้ามี)
	upd := map[string]interface{}{
		"updated_at": time.Now(),
	}
	if aid != nil && *aid > 0 {
		upd["approver_id"] = *aid
	}
	if err := setBookingStatus(tx, b.ID, "Pending Payment"); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to set booking status"})
		return
	}
	if len(upd) > 1 { // มี approver
		if err := tx.Model(&entity.BookingRoom{}).Where("id = ?", b.ID).Updates(upd).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update approver"})
			return
		}
	}

	// Idempotent: ถ้ามี payments แล้วไม่สร้างซ้ำ
	var cnt int64
	if err := tx.Model(&entity.Payment{}).
		Where("booking_room_id = ?", b.ID).
		Count(&cnt).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to count payments"})
		return
	}
	if cnt == 0 {
		awaitID, err := ensurePaymentStatusID(tx, "Awaiting payment")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing payment status: awaiting payment"})
			return
		}
		ptDep, err := ensurePaymentType(tx, "Deposit")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing payment type: deposit"})
			return
		}
		ptBal, err := ensurePaymentType(tx, "Balance")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing payment type: balance"})
			return
		}
		ptFull, err := ensurePaymentType(tx, "Full")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "missing payment type: full"})
			return
		}

		option := strings.ToLower(strings.TrimSpace(b.PaymentOption.OptionName))
		switch option {
		case "deposit":
			dep, bal := splitDepositBalance(&b)
			p1 := entity.Payment{
				BookingRoomID: b.ID,
				Amount:        dep,
				StatusID:      awaitID,
				PaymentTypeID: ptDep.ID,
			}
			p2 := entity.Payment{
				BookingRoomID: b.ID,
				Amount:        bal,
				StatusID:      awaitID,
				PaymentTypeID: ptBal.ID,
			}
			if err := tx.Create(&p1).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "create deposit payment failed"})
				return
			}
			if err := tx.Create(&p2).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "create balance payment failed"})
				return
			}
		case "full", "":
			total := b.TotalAmount - b.DiscountAmount
			if total < 0 {
				total = 0
			}
			p := entity.Payment{
				BookingRoomID: b.ID,
				Amount:        round2(total),
				StatusID:      awaitID,
				PaymentTypeID: ptFull.ID,
			}
			if err := tx.Create(&p).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "create full payment failed"})
				return
			}
		default:
			// treat as full
			total := b.TotalAmount - b.DiscountAmount
			if total < 0 {
				total = 0
			}
			p := entity.Payment{
				BookingRoomID: b.ID,
				Amount:        round2(total),
				StatusID:      awaitID,
				PaymentTypeID: ptFull.ID,
			}
			if err := tx.Create(&p).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "create payment failed"})
				return
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	// Reload for FE with relations
	if err := db.
		Preload("Payments.Status").
		Preload("PaymentOption").
		Preload("Status").
		Preload("Room").
		Preload("User").
		Preload("Approver").
		First(&b, b.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload booking failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "booking approved & payments initialized",
		"data":    buildBookingRoomResponse(b),
	})
}

// POST /booking-rooms/:id/reject
func RejectBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var req struct {
		Note string `json:"note" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil || strings.TrimSpace(req.Note) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุเหตุผลการยกเลิก"})
		return
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var b entity.BookingRoom
	if err := tx.First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
		return
	}

	now := time.Now()
	if err := setBookingStatus(tx, b.ID, "Cancelled"); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ตั้งค่าสถานะ Cancelled ไม่สำเร็จ"})
		return
	}
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{
			"cancelled_at":   &now,
			"cancelled_note": strings.TrimSpace(req.Note),
			"updated_at":     time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถยกเลิกได้"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกสำเร็จ"})
}

/* =======================
 * Receipt Upload/Delete
 * ======================= */

func UploadPaymentReceipt(c *gin.Context) {
	db := config.DB()

	pid := c.Param("payment_id")
	var pay entity.Payment
	if err := db.Preload("Status").Preload("BookingRoom").First(&pay, pid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	// ----- validate & save file -----
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must be a PDF"})
		return
	}

	dir := fmt.Sprintf("images/payments/booking_%d", pay.BookingRoomID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create dir"})
		return
	}
	fname := fmt.Sprintf("receipt_payment_%d_%d.pdf", pay.ID, time.Now().Unix())
	full := filepath.Join(dir, fname)
	if err := c.SaveUploadedFile(file, full); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "upload failed"})
		return
	}
	uploadedPath := normalizeSlashes(full)

	if err := db.Model(&entity.Payment{}).
		Where("id = ?", pay.ID).
		Updates(map[string]any{
			"receipt_path": uploadedPath,
			"updated_at":   time.Now(),
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update payment failed"})
		return
	}

	// ----- reload booking + payments -----
	var b entity.BookingRoom
	if err := db.Preload("Payments.Status").First(&b, pay.BookingRoomID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload booking failed"})
		return
	}

	// ===== compute due/paid =====
	totalDue := b.TotalAmount - b.DiscountAmount
	if totalDue < 0 {
		totalDue = 0
	}

	// ✅ ถ้าดิวเป็นศูนย์ ไม่ต้องรอใบเสร็จ -> Complete เลย
	if totalDue == 0 {
		tx := db.Begin()
		if err := setBookingStatus(tx, b.ID, "Complete"); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "set status failed"})
			return
		}
		_ = tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]any{
				"is_fully_prepaid": true,
				"updated_at":       time.Now(),
			}).Error
		if err := tx.Commit().Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
			return
		}
		c.JSON(http.StatusOK, gin.H{
			"message":        "receipt uploaded",
			"path":           uploadedPath,
			"booking_id":     b.ID,
			"total_due":      totalDue,
			"total_paid":     0,
			"fully_paid":     true,
			"missingReceipt": false,
		})
		return
	}

	// --- helper: ดึงชื่อสถานะจากทั้ง relation และ string ---
	getPayStatus := func(p entity.Payment) string {
		if s := strings.TrimSpace(p.Status.Name); s != "" {
			return strings.ToLower(s)
		}
		// เผื่อมีฟิลด์ string ชื่อ Status/StatusName ใน struct/json
		if v, ok := any(p).(interface{ GetStatus() string }); ok {
			return strings.ToLower(strings.TrimSpace(v.GetStatus()))
		}
		// fallback: ถ้า entity.Payment มีฟิลด์ Status string ให้ใช้รีเฟล็กซ์ (กันพลาด)
		if raw, ok := reflect.ValueOf(p).FieldByNameFunc(func(n string) bool { return n == "Status" || n == "StatusName" }).Interface().(string); ok {
			return strings.ToLower(strings.TrimSpace(raw))
		}
		return ""
	}

	inferAmount := func(p entity.Payment) float64 {
		if p.Amount > 0 {
			return p.Amount
		}
		note := strings.ToLower(strings.TrimSpace(p.Note))
		if strings.Contains(note, "deposit") {
			if b.DepositAmount > 0 {
				return b.DepositAmount
			}
			if b.TotalAmount > 0 {
				return b.TotalAmount / 2
			}
			return 0
		}
		if b.DepositAmount > 0 && b.TotalAmount >= b.DepositAmount {
			return b.TotalAmount - b.DepositAmount
		}
		return b.TotalAmount // full payment
	}

	var totalPaid float64
	var totalPaidWithReceipt float64

	for _, p := range b.Payments {
		st := getPayStatus(p) // "approved" | "paid" | "refunded" | ...
		if st == "approved" || st == "paid" {
			amt := inferAmount(p)
			totalPaid += amt
			if strings.TrimSpace(p.ReceiptPath) != "" {
				totalPaidWithReceipt += amt
			}
		}
	}

	fullyPaid := totalPaid >= totalDue
	fullyPaidWithReceipt := totalPaidWithReceipt >= totalDue

	tx := db.Begin()

	switch {
	case fullyPaidWithReceipt:
		// ✅ ยอดที่มีใบเสร็จครอบคลุมหนี้ -> Complete
		if err := setBookingStatus(tx, b.ID, "Complete"); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "set status failed"})
			return
		}
		_ = tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]any{
				"is_fully_prepaid": true,
				"updated_at":       time.Now(),
			}).Error

	case fullyPaid:
		// ✅ จ่ายครบแต่ใบเสร็จยังไม่ครบ -> Awaiting Receipt
		_ = setBookingStatus(tx, b.ID, "Awaiting Receipt")

	default:
		// จ่ายยังไม่ครบ -> อยู่ในสถานะเดิม/รอชำระต่อ
		// คุณจะตั้งเป็น "Payment" หรือ "Payment Review" ตาม flow ก็ได้
		_ = setBookingStatus(tx, b.ID, "Payment")
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "commit failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "receipt uploaded",
		"path":            uploadedPath,
		"booking_id":      b.ID,
		"total_due":       totalDue,
		"total_paid":      totalPaid,
		"paid_with_rcpt":  totalPaidWithReceipt,
		"fully_paid":      fullyPaid,
		"fully_with_rcpt": fullyPaidWithReceipt,
	})
}

// DELETE /payments/receipt/:payment_id
func DeletePaymentReceipt(c *gin.Context) {
	db := config.DB()

	pidStr := c.Param("payment_id")
	pid, err := strconv.ParseUint(pidStr, 10, 64)
	if err != nil || pid == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payment_id"})
		return
	}

	var p entity.Payment
	if err := db.First(&p, pid).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load payment failed"})
		return
	}

	if p.ReceiptPath != "" {
		_ = os.Remove(p.ReceiptPath) // best-effort
	}

	updates := map[string]any{
		"receipt_path": "",
		"updated_at":   time.Now(),
	}
	if db.Migrator().HasColumn(&entity.Payment{}, "receipt_status") {
		updates["receipt_status"] = "awaiting receipt"
	}

	if err := db.Model(&p).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update payment (clear receipt) failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
