package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"

)

// ListRole - ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดจาก Role
func ListRequestType(c *gin.Context) {
	var request_type []entity.RequestType

	// ดึงข้อมูลจากฐานข้อมูล
	if err := config.DB().Find(&request_type).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch request_type"})
		return
	}

	// แปลงข้อมูลเป็น map ที่มีชื่อฟิลด์เป็น PascalCase
	var result []map[string]interface{}
	for _, request_type := range request_type {
		mappedType := make(map[string]interface{})
		// ใช้ PascalCase สำหรับชื่อฟิลด์
		mappedType["ID"] = request_type.ID
		mappedType["TypeName"] = request_type.TypeName

		result = append(result, mappedType)
	}

	// ส่งข้อมูลที่แปลงแล้วกลับเป็น JSON
	c.JSON(http.StatusOK, result)
}

