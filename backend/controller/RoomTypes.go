package controller

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"strings"
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
		Where("type_name != ?", "Rental Space").
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


// ---------------- UPDATE (with de-duplicate) ----------------
func UpdateRoomType(c *gin.Context) {
	db := config.DB()

	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room type id"})
		return
	}

	// ---- ฟอร์มหลัก (multipart/form-data) ----
	type RoomTypeForm struct {
		TypeName         string `form:"TypeName"`
		RoomSize         string `form:"RoomSize"`
		ForRental        string `form:"ForRental"`        // "true"/"false"
		HasMultipleSizes string `form:"HasMultipleSizes"` // "true"/"false"
		Category         string `form:"Category"`
		RoomEquipments   string `form:"RoomEquipments"`  // JSON string
		RoomPrices       string `form:"RoomPrices"`      // JSON string
		RoomTypeLayouts  string `form:"RoomTypeLayouts"` // JSON string
		RoomTypeImages   string `form:"RoomTypeImages"`  // JSON string
	}

	var form RoomTypeForm
	if err := c.ShouldBind(&form); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bind form failed", "detail": err.Error()})
		return
	}

	// ==== DTO (รองรับ camelCase + snake_case) ====
	type equipmentDTO struct {
		ID          uint `json:"ID"`
		EquipmentID uint `json:"EquipmentID"`
		Quantity    int  `json:"Quantity"`
		// fallback keys
		EquipmentId uint `json:"equipment_id"`
		Qty         int  `json:"quantity"`
	}
	type priceDTO struct {
		ID         uint `json:"ID"`
		TimeSlotID uint `json:"TimeSlotID"`
		Price      int  `json:"Price"`
		// fallback
		TimeSlotId uint `json:"time_slot_id"`
	}
	type layoutDTO struct {
		ID           uint   `json:"ID"`
		RoomLayoutID uint   `json:"RoomLayoutID"`
		Capacity     int    `json:"Capacity"`
		Note         string `json:"Note"`
		// fallback
		RoomLayoutId uint `json:"room_layout_id"`
	}

	var (
		eqDTOs     []equipmentDTO
		priceDTOs  []priceDTO
		layoutDTOs []layoutDTO
		imgs       []entity.RoomTypeImage
	)

	// ---- แปลง JSON string -> DTO / entities ----
	if s := strings.TrimSpace(form.RoomEquipments); s != "" {
		if err := json.Unmarshal([]byte(s), &eqDTOs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid RoomEquipments JSON", "detail": err.Error()})
			return
		}
	}
	if s := strings.TrimSpace(form.RoomPrices); s != "" {
		if err := json.Unmarshal([]byte(s), &priceDTOs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid RoomPrices JSON", "detail": err.Error()})
			return
		}
	}
	if s := strings.TrimSpace(form.RoomTypeLayouts); s != "" {
		if err := json.Unmarshal([]byte(s), &layoutDTOs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid RoomTypeLayouts JSON", "detail": err.Error()})
			return
		}
	}
	if s := strings.TrimSpace(form.RoomTypeImages); s != "" {
		if err := json.Unmarshal([]byte(s), &imgs); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid RoomTypeImages JSON", "detail": err.Error()})
			return
		}
	}

	// ---- ตรวจ/แปลงค่าเบื้องต้น ----
	form.Category = strings.ToLower(strings.TrimSpace(form.Category))
	validCat := map[string]bool{"meetingroom": true, "trainingroom": true, "multifunctionroom": true}

	var sizeParsed float64
	if strings.TrimSpace(form.RoomSize) != "" {
		v, err := strconv.ParseFloat(form.RoomSize, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "RoomSize must be a number"})
			return
		}
		sizeParsed = v
	}

	// ======= De-duplicate (ห้ามซ้ำใน payload) =======

	// Equipments: ห้ามเลือก EquipmentID ซ้ำ
	{
		seen := map[uint]int{}
		for i, e := range eqDTOs {
			id := chooseUint(e.EquipmentID, e.EquipmentId)
			if id == 0 {
				continue
			}
			if j, ok := seen[id]; ok {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Duplicate equipment selected: equipment_id=%d (rows %d and %d)", id, j, i),
				})
				return
			}
			seen[id] = i
		}
	}

	// Layouts: ห้ามเลือก RoomLayoutID ซ้ำ
	{
		seen := map[uint]int{}
		for i, l := range layoutDTOs {
			id := chooseUint(l.RoomLayoutID, l.RoomLayoutId)
			if id == 0 {
				continue
			}
			if j, ok := seen[id]; ok {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Duplicate layout selected: room_layout_id=%d (rows %d and %d)", id, j, i),
				})
				return
			}
			seen[id] = i
		}
	}

	// Prices: ห้าม TimeSlotID ซ้ำในห้องเดียวกัน (ถ้าต้องการ)
	{
		seen := map[uint]int{}
		for i, p := range priceDTOs {
			id := chooseUint(p.TimeSlotID, p.TimeSlotId)
			if id == 0 {
				continue
			}
			if j, ok := seen[id]; ok {
				c.JSON(http.StatusBadRequest, gin.H{
					"error": fmt.Sprintf("Duplicate time slot selected: time_slot_id=%d (rows %d and %d)", id, j, i),
				})
				return
			}
			seen[id] = i
		}
	}

	// ---- Transaction ----
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	var existing entity.RoomType
	if err := tx.First(&existing, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Room type not found"})
		return
	}

	// ---- Update fields หลัก ----
	if strings.TrimSpace(form.TypeName) != "" {
		existing.TypeName = form.TypeName
	}
	if strings.TrimSpace(form.RoomSize) != "" {
		existing.RoomSize = float32(sizeParsed)
	}
	if form.ForRental != "" {
		existing.ForRental = (form.ForRental == "true")
	}
	if form.HasMultipleSizes != "" {
		existing.HasMultipleSizes = (form.HasMultipleSizes == "true")
	}
	if form.Category != "" {
		if !validCat[form.Category] {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid Category. Use meetingroom | trainingroom | multifunctionroom"})
			return
		}
		existing.Category = form.Category
	}

	// ---- Children: Replace-all เมื่อฟิลด์ถูกส่งมา (รวม "[]") ----

	// Prices
	if form.RoomPrices != "" {
		if err := tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomPrice{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to clear room prices"})
			return
		}
		for _, p := range priceDTOs {
			row := entity.RoomPrice{
				RoomTypeID: existing.ID,
				TimeSlotID: chooseUint(p.TimeSlotID, p.TimeSlotId),
				Price:      p.Price,
			}
			if err := tx.Create(&row).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert room prices"})
				return
			}
		}
	}

	// Equipments
	if form.RoomEquipments != "" {
		if err := tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomEquipment{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to clear room equipments"})
			return
		}
		for _, e := range eqDTOs {
			row := entity.RoomEquipment{
				RoomTypeID:  existing.ID,
				EquipmentID: chooseUint(e.EquipmentID, e.EquipmentId),
				Quantity:    chooseInt(e.Quantity, e.Qty, 1), // กันค่าว่างให้ >=1
			}
			if row.EquipmentID == 0 {
				continue
			}
			if err := tx.Create(&row).Error; err != nil {
				// ถ้ามี unique index ที่ DB จะเด้ง error ที่นี่
				if isUniqueViolation(err) {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Duplicate equipment for this room type"})
					return
				}
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert room equipments"})
				return
			}
		}
	}

	// Layouts
	if form.RoomTypeLayouts != "" {
		if err := tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomTypeLayout{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to clear room layouts"})
			return
		}
		for _, l := range layoutDTOs {
			row := entity.RoomTypeLayout{
				RoomTypeID:   existing.ID,
				RoomLayoutID: chooseUint(l.RoomLayoutID, l.RoomLayoutId),
				Capacity:     maxInt(l.Capacity, 1),
				Note:         l.Note,
			}
			if row.RoomLayoutID == 0 {
				continue
			}
			if err := tx.Create(&row).Error; err != nil {
				if isUniqueViolation(err) {
					tx.Rollback()
					c.JSON(http.StatusBadRequest, gin.H{"error": "Duplicate layout for this room type"})
					return
				}
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert room layouts"})
				return
			}
		}
	}

	// ===============================
	// Images: replace-all เมื่อฟิลด์ถูกส่งมา (แม้ "[]")
	// ===============================
	var filesToDelete []string
	if form.RoomTypeImages != "" {
		var oldImgs []entity.RoomTypeImage
		if err := tx.Where("room_type_id = ?", existing.ID).Find(&oldImgs).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to load existing images"})
			return
		}
		if err := tx.Where("room_type_id = ?", existing.ID).Delete(&entity.RoomTypeImage{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to clear images"})
			return
		}
		keep := make(map[string]struct{})
		for _, img := range imgs {
			img.RoomTypeID = existing.ID
			img.ID = 0
			if err := tx.Create(&img).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert images"})
				return
			}
			if fp := strings.TrimSpace(img.FilePath); fp != "" {
				keep[fp] = struct{}{}
			}
		}
		for _, oi := range oldImgs {
			if oi.FilePath != "" {
				if _, ok := keep[oi.FilePath]; !ok {
					filesToDelete = append(filesToDelete, oi.FilePath)
				}
			}
		}
	}

	// ---- อัปโหลดไฟล์ใหม่ (multipart: images) ----
	if mf, _ := c.MultipartForm(); mf != nil {
		if files := mf.File["images"]; len(files) > 0 {
			for _, file := range files {
				filename := fmt.Sprintf("images/roomtypes/%d_%d_%s", existing.ID, time.Now().UnixNano(), file.Filename)
				if err := c.SaveUploadedFile(file, filename); err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file", "detail": err.Error()})
					return
				}
				newImg := entity.RoomTypeImage{FilePath: filename, RoomTypeID: existing.ID}
				if err := tx.Create(&newImg).Error; err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to insert uploaded image"})
					return
				}
			}
		}
	}

	// ---- Save หลัก ----
	if err := tx.Save(&existing).Error; err != nil {
		low := strings.ToLower(err.Error())
		if strings.Contains(low, "unique") && strings.Contains(low, "type_name") {
			tx.Rollback()
			c.JSON(http.StatusConflict, gin.H{"error": "TypeName already exists"})
			return
		}
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update room type", "detail": err.Error()})
		return
	}

	// ---- Commit ----
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	// ---- ลบไฟล์ที่เลิกใช้งานแล้ว (หลัง commit) ----
	for _, p := range filesToDelete {
		_ = os.Remove(p)
	}

	// ---- ส่งข้อมูลที่อัปเดตกลับ ----
	var updated entity.RoomType
	db.Preload("RoomEquipments.Equipment").
		Preload("RoomPrices.TimeSlot").
		Preload("RoomTypeLayouts.RoomLayout").
		Preload("RoomTypeImages").
		First(&updated, existing.ID)

	c.JSON(http.StatusOK, gin.H{
		"status":  "success",
		"message": "Room type updated successfully",
		"room_type": updated,
	})
}

// ---- helpers ----
func chooseUint(a, b uint) uint {
	if a != 0 {
		return a
	}
	return b
}
func chooseInt(a, b, def int) int {
	if a != 0 {
		return a
	}
	if b != 0 {
		return b
	}
	return def
}
func maxInt(a, b int) int {
	if a > b {
		return a
	}
	return b
}

// ตรวจ unique violation แบบครอบจักรวาล (รองรับหลาย DB driver)
func isUniqueViolation(err error) bool {
	if err == nil {
		return false
	}
	// กรองจากข้อความ error (ง่าย/ใช้ได้กับหลาย dialect)
	msg := strings.ToLower(err.Error())
	return strings.Contains(msg, "unique constraint") ||
		strings.Contains(msg, "duplicate key") ||
		strings.Contains(msg, "unique violation")
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
