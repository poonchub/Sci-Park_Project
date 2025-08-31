// ==== เพิ่มในไฟล์ config/seed.go (หรือไฟล์เดียวกับ SeedDatabase) ====
package config

import (
	"encoding/json"
	"fmt"
	"time"

	"sci-park_web-application/entity"

	"gorm.io/gorm"
)

func seedBookingDemoData(db *gorm.DB) {
	// 1) Ensure BookingStatus ที่ UI ใช้
	statusNames := []string{"pending", "confirmed", "completed", "cancelled"}
	// หมายเหตุ:
	// - โค้ดเดิมมี "confirmed","unconfirmed","canceled"
	// - UI ฝั่ง FE ใช้ "pending","confirmed","completed","cancelled"
	// => ใส่ทั้งหมดไปก่อน ใครซ้ำระบบจะไม่สร้างใหม่ (uniqueIndex)
	for _, name := range statusNames {
		var s entity.BookingStatus
		db.FirstOrCreate(&s, entity.BookingStatus{StatusName: name})
	}

	// 2) ดึง PaymentStatus (ใช้ชื่อจาก Seed เดิมของคุณ)
	var psPendingPay, psPendingVerify, psPaid, psRejected, psRefunded entity.PaymentStatus
	db.Where("name = ?", "Pending Payment").FirstOrCreate(&psPendingPay, entity.PaymentStatus{Name: "Pending Payment"})
	db.Where("name = ?", "Pending Verification").FirstOrCreate(&psPendingVerify, entity.PaymentStatus{Name: "Pending Verification"})
	db.Where("name = ?", "Paid").FirstOrCreate(&psPaid, entity.PaymentStatus{Name: "Paid"})
	db.Where("name = ?", "Rejected").FirstOrCreate(&psRejected, entity.PaymentStatus{Name: "Rejected"})
	db.Where("name = ?", "Refunded").FirstOrCreate(&psRefunded, entity.PaymentStatus{Name: "Refunded"})

	// 3) ดึง Users ตัวอย่างจาก seed เดิม (เปลี่ยนเมลตามที่มีจริงใน Seed คุณ)
	var uAdmin, uMgr1, uInt1, uInt2 entity.User
	db.Where("email = ?", "admin@gmail.com").First(&uAdmin)
	db.Where("email = ?", "manager1@gmail.com").First(&uMgr1)
	db.Where("email = ?", "internaluser1@gmail.com").First(&uInt1)
	db.Where("email = ?", "internaluser2@gmail.com").First(&uInt2)

	// 4) ดึง Room ตัวอย่าง
	var rA302, rA303, rB404, rA211 entity.Room
	db.Where("room_number = ?", "A302").First(&rA302)
	db.Where("room_number = ?", "A303").First(&rA303)
	db.Where("room_number = ?", "B404").First(&rB404)
	db.Where("room_number = ?", "A211").First(&rA211)

	// 5) ดึง TimeSlot ที่ seed ไว้ (Morning/Afternoon/Fullday + hourly)
	var tsMorning, tsAfternoon, tsFull entity.TimeSlot
	db.Where("time_slot_name = ?", "Morning").First(&tsMorning)
	db.Where("time_slot_name = ?", "Afternoon").First(&tsAfternoon)
	db.Where("time_slot_name = ?", "Fullday").First(&tsFull)

	var ts0830, ts0930, ts1030, ts1330, ts1430 entity.TimeSlot
	db.Where("time_slot_name = ?", "08:30-09:30").First(&ts0830)
	db.Where("time_slot_name = ?", "09:30-10:30").First(&ts0930)
	db.Where("time_slot_name = ?", "10:30-11:30").First(&ts1030)
	db.Where("time_slot_name = ?", "13:30-14:30").First(&ts1330)
	db.Where("time_slot_name = ?", "14:30-15:30").First(&ts1430)

	// 6) helper ง่าย ๆ
	getBookingStatusID := func(name string) uint {
		var s entity.BookingStatus
		db.Where("status_name = ?", name).First(&s)
		return s.ID
	}
	addInfo := func(setup string, eq []string, note string) string {
		b, _ := json.Marshal(struct {
			SetupStyle     string   `json:"SetupStyle"`
			Equipment      []string `json:"Equipment"`
			AdditionalNote string   `json:"AdditionalNote"`
		}{setup, eq, note})
		return string(b)
	}
	createBooking := func(b entity.BookingRoom, slots []entity.TimeSlot, dates []string) entity.BookingRoom {
		// สร้าง booking
		db.Create(&b)

		// แนบ TimeSlots (many2many)
		if len(slots) > 0 {
			_ = db.Model(&b).Association("TimeSlots").Append(slots)
		}

		// แนบ BookingDates
		for _, ds := range dates {
			d, _ := time.Parse("2006-01-02", ds)
			db.Create(&entity.BookingDate{BookingRoomID: b.ID, Date: d})
		}
		return b
	}
	createPayment := func(p entity.Payment) entity.Payment {
		db.Create(&p)
		return p
	}

	// =========================
	// 7) สร้าง Booking หลาย ๆ เคส
	// =========================
	now := time.Now()

	// 7.1 pending (= unconfirmed) ยังไม่จ่าย
	_ = createBooking(entity.BookingRoom{
		Purpose:        "Team sync (pending/unpaid)",
		UserID:         uInt1.ID,
		RoomID:         rA302.ID,
		StatusID:       getBookingStatusID("pending"),
		AdditionalInfo: addInfo("U-shape", []string{"Projector", "Whiteboard"}, "Need HDMI"),
	}, []entity.TimeSlot{ts0830, ts0930, ts1030}, []string{
		now.AddDate(0, 0, 2).Format("2006-01-02"),
	})

	// 7.2 confirmed + unpaid (ยังไม่ส่งสลิป)
	_ = createBooking(entity.BookingRoom{
		Purpose:        "Client meeting (confirmed/unpaid)",
		UserID:         uInt2.ID,
		RoomID:         rA303.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Classroom", []string{"TV"}, ""),
	}, []entity.TimeSlot{tsMorning}, []string{
		now.AddDate(0, 0, 3).Format("2006-01-02"),
	})

	// 7.3 confirmed + submitted slip (รอตรวจ) -> PaymentStatus = Pending Verification
	b3 := createBooking(entity.BookingRoom{
		Purpose:        "Workshop (confirmed/submitted)",
		UserID:         uInt1.ID,
		RoomID:         rB404.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Theater", []string{"Mic", "Speakers"}, "Bring own laptop"),
	}, []entity.TimeSlot{tsAfternoon}, []string{
		now.AddDate(0, 0, 4).Format("2006-01-02"),
	})
	createPayment(entity.Payment{
		PaymentDate:   now.Add(-24 * time.Hour),
		Amount:        1200,
		SlipPath:      "/images/payment/user_submitted/slip_1.png",
		PayerID:       uInt1.ID,
		BookingRoomID: b3.ID,
		StatusID:      psPendingVerify.ID, // รอตรวจสลิป
	})

	// 7.4 confirmed + paid (ตรวจแล้ว)
	b4 := createBooking(entity.BookingRoom{
		Purpose:        "Training (confirmed/paid)",
		UserID:         uInt2.ID,
		RoomID:         rA211.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Classroom", []string{"TV", "Projector"}, ""),
	}, []entity.TimeSlot{tsFull}, []string{
		now.AddDate(0, 0, 5).Format("2006-01-02"),
	})
	createPayment(entity.Payment{
		PaymentDate:   now.Add(-12 * time.Hour),
		Amount:        2000,
		SlipPath:      "/images/payment/user_paid/slip_2000.png",
		PayerID:       uInt2.ID,
		BookingRoomID: b4.ID,
		StatusID:      psPaid.ID,
	})

	// 7.5 confirmed + refunded
	b5 := createBooking(entity.BookingRoom{
		Purpose:        "Seminar (confirmed/refunded)",
		UserID:         uAdmin.ID,
		RoomID:         rA302.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Theater", []string{"Mic"}, "Refund case"),
	}, []entity.TimeSlot{ts1330, ts1430}, []string{
		now.AddDate(0, 0, 6).Format("2006-01-02"),
	})
	createPayment(entity.Payment{
		PaymentDate:   now.Add(-48 * time.Hour),
		Amount:        1500,
		SlipPath:      "/images/payment/refund/slip_1500.png",
		PayerID:       uAdmin.ID,
		BookingRoomID: b5.ID,
		StatusID:      psRefunded.ID,
	})

	// 7.6 completed (ปิดงานแล้ว) — ตรง ๆ ใส่ status "completed"
	_ = createBooking(entity.BookingRoom{
		Purpose:        "Board review (completed)",
		UserID:         uMgr1.ID,
		RoomID:         rB404.ID,
		StatusID:       getBookingStatusID("completed"),
		AdditionalInfo: addInfo("U-shape", []string{"Whiteboard"}, ""),
	}, []entity.TimeSlot{tsMorning}, []string{
		now.AddDate(0, 0, -1).Format("2006-01-02"),
	})

	// 7.7 cancelled (ยกเลิกไปแล้ว)
	_ = createBooking(entity.BookingRoom{
		Purpose:        "Cancelled demo",
		UserID:         uInt1.ID,
		RoomID:         rA303.ID,
		StatusID:       getBookingStatusID("cancelled"),
		AdditionalInfo: addInfo("Theater", []string{}, "User cancelled"),
		CancelledAt:    &[]time.Time{now.Add(-2 * time.Hour)}[0],
	}, []entity.TimeSlot{tsAfternoon}, []string{
		now.AddDate(0, 0, 7).Format("2006-01-02"),
	})

	// 7.8 multi-day + หลายช่วงเวลา
	_ = createBooking(entity.BookingRoom{
		Purpose:        "2-day workshop (pending)",
		UserID:         uInt2.ID,
		RoomID:         rA211.ID,
		StatusID:       getBookingStatusID("pending"),
		AdditionalInfo: addInfo("Classroom", []string{"TV", "Mic"}, "Two days event"),
	}, []entity.TimeSlot{ts0830, ts0930, ts1030, ts1330}, []string{
		now.AddDate(0, 0, 8).Format("2006-01-02"),
		now.AddDate(0, 0, 9).Format("2006-01-02"),
	})

	// 7.9 confirmed -> submitted -> rejected (ต้องอัปโหลดใหม่)
	b9 := createBooking(entity.BookingRoom{
		Purpose:        "Payment rejected (need reupload)",
		UserID:         uInt1.ID,
		RoomID:         rA302.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Classroom", []string{"Projector"}, ""),
	}, []entity.TimeSlot{tsMorning}, []string{
		now.AddDate(0, 0, 10).Format("2006-01-02"),
	})
	createPayment(entity.Payment{
		PaymentDate:   now.Add(-6 * time.Hour),
		Amount:        1000,
		SlipPath:      "/images/payment/rejected/slip_wrong.png",
		PayerID:       uInt1.ID,
		BookingRoomID: b9.ID,
		StatusID:      psRejected.ID, // ไม่ผ่าน
	})

	// 7.10 confirmed + paid + มี invoice (ตัวอย่างแนบ InvoiceID)
	var inv entity.Invoice
	db.FirstOrCreate(&inv, entity.Invoice{
		InvoiceNumber: fmt.Sprintf("INV-%d", now.Unix()),
	})
	b10 := createBooking(entity.BookingRoom{
		Purpose:        "With invoice (paid)",
		UserID:         uInt2.ID,
		RoomID:         rA303.ID,
		StatusID:       getBookingStatusID("confirmed"),
		AdditionalInfo: addInfo("Theater", []string{"Mic"}, "Invoice sample"),
	}, []entity.TimeSlot{tsFull}, []string{
		now.AddDate(0, 0, 12).Format("2006-01-02"),
	})
	createPayment(entity.Payment{
		PaymentDate:   now.Add(-3 * time.Hour),
		Amount:        2500,
		SlipPath:      "/images/payment/invoice/slip_2500.png",
		PayerID:       uInt2.ID,
		BookingRoomID: b10.ID,
		InvoiceID:     inv.ID,
		StatusID:      psPaid.ID,
	})

	fmt.Println("✅ Seed booking demo data (many cases) done.")
}
