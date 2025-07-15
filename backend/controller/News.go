package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"time"

	"github.com/gin-gonic/gin"
)

// GET /news
func ListNews(c *gin.Context) {
	var news []entity.News

	db := config.DB()

	result := db.
		Preload("NewsImages").
		Order("created_at DESC").Find(&news)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &news)
}

// GET /news/pinned
func ListPinnedNews(c *gin.Context) {
	var pinnedNews []entity.News
	db := config.DB()

	now := time.Now().UTC()

	err := db.
		Where("is_pinned = ?", true).
		Where("display_start <= ? AND display_end >= ?", now, now).
		Order("created_at DESC").
		Preload("User").
		Preload("NewsImages").
		Find(&pinnedNews).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, pinnedNews)
}

// POST /news
func CreateNews(c *gin.Context){
	var news entity.News

	if err := c.ShouldBindJSON(&news);
	err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	var user entity.User
	if err := db.First(&user, news.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	loc, _ := time.LoadLocation("Asia/Bangkok")
	n := entity.News{
		Title: news.Title,
		Summary: news.Summary,
		FullContent: news.FullContent,
		DisplayStart: news.DisplayStart.In(loc),
		DisplayEnd: news.DisplayEnd.In(loc),
		IsPinned: news.IsPinned,
		UserID: news.UserID,
	}

	if err := db.FirstOrCreate(&n, entity.News{
		Title: news.Title,
	}).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data": n,
	})
}

// PATCH /news/:id
func UpdateNewsByID(c *gin.Context) {
	ID := c.Param("id")

	var news entity.News

	db := config.DB()
	result := db.First(&news, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&news); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&news)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}

// DELETE /news/:id
func DeleteNewsByID(c *gin.Context) {
	ID := c.Param("id")

	db := config.DB()

	var news entity.News
	if err := db.Where("id = ?", ID).First(&news).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "News not found"})
		return
	}

	if err := db.Where("id = ?", ID).Delete(&entity.News{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete news"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "News deleted successfully"})
}