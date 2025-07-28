package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

func ListTimeSlots(c *gin.Context) {
	var timeSlot []entity.TimeSlot

	db := config.DB()

	db.Find(&timeSlot)

	c.JSON(http.StatusOK, &timeSlot)
}

// // GetRoomTypeID ส่งราคาและวันเวลาที่ห้องถูกจองแล้ว
// func GetRoomTypeID(c *gin.Context) {
// 	db := config.DB()
// 	roomTypeID := c.Param("id")

// 	// 1. ดึงราคาโดยใช้ RoomTypeID
// 	var roomPrices []entity.RoomPrice
// 	err := db.Preload("TimeSlot").Where("room_type_id = ?", roomTypeID).Find(&roomPrices).Error
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error":  "failed to get room prices",
// 			"detail": err.Error(),
// 		})
// 		return
// 	}

// 	// 2. ดึง Room ทั้งหมดที่อยู่ใน RoomType นี้
// 	var rooms []entity.Room
// 	err = db.Where("room_type_id = ?", roomTypeID).Find(&rooms).Error
// 	if err != nil || len(rooms) == 0 {
// 		c.JSON(http.StatusInternalServerError, gin.H{
// 			"error": "ไม่พบห้องในประเภทนี้",
// 		})
// 		return
// 	}

// 	// เอา room_id ทั้งหมดในประเภทนี้ไปดึง BookingRoom
// 	roomIDs := []uint{}
// 	for _, room := range rooms {
// 		roomIDs = append(roomIDs, room.ID)
// 	}

// 	var bookings []entity.BookingRoom
// 	err = db.Preload("TimeSlot").Where("room_id IN ?", roomIDs).Find(&bookings).Error
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบข้อมูลการจอง"})
// 		return
// 	}

// 	// 3. จัดรูปแบบข้อมูลที่ถูกจอง
// 	bookedMap := map[string]map[string]bool{}
// 	for _, b := range bookings {
// 		dateStr := b.Date.Format("2006-01-02")
// 		if _, ok := bookedMap[dateStr]; !ok {
// 			bookedMap[dateStr] = map[string]bool{"morning": false, "afternoon": false}
// 		}
// 		switch b.TimeSlot.TimeSlotName {
// 		case "เช้า":
// 			bookedMap[dateStr]["morning"] = true
// 		case "บ่าย":
// 			bookedMap[dateStr]["afternoon"] = true
// 		case "เต็มวัน":
// 			bookedMap[dateStr]["morning"] = true
// 			bookedMap[dateStr]["afternoon"] = true
// 		}
// 	}

// 	c.JSON(http.StatusOK, gin.H{
// 		"RoomPrices":  roomPrices,
// 		"BookedDates": bookedMap,
// 	})
// }

func GetRoomByIDwithBookings(c *gin.Context) {
	db := config.DB()
	roomID := c.Param("id")

	// 1. หา room ที่เลือก พร้อม preload RoomType
	var room entity.Room
	err := db.Preload("RoomType").First(&room, roomID).Error
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบห้อง"})
		return
	}

	// 2. หา RoomPrice ตาม RoomType ของห้อง พร้อม preload TimeSlot
	var roomPrices []entity.RoomPrice
	err = db.Preload("TimeSlot").Where("room_type_id = ?", room.RoomTypeID).Find(&roomPrices).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงราคาห้องได้"})
		return
	}

	// 3. หา booking ของห้องนี้ (เว้นที่ยกเลิกแล้ว)
	var bookings []entity.BookingRoom
	err = db.Preload("TimeSlot").
		Where("room_id = ? AND status != ?", room.ID, "cancelled").
		Find(&bookings).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบข้อมูลการจอง"})
		return
	}

	// 4. สร้าง booking map
	bookedMap := map[string]map[string]bool{}
	for _, b := range bookings {
		dateStr := b.Date.Format("2006-01-02")
		if _, ok := bookedMap[dateStr]; !ok {
			bookedMap[dateStr] = map[string]bool{"morning": false, "afternoon": false}
		}

		switch b.TimeSlot.TimeSlotName {
		case "เช้า":
			bookedMap[dateStr]["morning"] = true
		case "บ่าย":
			bookedMap[dateStr]["afternoon"] = true
		case "เต็มวัน":
			bookedMap[dateStr]["morning"] = true
			bookedMap[dateStr]["afternoon"] = true
		}
	}

	// 5. ตอบกลับ JSON พร้อมข้อมูล room, ราคาห้อง, และแผนที่การจอง
	c.JSON(http.StatusOK, gin.H{
		"Room":        room,
		"RoomPrices":  roomPrices,
		"BookedDates": bookedMap,
	})
}


// func GetRoomByIDwithBookings(c *gin.Context) {
//     db := config.DB()
// 	roomtypeID := c.Param("id")

// 	var roomtype entity.RoomType
// 	err := db.Preload("Rooms").First(&roomtype, roomtypeID).Error
// 	if err != nil {
// 		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบประเภทห้อง"})
// 		return
// 	}

// 	var roomPrices []entity.RoomPrice
// 	err = db.Preload("TimeSlot").Where("room_type_id = ?", roomtype.ID).Find(&roomPrices).Error
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงราคาห้องได้"})
// 		return
// 	}

// 	// หา room_id ทั้งหมดจาก roomtype นี้
// 	var roomIDs []uint
// 	for _, r := range roomtype.Rooms {
// 		roomIDs = append(roomIDs, r.ID)
// 	}

// 	// หา bookings ของทุกห้อง
// 	var bookings []entity.BookingRoom
// 	err = db.Preload("TimeSlot").Where("room_id IN ?", roomIDs).Find(&bookings).Error
// 	if err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่พบข้อมูลการจอง"})
// 		return
// 	}

// 	// 4. สร้าง booking map
// 	bookedMap := map[string]map[string]bool{}
// 	for _, b := range bookings {
// 		dateStr := b.Date.Format("2006-01-02")
// 		if _, ok := bookedMap[dateStr]; !ok {
// 			bookedMap[dateStr] = map[string]bool{"morning": false, "afternoon": false}
// 		}
// 		switch b.TimeSlot.TimeSlotName {
// 		case "เช้า":
// 			bookedMap[dateStr]["morning"] = true
// 		case "บ่าย":
// 			bookedMap[dateStr]["afternoon"] = true
// 		case "เต็มวัน":
// 			bookedMap[dateStr]["morning"] = true
// 			bookedMap[dateStr]["afternoon"] = true
// 		}
// 	}

// 	// 5. ตอบกลับ
// 	c.JSON(http.StatusOK, gin.H{
// 		"RoomPrices":  roomPrices,
// 		"BookedDates": bookedMap,
// 	})
// }
