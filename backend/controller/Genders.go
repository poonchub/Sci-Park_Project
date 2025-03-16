package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// ListGender - ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดจาก Gender
func ListGenders(c *gin.Context) {
	var genders []entity.Gender

	// ดึงข้อมูลจากฐานข้อมูล
	if err := config.DB().Find(&genders).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch genders"})
		return
	}

	// แปลงข้อมูลเป็น map ที่มีชื่อฟิลด์เป็น PascalCase
	var result []map[string]interface{}
	for _, gender := range genders {
		mappedGender := make(map[string]interface{})
		// ใช้ PascalCase สำหรับชื่อฟิลด์
		mappedGender["ID"] = gender.ID
		mappedGender["Name"] = gender.Name

		result = append(result, mappedGender)
	}

	// ส่งข้อมูลที่แปลงแล้วกลับเป็น JSON
	c.JSON(http.StatusOK, result)
}
