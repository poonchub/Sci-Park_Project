package controller

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
)

func createFolderIfNotExist(folderPath string) {
	if _, err := os.Stat(folderPath); os.IsNotExist(err) {
		err := os.MkdirAll(folderPath, os.ModePerm)
		if err != nil {
			log.Fatalf("ไม่สามารถสร้างโฟลเดอร์ %s: %v", folderPath, err)
		}
	}
}

// POST /maintenance-images
func CreateMaintenanceImages(c *gin.Context) {
	// รับ UserID และ RequestID จาก form-data
	UserIDStr := c.PostForm("userID")
	RequestIDtr := c.PostForm("requestID")
	RequestID, err2 := strconv.ParseUint(RequestIDtr, 10, 32)

	if UserIDStr == "" || err2 != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ UserIDStr และ RequestID"})
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
	customerFolder := fmt.Sprintf("images/maintenance-request/user%s/request%s", UserIDStr,RequestIDtr)
	createFolderIfNotExist(customerFolder)

	var images []entity.MaintenanceImage
	for index, file := range files {
		// ตั้งชื่อไฟล์ใหม่
		newFileName := fmt.Sprintf("request%s_%d.jpg", RequestIDtr, index+1)
		filePath := path.Join(customerFolder, newFileName)

		// บันทึกไฟล์ลงในโฟลเดอร์
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		// สร้าง MaintenanceImage entity สำหรับไฟล์นี้
		image := entity.MaintenanceImage{
			FilePath:  filePath,
			RequestID: uint(RequestID),
		}

		// บันทึกข้อมูลในฐานข้อมูล
		if err := db.FirstOrCreate(&image, &entity.MaintenanceImage{
			FilePath: image.FilePath,
		}).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		images = append(images, image)
	}

	c.JSON(http.StatusCreated, gin.H{"message": "อัพโหลดสำเร็จ", "MaintenanceImage": images})
}