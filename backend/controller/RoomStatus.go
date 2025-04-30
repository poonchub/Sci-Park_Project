package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /room-types
func ListRoomStatus(c *gin.Context) {
    var roomStatus []entity.RoomStatus

    db := config.DB()

    // ดึงข้อมูลทั้งหมดจาก RoomStatus
    db.Find(&roomStatus)

    // สร้างผลลัพธ์ในรูปแบบที่ต้องการ
    var result []map[string]interface{}
    for _, status := range roomStatus {
        // แปลงข้อมูลให้อยู่ในรูปแบบ camel case
        result = append(result, map[string]interface{}{
            "ID":         status.ID,
            "StatusName": status.StatusName, // camel case for status_name
        })
    }

    // ส่งผลลัพธ์เป็น JSON
    c.JSON(http.StatusOK, result)
}