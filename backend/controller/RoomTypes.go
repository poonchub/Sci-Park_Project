package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
    "fmt"
	"github.com/gin-gonic/gin"
)


// GET /room-types
func ListRoomTypes(c *gin.Context) {
    var roomTypes []entity.RoomType

    db := config.DB()

    // ดึงข้อมูลจากฐานข้อมูล
    if err := db.Find(&roomTypes).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room types"})
        return
    }

    // สร้างแผนที่ข้อมูลที่ต้องการส่งกลับ (แค่ ID, TypeName, HalfDayRate, FullDayRate)
    var result []map[string]interface{}
    for _, roomType := range roomTypes {
        result = append(result, map[string]interface{}{
            "ID":          roomType.ID,
            "TypeName":    roomType.TypeName,
           
        })
    }

    // ส่งผลลัพธ์กลับในรูปแบบ JSON
    c.JSON(http.StatusOK, result)
}

// GET /room-types-for-booking
func ListRoomTypesForBooking(c *gin.Context) {
    var roomTypes []entity.RoomType

    db := config.DB()

    // ดึงข้อมูลจากฐานข้อมูล
    if err := db.
		Preload("RoomTypeLayouts.RoomLayout").
		Preload("RoomEquipments.Equipment").
		Preload("RoomTypeImages").
		Preload("RoomPrices").
		Find(&roomTypes).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room types"})
        return
    }

    // สร้างแผนที่ข้อมูลที่ต้องการส่งกลับ (แค่ ID, TypeName, HalfDayRate, FullDayRate)
    var result []map[string]interface{}
    for _, roomType := range roomTypes {
        result = append(result, map[string]interface{}{
            "ID":          roomType.ID,
            "TypeName":    roomType.TypeName,
			"RoomSize":    roomType.RoomSize,
			"RoomTypeLayouts":	roomType.RoomTypeLayouts,
			"RoomTypeImages": 	roomType.RoomTypeImages,
			"RoomPrices":		roomType.RoomPrices,
			"RoomEquipments":		roomType.RoomEquipments,
        })
    }

    // ส่งผลลัพธ์กลับในรูปแบบ JSON
    c.JSON(http.StatusOK, result)
}


func CreateRoomType(c *gin.Context) {
	var roomType entity.RoomType

	db := config.DB()

	// Bind JSON จาก request body
	if err := c.ShouldBindJSON(&roomType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่ามี RoomType ที่มีชื่อเดียวกันอยู่ในฐานข้อมูลหรือไม่
	var existingRoomType entity.RoomType
	if err := db.Where("type_name = ?", roomType.TypeName).First(&existingRoomType).Error; err == nil {
		// ถ้ามีห้องประเภทที่มีชื่อเดียวกันแล้ว
		c.JSON(http.StatusConflict, gin.H{"error": "Room type name already exists"})
		return
	}

	// ตรวจสอบค่าของ HalfDayRate และ FullDayRate ว่ามีค่าหรือไม่
	// if roomType.HalfDayRate <= 0 || roomType.FullDayRate <= 0 {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "Rates must be positive values"})
	// 	return
	// }

	// บันทึกข้อมูล RoomType ใหม่ลงในฐานข้อมูล
	if err := db.Create(&roomType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to create room type: %v", err)})
		return
	}

	// ส่ง response กลับเมื่อ RoomType ถูกสร้างสำเร็จ
	c.JSON(http.StatusCreated, gin.H{
		"message":    "Room type created successfully",
		"room_type":  roomType,
	})
}


func UpdateRoomType(c *gin.Context) {
	var roomType entity.RoomType
	db := config.DB()

	// รับ RoomType ID จาก URL
	roomTypeID := c.Param("id")

	// Bind JSON จาก request body
	if err := c.ShouldBindJSON(&roomType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่ามี RoomType ที่มีชื่อเดียวกันแล้วในฐานข้อมูลหรือไม่
	var existingRoomType entity.RoomType
	if err := db.Where("type_name = ? AND id != ?", roomType.TypeName, roomTypeID).First(&existingRoomType).Error; err == nil {
		// ถ้ามี RoomType ที่ชื่อเดียวกันในฐานข้อมูล
		c.JSON(http.StatusConflict, gin.H{"error": "Room type name already exists"})
		return
	}

	// ตรวจสอบค่าของ HalfDayRate และ FullDayRate ว่ามีค่าหรือไม่
	// if roomType.HalfDayRate <= 0 || roomType.FullDayRate <= 0 {
	// 	c.JSON(http.StatusBadRequest, gin.H{"error": "Rates must be positive values"})
	// 	return
	// }

	// หาข้อมูล RoomType ที่ต้องการอัพเดท
	var roomTypeToUpdate entity.RoomType
	if err := db.Where("id = ?", roomTypeID).First(&roomTypeToUpdate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
		return
	}

	// อัพเดทข้อมูล RoomType
	if err := db.Model(&roomTypeToUpdate).Updates(entity.RoomType{
		TypeName:    roomType.TypeName,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to update room type: %v", err)})
		return
	}

	// ส่ง response กลับเมื่ออัพเดท RoomType สำเร็จ
	c.JSON(http.StatusOK, gin.H{
		"message":    "Room type updated successfully",
		"room_type":  roomTypeToUpdate,
	})
}



// GET /room-types/:id
func GetRoomTypeByID(c *gin.Context) {
    id := c.Param("id")

    db := config.DB()

    var roomType entity.RoomType
    // preload ข้อมูลที่เกี่ยวข้องทั้งหมด
    if err := db.
        Preload("RoomTypeLayouts.RoomLayout").
        Preload("RoomEquipments.Equipment").
        Preload("RoomTypeImages").
        Preload("RoomPrices").
        First(&roomType, id).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
        return
    }

    // ส่งข้อมูลกลับ
    c.JSON(http.StatusOK, roomType)
}
