package controller

import (
	"fmt"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
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
	if room.RoomNumber == "" || room.RoomStatusID == 0 || room.FloorID == 0 || room.RoomTypeID == 0 {
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
	if room.RoomNumber == "" || room.RoomStatusID == 0 || room.FloorID == 0 || room.RoomTypeID == 0 {
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
		RoomStatusID: room.RoomStatusID,
		FloorID:      room.FloorID,
		RoomTypeID:   room.RoomTypeID,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to update room: %v", err)})
		return
	}

	// ส่ง response กลับเมื่ออัพเดทห้องสำเร็จ
	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Room updated successfully",
		"room": gin.H{
			"ID":           existingRoom.ID,
			"RoomNumber":   existingRoom.RoomNumber,
			"RoomStatusID": existingRoom.RoomStatusID,
			"FloorID":      existingRoom.FloorID,
			"RoomTypeID":   existingRoom.RoomTypeID,
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

        floorID, _ := strconv.Atoi(c.DefaultQuery("floor", "0"))
        roomTypeID, _ := strconv.Atoi(c.DefaultQuery("room_type", "0"))
        roomStatusID, _ := strconv.Atoi(c.DefaultQuery("room_status", "0"))
        // capacityMin, capacityMax เอาออก เพราะไม่อยู่ใน Room ตารางนี้

        page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
        limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

        if page < 1 {
            page = 1
        }
        if limit < 1 {
            limit = 10
        }
        offset := (page - 1) * limit

        db := config.DB()

        if floorID > 0 {
            db = db.Where("floor_id = ?", floorID)
        }
        if roomTypeID > 0 {
            db = db.Where("room_type_id = ?", roomTypeID)
        }
        if roomStatusID > 0 {
            db = db.Where("room_status_id = ?", roomStatusID)
        }

        query := db.Preload("Floor").
                    Preload("RoomType.RoomTypeLayouts").  // โหลด RoomTypeLayouts ด้วย
                    Preload("RoomStatus").
                    Order("rooms.created_at DESC").
                    Limit(limit).
                    Offset(offset)

        if err := query.Find(&rooms).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
            return
        }

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

        var roomResponses []map[string]interface{}
        for _, room := range rooms {
            capacity := 0
            if len(room.RoomType.RoomTypeLayouts) > 0 {
                capacity = room.RoomType.RoomTypeLayouts[0].Capacity
            }
            roomResponse := map[string]interface{}{
                "ID":           room.ID,
                "RoomNumber":   room.RoomNumber,
                "Capacity":     capacity,  // ดึงจาก RoomTypeLayout
                "FloorID":      room.FloorID,
                "RoomTypeID":   room.RoomTypeID,
                "RoomStatusID": room.RoomStatusID,
                "Floor":        room.Floor.Number,
                "RoomType":     room.RoomType.TypeName,
                "RoomStatus":   room.RoomStatus.StatusName,
            }
            roomResponses = append(roomResponses, roomResponse)
        }

        c.JSON(http.StatusOK, gin.H{
            "data":       roomResponses,
            "page":       page,
            "limit":      limit,
            "total":      total,
            "totalPages": (total + int64(limit) - 1) / int64(limit),
        })
    }



// GET /room/:id
func GetRoomByID(c *gin.Context) {
    roomID := c.Param("id")
    var room entity.Room

    // preload ให้ครบทั้ง Floor, RoomTypeLayouts, RoomStatus
    if err := config.DB().
        Preload("Floor").
        Preload("RoomType.RoomTypeLayouts").
        Preload("RoomStatus").
        First(&room, roomID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
        return
    }

    // ดึง capacity จาก RoomTypeLayouts (ตัวแรก)
    capacity := 0
    if len(room.RoomType.RoomTypeLayouts) > 0 {
        capacity = room.RoomType.RoomTypeLayouts[0].Capacity
    }

    // ส่งข้อมูลครบสำหรับใช้ในหน้า Edit Room
    c.JSON(http.StatusOK, gin.H{
        "ID":           room.ID,
        "RoomNumber":   room.RoomNumber,
        "RoomStatusID": room.RoomStatusID,
        "FloorID":      room.FloorID,
        "RoomTypeID":   room.RoomTypeID,
        "Capacity":     capacity,
        "Floor":        room.Floor.Number,
        "RoomType":     room.RoomType.TypeName,
        "RoomStatus":   room.RoomStatus.StatusName,
    })
}


// handler.go

func GetRoomsByRoomTypeID(c *gin.Context) {
	var rooms []entity.Room
	id := c.Param("id")

	if err := config.DB().
		Preload("RoomStatus").
		Preload("Floor").
		Where("room_type_id = ?", id).
		Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, rooms)
}

// GET /room-rental-space-option
func GetRoomRentalSpaceByOption(c *gin.Context) {
	var rooms []entity.Room
	db := config.DB()

	floorID, _ := strconv.Atoi(c.DefaultQuery("floorId", "0"))
	roomStatusID, _ := strconv.Atoi(c.DefaultQuery("roomStatusId", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	var roomtype entity.RoomType
	if err := db.Where("type_name = ?", "Rental Space").First(&roomtype).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room Type 'Rental Space' not found"})
		return
	}

	query := db.Model(&entity.Room{})

	if roomtype.ID != 0 {
		query = query.Where("room_type_id = ?", roomtype.ID)
	}
	if floorID != 0 {
		query = query.Where("floor_id = ?", floorID)
	}
	if roomStatusID != 0 {
		query = query.Where("room_status_id = ?", roomStatusID)
	}

	query = query.
		Preload("Floor").
		Preload("RoomStatus").
		Preload("Invoice.Notifications").
		Preload("ServiceAreaDocument.RequestServiceArea.User").
		Preload("ServiceAreaDocument.ServiceUserType")

	if err := query.Limit(limit).Offset(offset).Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var total int64
	countQuery := db.Model(&entity.Room{})
	if roomtype.ID != 0 {
		countQuery = countQuery.Where("room_type_id = ?", roomtype.ID)
	}
	if floorID != 0 {
		countQuery = countQuery.Where("floor_id = ?", floorID)
	}
	if roomStatusID != 0 {
		countQuery = countQuery.Where("room_status_id = ?", roomStatusID)
	}
	countQuery.Count(&total)

	c.JSON(http.StatusOK, gin.H{
		"data":       rooms,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit),
	})
}
