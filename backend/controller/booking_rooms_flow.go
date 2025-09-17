// controller/booking_rooms_flow.go
package controller

import (
	"encoding/json"
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

// ====== ใช้ struct/ฟังก์ชันเดิมจาก ListBookingRooms ======
// - BookingRoomResponse
// - PaymentSummary
// - AdditionalInfo
// - mergeTimeSlots
// - buildPaymentSummaries
// - computeBookingFinance
// - computeDisplayStatus
//
// ถ้ายังไม่มีฟังก์ชันกลาง ให้เพิ่มด้านล่าง แล้วให้ทั้ง List และ Get ใช้ร่วมกัน

// สร้าง response ให้สอดคล้องกับหน้า All
func buildBookingRoomResponse(b entity.BookingRoom) BookingRoomResponse {
	// merge slot (เอาวันแรกของการจองเป็นฐานเวลา)
	bookingDate := time.Now()
	if len(b.BookingDates) > 0 {
		bookingDate = b.BookingDates[0].Date
	}
	merged := mergeTimeSlots(b.TimeSlots, bookingDate)

	// booking status (ยกเลิกชนะ)
	status := b.Status.StatusName
	if b.CancelledAt != nil {
		status = "cancelled"
	}

	// additional info
	var addInfo AdditionalInfo
	if b.AdditionalInfo != "" {
		_ = json.Unmarshal([]byte(b.AdditionalInfo), &addInfo)
	}

	// payments summary
	pList, pActive := buildPaymentSummaries(b.Payments)
	if pList == nil {
		pList = []PaymentSummary{}
	}

	// invoice pdf (normalize path)
	var invoicePDFPath *string
	if b.RoomBookingInvoice != nil && b.RoomBookingInvoice.InvoicePDFPath != "" {
		p := strings.ReplaceAll(b.RoomBookingInvoice.InvoicePDFPath, "\\", "/")
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

	  ca := b.ConfirmedAt

	// finance + display (คำนวณแบบเดียวกับหน้า All)
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
		Payment:            pActive, // งวด active (หรือ null ถ้าไม่มี)
		Payments:           pList,   // ทุกงวด (deposit จะ 2)
		RoomBookingInvoice: b.RoomBookingInvoice,
		DisplayStatus:      disp,
		InvoicePDFPath:     invoicePDFPath,
		Finance:            fin,
		PaymentOption:      &b.PaymentOption,
		Approver:           ap, // ✅
		ConfirmedAt:        ca, // ✅
	}
}

// GET /booking-rooms/:id
// controller/booking_rooms_flow.go (หรือที่ใช้โหลด BookingRoom by id)
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

	// ✅ เพิ่ม Preload("Approver") ตรง BookingRoom ด้วย
	if err := db.
		Model(&entity.BookingRoom{}).
		Preload("Room.Floor").
		Preload("User").
		Preload("Approver"). // <<<<<<<<<< สำคัญ
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

	resp := buildBookingRoomResponse(b) // ดูข้อ 2
	c.JSON(http.StatusOK, resp)
}

// POST /booking-rooms/:id/approve

// ตัดโควต้าฟรี meeting หากต้องตัด และกันนับซ้ำด้วย quotaConsumed
// func consumeFreeMeetingQuotaIfNeeded(tx *gorm.DB, b *entity.BookingRoom) error {
// 	// ต้องมี Room.RoomType เพื่อดู Category
// 	if b.Room.ID == 0 || b.Room.RoomType.ID == 0 {
// 		if err := tx.Preload("Room.RoomType").First(&b, b.ID).Error; err != nil {
// 			return err
// 		}
// 	}

// 	// อ่าน AdditionalInfo
// 	var info additionalInfoPayload
// 	if s := strings.TrimSpace(b.AdditionalInfo); s != "" {
// 		_ = json.Unmarshal([]byte(s), &info)
// 	}

// 	// ถ้ากินโควต้าไปแล้ว ไม่ต้องทำซ้ำ
// 	if info.QuotaConsumed {
// 		return nil
// 	}

// 	// map policy จาก RoomType.Category (เวอร์ชันใหม่คืน (string, error))
// 	policy, err := classifyPolicyRoom(&b.Room)
// 	if err != nil {
// 		// ไม่รู้จักหมวด -> ข้ามไปเฉย ๆ เพื่อไม่ให้บล็อก flow
// 		return nil
// 	}

// 	// ต้องเป็นหมวด meeting และผู้ใช้ติ๊ก "ใช้สิทธิ์ฟรี"
// 	if policy != "meeting" || !info.Discounts.UsedFreeCredit {
// 		return nil
// 	}

// 	// หา user_packages แถวล่าสุด
// 	var up entity.UserPackage
// 	if err := tx.Preload("Package").
// 		Where("user_id = ?", b.UserID).
// 		Order("created_at DESC").
// 		First(&up).Error; err != nil {
// 		// ไม่พบแพ็กเกจ -> ไม่ตัด แต่ไม่ถือเป็น error เพื่อไม่บล็อกการอนุมัติ
// 		return nil
// 	}

// 	// นับ 1 ครั้งต่อ 1 booking (ถ้าต้องการนับตามวัน: incBy := len(b.BookingDates))
// 	incBy := 1

// 	// อัปเดต usage แบบ atomic (+incBy)
// 	if err := tx.Model(&entity.UserPackage{}).
// 		Where("id = ?", up.ID).
// 		UpdateColumn("meeting_room_used", gorm.Expr("meeting_room_used + ?", incBy)).Error; err != nil {
// 		return err
// 	}

// 	// เซ็ตธงกันซ้ำลง AdditionalInfo
// 	info.QuotaConsumed = true
// 	newJSON, _ := json.Marshal(info)
// 	if err := tx.Model(&entity.BookingRoom{}).
// 		Where("id = ?", b.ID).
// 		Update("additional_info", string(newJSON)).Error; err != nil {
// 		return err
// 	}

// 	return nil
// }

// controllers/booking_room.go
func currentApproverID(c *gin.Context) *uint {
	// 1) จาก middleware (เช่น JWT) ที่ set userID ไว้ใน context
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
	// 2) เผื่อกรณีพิเศษส่ง header มา (fallback)
	if s := c.GetHeader("X-User-ID"); s != "" {
		if id, err := strconv.ParseUint(s, 10, 64); err == nil {
			u := uint(id)
			return &u
		}
	}
	// 3) เผื่อมีส่ง query ?approver_id=...
	if q := c.Query("approver_id"); q != "" {
		if id, err := strconv.ParseUint(q, 10, 64); err == nil {
			u := uint(id)
			return &u
		}
	}
	return nil
}

// controllers/booking_room.go
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
		c.JSON(http.StatusNotFound, gin.H{"error": "Booking not found"})
		return
	}
	if b.CancelledAt != nil {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Booking has been cancelled"})
		return
	}

	// ✅ ใช้ helper เดียว (ภายใน helper ให้ใช้ c.Get("userID") เป็นหลัก)
	aid := currentApproverID(c)

	// confirmed_at + event window (เหมือนเดิม) ...
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

	// หา/สร้าง Confirmed (เหมือนเดิม)
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

	// ✅ อัปเดต status_id + approver_id (ถ้ามี)
	upd := map[string]interface{}{
		"status_id":  bs.ID,
		"updated_at": time.Now(),
	}
	if aid != nil && *aid > 0 {
		upd["approver_id"] = *aid
	}
	if err := tx.Model(&entity.BookingRoom{}).
		Where("id = ?", b.ID).
		Updates(upd).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to approve booking"})
		return
	}

	// … ส่วนคำนวณ/สร้าง Payment + consumeFreeMeetingQuotaIfNeeded(...) เหมือนเดิม …

	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction failed"})
		return
	}

	// ✅ Reload พร้อม Approver ให้ FE
	if err := db.
		Preload("Payments.Status").
		Preload("PaymentOption").
		Preload("Status").
		Preload("Room").
		Preload("User").
		Preload("Approver").
		First(&b, b.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load booking data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Booking approved successfully", "data": b})
}


func RejectBookingRoom(c *gin.Context) {
    db := config.DB()
    id := c.Param("id")

    // 1) รับเหตุผลจาก body และ validate
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

    // หา/สร้างสถานะ Cancelled
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
            "status_id":      bs.ID,
            "cancelled_at":   &now,
            "cancelled_note": strings.TrimSpace(req.Note), // << บันทึกเหตุผล
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

// DELETE /payments/receipt/:payment_id
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

	// ลบไฟล์จริง (best-effort)
	if p.ReceiptPath != "" {
		_ = os.Remove(p.ReceiptPath)
	}

	// เคลียร์เฉพาะใบเสร็จ! ไม่แตะ payments.status
	updates := map[string]any{
		"receipt_path": "",
		"updated_at":   time.Now(),
	}

	// ถ้ามีคอลัมน์ receipt_status ให้ตั้งเป็น "awaiting receipt"
	if db.Migrator().HasColumn(&entity.Payment{}, "receipt_status") {
		updates["receipt_status"] = "awaiting receipt"
	}

	if err := db.Model(&p).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "update payment (clear receipt) failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
