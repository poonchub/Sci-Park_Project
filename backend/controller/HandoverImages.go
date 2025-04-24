package controller

import (
	"fmt"
	"net/http"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
)

// POST /handover-images
func CreateHandoverImages(c *gin.Context) {
	// รับ UserID และ RequestID จาก form-data
	UserIDStr := c.PostForm("userID")
	TaskIDtr := c.PostForm("taskID")
	TaskID, err2 := strconv.ParseUint(TaskIDtr, 10, 32)

	if UserIDStr == "" || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ UserIDStr และ TaskID"})
		return
	}

	db := config.DB()

	// รับไฟล์จากฟอร์มหลายไฟล์
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์"})
		return
	}

	// รับไฟล์จากฟอร์ม
	files := form.File["files"]
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์"})
		return
	}

	// สร้างโฟลเดอร์ XX ถ้ายังไม่มี
	customerFolder := fmt.Sprintf("images/maintenance-task/user%s/task%s", UserIDStr,TaskIDtr)
	createFolderIfNotExist(customerFolder)

	var images []entity.HandoverImage
	for index, file := range files {
		// ตั้งชื่อไฟล์ใหม่
		newFileName := fmt.Sprintf("task%s_%d.jpg", TaskIDtr, index+1)
		filePath := path.Join(customerFolder, newFileName)

		// บันทึกไฟล์ลงในโฟลเดอร์
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		// สร้าง MaintenanceImage entity สำหรับไฟล์นี้
		image := entity.HandoverImage{
			FilePath:  filePath,
			TaskID: uint(TaskID),
		}

		// บันทึกข้อมูลในฐานข้อมูล
		if err := db.FirstOrCreate(&image, &entity.HandoverImage{
			FilePath: image.FilePath,
		}).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		images = append(images, image)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "อัพโหลดสำเร็จ", "HandoverImage": images})
}