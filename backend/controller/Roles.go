package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// ListRole - ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดจาก Role
func ListRoles(c *gin.Context) {
	var roles []entity.Role

	// ดึงข้อมูลจากฐานข้อมูล
	if err := config.DB().Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch roles"})
		return
	}

	// แปลงข้อมูลเป็น map ที่มีชื่อฟิลด์เป็น PascalCase
	var result []map[string]interface{}
	for _, role := range roles {
		mappedRole := make(map[string]interface{})
		// ใช้ PascalCase สำหรับชื่อฟิลด์
		mappedRole["ID"] = role.ID
		mappedRole["Name"] = role.Name

		result = append(result, mappedRole)
	}

	// ส่งข้อมูลที่แปลงแล้วกลับเป็น JSON
	c.JSON(http.StatusOK, result)
}
