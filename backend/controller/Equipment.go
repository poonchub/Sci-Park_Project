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