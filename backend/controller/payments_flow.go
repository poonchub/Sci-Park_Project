// controller/payment.go
package controller

import (
	"errors"
	"fmt"

	"os"
	"path/filepath"
	"strconv"

	"net/http"

	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"
)

// POST /payments/:id/submit-slip
// body: { "SlipPath": "images/slips/....jpg", "Note": "..." }
// --- ใส่ import ให้ครบ ---
// import (
// 	"fmt"
// 	"os"
// 	"path/filepath"
// 	"strconv"
// 	"strings"
// 	"time"

// 	"github.com/gin-gonic/gin"
// 	"gorm.io/gorm"

// 	"sci-park_web-application/config"
// 	"sci-park_web-application/entity"
// )

// helper: ดึงค่าจากฟอร์มแบบปลอดภัย + รองรับหลาย alias
func getFormVal(c *gin.Context, keys ...string) string {
	// ให้แน่ใจว่า parse multipart แล้ว
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
// controller/payments_flow.go
func SubmitPaymentSlip(c *gin.Context) {
	db := config.DB()

	// ----------- params ----------- //
	bookingIDStr := c.Param("id")
	bookingID64, err := strconv.ParseUint(bookingIDStr, 10, 64)
	if err != nil || bookingID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid booking id"})
		return
	}
	bookingID := uint(bookingID64)

	// รับไฟล์: รองรับได้ทั้ง "slip" และ "file"
	fileHeader, err := c.FormFile("slip")
	if err != nil {
		fileHeader, err = c.FormFile("file")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "slip file is required (multipart/form-data)"})
			return
		}
	}

	// helper: อ่านฟอร์ม (รองรับได้หลายชื่อ)
	getForm := func(keys ...string) string {
		for _, k := range keys {
			if v := strings.TrimSpace(c.PostForm(k)); v != "" {
				return v
			}
		}
		return ""
	}

	// ----------- form fields ----------- //
	payerIDStr := getForm("PayerID", "payer_id")
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

	paymentIDStr := getForm("PaymentID", "payment_id") // optional
	amountStr := getForm("Amount", "amount")           // optional
	paymentTypeIDStr := getForm("PaymentTypeID", "payment_type_id") // optional
	note := getForm("Note", "note")                                  // optional

	// เพิ่ม: อ่านงวด และ trans_timestamp (จาก FE)
	instKey := strings.ToLower(getForm("InstallmentKey", "installment")) // "full" | "deposit" | "balance" (optional)
	paymentDateStr := getForm("PaymentDate", "payment_date", "trans_timestamp", "TransTimestamp")

	var amount float64
	if amountStr != "" {
		if v, err := strconv.ParseFloat(amountStr, 64); err == nil {
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
		// รองรับ RFC3339; ถ้า FE ส่ง ISO มาก็ผ่านได้
		if t, err := time.Parse(time.RFC3339, paymentDateStr); err == nil {
			paymentDate = t
		}
	}

	// ----------- save file ----------- //
	saveDir := fmt.Sprintf("images/payments/booking_%d", bookingID)
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create directory"})
		return
	}
	filename := fmt.Sprintf("%d_%s", time.Now().Unix(), filepath.Base(fileHeader.Filename))
	destPath := filepath.Join(saveDir, filename)
	if err := c.SaveUploadedFile(fileHeader, destPath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot save slip file"})
		return
	}

	// ----------- tx ----------- //
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// โหลด booking
	var b entity.BookingRoom
	if err := tx.
		Preload("Payments.Status").
		Preload("PaymentOption").
		First(&b, bookingID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	// สถานะหลังอัปสลิป → Pending Verification
	psPendingVer, err := getOrCreatePaymentStatus(tx, "Pending Verification")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot get pending verification"})
		return
	}

	// ----------- target payment ----------- //
	var pay entity.Payment

	// (A) ถ้า FE ระบุ PaymentID มา -> ใช้อันนั้น
	if paymentIDStr != "" {
		if v, err := strconv.ParseUint(paymentIDStr, 10, 64); err == nil && v > 0 {
			if err := tx.Preload("Status").First(&pay, uint(v)).Error; err != nil {
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

	// (B) ไม่ได้ระบุ PaymentID → หาเป้าหมายจาก installment ก่อน (ถ้ามี), ไม่งั้นค่อยหา open statuses
	if pay.ID == 0 {
		// open statuses (รวม "unpaid" ไว้ด้วย)
		var openStatusIDs []uint
		if err := tx.
			Model(&entity.PaymentStatus{}).
			Where("LOWER(name) IN ?", []string{"pending payment", "pending verification", "rejected", "unpaid"}).
			Pluck("id", &openStatusIDs).Error; err != nil {
			openStatusIDs = []uint{}
		}

		// ถ้ามี instKey ให้หาตามงวดก่อน
		if instKey != "" {
			err = tx.Where("booking_room_id = ? AND LOWER(note) = ? AND status_id IN ?",
				bookingID, instKey, openStatusIDs).
				Order("id DESC").First(&pay).Error
		}

		// ถ้ายังไม่เจอ -> fallback หาอันที่เปิดอยู่ล่าสุด
		if pay.ID == 0 {
			if err := tx.Where("booking_room_id = ? AND status_id IN ?",
				bookingID, openStatusIDs).
				Order("id DESC").First(&pay).Error; err != nil {
				// **ยังไม่เจอจริงๆ → สร้าง Payment ใหม่**
				newPay := entity.Payment{
					BookingRoomID: bookingID,
					PayerID:       payerID,
					StatusID:      psPendingVer.ID,
					Note:          instKey,            // เก็บ key ของงวดไว้ใน note (เช่น "deposit"/"balance"/"full")
					Amount:        amount,             // ถ้า FE ไม่ส่งมา อาจเป็น 0 ได้ (แล้วค่อยไป update ทีหลังได้)
					PaymentTypeID: paymentTypeID,      // ถ้า FE ไม่ส่ง อาจปล่อยว่างได้
					PaymentDate:   paymentDate,
					SlipPath:      destPath,
				}
				if err := tx.Create(&newPay).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create payment"})
					return
				}
				pay = newPay
			}
		}
	}

	// ----------- update payment (กรณีเจอเป้าหมาย) ----------- //
	// ใช้ snake_case เพื่อให้ GORM อัปเดต
	update := map[string]interface{}{
		"slip_path":    destPath,       // ถ้าฟิลด์คุณเป็น ARRAY/JSON ต้องปรับเป็น append ตาม schema
		"status_id":    psPendingVer.ID,
		"payer_id":     payerID,
		"note":         noteIfNotEmpty(note, instKey), // ถ้า FE ไม่ได้ส่ง note ให้คง instKey ไว้ก็ได้
		"payment_date": paymentDate,
		"updated_at":   time.Now(),
	}
	if paymentTypeID > 0 {
		update["payment_type_id"] = paymentTypeID
	}
	if amount > 0 {
		update["amount"] = amount
	}
	// ถ้าสร้างใหม่เมื่อกี้แล้ว (ไม่มี RowsAffected เพราะเรา set pay จาก create) ให้ข้าม Updates
	if pay.ID != 0 {
		if err := tx.Model(&entity.Payment{}).Where("id = ?", pay.ID).Updates(update).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update payment"})
			return
		}
	}

	// commit
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	_ = db.Preload("Status").First(&pay, pay.ID)
	c.JSON(http.StatusOK, gin.H{
		"message": "slip uploaded",
		"payment": pay,
		"file":    destPath,
	})
}

func noteIfNotEmpty(note string, fallback string) string {
	n := strings.TrimSpace(note)
	if n != "" {
		return n
	}
	return strings.TrimSpace(fallback)
}


// ==================== Helpers ====================
// =============== helpers: สรุปการเงิน + next step ===============
func lower(s string) string { return strings.ToLower(strings.TrimSpace(s)) }

func summarizeFinance(b *entity.BookingRoom) (paidApproved, paidPending, paidRejected, total, remaining float64) {
	total = b.TotalAmount
	if total < 0 {
		total = 0
	}
	for _, p := range b.Payments {
		switch lower(p.Status.Name) { // ถ้า struct ใช้ Name ให้เปลี่ยนเป็น p.Status.Name
		case "approved":
			paidApproved += p.Amount
		case "pending payment", "pending review", "รอตรวจสอบสลิป":
			paidPending += p.Amount
		case "rejected":
			paidRejected += p.Amount
		}
	}
	remaining = total - paidApproved
	if remaining < 0 {
		remaining = 0
	}
	return
}

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
		} // ยังไม่ผ่านงวดมัดจำ
		if remaining > 0 {
			return "balance"
		} // ต่อด้วยงวดคงเหลือ
		return "done"
	}
	if remaining > 0 {
		return "full"
	}
	return "done"
}

// สร้าง/อัปเดต “งวดคงเหลือ (Balance)” หลังมัดจำผ่าน + อัปเดตสถานะ Booking เมื่อจ่ายครบ
func refreshBookingFinanceAndNextDue(tx *gorm.DB, b *entity.BookingRoom) error {
	if err := tx.
		Preload("Payments.Status").
		Preload("PaymentOption").
		First(b, b.ID).Error; err != nil {
		return err
	}

	_, _, _, _, remaining := summarizeFinance(b)
	plan := lower(b.PaymentOption.OptionName)

	// แผน Deposit และยังเหลือยอด → ดูแลงวด Balance (Pending Payment)
	if plan == "deposit" && remaining > 0 {
		psPending, err := getOrCreatePaymentStatus(tx, "Pending Payment")
		if err != nil {
			return err
		}

		// หา balance-pending เดิม ถ้ามีให้อัปเดตยอด, ถ้าไม่มีให้สร้างใหม่
		var bal *entity.Payment
		for i := range b.Payments {
			p := &b.Payments[i]
			if lower(p.Status.Name) == "pending payment" && strings.EqualFold(strings.TrimSpace(p.Note), "balance") {
				bal = p
				break
			}
		}
		if bal != nil {
			if err := tx.Model(&entity.Payment{}).
				Where("id = ?", bal.ID).
				Updates(map[string]interface{}{"amount": remaining, "updated_at": time.Now()}).Error; err != nil {
				return err
			}
		} else {
			nb := entity.Payment{
				BookingRoomID: b.ID,
				PayerID:       b.UserID,
				Amount:        remaining,
				StatusID:      psPending.ID,
				Note:          "Balance",
			}
			if err := tx.Create(&nb).Error; err != nil {
				return err
			}
		}
		// ยังไม่ fully paid → ไม่เปลี่ยนสถานะ booking
		return tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]interface{}{"updated_at": time.Now()}).Error
	}

	// fully paid → เปลี่ยนเป็น Awaiting Receipt
	if remaining <= 0 {
		var s entity.BookingStatus
		if err := tx.Where("LOWER(status_name)=?", "awaiting receipt").First(&s).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				s = entity.BookingStatus{StatusName: "Awaiting Receipt"}
				if err := tx.Create(&s).Error; err != nil {
					return err
				}
			} else {
				return err
			}
		}
		return tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]interface{}{"status_id": s.ID, "updated_at": time.Now()}).Error
	}
	return nil
}

// =============== อนุมัติสลิปทีละงวด (มี gating Deposit → Balance) ===============
// PATCH /payments/:id/approve
func ApprovePayment(c *gin.Context) {
	db := config.DB()
	pid := c.Param("id")

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 1) โหลด payment + booking ที่เกี่ยวข้อง
	var pay entity.Payment
	if err := tx.
		Preload("Status").
		Preload("BookingRoom.PaymentOption").
		Preload("BookingRoom.Payments.Status").
		First(&pay, pid).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}
	booking := pay.BookingRoom

	// 2) ดึงสถานะสำคัญ
	psApproved, err := getOrCreatePaymentStatus(tx, "Approved")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Approved status"})
		return
	}
	psRejected, err := getOrCreatePaymentStatus(tx, "Rejected")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Rejected status"})
		return
	}

	// 3) อนุมัติได้เฉพาะสเตทที่ยังไม่ Approved/Rejected (ถือว่า pending หมด)
	if pay.StatusID == psApproved.ID {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "This payment is already approved"})
		return
	}
	if pay.StatusID == psRejected.ID {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "This payment was rejected"})
		return
	}

	// 4) Gating: ถ้า booking ยังต้อง "deposit" ห้ามอนุมัติใบที่เป็น balance ก่อน
	next := computeNextDue(&booking) // deposit | balance | full | done
	if next == "deposit" && strings.EqualFold(strings.TrimSpace(pay.Note), "balance") {
		tx.Rollback()
		c.JSON(http.StatusConflict, gin.H{
			"error":       "Please approve the deposit first",
			"nextDue":     next,
			"plan":        booking.PaymentOption.OptionName,
			"paymentNote": pay.Note,
		})
		return
	}

	// 5) เซ็ต payment → Approved
	now := time.Now()
	if err := tx.Model(&entity.Payment{}).
		Where("id = ?", pay.ID).
		Updates(map[string]interface{}{
			"status_id":    psApproved.ID,
			"payment_date": now,
			"updated_at":   now,
			"note":         strings.TrimSpace(pay.Note),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve payment"})
		return
	}

	// 6) รีเฟรชการเงิน/สร้างงวดถัดไปถ้าจำเป็น
	if err := refreshBookingFinanceAndNextDue(tx, &booking); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to refresh finance: " + err.Error()})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	// reload ส่งกลับ FE พร้อมสรุปการเงินและ next step
	if err := db.
		Preload("Payments.Status").
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

// POST /payments/:id/reject
// POST /payments/:id/reject
// body: { "ApproverID": 123, "Note": "รูปไม่ชัด" }
func RejectPayment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var body struct {
		ApproverID uint   `json:"ApproverID"`
		Note       string `json:"Note"`
	}
	_ = c.ShouldBindJSON(&body)

	ps, err := getOrCreatePaymentStatus(db, "Rejected")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot get rejected status"})
		return
	}

	if err := db.Model(&entity.Payment{}).Where("id = ?", id).Updates(map[string]interface{}{
		"status_id":   ps.ID,
		"approver_id": body.ApproverID,
		"note":        body.Note,
		"updated_at":  time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reject failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "payment rejected"})
}

// POST /payments/:id/refund
func RefundedBookingRoom(c *gin.Context) {
	db := config.DB()
	paymentID := c.Param("id")

	var pay entity.Payment
	if err := db.Preload("Status").First(&pay, paymentID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Payment not found"})
		return
	}

	ps, err := getOrCreatePaymentStatus(db, "Refunded")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Refunded ไม่สำเร็จ"})
		return
	}

	if err := db.Model(&entity.Payment{}).Where("id = ?", pay.ID).Updates(map[string]interface{}{
		"status_id":  ps.ID,
		"updated_at": time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update payment"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Refunded successfully"})
}
