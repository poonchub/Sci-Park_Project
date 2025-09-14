// controller/booking_rooms_flow.go
package controller

import (
	"errors"
	"fmt"
	"path/filepath"

	"os"

	"strconv"

	// "fmt"

	"net/http"
	"strings"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// คืน path แบบใช้ / เสมอ
func normalizeSlashes(p string) string {
	return strings.ReplaceAll(p, "\\", "/")
}

// ดึง/สร้างสถานะของ "BookingRoom"
func getOrCreateBookingStatus(tx *gorm.DB, name string) (*entity.BookingStatus, error) {
	var st entity.BookingStatus
	// สมมติคอลัมน์ชื่อ status_name ตามที่ใช้ที่อื่น
	if err := tx.Where("LOWER(status_name) = ?", strings.ToLower(name)).First(&st).Error; err != nil {
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

// setter สะดวก ๆ
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

// GET /booking-rooms/:id
// controller/booking_rooms_flow.go (หรือที่ใช้โหลด BookingRoom by id)
func GetBookingRoomByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var b entity.BookingRoom

	// 1) เช็คว่ามีจริงก่อน
	if err := db.First(&b, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "booking not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load booking failed"})
		return
	}

	// 2) โหลดความสัมพันธ์ (ตัด Payments.Invoice ออก)
	if err := db.
		Model(&entity.BookingRoom{}).
		Preload("Room.Floor").
		Preload("User").
		Preload("BookingDates").
		Preload("TimeSlots").
		Preload("PaymentOption").
		Preload("Payments.Status").    // ✅ ได้แน่
		Preload("RoomBookingInvoice"). // ✅ ถ้า invoice อยู่ที่ Booking
		First(&b, id).Error; err != nil {
		// ❗อย่าคืน 404 ถ้า preload พลาด ให้เป็น 500
		c.JSON(http.StatusInternalServerError, gin.H{"error": "load relations failed"})
		return
	}

	c.JSON(http.StatusOK, b)
}

// POST /booking-rooms/:id/approve
// controller/booking_approve.go
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
		First(&b, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}
	if b.CancelledAt != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking has been cancelled"})
		return
	}

	// set confirmed_at / event window
	if b.ConfirmedAt == nil {
		now := time.Now()
		if err := tx.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Update("confirmed_at", &now).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set confirmed time"})
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
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set event start/end"})
				return
			}
		}
	}

	// booking status → Confirmed
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "confirmed").First(&bs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			bs = entity.BookingStatus{StatusName: "Confirmed"}
			if err := tx.Create(&bs).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Confirmed status"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get Confirmed status"})
			return
		}
	}
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{"status_id": bs.ID, "updated_at": time.Now()}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve booking"})
		return
	}

	// ==== สร้าง/อัปเดต “งวดแรก” ตาม Full/Deposit ====
	// สำคัญ: totalDue = TotalAmount (สุทธิแล้ว) ไม่ต้องลบ DiscountAmount อีก
	totalDue := b.TotalAmount
	if totalDue < 0 {
		totalDue = 0
	}

	firstAmount := totalDue
	firstNote := "Waiting for payment"

	plan := strings.ToLower(strings.TrimSpace(b.PaymentOption.OptionName))
	if plan == "deposit" {
		// จ่ายมัดจำเท่าที่ตั้งไว้ แต่อย่าเกินยอดรวม
		if b.DepositAmount > 0 && b.DepositAmount < totalDue {
			firstAmount = b.DepositAmount
			firstNote = "Deposit due"
		} else if b.DepositAmount <= 0 {
			firstAmount = 0
			firstNote = "Deposit waived (0 THB)"
		} else {
			// กรณีตั้งมัดจำมากกว่ายอดสุทธิ ให้ตัดเหลือยอดสุทธิ
			firstAmount = totalDue
			firstNote = "Deposit (capped to total)"
		}
	} else {
		// full
		firstAmount = totalDue
		firstNote = "Full payment due"
	}

	// เลือกสถานะตามยอดงวดแรก
	var psPending, psApproved entity.PaymentStatus
	var err error

	if firstAmount > 0 {
		psPending, err = getOrCreatePaymentStatus(tx, "Pending Payment")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get pending status"})
			return
		}
	} else {
		psApproved, err = getOrCreatePaymentStatus(tx, "Approved")
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get approved status"})
			return
		}
	}

	// ถ้ามี Payment อยู่แล้ว ให้อัปเดตใบล่าสุดให้เป็นงวดแรก
	if len(b.Payments) > 0 {
		latest := b.Payments[len(b.Payments)-1]
		update := map[string]interface{}{
			"amount":     firstAmount,
			"note":       firstNote,
			"updated_at": time.Now(),
		}
		if firstAmount > 0 {
			update["status_id"] = psPending.ID
			// ไม่ต้อง set payment_date ตอนยังไม่จ่าย
		} else {
			update["status_id"] = psApproved.ID
			update["payment_date"] = time.Now()
			update["note"] = "No payment required"
		}
		if err := tx.Model(&entity.Payment{}).Where("id = ?", latest.ID).Updates(update).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update first payment"})
			return
		}
	} else {
		np := entity.Payment{
			BookingRoomID: b.ID,
			Amount:        firstAmount,
			PayerID:       b.UserID,
			SlipPath:      "",
			Note:          firstNote,
		}
		if firstAmount > 0 {
			np.StatusID = psPending.ID // ← ใช้ .ID
		} else {
			np.StatusID = psApproved.ID // ← ใช้ .ID
			np.PaymentDate = time.Now() // <-- ใช้ค่า ไม่ใช่ *time.Time// ถ้า field เป็น *time.Time
			np.Note = "No payment required"
		}
		if err := tx.Create(&np).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create first payment"})
			return
		}
	}

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	// reload & return
	if err := db.
		Preload("Payments.Status").
		Preload("PaymentOption").
		Preload("Status").
		Preload("Room").
		Preload("User").
		First(&b, b.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load booking data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking approved successfully", "data": b})
}

// POST /booking-rooms/:id/reject
func RejectBookingRoom(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

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

	// หา BookingStatus = "Cancelled"
	var bs entity.BookingStatus
	if err := tx.Where("LOWER(status_name) = ?", "cancelled").First(&bs).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			bs = entity.BookingStatus{StatusName: "Cancelled"}
			if err := tx.Create(&bs).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Cancelled ไม่สำเร็จ"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Cancelled ไม่สำเร็จ"})
			return
		}
	}

	now := time.Now()
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(map[string]interface{}{
			"status_id":    bs.ID,
			"cancelled_at": &now,
			"updated_at":   time.Now(),
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

// POST /booking-rooms/:id/complete
// func CompleteBookingRoom(c *gin.Context) {
// 	db := config.DB()
// 	id := c.Param("id")

// 	tx := db.Begin()
// 	defer func() {
// 		if r := recover(); r != nil {
// 			tx.Rollback()
// 		}
// 	}()

// 	var b entity.BookingRoom
// 	if err := tx.First(&b, id).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการจอง"})
// 		return
// 	}
// 	if b.CancelledAt != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusBadRequest, gin.H{"error": "การจองถูกยกเลิกแล้ว"})
// 		return
// 	}

// 	// หา BookingStatus = "Completed"
// 	var bs entity.BookingStatus
// 	if err := tx.Where("LOWER(status_name) = ?", "completed").First(&bs).Error; err != nil {
// 		if errors.Is(err, gorm.ErrRecordNotFound) {
// 			bs = entity.BookingStatus{StatusName: "Completed"}
// 			if err := tx.Create(&bs).Error; err != nil {
// 				tx.Rollback()
// 				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Completed ไม่สำเร็จ"})
// 				return
// 			}
// 		} else {
// 			tx.Rollback()
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Completed ไม่สำเร็จ"})
// 			return
// 		}
// 	}

// 	if err := tx.Model(&entity.BookingRoom{}).
// 		Where("id = ?", b.ID).
// 		Updates(map[string]interface{}{"status_id": bs.ID, "updated_at": time.Now()}).Error; err != nil {
// 		tx.Rollback()
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถปิดงานได้"})
// 		return
// 	}

// 	// ===== ออกใบแจ้งหนี้งวดสุดท้าย (ถ้ามียอดคงเหลือ) =====
// 	// รับยอดรวมทั้งงานจาก FE (หรือคุณจะคำนวณเองฝั่งเซิร์ฟเวอร์ก็ได้)
// 	var body struct {
// 		BookingTotal float64 `json:"booking_total"`
// 	}
// 	_ = c.ShouldBindJSON(&body)

// 	if body.BookingTotal > 0 {
// 		// รวมยอดที่จ่ายแล้วจากทุก invoice ของ booking นี้
// 		var invs []entity.Invoice
// 		if err := tx.Where("booking_room_id = ?", b.ID).Find(&invs).Error; err != nil {
// 			tx.Rollback()
// 			c.JSON(http.StatusInternalServerError, gin.H{"error": "คำนวณยอดที่ชำระแล้วไม่สำเร็จ"})
// 			return
// 		}
// 		var paidSum float64
// 		for _, iv := range invs {
// 			paidSum += iv.PaidAmount
// 		}

// 		remain := body.BookingTotal - paidSum
// 		if remain > 0 {
// 			// วันสิ้นสุดกิจกรรม
// 			end := time.Now()
// 			if err := tx.Preload("BookingDates").First(&b, b.ID).Error; err == nil {
// 				if t, ok := lastBookingDate(&b); ok {
// 					end = t
// 				}
// 			}

// 			// หา/สร้างสถานะ Unpaid
// 			var unpaid entity.PaymentStatus
// 			if err := tx.Where("LOWER(name)=?", "unpaid").First(&unpaid).Error; err != nil {
// 				if errors.Is(err, gorm.ErrRecordNotFound) {
// 					unpaid = entity.PaymentStatus{Name: "Unpaid"}
// 					if err := tx.Create(&unpaid).Error; err != nil {
// 						tx.Rollback()
// 						c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างสถานะ Unpaid ไม่สำเร็จ"})
// 						return
// 					}
// 				} else {
// 					tx.Rollback()
// 					c.JSON(http.StatusInternalServerError, gin.H{"error": "ดึงสถานะ Unpaid ไม่สำเร็จ"})
// 					return
// 				}
// 			}

// 			finalInv := entity.Invoice{
// 				BookingRoomID: b.ID,
// 				InvoiceNumber: fmt.Sprintf("FIN-%d-%d", b.ID, time.Now().Unix()),
// 				IssueDate:     time.Now(),
// 				DueDate:       end.Add(7 * 24 * time.Hour), // +7 วันหลังจบกิจกรรม
// 				BillingPeriod: end,
// 				TotalAmount:   remain,
// 				InvoiceType:   "final",
// 				PaidAmount:    0,
// 				StatusID:      unpaid.ID,
// 				RoomID:        b.RoomID,
// 				CreaterID:     b.UserID,
// 				CustomerID:    b.UserID,
// 			}
// 			if err := tx.Create(&finalInv).Error; err != nil {
// 				tx.Rollback()
// 				c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้างใบแจ้งหนี้งวดสุดท้ายไม่สำเร็จ"})
// 				return
// 			}
// 		}
// 	}

//		if err := tx.Commit().Error; err != nil {
//			c.JSON(http.StatusInternalServerError, gin.H{"error": "บันทึกธุรกรรมไม่สำเร็จ"})
//			return
//		}
//		c.JSON(http.StatusOK, gin.H{"message": "ปิดงานสำเร็จ"})
//	}
func UploadPaymentReceipt(c *gin.Context) {
	db := config.DB()

	pid := c.Param("payment_id")
	var pay entity.Payment
	if err := db.Preload("Status").Preload("BookingRoom").First(&pay, pid).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment not found"})
		return
	}

	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file is required"})
		return
	}
	if !strings.HasSuffix(strings.ToLower(file.Filename), ".pdf") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "file must be a PDF"})
		return
	}

	// เก็บที่: images/payments/booking_<id>/receipt_payment_<id>_<ts>.pdf
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

	// อัปเดต path ใบเสร็จให้ payment นี้
	if err := db.Model(&entity.Payment{}).Where("id = ?", pay.ID).
		Updates(map[string]interface{}{"receipt_path": uploadedPath, "updated_at": time.Now()}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update payment failed"})
		return
	}

	// โหลด booking + payments เพื่อเช็กยอด
	var b entity.BookingRoom
	if err := db.Preload("Payments.Status").First(&b, pay.BookingRoomID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "reload booking failed"})
		return
	}

	totalDue := b.TotalAmount - b.DiscountAmount
	if totalDue < 0 {
		totalDue = 0
	}

	var sumApproved float64
	for _, p := range b.Payments {
		if strings.EqualFold(p.Status.Name, "Approved") {
			sumApproved += p.Amount
		}
	}

	// ถ้าจ่ายครบแล้วและมีใบเสร็จ → Completed
	if sumApproved >= totalDue {
		// flag การเงิน
		_ = db.Model(&entity.BookingRoom{}).
			Where("id = ?", b.ID).
			Updates(map[string]interface{}{"is_fully_prepaid": true, "updated_at": time.Now()}).Error

		if err := setBookingStatus(db, b.ID, "Completed"); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "set completed failed"})
			return
		}
	} else {
		// ยังไม่ครบ: ให้คงเป็น Awaiting Receipt (หรือ Confirmed ก็ได้แล้วแต่ flow)
		_ = setBookingStatus(db, b.ID, "Awaiting Receipt")
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "receipt uploaded",
		"path":    uploadedPath,
	})
}

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

	// ลบไฟล์จริง (ถ้าอยากลบ)
	if p.ReceiptPath != "" {
		_ = os.Remove(p.ReceiptPath)
	}

	if err := db.Model(&p).Updates(map[string]any{
		"receipt_path": "",
		"updated_at":   time.Now(),
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "clear receipt failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
