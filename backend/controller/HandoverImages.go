package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
)

// POST /handover-images
func CreateHandoverImages(c *gin.Context) {
	userIDStr := c.PostForm("userID")
	taskIDStr := c.PostForm("taskID")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if userIDStr == "" || err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ userID และ taskID ให้ถูกต้อง"})
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
	folderPath := fmt.Sprintf("images/maintenance-task/user%s/task%s", userIDStr, taskIDStr)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์ได้"})
		return
	}

	db := config.DB()
	var savedImages []entity.HandoverImage

	for index, file := range files {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		newFileName := fmt.Sprintf("task%s_%d%s", taskIDStr, index+1, ext)
		fullPath := filepath.Join(folderPath, newFileName)

		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		image := entity.HandoverImage{
			FilePath: fullPath,
			TaskID:   uint(taskID),
		}

		// ป้องกันการซ้ำ
		if err := db.Where("file_path = ?", image.FilePath).FirstOrCreate(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		savedImages = append(savedImages, image)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "อัปโหลดสำเร็จ",
		"handoverImage": savedImages,
	})
}

// DELETE /handover-images/:id
func DeleteHandoverImagesByTaskID(c *gin.Context) {
	taskID := c.Param("id")
	db := config.DB()

	var images []entity.HandoverImage
	if err := db.Where("task_id = ?", taskID).Find(&images).Error; err != nil || len(images) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบภาพสำหรับ Task นี้"})
		return
	}

	// ลบออกจาก DB
	if err := db.Where("task_id = ?", taskID).Delete(&entity.HandoverImage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบภาพได้"})
		return
	}

	for _, img := range images {
		os.Remove(img.FilePath)
	}

	c.JSON(http.StatusOK, gin.H{"message": "ลบภาพสำเร็จ"})
}

// PATCH /handover-images
func UpdateHandoverImages(c *gin.Context) {
	userIDStr := c.PostForm("userID")
	taskIDStr := c.PostForm("taskID")

	taskID, err := strconv.ParseUint(taskIDStr, 10, 32)
	if userIDStr == "" || err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ userID และ taskID ให้ถูกต้อง"})
		return
	}

	db := config.DB()

	// ดึงภาพเดิม
	var oldImages []entity.HandoverImage
	if err := db.Where("task_id = ?", taskID).Find(&oldImages).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงข้อมูลภาพเดิมได้"})
		return
	}

	// ลบภาพเดิมจาก DB และจาก disk
	for _, img := range oldImages {
		os.Remove(img.FilePath) // ลบไฟล์จริง (optional)
	}
	if err := db.Where("task_id = ?", taskID).Delete(&entity.HandoverImage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถลบภาพเดิมจากฐานข้อมูลได้"})
		return
	}

	// รับไฟล์ใหม่
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบไฟล์ที่อัปโหลด"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาอัปโหลดไฟล์อย่างน้อยหนึ่งไฟล์"})
		return
	}

	// เตรียมโฟลเดอร์
	folderPath := fmt.Sprintf("images/maintenance-task/user%s/task%s", userIDStr, taskIDStr)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์ได้"})
		return
	}

	var newImages []entity.HandoverImage
	for i, file := range files {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		newFileName := fmt.Sprintf("task%s_%d%s", taskIDStr, i+1, ext)
		fullPath := filepath.Join(folderPath, newFileName)

		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		image := entity.HandoverImage{
			FilePath: fullPath,
			TaskID:   uint(taskID),
		}

		if err := db.Create(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		newImages = append(newImages, image)
	}

	c.JSON(http.StatusOK, gin.H{
		"message":       "อัปเดตภาพสำเร็จ",
		"handoverImage": newImages,
	})
}
