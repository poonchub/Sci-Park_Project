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

// POST /news-images
func CreateNewsImages(c *gin.Context) {
	userIDStr := c.PostForm("userID")
	newsIDStr := c.PostForm("newsID")

	newsID, err := strconv.ParseUint(newsIDStr, 10, 32)

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
	folderPath := fmt.Sprintf("images/news/user%s/news%s", userIDStr, newsIDStr)
	if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถสร้างโฟลเดอร์ได้"})
		return
	}

	db := config.DB()
	var savedImages []entity.NewsImage

	for index, file := range files {
		ext := filepath.Ext(file.Filename)
		if ext == "" {
			ext = ".jpg"
		}
		newFileName := fmt.Sprintf("news%s_%d%s", newsIDStr, index+1, ext)
		fullPath := filepath.Join(folderPath, newFileName)

		if err := c.SaveUploadedFile(file, fullPath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถบันทึกไฟล์ได้"})
			return
		}

		image := entity.NewsImage{
			FilePath:  fullPath,
			NewsID: uint(newsID),
		}

		// ป้องกันข้อมูลซ้ำ
		if err := db.Where("file_path = ?", image.FilePath).FirstOrCreate(&image).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		savedImages = append(savedImages, image)
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": 		"อัปโหลดสำเร็จ",
		"newsImages": 	savedImages,
	})
}

// DELETE /news-images/:newsID
func DeleteNewsImagesByNewsID(c *gin.Context) {
	newsIDStr := c.Param("newsID")
	newsID, err := strconv.ParseUint(newsIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid newsID"})
		return
	}

	db := config.DB()
	var images []entity.NewsImage

	// Retrieve all image records associated with the given news ID
	if err := db.Where("news_id = ?", newsID).Find(&images).Error; err != nil || len(images) == 0 {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch image records"})
		return
	}

	// Delete image files from the file system
	for _, img := range images {
		if err := os.Remove(img.FilePath); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{
				"error":     "Failed to delete image file",
				"file_path": img.FilePath,
			})
			return
		}
	}

	// Delete image records from the database
	if err := db.Where("news_id = ?", newsID).Delete(&entity.NewsImage{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image records from the database"})
		return
	}

	// Optionally delete the folder (if it exists)
	if len(images) > 0 {
		imageFolder := filepath.Dir(images[0].FilePath)
		if err := os.RemoveAll(imageFolder); err != nil && !os.IsNotExist(err) {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete image folder"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "News images deleted successfully"})
}