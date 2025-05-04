package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"github.com/gin-gonic/gin"
    "fmt"
)

func CreateRoom(c *gin.Context) {
	var room entity.Room
    db := config.DB()

	// Bind JSON จาก request body
	if err := c.ShouldBindJSON(&room); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่า RoomNumber ซ้ำในฐานข้อมูลหรือไม่
	var existingRoom entity.Room
	if err := db.Where("room_number = ?", room.RoomNumber).First(&existingRoom).Error; err == nil {
		// ถ้าพบห้องที่มี RoomNumber ซ้ำ
		c.JSON(http.StatusConflict, gin.H{"error": "RoomNumber already exists"})
		return
	}

	// ตรวจสอบข้อมูลที่ต้องการ
	if room.RoomNumber == "" || room.Capacity == 0 || room.RoomStatusID == 0 || room.FloorID == 0 || room.RoomTypeID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
		return
	}

	// บันทึกห้องใหม่ลงในฐานข้อมูล
	if err := db.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to create room: %v", err)})
		return
	}

	// ส่ง response กลับเมื่อห้องถูกสร้างสำเร็จ
	c.JSON(http.StatusCreated, gin.H{
		"message": "Room created successfully",
		"room":    room,
	})
}

func UpdateRoom(c *gin.Context) {
    var room entity.Room
    db := config.DB()

    // รับ RoomID จาก URL
    roomID := c.Param("id")

    // Bind JSON จาก request body
    if err := c.ShouldBindJSON(&room); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // ตรวจสอบว่า RoomNumber ซ้ำในฐานข้อมูลหรือไม่
    var existingRoom entity.Room
    if err := db.Where("room_number = ? AND id != ?", room.RoomNumber, roomID).First(&existingRoom).Error; err == nil {
        // ถ้าพบห้องที่มี RoomNumber ซ้ำ
        c.JSON(http.StatusConflict, gin.H{"error": "RoomNumber already exists"})
        return
    }

    // ตรวจสอบข้อมูลที่ต้องการ
    if room.RoomNumber == "" || room.Capacity == 0 || room.RoomStatusID == 0 || room.FloorID == 0 || room.RoomTypeID == 0 {
        c.JSON(http.StatusBadRequest, gin.H{"error": "All fields are required"})
        return
    }

    // หาห้องที่ต้องการอัพเดท
    if err := db.Where("id = ?", roomID).First(&existingRoom).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
        return
    }

    // อัปเดตห้องด้วยค่าจาก JSON request ที่รับมา
    if err := db.Model(&existingRoom).Updates(entity.Room{
        RoomNumber:   room.RoomNumber,
        Capacity:     room.Capacity,
        RoomStatusID: room.RoomStatusID,
        FloorID:      room.FloorID,
        RoomTypeID:   room.RoomTypeID,
    }).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to update room: %v", err)})
        return
    }

    // ส่ง response กลับเมื่ออัพเดทห้องสำเร็จ
    c.JSON(http.StatusOK, gin.H{
        "message": "Room updated successfully",
        "room": gin.H{
            "ID":          existingRoom.ID,
            "RoomNumber":  existingRoom.RoomNumber,
            "Capacity":    existingRoom.Capacity,
            "RoomStatusID": existingRoom.RoomStatusID,
            "FloorID":     existingRoom.FloorID,
            "RoomTypeID":  existingRoom.RoomTypeID,
        },
    })
}



// GET /rooms
func ListRooms(c *gin.Context) {
	var room []entity.Room

	db := config.DB()

	db.Find(&room)

	c.JSON(http.StatusOK, &room)
}

// GET /rooms
func ListSetRooms(c *gin.Context) {
    var rooms []entity.Room

    // รับค่าจาก Query Parameters
    floorID, _ := strconv.Atoi(c.DefaultQuery("floor", "0"))
    roomTypeID, _ := strconv.Atoi(c.DefaultQuery("room_type", "0"))
    roomStatusID, _ := strconv.Atoi(c.DefaultQuery("room_status", "0"))
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

    // ตรวจสอบค่าที่ส่งมา
    if page < 1 {
        page = 1
    }
    if limit < 1 {
        limit = 10
    }
    offset := (page - 1) * limit

    // เชื่อมต่อกับฐานข้อมูล
    db := config.DB()

    // การกรองตาม floor_id
    if floorID > 0 {
        db = db.Where("floor_id = ?", floorID)
    }

    // การกรองตาม room_type_id
    if roomTypeID > 0 {
        db = db.Where("room_type_id = ?", roomTypeID)
    }

    // การกรองตาม room_status_id
    if roomStatusID > 0 {
        db = db.Where("room_status_id = ?", roomStatusID)
    }

    // ดึงข้อมูลห้องจากฐานข้อมูล
    query := db.Preload("Floor").Preload("RoomType").Preload("RoomStatus")

    // แก้ไขการ ORDER โดยใช้ `rooms.created_at` เพื่อระบุคอลัมน์ที่มาจากตาราง `rooms`
    if err := query.Order("rooms.created_at DESC").Limit(limit).Offset(offset).Find(&rooms).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
        return
    }

    // คำนวณจำนวนทั้งหมดแยกออกจาก Query หลัก
    var total int64
    countQuery := config.DB().Model(&entity.Room{})

    if floorID > 0 {
        countQuery = countQuery.Where("floor_id = ?", floorID)
    }

    if roomTypeID > 0 {
        countQuery = countQuery.Where("room_type_id = ?", roomTypeID)
    }

    if roomStatusID > 0 {
        countQuery = countQuery.Where("room_status_id = ?", roomStatusID)
    }

    countQuery.Count(&total)

    // จัดรูปแบบข้อมูลที่ส่งกลับให้เป็น PascalCase
    var roomResponses []map[string]interface{}
    for _, room := range rooms {
        roomResponse := map[string]interface{}{
            "ID":              room.ID,
            "RoomNumber":      room.RoomNumber,
            "Capacity":        room.Capacity,
            "FloorID":         room.FloorID,
            "RoomTypeID":      room.RoomTypeID,
            "RoomStatusID":    room.RoomStatusID,
            "Floor":           room.Floor.Number,  // ดึงข้อมูลจาก Floor
            "RoomType":        room.RoomType.TypeName,  // ดึงข้อมูลจาก RoomType
            "RoomStatus":      room.RoomStatus.StatusName,  // ดึงข้อมูลจาก RoomStatus
        }

        roomResponses = append(roomResponses, roomResponse)
    }

    // ส่งข้อมูลห้องทั้งหมดกลับไปในรูปแบบ JSON
    c.JSON(http.StatusOK, gin.H{
        "data":       roomResponses,
        "page":       page,
        "limit":      limit,
        "total":      total,
        "totalPages": (total + int64(limit) - 1) / int64(limit), // คำนวณจำนวนหน้าทั้งหมด
    })
}
