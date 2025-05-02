package controller

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
)

// POST /maintenance-images
func CreateMaintenanceImages(c *gin.Context) {
	userIDStr := c.PostForm("userID")
	requestIDStr := c.PostForm("requestID")

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if userIDStr == "" || err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ userID และ requestID ให้ถูกต้อง"})
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาเลือกไฟล์เพื่ออัปโหลด"})
		return
	}

	// สร้าง path เก็บไฟล์
	folderPath := fmt.Sprintf("images/maintenance-request/user%s/request%s", userIDStr, requestIDStr)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์ได้"})
		return
	}

	db := config.DB()
	var savedImages []entity.MaintenanceImage

	for index, file := range files {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		newFileName := fmt.Sprintf("request%s_%d%s", requestIDStr, index+1, ext)
		fullPath := filepath.Join(folderPath, newFileName)

		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		image := entity.MaintenanceImage{
			FilePath:  fullPath,
			RequestID: uint(requestID),
		}

		// ป้องกันข้อมูลซ้ำ
		if err := db.Where("file_path = ?", image.FilePath).FirstOrCreate(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		savedImages = append(savedImages, image)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":           "อัปโหลดสำเร็จ",
		"maintenanceImages": savedImages,
	})
}

// PATCH /maintenance-images
func UpdateMaintenanceImages(c *gin.Context) {
	userIDStr := c.PostForm("userID")
	requestIDStr := c.PostForm("requestID")

	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if userIDStr == "" || err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ userID และ requestID ให้ถูกต้อง"})
		return
	}

	db := config.DB()

	// ดึงภาพเดิมจากฐานข้อมูล
	var oldImages []entity.MaintenanceImage
	if err := db.Where("request_id = ?", requestID).Find(&oldImages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงภาพเดิมได้"})
		return
	}

	// ลบไฟล์จริงและข้อมูลใน DB
	for _, img := range oldImages {
		os.Remove(img.FilePath) // ลบไฟล์จาก disk (optional)
	}
	if err := db.Where("request_id = ?", requestID).Delete(&entity.MaintenanceImage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ลบภาพเดิมจากฐานข้อมูลไม่สำเร็จ"})
		return
	}

	// รับไฟล์ใหม่
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์อัปโหลด"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาอัปโหลดอย่างน้อยหนึ่งไฟล์"})
		return
	}

	// เตรียมโฟลเดอร์
	folderPath := fmt.Sprintf("images/maintenance-request/user%s/request%s", userIDStr, requestIDStr)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์ได้"})
		return
	}

	var newImages []entity.MaintenanceImage
	for i, file := range files {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		newFileName := fmt.Sprintf("request%s_%d%s", requestIDStr, i+1, ext)
		fullPath := path.Join(folderPath, newFileName)

		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		image := entity.MaintenanceImage{
			FilePath:  fullPath,
			RequestID: uint(requestID),
		}

		if err := db.Create(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		newImages = append(newImages, image)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "อัปเดตรูปภาพสำเร็จ",
		"maintenanceImage": newImages,
	})
}
