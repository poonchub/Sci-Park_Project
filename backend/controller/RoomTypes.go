package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

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
            "HalfDayRate": roomType.HalfDayRate,
            "FullDayRate": roomType.FullDayRate,
        })
    }

    // ส่งผลลัพธ์กลับในรูปแบบ JSON
    c.JSON(http.StatusOK, result)
}
