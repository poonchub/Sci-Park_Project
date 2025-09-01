package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// ---------------- LIST ----------------

// GET /room-types
func ListRoomTypes(c *gin.Context) {
    db := config.DB()

    // ✅ รับค่า query params
    search := c.Query("search")
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
    offset := (page - 1) * limit

    var roomTypes []entity.RoomType
    query := db.
        Preload("Rooms").
        Preload("RoomTypeImages").
        Preload("RoomTypeLayouts.RoomLayout").
        Preload("RoomEquipments.Equipment").
        Preload("RoomPrices.TimeSlot")

    // ✅ ถ้ามี search ให้ filter ด้วย LIKE
    if search != "" {
        query = query.Where("type_name LIKE ?", "%"+search+"%")
    }

    // ✅ ใช้ limit/offset
    if err := query.Limit(limit).Offset(offset).Find(&roomTypes).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    // ✅ นับ total ทั้งหมด (ไม่ใช่แค่หน้าที่กำลัง query)
    var total int64
    countQuery := db.Model(&entity.RoomType{})
    if search != "" {
        countQuery = countQuery.Where("type_name LIKE ?", "%"+search+"%")
    }
    countQuery.Count(&total)

    c.JSON(http.StatusOK, gin.H{
        "data":  roomTypes,
        "page":  page,
        "limit": limit,
        "total": total,
    })
}


// GET /room-types-for-booking
func ListRoomTypesForBooking(c *gin.Context) {
	var roomTypes []entity.RoomType
	db := config.DB()

	if err := db.
		Preload("RoomTypeLayouts.RoomLayout").
		Preload("RoomEquipments.Equipment"). // ✅ preload Equipment ด้วย
		Preload("RoomTypeImages").
		Preload("RoomPrices.TimeSlot").
		Find(&roomTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch room types"})
		return
	}

	var result []map[string]interface{}
	for _, roomType := range roomTypes {
		result = append(result, map[string]interface{}{
			"ID":              roomType.ID,
			"TypeName":        roomType.TypeName,
			"RoomSize":        roomType.RoomSize,
			"RoomTypeLayouts": roomType.RoomTypeLayouts,
			"RoomTypeImages":  roomType.RoomTypeImages,
			"RoomPrices":      roomType.RoomPrices,
			"RoomEquipments":  roomType.RoomEquipments, // ✅ มี Equipment ข้างในแล้ว
		})
	}

	c.JSON(http.StatusOK, result)
}

// ---------------- GET BY ID ----------------
func GetRoomTypeByID(c *gin.Context) {
	id := c.Param("id")
	db := config.DB()

	var roomType entity.RoomType
	if err := db.
		Preload("RoomTypeLayouts.RoomLayout").
		Preload("RoomEquipments.Equipment"). // ✅ preload Equipment ด้วย
		Preload("RoomTypeImages").
		Preload("RoomPrices.TimeSlot").
		First(&roomType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
		return
	}

	c.JSON(http.StatusOK, roomType)
}

// ---------------- CREATE ----------------
func CreateRoomType(c *gin.Context) {
	var roomType entity.RoomType
	db := config.DB()

	if err := c.ShouldBindJSON(&roomType); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check duplicate
	var existing entity.RoomType
	if err := db.Where("type_name = ?", roomType.TypeName).First(&existing).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Room type name already exists"})
		return
	}

	if err := db.Create(&roomType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to create room type: %v", err)})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Room type created successfully", "room_type": roomType})
}

// ---------------- UPDATE ----------------
func UpdateRoomType(c *gin.Context) {
	db := config.DB()
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room type id"})
		return
	}

	// ---- ฟอร์มหลัก ----
	type RoomTypeForm struct {
		TypeName         string `form:"TypeName"`
		RoomSize         int    `form:"RoomSize"`
		ForRental        string `form:"ForRental"`        // 👈 รับ string ("true"/"false")
		HasMultipleSizes string `form:"HasMultipleSizes"` // 👈 รับ string ("true"/"false")
		RoomEquipments   string `form:"RoomEquipments"`
		RoomPrices       string `form:"RoomPrices"`
		RoomTypeLayouts  string `form:"RoomTypeLayouts"`
		RoomTypeImages   string `form:"RoomTypeImages"`
	}

	var form RoomTypeForm
	if err := c.ShouldBind(&form); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bind form failed", "detail": err.Error()})
		return
	}

	// ---- แปลง JSON string -> struct ----
	var equipments []entity.RoomEquipment
	if form.RoomEquipments != "" {
		_ = json.Unmarshal([]byte(form.RoomEquipments), &equipments)
	}

	var prices []entity.RoomPrice
	if form.RoomPrices != "" {
		_ = json.Unmarshal([]byte(form.RoomPrices), &prices)
	}

	var layouts []entity.RoomTypeLayout
	if form.RoomTypeLayouts != "" {
		_ = json.Unmarshal([]byte(form.RoomTypeLayouts), &layouts)
	}

	var images []entity.RoomTypeImage
	if form.RoomTypeImages != "" {
		_ = json.Unmarshal([]byte(form.RoomTypeImages), &images)
	}

	// ---- Transaction ----
	tx := db.Begin()

	var existing entity.RoomType
	if err := tx.First(&existing, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
		return
	}

	// ---- Update fields หลัก ----
	existing.TypeName = form.TypeName
	existing.RoomSize = float32(form.RoomSize)
	existing.ForRental = (form.ForRental == "true")
	existing.HasMultipleSizes = (form.HasMultipleSizes == "true")

	// ---- ลบ + Insert children เฉพาะที่มีข้อมูลใหม่ ----
	if len(prices) > 0 {
		tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomPrice{})
		for _, p := range prices {
			p.RoomTypeID = existing.ID
			p.ID = 0
			tx.Create(&p)
		}
	}

	if len(equipments) > 0 {
		tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomEquipment{})
		for _, e := range equipments {
			e.RoomTypeID = existing.ID
			e.ID = 0
			tx.Create(&e)
		}
	}

	if len(layouts) > 0 {
		tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomTypeLayout{})
		for _, l := range layouts {
			l.RoomTypeID = existing.ID
			l.ID = 0
			tx.Create(&l)
		}
	}

	// ---- จัดการรูปภาพ ----
	if len(images) > 0 {
		tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomTypeImage{})
		for _, img := range images {
			img.RoomTypeID = existing.ID
			img.ID = 0
			tx.Create(&img)
		}
	}

	// ---- อัพโหลดไฟล์ใหม่ ----
	formFiles, _ := c.MultipartForm()
	if formFiles != nil {
		files := formFiles.File["images"]
		for _, file := range files {
			filename := fmt.Sprintf("images/roomtypes/%d_%d_%s", existing.ID, time.Now().UnixNano(), file.Filename)
			if err := c.SaveUploadedFile(file, filename); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file", "detail": err.Error()})
				return
			}
			newImg := entity.RoomTypeImage{
				FilePath:   filename,
				RoomTypeID: existing.ID,
			}
			tx.Create(&newImg)
		}
	}

	// ---- Save หลัก ----
	if err := tx.Save(&existing).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update room type", "detail": err.Error()})
		return
	}

	tx.Commit()

	var updated entity.RoomType
	db.Preload("RoomEquipments.Equipment").
		Preload("RoomPrices.TimeSlot").
		Preload("RoomTypeLayouts.RoomLayout").
		Preload("RoomTypeImages").
		First(&updated, existing.ID)

	c.JSON(http.StatusOK, gin.H{
		"status":    "success",
		"message":   "Room type updated successfully",
		"room_type": updated,
	})

}

// ---------------- DELETE ----------------
func DeleteRoomType(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var roomType entity.RoomType
	if err := db.First(&roomType, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
		return
	}

	if err := db.Delete(&roomType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Room type deleted successfully"})
}


