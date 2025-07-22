package controller

import (
	"fmt"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"
	"time"

	"github.com/gin-gonic/gin"
)

// GET /news
func ListNews(c *gin.Context) {
	var news []entity.News

	db := config.DB()

	result := db.
		Preload("NewsImages").Find(&news)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &news)
}

// GET /news/ordered
func ListNewsOrdered(c *gin.Context) {
	var news []entity.News
	db := config.DB()

	result := db.
		Preload("NewsImages").
		Order("is_pinned DESC").
		Order("display_start DESC").
		Find(&news)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, news)
}

// GET /news/ordered-period
func ListNewsOrderedPeriod(c *gin.Context) {
	var news []entity.News
	db := config.DB()

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load location"})
		return
	}

	now := time.Now().In(loc)
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	endOfDay := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)

	result := db.
		Preload("NewsImages").
		Where("display_start <= ? AND display_end >= ?", endOfDay, startOfDay).
		Order("is_pinned DESC").
		Order("display_start DESC").
		Find(&news)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, news)
}

// GET /news/unpinned?limit=
func ListUnpinnedNews(c *gin.Context) {
	var news []entity.News
	db := config.DB()

	limitParam := c.Query("limit")

	query := db.
		Where("is_pinned = ?", false).
		Order("display_start DESC").
		Preload("User").
		Preload("NewsImages")

	if limitParam != "" {
		var limit int
		if _, err := fmt.Sscanf(limitParam, "%d", &limit); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	result := query.Find(&news)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, news)
}

// GET /news/pinned?limit=
func ListPinnedNews(c *gin.Context) {
	var news []entity.News
	db := config.DB()

	limitParam := c.Query("limit")

	query := db.
		Where("is_pinned = ?", true).
		Order("display_start DESC").
		Preload("User").
		Preload("NewsImages")

	if limitParam != "" {
		var limit int
		if _, err := fmt.Sscanf(limitParam, "%d", &limit); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	result := query.Find(&news)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, news)
}

// GET /news/pinned-period?limit=
func ListPinnedNewsPeriod(c *gin.Context) {
	var pinnedNews []entity.News
	db := config.DB()

	limitParam := c.Query("limit")

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load location"})
		return
	}

	now := time.Now().In(loc)
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	endOfDay := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)

	query := db.
		Where("is_pinned = ?", true).
		Where("display_start <= ? AND display_end >= ?", endOfDay, startOfDay).
		Order("display_start DESC").
		Preload("User").
		Preload("NewsImages").
		Find(&pinnedNews)

	if limitParam != "" {
		var limit int
		if _, err := fmt.Sscanf(limitParam, "%d", &limit); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	result := query.Find(&pinnedNews)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, pinnedNews)
}

// GET /news/unpinned-period?limit=
func ListUnpinnedNewsPeriod(c *gin.Context) {
	var unpinnedNews []entity.News
	db := config.DB()

	limitParam := c.Query("limit")

	loc, err := time.LoadLocation("Asia/Bangkok")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load location"})
		return
	}

	now := time.Now().In(loc)
	startOfDay := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, loc)
	endOfDay := time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, loc)

	query := db.
		Where("is_pinned = ?", false).
		Where("display_start <= ? AND display_end >= ?", endOfDay, startOfDay).
		Order("display_start DESC").
		Preload("User").
		Preload("NewsImages").
		Find(&unpinnedNews)

	if limitParam != "" {
		var limit int
		if _, err := fmt.Sscanf(limitParam, "%d", &limit); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}

	result := query.Find(&unpinnedNews)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": result.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, unpinnedNews)
}

// POST /news
func CreateNews(c *gin.Context) {
	var news entity.News

	if err := c.ShouldBindJSON(&news); err != nil {
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
		Title:        news.Title,
		Summary:      news.Summary,
		FullContent:  news.FullContent,
		DisplayStart: news.DisplayStart.In(loc),
		DisplayEnd:   news.DisplayEnd.In(loc),
		IsPinned:     news.IsPinned,
		UserID:       news.UserID,
	}

	if err := db.FirstOrCreate(&n, entity.News{
		Title: news.Title,
	}).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	services.NotifySocketEvent("news_created", n)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Create success",
		"data":    n,
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

	services.NotifySocketEvent("news_updated", news)

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
