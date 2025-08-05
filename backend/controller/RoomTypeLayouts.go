package controller

import (
	"net/http"
	

	"github.com/gin-gonic/gin"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
)

// GET /roomlayouts/by-roomtype/:id

func GetRoomLayoutsByRoomTypeID(c *gin.Context) {
	db := config.DB()
    var layouts []entity.RoomTypeLayout
    id := c.Param("id")

    if err := db.
        Preload("RoomLayout").
        Where("room_type_id = ?", id).
        Find(&layouts).Error; err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    var response []gin.H
    for _, layout := range layouts {
        response = append(response, gin.H{
            "room_type_layout_id": layout.ID,
            "layout_id":           layout.RoomLayout.ID,
            "layout_name":         layout.RoomLayout.LayoutName,
            "capacity":            layout.Capacity,
            "note":                layout.Note,
        })
    }

    c.JSON(http.StatusOK, response)
}

func GetAllRoomLayouts(c *gin.Context) {
	db := config.DB()
	var layouts []entity.RoomLayout
	if err := db.Find(&layouts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูล RoomLayout ได้"})
		return
	}
	c.JSON(http.StatusOK, layouts)
}

