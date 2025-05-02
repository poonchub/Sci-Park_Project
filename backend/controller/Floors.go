package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /floors
func ListFloors(c *gin.Context) {
    var floors []entity.Floor

    db := config.DB()

    // ดึงข้อมูลจากฐานข้อมูล
    if err := db.Find(&floors).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch floors"})
        return
    }

    // สร้างแผนที่ข้อมูลที่ต้องการส่งกลับ (แค่ ID และ Number)
    var result []map[string]interface{}
    for _, floor := range floors {
        result = append(result, map[string]interface{}{
            "ID":     floor.ID,
            "Number": floor.Number,
        })
    }

    // ส่งผลลัพธ์กลับในรูปแบบ JSON
    c.JSON(http.StatusOK, result)
}
