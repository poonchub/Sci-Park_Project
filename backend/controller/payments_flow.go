// controller/payment.go
package controller

import (
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

// controller/payments_flow.go (ส่วนอัปโหลดสลิป)
func SubmitPaymentSlip(c *gin.Context) {
	db := config.DB()

	bookingIDStr := c.Param("id")
	bookingID64, err := strconv.ParseUint(bookingIDStr, 10, 64)
	if err != nil || bookingID64 == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid booking id"})
		return
	}
	bookingID := uint(bookingID64)

	fileHeader, err := c.FormFile("slip")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "slip file is required (multipart/form-data)"})
		return
	}

	payerIDStr := strings.TrimSpace(c.PostForm("PayerID"))
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

	paymentIDStr := strings.TrimSpace(c.PostForm("PaymentID"))         // optional
	amountStr := strings.TrimSpace(c.PostForm("Amount"))               // optional
	paymentTypeIDStr := strings.TrimSpace(c.PostForm("PaymentTypeID")) // optional
	note := c.PostForm("Note")
	paymentDateStr := strings.TrimSpace(c.PostForm("PaymentDate"))

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
		if t, err := time.Parse(time.RFC3339, paymentDateStr); err == nil {
			paymentDate = t
		}
	}

	// save file
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

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// โหลด booking + payments ของมัน
	var b entity.BookingRoom
	if err := tx.
		Preload("Payments.Status").
		Preload("PaymentOption").
		First(&b, bookingID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
		return
	}

	// สถานะเป้าหมายหลังอัปสลิป
	psPendingVer, err := getOrCreatePaymentStatus(tx, "Pending Verification")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot get pending verification"})
		return
	}

	var pay entity.Payment
	// 1) ถ้ามี PaymentID → อัปเดตตัวนั้น (ต้องเป็นของ booking เดียวกัน)
	if paymentIDStr != "" {
		if v, err := strconv.ParseUint(paymentIDStr, 10, 64); err == nil && v > 0 {
			if err := tx.First(&pay, uint(v)).Error; err != nil {
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
	// 2) ถ้าไม่ส่ง PaymentID → หา “งวดเปิดอยู่” (Pending Payment/Verification/Rejected) ของ booking นี้
	if pay.ID == 0 {
		if err := tx.
			Where("booking_room_id = ? AND status_id IN (?)",
				bookingID,
				tx.Model(&entity.PaymentStatus{}).Select("id").Where("LOWER(name) IN ?", []string{"pending payment", "pending verification", "rejected"}),
			).
			Order("id DESC").First(&pay).Error; err != nil {
			// 3) ถ้าไม่เจอเลย → (edge) สร้างงวดใหม่ตามกติกา (อิง Full/Deposit)
			psPending, _ := getOrCreatePaymentStatus(tx, "Pending Payment")
			totalDue := b.TotalAmount - b.DiscountAmount
			if totalDue < 0 {
				totalDue = 0
			}
			firstAmount := totalDue
			firstNote := "Waiting for payment"
			if strings.EqualFold(b.PaymentOption.OptionName, "Deposit") && b.DepositAmount > 0 {
				firstAmount = b.DepositAmount
				firstNote = "Deposit due"
			}
			pay = entity.Payment{
				BookingRoomID: b.ID,
				StatusID:      psPending.ID,
				Amount:        firstAmount,
				PaymentDate:   time.Now(),
				PayerID:       payerID,
				Note:          firstNote,
			}
			if err := tx.Create(&pay).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot create payment shell"})
				return
			}
		}
	}

	// อัปเดต slip + set เป็น Pending Verification
	update := map[string]interface{}{
		"SlipPath":    destPath,
		"StatusID":    psPendingVer.ID,
		"PayerID":     payerID,
		"Note":        note,
		"PaymentDate": paymentDate,
		"updated_at":  time.Now(),
	}
	if paymentTypeID > 0 {
		update["PaymentTypeID"] = paymentTypeID
	}
	// อนุญาต override amount หากส่งมา
	if amount > 0 {
		update["Amount"] = amount
	}
	if err := tx.Model(&entity.Payment{}).Where("id = ?", pay.ID).Updates(update).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot update payment"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	_ = db.Preload("Status").First(&pay, pay.ID)
	c.JSON(http.StatusOK, gin.H{"message": "slip uploaded", "payment": pay, "file": destPath})
}

// func applyPaymentToInvoice(db *gorm.DB, invoiceID uint, amount float64, paidAt time.Time) error {
//     var inv entity.Invoice
//     if err := db.First(&inv, invoiceID).Error; err != nil { return err }

//     newPaid := inv.PaidAmount + amount
//     statusName := "Partially Paid"
//     if newPaid <= 0 {
//         statusName = "Unpaid"
//     } else if newPaid+1e-6 >= inv.TotalAmount { // กันพลาด float
//         statusName = "Paid"
//         newPaid = inv.TotalAmount
//     }
//     var st entity.PaymentStatus
//     if err := db.Where("LOWER(name)=?", strings.ToLower(statusName)).First(&st).Error; err != nil {
//         st = entity.PaymentStatus{Name: statusName}
//         if err := db.Create(&st).Error; err != nil { return err }
//     }

//     return db.Model(&entity.Invoice{}).
//         Where("id = ?", inv.ID).
//         Updates(map[string]any{
//             "paid_amount": newPaid,
//             "status_id":   st.ID,
//             "updated_at":  time.Now(),
//         }).Error
// }

// POST /payments/:id/approve
// func ApprovePayment(c *gin.Context) {
//     db := config.DB()
//     id := c.Param("id")

//     var p entity.Payment
//     if err := db.First(&p, id).Error; err != nil {
//         c.JSON(http.StatusNotFound, gin.H{"error":"ไม่พบ payment"}); return
//     }

//     // → เซ็ตสถานะ Paid ให้ payment
//     var ps entity.PaymentStatus
//     if err := db.Where("LOWER(name)=?","paid").First(&ps).Error; err != nil {
//         ps = entity.PaymentStatus{Name:"Paid"}; _ = db.Create(&ps).Error
//     }
//     p.StatusID = ps.ID
//     if err := db.Save(&p).Error; err != nil {
//         c.JSON(http.StatusInternalServerError, gin.H{"error":"อัปเดตสถานะไม่สำเร็จ"}); return
//     }

//     // → ตัดยอดเข้า invoice ถ้ามี
//     if p.InvoiceID != 0 && p.Amount > 0 {
//         if err := applyPaymentToInvoice(db, p.InvoiceID, p.Amount, p.PaymentDate); err != nil {
//             c.JSON(http.StatusInternalServerError, gin.H{"error":"ตัดยอดเข้าใบแจ้งหนี้ไม่สำเร็จ"}); return
//         }
//     }

//     c.JSON(http.StatusOK, gin.H{"message": "Payment approved", "payment": p})
// }

// func MarkPaymentPaid(c *gin.Context) {
// 	db := config.DB()
// 	id := c.Param("id")

// 	var payment entity.Payment
// 	if err := db.First(&payment, id).Error; err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบ payment"})
// 		return
// 	}

// 	var ps entity.PaymentStatus
// 	if err := db.Where("LOWER(name) = ?", strings.ToLower("Paid")).First(&ps).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			ps = entity.PaymentStatus{Name: "Paid"}
// 			if err := db.Create(&ps).Error; err != nil {
// 				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Paid ไม่สำเร็จ"})
// 				return
// 			}
// 		} else {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Paid ไม่สำเร็จ"})
// 			return
// 		}
// 	}

// 	payment.StatusID = ps.ID
// 	if err := db.Save(&payment).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "อัปเดตสถานะไม่สำเร็จ"})
// 		return
// 	}

// 	if payment.InvoiceID != 0 {
// 		if err := ApplyPaymentToInvoiceID(payment.InvoiceID, payment.Amount, payment.PaymentDate); err != nil {
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "ปรับยอดใบแจ้งหนี้ไม่สำเร็จ"})
// 			return
// 		}
// 	}

// 	c.JSON(http.StatusOK, gin.H{"message": "Payment marked as Paid", "payment": payment})
// }

// POST /payments/:id/approve
// body: { "ApproverID": 123, "ReceiptPath": "images/receipts/..pdf", "Note": "OK" }
// helper: ดึงสถานะ Booking ตามชื่อ
func getBookingStatusByName(tx *gorm.DB, name string) (entity.BookingStatus, error) {
	var s entity.BookingStatus
	err := tx.Where("LOWER(status_name)=?", strings.ToLower(strings.TrimSpace(name))).First(&s).Error
	return s, err
}

func ApprovePayment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var body struct {
		ApproverID  uint   `json:"ApproverID"`
		ReceiptPath string `json:"ReceiptPath"`
		Note        string `json:"Note"`
	}
	_ = c.ShouldBindJSON(&body)

	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var p entity.Payment
	if err := tx.
		Preload("Status").
		Preload("BookingRoom.PaymentOption").
		Preload("BookingRoom.Payments.Status").
		Preload("BookingRoom.User").
		First(&p, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}
	b := p.BookingRoom

	// 1) เปลี่ยน Payment -> Approved
	psApproved, err := getOrCreatePaymentStatus(tx, "Approved")
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot get approved status"})
		return
	}
	if err := tx.Model(&entity.Payment{}).Where("id = ?", p.ID).
		Updates(map[string]interface{}{
			"status_id":    psApproved.ID,
			"approver_id":  body.ApproverID,
			"receipt_path": body.ReceiptPath, // ถ้าไม่มี ให้ส่งค่าว่างมาได้
			"note":         body.Note,
			"updated_at":   time.Now(),
		}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "approve failed"})
		return
	}

	// 2) คำนวณยอดที่อนุมัติแล้วทั้งหมด
	totalDue := b.TotalAmount - b.DiscountAmount
	if totalDue < 0 {
		totalDue = 0
	}
	var sumApproved float64
	for _, pay := range b.Payments {
		if strings.EqualFold(pay.Status.Name, "Approved") {
			sumApproved += pay.Amount
		}
	}
	// เพิ่มยอดของ p ถ้าก่อนหน้าไม่ใช่ Approved
	if !strings.EqualFold(p.Status.Name, "Approved") {
		sumApproved += p.Amount
	}
	sumApproved = round2(sumApproved)
	totalDue = round2(totalDue)

	// 3) ถ้าเป็น Deposit และยังไม่ครบ -> สร้าง payment ของยอดคงเหลือแบบ Pending Payment
	if strings.EqualFold(b.PaymentOption.OptionName, "Deposit") {
		remaining := round2(totalDue - sumApproved)
		if remaining > 0 {
			psPending, _ := getOrCreatePaymentStatus(tx, "Pending Payment")
			var exists int64
			if err := tx.Model(&entity.Payment{}).
				Where("booking_room_id = ? AND status_id = ? AND LOWER(note) = ?",
					b.ID, psPending.ID, "balance due").
				Count(&exists).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "check balance existence failed"})
				return
			}
			if exists == 0 {
				newPay := entity.Payment{
					BookingRoomID: b.ID,
					StatusID:      psPending.ID,
					Amount:        remaining,
					PaymentDate:   time.Now(),
					PayerID:       b.UserID,
					Note:          "Balance due",
				}
				if err := tx.Create(&newPay).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "create balance payment failed"})
					return
				}
			}
		}
	}

	// 4) ตั้งสถานะ Booking = "Awaiting Receipt" เสมอ หลังอนุมัติเงิน
	if err := setBookingStatus(tx, b.ID, "Awaiting Receipt"); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "cannot set awaiting receipt"})
		return
	}

	// 5) ถ้าจ่ายครบแล้ว -> ติดธง is_fully_prepaid = true (ยังไม่ Completed จนกว่าจะอัปโหลดใบเสร็จ)
	updates := map[string]any{"updated_at": time.Now()}
	if sumApproved >= totalDue {
		updates["is_fully_prepaid"] = true
	} else if b.IsFullyPrepaid {
		updates["is_fully_prepaid"] = false
	}
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update prepaid flag failed"})
		return
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "transaction failed"})
		return
	}

	var out entity.BookingRoom
	if err := db.Preload("Payments.Status").
		Preload("PaymentOption").Preload("Status").
		First(&out, b.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload booking failed"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "payment approved", "data": out})
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
