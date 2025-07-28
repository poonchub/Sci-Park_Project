package controller

import (
	"net/http"
	

	"github.com/gin-gonic/gin"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
)

// =============================
// 🎯 GET /room-discount/:id
// =============================
func GetRoomDiscountByID(c *gin.Context) {
	db := config.DB()
	id := c.Param("id")

	var userWithPackage entity.User
	err := db.Preload("UserPackages.Package").
		Where("id = ?", id).
		First(&userWithPackage).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "load user package failed",
			"detail": err.Error(),
		})
		return
	}

	quota := gin.H{"meeting_room": gin.H{"total": 0, "used": 0, "remaining": 0}}

	for _, up := range userWithPackage.UserPackages {
		total := up.Package.MeetingRoomLimit
		used := up.MeetingRoomUsed
		remaining := total - used
		if remaining < 0 {
			remaining = 0
		}

		quota["meeting_room"] = gin.H{
			"total":     total,
			"used":      used,
			"remaining": remaining,
		}
		break
	}

	c.JSON(http.StatusOK, quota)
}
