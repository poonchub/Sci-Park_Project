package controller

import (
	"fmt"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sort"
	"time"

	"github.com/gin-gonic/gin"
)

func ListTimeSlots(c *gin.Context) {
	var timeSlot []entity.TimeSlot

	db := config.DB()

	db.Find(&timeSlot)

	c.JSON(http.StatusOK, &timeSlot)
}


func GetRoomByIDwithBookings(c *gin.Context) {
	db := config.DB()
	roomID := c.Param("id")

	var room entity.Room
	err := db.Preload("RoomType.RoomTypeLayouts.RoomLayout").
		Preload("RoomStatus").
		First(&room, roomID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้อง"})
		return
	}

	if room.RoomStatus.Code != "available" {
		c.JSON(http.StatusForbidden, gin.H{"error": "ห้องนี้ไม่พร้อมใช้งาน"})
		return
	}

	var roomPrices []entity.RoomPrice
	err = db.Preload("TimeSlot").Where("room_type_id = ?", room.RoomTypeID).Find(&roomPrices).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงราคาห้องได้"})
		return
	}

	// >>> คำนวณ Capacity จาก RoomTypeLayouts
	capacity := 0
	if len(room.RoomType.RoomTypeLayouts) > 0 {
		for _, layout := range room.RoomType.RoomTypeLayouts {
			if layout.Capacity > capacity {
				capacity = layout.Capacity // ใช้ค่ามากสุด
			}
		}
	}

	var bookings []entity.BookingRoom
	err = db.Preload("TimeSlots").
		Preload("BookingDates").
		Preload("User").
		Preload("Status").
		Joins("JOIN booking_statuses ON booking_rooms.status_id = booking_statuses.id").
		Where("booking_rooms.room_id = ? AND booking_statuses.status_name != ?", room.ID, "cancelled").
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบข้อมูลการจอง"})
		return
	}

	fmt.Printf("room.ID: %d, room.RoomTypeID: %d, room.RoomStatus.Code: %s\n", room.ID, room.RoomTypeID, room.RoomStatus.Code)
	var simpleBookings []entity.BookingRoom
	err = db.Where("room_id = ?", room.ID).Find(&simpleBookings).Error
	if err != nil {
		fmt.Printf("Error simple query: %v\n", err)
	} else {
		fmt.Printf("Simple query bookings count: %d\n", len(simpleBookings))
	}

	for i, b := range simpleBookings {
		fmt.Printf("SimpleBooking #%d ID: %d, StatusID: %d\n", i+1, b.ID, b.StatusID)
	}

	fmt.Printf("จำนวน bookings ที่ดึงมา: %d\n", len(bookings))
	for i, b := range bookings {
		fmt.Printf("BookingRoom #%d ID: %d\n", i+1, b.ID)
		fmt.Printf(" - จำนวน BookingDates: %d\n", len(b.BookingDates))
		for j, bd := range b.BookingDates {
			fmt.Printf("   BookingDate #%d: %s\n", j+1, bd.Date.Format("2006-01-02"))
		}
	}

	toHourlySlices := func(start, end time.Time) []string {
		var hours []string
		for t := start; !t.After(end.Add(-time.Hour)); t = t.Add(time.Hour) {
			hours = append(hours, t.Format("15:04"))
		}
		return hours
	}

	isSameSet := func(a, b []string) bool {
		if len(a) != len(b) {
			return false
		}
		m := make(map[string]struct{}, len(a))
		for _, v := range a {
			m[v] = struct{}{}
		}
		for _, v := range b {
			if _, ok := m[v]; !ok {
				return false
			}
		}
		return true
	}

	fullDayHours := []string{"08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"}

	morningRange := map[string]struct{}{
		"08:00": {}, "09:00": {}, "10:00": {}, "11:00": {},
	}
	afternoonRange := map[string]struct{}{
		"12:00": {}, "13:00": {}, "14:00": {}, "15:00": {}, "16:00": {},
	}

	bookedDates := map[string][]map[string]interface{}{}

	for _, booking := range bookings {

		if booking.Status.StatusName == "canceled" {
			continue
		}
		for _, bd := range booking.BookingDates {
			dateStr := bd.Date.Format("2006-01-02")

			if _, ok := bookedDates[dateStr]; !ok {
				bookedDates[dateStr] = []map[string]interface{}{}
			}

			if len(booking.TimeSlots) == 0 {
				// ไม่มี TimeSlot → Full Day
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "fullDay",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    fullDayHours,
				})
				continue
			}

			var allHours []string
			fullDaySlotFound := false

			for _, ts := range booking.TimeSlots {
				// ถ้าช่วงเวลาครอบทั้งวัน → Full Day
				if ts.StartTime.Format("15:04") == "08:00" && ts.EndTime.Format("15:04") == "17:00" {
					fullDaySlotFound = true
				}
				hours := toHourlySlices(ts.StartTime, ts.EndTime)
				allHours = append(allHours, hours...)
			}

			if fullDaySlotFound {
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "fullDay",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    fullDayHours,
				})
				continue
			}

			// ลบชั่วโมงซ้ำ
			hourSet := make(map[string]struct{})
			for _, h := range allHours {
				hourSet[h] = struct{}{}
			}
			uniqueHours := make([]string, 0, len(hourSet))
			for h := range hourSet {
				uniqueHours = append(uniqueHours, h)
			}
			sort.Strings(uniqueHours)

			// ป้องกัน subset ถูกนับเป็น full day
			if len(uniqueHours) == len(fullDayHours) && isSameSet(uniqueHours, fullDayHours) {
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "fullDay",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    fullDayHours,
				})
				continue
			}

			// เช็ก morning
			isMorning := true
			for _, h := range uniqueHours {
				if _, ok := morningRange[h]; !ok {
					isMorning = false
					break
				}
			}

			// เช็ก afternoon
			isAfternoon := true
			for _, h := range uniqueHours {
				if _, ok := afternoonRange[h]; !ok {
					isAfternoon = false
					break
				}
			}

			if isMorning && len(uniqueHours) == len(morningRange) {
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "morning",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    uniqueHours,
				})
			} else if isAfternoon && len(uniqueHours) == len(afternoonRange) {
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "afternoon",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    uniqueHours,
				})
			} else {
				bookedDates[dateStr] = append(bookedDates[dateStr], map[string]interface{}{
					"type":     "hourly",
					"bookedBy": booking.User.FirstName,
					"status":   booking.Status.StatusName,
					"hours":    uniqueHours,
				})
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"Room":        room,
		"Capacity":   capacity,
		"RoomPrices":  roomPrices,
		"BookedDates": bookedDates,
	})
}




// ดึง Timeslot ทั้งหมด
func GetTimeSlots(c *gin.Context) {
	db := config.DB()
	var timeslots []entity.TimeSlot
	if err := db.Find(&timeslots).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูล timeslot ได้"})
		return
	}
	c.JSON(http.StatusOK, timeslots)
}

// สร้าง Timeslot ใหม่
func CreateTimeSlot(c *gin.Context) {
	db := config.DB()
	var timeslot entity.TimeSlot
	if err := c.ShouldBindJSON(&timeslot); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := db.Create(&timeslot).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้าง timeslot ได้"})
		return
	}
	c.JSON(http.StatusCreated, timeslot)
}
