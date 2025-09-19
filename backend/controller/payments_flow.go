// controller/payment.go
package controller

import (
	"errors"
	"fmt"
	"log"
	"math"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

/* ==========================
   Small helpers
   ========================== */

// ดึงค่าจาก multipart/form-data แบบปลอดภัย (ลองหลายคีย์)
func getFormVal(c *gin.Context, keys ...string) string {
	_ = c.Request.ParseMultipartForm(32 << 20)
	for _, k := range keys {
		if v := strings.TrimSpace(c.PostForm(k)); v != "" {
			return v
		}
		if c.Request.MultipartForm != nil {
			if vals, ok := c.Request.MultipartForm.Value[k]; ok && len(vals) > 0 {
				if v := strings.TrimSpace(vals[0]); v != "" {
					return v
				}
			}
		}
	}
	return ""
}

func lower(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func normalizeSlashes(p string) string {
	return strings.ReplaceAll(p, "\\", "/")
}

// ดึง/สร้าง PaymentStatus แบบ case-insensitive
// ใช้กับตาราง payment_statuses (คอลัมน์: name)
func ensurePaymentStatusID(tx *gorm.DB, name string) (uint, error) {
	n := strings.TrimSpace(name)
	if n == "" {
		return 0, fmt.Errorf("empty payment status")
	}

	// ปรับชื่อให้เป็นรูปแบบเดียว
	aliases := map[string][]string{
		"approved":             {"paid", "success", "completed"},
		"pending verification": {"submitted", "processing"},
		"pending payment":      {"unpaid", "awaiting payment"},
		"rejected":             {"failed"},
		"refunded":             {"refund"},
	}

	var ps entity.PaymentStatus
	// หาแบบตรงตัวก่อน
	if err := tx.Where("LOWER(name) = ?", strings.ToLower(n)).First(&ps).Error; err == nil {
		return ps.ID, nil
	}

	// ถ้ามี alias ให้ลองหาในกลุ่มนั้น
	if al, ok := aliases[strings.ToLower(n)]; ok && len(al) > 0 {
		lowerAl := make([]string, 0, len(al))
		for _, a := range al {
			lowerAl = append(lowerAl, strings.ToLower(a))
		}
		if err := tx.Where("LOWER(name) IN ?", lowerAl).First(&ps).Error; err == nil {
			return ps.ID, nil
		}
	}

	// ไม่พบ → สร้างใหม่
	ps = entity.PaymentStatus{Name: n}
	if err := tx.Create(&ps).Error; err != nil {
		return 0, err
	}
	return ps.ID, nil
}

/* ==========================
   Finance helpers (robust)
   ========================== */

// รวบรวมยอดตามสถานะ (ยืดหยุ่นกับ alias)
func summarizeFinance(b *entity.BookingRoom) (paidApproved, paidPending, paidRejected, total, remaining float64) {
	total = b.TotalAmount
	if total < 0 {
		total = 0
	}
	for _, p := range b.Payments {
		switch lower(p.Status.Name) {
		case "paid", "approved", "completed", "success":
			paidApproved += p.Amount
		case "awaiting payment", "pending payment", "pending verification", "verifying", "submitted", "processing":
			paidPending += p.Amount
		case "rejected", "failed":
			paidRejected += p.Amount
		}
	}
	remaining = total - paidApproved
	if remaining < 0 {
		remaining = 0
	}
	return
}

// คำนวณงวดถัดไป (ใช้กับ gating และ response ให้ FE)
func computeNextDue(b *entity.BookingRoom) string {
	paidApproved, _, _, total, remaining := summarizeFinance(b)
	plan := lower(b.PaymentOption.OptionName)

	if plan == "deposit" {
		dep := b.DepositAmount
		if dep <= 0 || dep > total {
			dep = total
		}
		if paidApproved < dep {
			return "deposit"
		}
		if remaining > 0 {
			return "balance"
		}
		return "done"
	}
	if remaining > 0 {
		return "full"
	}
	return "done"
}

// อัปเดต Booking.Status ตามยอด (ไม่สร้างงวดใหม่ - เพราะเราเตรียมไว้ตั้งแต่ Approve แล้ว)
func updateBookingStatusAfterPayment(tx *gorm.DB, b *entity.BookingRoom) error {
	if err := tx.Preload("Payments.Status").
		Preload("PaymentOption").
		First(b, b.ID).Error; err != nil {
		return err
	}

	paidApproved, _, _, total, remaining := summarizeFinance(b)
	plan := lower(b.PaymentOption.OptionName)

	switch {
	case total == 0:
		// กรณีฟรี/ส่วนลดเต็ม
		return setBookingStatus(tx, b.ID, "Complete")
	case remaining <= 0:
		// จ่ายครบ → รอใบเสร็จ
		return setBookingStatus(tx, b.ID, "Awaiting Receipt")
	case plan == "deposit" && paidApproved > 0: // จ่ายบางส่วนแล้ว (Deposit ผ่าน)
		return setBookingStatus(tx, b.ID, "Partially Paid")
	default:
		// ยังไม่ชำระหรือยังไม่พอ → คงเป็น Pending Payment
		return setBookingStatus(tx, b.ID, "Pending Payment")
	}
}

/* ============== helpers ที่ฟังก์ชันนี้อ้างถึง ============== */

// คืนสตริงตัวแรกที่ไม่ว่าง (ใช้ช่วยอ่านชื่อสถานะ/ค่าอื่น ๆ)
func firstNonEmpty(vals ...interface{}) string {
	for _, v := range vals {
		s := strings.TrimSpace(fmt.Sprint(v))
		if s != "" && s != "0" {
			return s
		}
	}
	return ""
}

// ถ้า note ว่าง ให้ใช้ fallback (เช่น instKey: deposit/balance)
func noteIfNotEmpty(note, fallback string) string {
	n := strings.TrimSpace(note)
	if n != "" {
		return n
	}
	return strings.TrimSpace(fallback)
}

/* ============================================================ */
/* ================  SUBMIT / RE-SUBMIT SLIP  ================= */
/* ============================================================ */

func SubmitPaymentSlip(c *gin.Context) {
	db := config.DB()

	// ---- params ----
	bookingIDStr := c.Param("id")
	bookingID64, err := strconv.ParseUint(bookingIDStr, 10, 64)
	if err != nil || bookingID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid booking id"})
		return
	}
	bookingID := uint(bookingID64)

	// ---- file (รองรับ field: slip หรือ file) ----
	fileHeader, err := c.FormFile("slip")
	if err != nil {
		fileHeader, err = c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "slip file is required (multipart/form-data)"})
			return
		}
	}
	// ยอมรับ jpg/png/pdf
	{
		n := strings.ToLower(fileHeader.Filename)
		if !(strings.HasSuffix(n, ".jpg") || strings.HasSuffix(n, ".jpeg") || strings.HasSuffix(n, ".png") || strings.HasSuffix(n, ".pdf")) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "file must be JPG/PNG/PDF"})
			return
		}
	}

	// ---- form fields ----
	payerIDStr := getFormVal(c, "PayerID", "payer_id")
	if payerIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "PayerID is required"})
		return
	}
	payerID64, err := strconv.ParseUint(payerIDStr, 10, 64)
	if err != nil || payerID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid PayerID"})
		return
	}
	payerID := uint(payerID64)

	paymentIDStr := getFormVal(c, "PaymentID", "payment_id")                   // optional
	amountStr := getFormVal(c, "Amount", "amount")                             // optional
	paymentTypeIDStr := getFormVal(c, "PaymentTypeID", "payment_type_id")      // optional
	note := getFormVal(c, "Note", "note")                                      // optional
	instKey := strings.ToLower(getFormVal(c, "InstallmentKey", "installment")) // "full" | "deposit" | "balance"
	paymentDateStr := getFormVal(c, "PaymentDate", "payment_date", "trans_timestamp", "TransTimestamp")

	var amount float64
	if amountStr != "" {
		if v, err := strconv.ParseFloat(amountStr, 64); err == nil && v > 0 {
			amount = v
		}
	}
	var paymentTypeID uint
	if paymentTypeIDStr != "" {
		if v, err := strconv.ParseUint(paymentTypeIDStr, 10, 64); err == nil {
			paymentTypeID = uint(v)
		}
	}
	paymentDate := time.Now()
	if paymentDateStr != "" {
		if t, err := time.Parse(time.RFC3339, paymentDateStr); err == nil {
			paymentDate = t
		}
	}

	// ---- save file ----
	saveDir := fmt.Sprintf("images/payments/booking_%d", bookingID)
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create directory"})
		return
	}
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(fileHeader.Filename))
	destPath := normalizeSlashes(filepath.Join(saveDir, filename))
	if err := c.SaveUploadedFile(fileHeader, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save slip file"})
		return
	}

	// ---- transaction ----
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ---- load booking + relations ที่ใช้คำนวณ ----
	var b entity.BookingRoom
	if err := tx.Preload("Payments.Status").
		Preload("Payments.PaymentType").
		Preload("PaymentOption").
		First(&b, bookingID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	// ---- statuses ----
	psPendingVerID, err := ensurePaymentStatusID(tx, "Pending verification")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot get pending verification status"})
		return
	}

	// helper: เงินที่ approved แล้ว
	sumApproved := func() float64 {
		var s float64
		for _, p := range b.Payments {
			name := strings.ToLower(strings.TrimSpace(p.Status.Name))
			if name == "approved" || name == "paid" {
				s += p.Amount
			}
		}
		return s
	}

	// helper: เดา amount ถ้า FE ไม่ส่งมา
	inferAmount := func(plan, key string) float64 {
		plan = strings.ToLower(strings.TrimSpace(plan)) // "deposit" | "full"
		key = strings.ToLower(strings.TrimSpace(key))   // "deposit" | "balance" | "full"

		total := b.TotalAmount - b.DiscountAmount
		if total < 0 {
			total = 0
		}

		switch {
		case plan == "deposit" && key == "deposit":
			if b.DepositAmount > 0 {
				return b.DepositAmount
			}
			return math.Max(total/2, 0) // fallback ถ้าไม่ตั้งค่า DepositAmount
		case plan == "deposit" && key == "balance":
			dep := b.DepositAmount
			if dep <= 0 {
				dep = total / 2
			}
			return math.Max(total-dep, 0)
		default:
			// full
			paid := sumApproved()
			return math.Max(total-paid, 0)
		}
	}

	// ---- เลือก/สร้าง payment target ----
	var pay entity.Payment

	// (A) explicit PaymentID
	if paymentIDStr != "" {
		if v, err := strconv.ParseUint(paymentIDStr, 10, 64); err == nil && v > 0 {
			if err := tx.Preload("Status").Preload("PaymentType").First(&pay, uint(v)).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
				return
			}
			if pay.BookingRoomID != bookingID {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": "payment does not belong to this booking"})
				return
			}
		}
	}

	// (B) by installment: ลองจับจาก payment_types.name → fallback payments.note
	if pay.ID == 0 && instKey != "" {
		instKey = strings.ToLower(strings.TrimSpace(instKey))

		var openIDs []uint
		_ = tx.Model(&entity.PaymentStatus{}).
			Where("LOWER(name) IN ?", []string{
				"awaiting payment", "pending payment", "pending verification", "rejected", "unpaid",
			}).Pluck("id", &openIDs)

		err := tx.Preload("Status").Preload("PaymentType").
			Joins("JOIN payment_types ON payment_types.id = payments.payment_type_id").
			Where("payments.booking_room_id = ? AND LOWER(payment_types.name) = ? AND payments.status_id IN ?",
				bookingID, instKey, openIDs).
			Order("payments.id DESC").
			First(&pay).Error

		if errors.Is(err, gorm.ErrRecordNotFound) {
			// fallback: note
			_ = tx.Preload("Status").Preload("PaymentType").
				Where("booking_room_id = ? AND LOWER(COALESCE(note,'')) = ? AND status_id IN ?",
					bookingID, instKey, openIDs).
				Order("id DESC").
				First(&pay).Error
		} else if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "query payment by installment failed"})
			return
		}
	}

	// (C) ถ้ายังไม่เจอ → เอา “งวดยังเปิด” ล่าสุด
	if pay.ID == 0 {
		var openIDs []uint
		_ = tx.Model(&entity.PaymentStatus{}).
			Where("LOWER(name) IN ?", []string{
				"awaiting payment", "pending payment", "pending verification", "rejected", "unpaid",
			}).Pluck("id", &openIDs)

		_ = tx.Preload("Status").Preload("PaymentType").
			Where("booking_room_id = ? AND status_id IN ?", bookingID, openIDs).
			Order("id DESC").
			First(&pay).Error
	}

	// (D) ไม่มีจริง ๆ → สร้างใหม่ (สถานะ Pending verification)
	if pay.ID == 0 {
		if amount <= 0 {
			plan := strings.ToLower(strings.TrimSpace(b.PaymentOption.OptionName))
			amount = inferAmount(plan, instKey)
		}
		newPay := entity.Payment{
			BookingRoomID: bookingID,
			PayerID:       payerID,
			StatusID:      psPendingVerID,
			Note:          strings.TrimSpace(instKey),
			Amount:        amount,
			PaymentTypeID: paymentTypeID,
			PaymentDate:   paymentDate,
			SlipPath:      destPath,
		}
		if err := tx.Create(&newPay).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create payment"})
			return
		}
		pay = newPay
	} else {
		// update งวดเดิม (re-submit)
		if amount <= 0 {
			plan := strings.ToLower(strings.TrimSpace(b.PaymentOption.OptionName))
			amount = inferAmount(plan, instKey)
		}
		update := map[string]interface{}{
			"slip_path":    destPath,
			"status_id":    psPendingVerID,
			"payer_id":     payerID,
			"note":         noteIfNotEmpty(note, instKey),
			"payment_date": paymentDate,
			"amount":       amount,
			"approver_id":  0,  // ตัดผลอนุมัติเดิม (ให้ตรวจใหม่)
			"receipt_path": "", // เคลียร์ใบเสร็จเก่า (กันสับสน)
			"updated_at":   time.Now(),
		}
		if paymentTypeID > 0 {
			update["payment_type_id"] = paymentTypeID
		}
		if err := tx.Model(&entity.Payment{}).Where("id = ?", pay.ID).Updates(update).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update payment"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	// reload เพื่อตอบกลับ
	_ = db.Preload("Status").Preload("PaymentType").First(&pay, pay.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "slip uploaded",
		"payment": pay,
		"file":    destPath,
	})
}

/* ==========================
   PATCH /payments/:id/approve
   ========================== */

func ApprovePayment(c *gin.Context) {
	db := config.DB()
	pid := c.Param("id")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// load payment + booking + types
	var pay entity.Payment
	if err := tx.
		Preload("Status").
		Preload("PaymentType").
		Preload("BookingRoom.PaymentOption").
		Preload("BookingRoom.Payments.Status").
		Preload("BookingRoom.Payments.PaymentType").
		First(&pay, pid).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}
	booking := pay.BookingRoom

	// statuses
	paidID, err := ensurePaymentStatusID(tx, "Paid")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Paid status"})
		return
	}
	rejectedID, err := ensurePaymentStatusID(tx, "Rejected")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Rejected status"})
		return
	}

	// already terminal?
	if pay.StatusID == paidID {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "This payment is already paid"})
		return
	}
	if pay.StatusID == rejectedID {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "This payment was rejected"})
		return
	}

	// gating: deposit must be paid before balance (only for deposit plan)
	if lower(booking.PaymentOption.OptionName) == "deposit" && pay.PaymentTypeID != 0 {
		// if this payment is Balance but Deposit not Paid yet → block
		isBalance := strings.EqualFold(strings.TrimSpace(pay.PaymentType.TypeName), "balance")
		if isBalance {
			// find a Deposit payment not yet Paid
			var depositUnpaid bool
			for _, p := range booking.Payments {
				if p.PaymentTypeID != 0 && strings.EqualFold(strings.TrimSpace(p.PaymentType.TypeName), "deposit") {
					if lower(p.Status.Name) != "paid" && lower(p.Status.Name) != "approved" && lower(p.Status.Name) != "completed" {
						depositUnpaid = true
						break
					}
				}
			}
			if depositUnpaid {
				tx.Rollback()
				c.JSON(http.StatusConflict, gin.H{
					"error":       "Please approve the deposit first",
					"nextDue":     "deposit",
					"plan":        booking.PaymentOption.OptionName,
					"paymentType": pay.PaymentType.TypeName,
				})
				return
			}
		}
	}

	// set payment → Paid
	now := time.Now()
	if err := tx.Model(&entity.Payment{}).
		Where("id = ?", pay.ID).
		Updates(map[string]interface{}{
			"status_id":    paidID,
			"payment_date": now,
			"updated_at":   now,
			"note":         strings.TrimSpace(pay.Note),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve payment"})
		return
	}

	// update booking status from finance
	if err := updateBookingStatusAfterPayment(tx, &booking); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update booking status: " + err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	// reload for FE
	if err := db.
		Preload("Payments.Status").
		Preload("Payments.PaymentType").
		Preload("PaymentOption").
		Preload("Status").
		Preload("Room").
		Preload("User").
		First(&booking, booking.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load booking data"})
		return
	}
	paidApproved, paidPending, paidRejected, total, remaining := summarizeFinance(&booking)
	c.JSON(http.StatusOK, gin.H{
		"message": "Payment approved",
		"data":    booking,
		"finance": gin.H{
			"paidApproved": paidApproved,
			"paidPending":  paidPending,
			"paidRejected": paidRejected,
			"total":        total,
			"remaining":    remaining,
			"nextDue":      computeNextDue(&booking), // "deposit" | "balance" | "full" | "done"
			"plan":         booking.PaymentOption.OptionName,
		},
	})
}

/* ==========================
   POST /payments/:id/reject
   ========================== */
// แนะนำให้มีค่าคงที่ชื่อสถานะให้ตรงกับที่ฟรอนต์ใช้
// ชื่อสถานะให้ตรงกับข้อมูลจริงใน DB ของคุณ
const PaymentStatusPendingPayment = "Pending Payment"

func RejectPayment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var body struct {
		ApproverID uint   `json:"ApproverID"`
		Note       string `json:"Note"`
	}
	_ = c.ShouldBindJSON(&body)

	if err := db.Transaction(func(tx *gorm.DB) error {
		// 1) หา status_id สำหรับ "Pending Payment"
		psPendingID, err := ensurePaymentStatusID(tx, PaymentStatusPendingPayment)
		if err != nil {
			// log แล้วส่งข้อความออกให้ client เห็น
			log.Printf("[RejectPayment] ensurePaymentStatusID err: %v", err)
			return fmt.Errorf("cannot get pending payment status")
		}

		// 2) เตรียม updates — ใส่เฉพาะคอลัมน์ที่มีอยู่จริงใน struct/entity ของคุณ
		updates := map[string]interface{}{
			"status_id":   psPendingID,
			"approver_id": body.ApproverID,
			"note":        strings.TrimSpace(body.Note),
			"updated_at":  time.Now(),
		}

		// ถ้า field เหล่านี้มีอยู่จริงและรับค่าว่างได้ ให้ใส่เพื่อล้างสลิปเก่า
		// ถ้าเป็น NOT NULL แต่อยากล้าง ให้ใช้ "" แทน NULL
		if tx.Migrator().HasColumn(&entity.Payment{}, "slip_path") {
			updates["slip_path"] = "" // หรือ gorm.Expr("NULL") ถ้า column เป็น NULL ได้
		}
		if tx.Migrator().HasColumn(&entity.Payment{}, "receipt_path") {
			updates["receipt_path"] = ""
		}
		if tx.Migrator().HasColumn(&entity.Payment{}, "submitted_at") {
			updates["submitted_at"] = nil
		}
		if tx.Migrator().HasColumn(&entity.Payment{}, "approved_at") {
			updates["approved_at"] = nil
		}
		if tx.Migrator().HasColumn(&entity.Payment{}, "verified_at") {
			updates["verified_at"] = nil
		}

		// 3) อัปเดต payment
		if err := tx.Model(&entity.Payment{}).
			Where("id = ?", id).
			Updates(updates).Error; err != nil {
			log.Printf("[RejectPayment] update err: %v", err)
			return fmt.Errorf("reject payment failed")
		}

		return nil
	}); err != nil {
		// ให้ client เห็น error ที่อ่านรู้เรื่อง
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "payment reset to Pending Payment"})
}

/* ==========================
   POST /payments/:id/refund
   ========================== */

// func RefundedBookingRoom(c *gin.Context) {
// 	db := config.DB()
// 	paymentID := c.Param("id")

// 	var pay entity.Payment
// 	if err := db.Preload("Status").First(&pay, paymentID).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
// 		return
// 	}

// 	psID, err := ensurePaymentStatusID(db, "Refunded")
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Refunded ไม่สำเร็จ"})
// 		return
// 	}

// 	if err := db.Model(&entity.Payment{}).Where("id = ?", pay.ID).Updates(map[string]interface{}{
// 		"status_id":  psID,
// 		"updated_at": time.Now(),
// 	}).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
// 		return
// 	}

// 	c.JSON(http.StatusOK, gin.H{"message": "Refunded successfully"})
// }

// PUT /payments/:id/refund
func RefundPaymentByAdmin(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	type bodyT struct {
		Reason        string `json:"reason"`        // optional
		CancelBooking *bool  `json:"cancelBooking"` // default = true (nil -> true)
	}
	var body bodyT
	_ = c.ShouldBindJSON(&body)

	// default = true
	cancel := true
	if body.CancelBooking != nil {
		cancel = *body.CancelBooking
	}

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var pay entity.Payment
	if err := tx.Preload("BookingRoom.Status").First(&pay, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	// 1) set payment -> Refunded
	psID, err := ensurePaymentStatusID(tx, "Refunded")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Refunded ไม่สำเร็จ"})
		return
	}
	if err := tx.Model(&entity.Payment{}).
		Where("id = ?", pay.ID).
		Updates(map[string]any{
			"status_id":  psID,
			"updated_at": time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	// 2) ถ้าต้องการยกเลิก booking ด้วย
	if cancel {
		var booking entity.BookingRoom
		if err := tx.Preload("Status").First(&booking, pay.BookingRoomID).Error; err == nil {
			// ยกเลิกได้ทุกสถานะ ยกเว้น "Cancelled" (ให้ idempotent)
			cur := strings.ToLower(strings.TrimSpace(booking.Status.StatusName))
			if cur != "cancelled" {
				if err2 := setBookingStatus(tx, booking.ID, "Cancelled"); err2 != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "ตั้งค่าสถานะ Cancelled ไม่สำเร็จ"})
					return
				}
				note := strings.TrimSpace(body.Reason)
				if note == "" {
					note = "Refunded by admin"
				}
				now := time.Now()
				if err := tx.Model(&entity.BookingRoom{}).
					Where("id = ?", booking.ID).
					Updates(map[string]any{
						"cancelled_at":   now,
						"cancelled_note": note,
						"updated_at":     time.Now(),
					}).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดต Booking เป็น Cancelled ไม่สำเร็จ"})
					return
				}
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Refunded successfully"})
}

func valueOrZero(p *float64) float64 {
	if p == nil {
		return 0
	}
	return *p
}
