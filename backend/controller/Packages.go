package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"github.com/gin-gonic/gin"
)

// ListPackages - ฟังก์ชันสำหรับดึงข้อมูลทั้งหมดจาก Package
func ListPackages(c *gin.Context) {
	var packages []entity.Package

	// ดึงข้อมูลจากฐานข้อมูล
	if err := config.DB().Find(&packages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to fetch packages"})
		return
	}

	// แปลงข้อมูลเป็น map ที่มีชื่อฟิลด์เป็น PascalCase
	var result []map[string]interface{}
	for _, pkg := range packages {
		mappedPackage := make(map[string]interface{})
		// ใช้ PascalCase สำหรับชื่อฟิลด์
		mappedPackage["ID"] = pkg.ID
		mappedPackage["PackageName"] = pkg.PackageName
		mappedPackage["MeetingRoomLimit"] = pkg.MeetingRoomLimit
		mappedPackage["TrainingRoomLimit"] = pkg.TrainingRoomLimit
		mappedPackage["MultiFunctionRoomLimit"] = pkg.MultiFunctionRoomLimit

		result = append(result, mappedPackage)
	}

	// ส่งข้อมูลที่แปลงแล้วกลับเป็น JSON
	c.JSON(http.StatusOK, result)
}
