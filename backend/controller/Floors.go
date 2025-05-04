package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
    "fmt"
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


func CreateFloor(c *gin.Context) {
	var floor entity.Floor
    db := config.DB()


	// Bind JSON จาก request body
	if err := c.ShouldBindJSON(&floor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่ามีชั้นที่มีหมายเลขเดียวกันอยู่ในฐานข้อมูลหรือไม่
	var existingFloor entity.Floor
	if err := db.Where("number = ?", floor.Number).First(&existingFloor).Error; err == nil {
		// ถ้าพบชั้นที่มีหมายเลขเดียวกัน
		c.JSON(http.StatusConflict, gin.H{"error": "Floor number already exists"})
		return
	}

	// ตรวจสอบว่า number มีค่าหรือไม่
	if floor.Number == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Floor number is required"})
		return
	}

	// บันทึกชั้นใหม่ลงในฐานข้อมูล
	if err := db.Create(&floor).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to create floor: %v", err)})
		return
	}

	// ส่ง response กลับเมื่อชั้นถูกสร้างสำเร็จ
	c.JSON(http.StatusCreated, gin.H{
		"message": "Floor created successfully",
		"floor":   floor,
	})
}

// UpdateFloor - ฟังก์ชันสำหรับการอัพเดทข้อมูลชั้น
func UpdateFloor(c *gin.Context) {
	var floor entity.Floor
	db := config.DB()

	// รับ Floor ID จาก URL
	floorID := c.Param("id")

	// Bind JSON จาก request body
	if err := c.ShouldBindJSON(&floor); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ตรวจสอบว่ามีชั้นที่มีหมายเลขเดียวกันในฐานข้อมูลหรือไม่ (ยกเว้นชั้นที่กำลังจะอัพเดท)
	var existingFloor entity.Floor
	if err := db.Where("number = ? AND id != ?", floor.Number, floorID).First(&existingFloor).Error; err == nil {
		// ถ้าพบชั้นที่มีหมายเลขเดียวกันแล้วในฐานข้อมูล
		c.JSON(http.StatusConflict, gin.H{"error": "Floor number already exists"})
		return
	}

	// ตรวจสอบว่า number มีค่าหรือไม่
	if floor.Number == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Floor number is required"})
		return
	}

	// หาข้อมูล Floor ที่ต้องการอัพเดท
	var floorToUpdate entity.Floor
	if err := db.Where("id = ?", floorID).First(&floorToUpdate).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Floor not found"})
		return
	}

	// อัพเดทข้อมูล Floor
	if err := db.Model(&floorToUpdate).Updates(entity.Floor{
		Number: floor.Number,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Unable to update floor: %v", err)})
		return
	}

	// ส่ง response กลับเมื่อการอัพเดทสำเร็จ
	c.JSON(http.StatusOK, gin.H{
		"message": "Floor updated successfully",
		"floor":   floorToUpdate,
	})
}
