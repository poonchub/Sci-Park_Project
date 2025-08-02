package controller

import (
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"time"

	"github.com/gin-gonic/gin"
)

func GetPendingPayments(c *gin.Context) {
    db := config.DB()

    var bookings []entity.BookingRoom

    // ดึง BookingRoom ที่ยังไม่มี Payment ที่สถานะ Confirmed
    err := db.Preload("User").
        Preload("Room").
        Preload("TimeSlot").
        Preload("Payments", "status != ?", "confirmed"). // ดึง payment ที่ยังไม่ confirm
        Where("id IN (?)", db.Model(&entity.Payment{}).
            Select("booking_room_id").
            Where("status != ?", "confirmed")).
        Find(&bookings).Error

    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลได้: " + err.Error()})
        return
    }

    c.JSON(http.StatusOK, gin.H{
        "pending_bookings": bookings,
    })
}

type PaymentUpdateInput struct {
    PaymentID uint   `json:"payment_id" binding:"required"`
    Status    string `json:"status" binding:"required,oneof=pending confirmed cancelled"`
}

func UpdatePaymentStatus(c *gin.Context) {
    db := config.DB()

    var input PaymentUpdateInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง: " + err.Error()})
        return
    }

    var payment entity.Payment
    if err := db.First(&payment, input.PaymentID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบการชำระเงินนี้"})
        return
    }

    payment.Status = input.Status

    if err := db.Save(&payment).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตสถานะได้"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "อัปเดตสถานะสำเร็จ"})
}

func CancelExpiredBookings() {
    db := config.DB()
    expiryDuration := 15 * time.Minute
    cutoffTime := time.Now().Add(-expiryDuration)

    var expiredBookings []entity.BookingRoom

    // preload payments ที่สถานะยืนยันแล้ว
    err := db.Preload("Payments", "status = ?", "confirmed").
        Where("created_at <= ?", cutoffTime).
        Find(&expiredBookings).Error
    if err != nil {
        log.Println("Error fetching expired bookings:", err)
        return
    }

    for _, booking := range expiredBookings {
        if len(booking.Payments) == 0 {
            log.Println("Booking", booking.ID, "ไม่มี payment confirmed")
            if err := db.Delete(&booking).Error; err != nil {
                log.Println("Error cancelling booking ID", booking.ID, err)
            } else {
                log.Println("Cancelled expired booking ID", booking.ID)
            }
        } else {
            log.Println("Booking", booking.ID, "มี payment แล้ว ไม่ลบ")
        }
    }
}


func CancelExpiredBookingsHandler(c *gin.Context) {
    CancelExpiredBookings() // เรียกฟังก์ชันเดิม
    c.JSON(http.StatusOK, gin.H{"message": "ยกเลิกการจองที่หมดอายุแล้วเรียบร้อย"})
}