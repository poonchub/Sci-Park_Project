package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

func GetEquipmentByRoomType(c *gin.Context) {
	db := config.DB()
	var roomEquipments []entity.RoomEquipment
	roomTypeID := c.Param("id")

	if err := db.
		Preload("Equipment").
		Where("room_type_id = ?", roomTypeID).
		Find(&roomEquipments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลอุปกรณ์ได้"})
		return
	}

	var equipments []entity.Equipment
	for _, re := range roomEquipments {
		equipments = append(equipments, re.Equipment)
	}

	c.JSON(http.StatusOK, gin.H{"equipment": equipments})
}



// ดึง Equipment ทั้งหมด
func GetEquipments(c *gin.Context) {
	db := config.DB()
	var equipments []entity.Equipment
	if err := db.Find(&equipments).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลอุปกรณ์ได้"})
		return
	}
	c.JSON(http.StatusOK, equipments)
}

// ดึง Equipment ตาม ID
func GetEquipment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")
	var equipment entity.Equipment
	if err := db.First(&equipment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอุปกรณ์"})
		return
	}
	c.JSON(http.StatusOK, equipment)
}

// สร้าง Equipment ใหม่
func CreateEquipment(c *gin.Context) {
	db := config.DB()
	var equipment entity.Equipment
	if err := c.ShouldBindJSON(&equipment); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}
	if err := db.Create(&equipment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างอุปกรณ์ได้"})
		return
	}
	c.JSON(http.StatusCreated, equipment)
}

// แก้ไข Equipment
func UpdateEquipment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")
	var equipment entity.Equipment

	if err := db.First(&equipment, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบอุปกรณ์"})
		return
	}

	var input entity.Equipment
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	equipment.EquipmentName = input.EquipmentName

	if err := db.Save(&equipment).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถแก้ไขอุปกรณ์ได้"})
		return
	}
	c.JSON(http.StatusOK, equipment)
}

// ลบ Equipment
func DeleteEquipment(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")
	if err := db.Delete(&entity.Equipment{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบอุปกรณ์ได้"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "ลบอุปกรณ์เรียบร้อย"})
}
