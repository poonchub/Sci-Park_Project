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


func UseRoomQuota(c *gin.Context) {
	db := config.DB()
	var req struct {
		UserID    uint   `json:"user_id"`
		RoomType  string `json:"room_type"` // "meeting", "training", "multi"
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ข้อมูลไม่ถูกต้อง"})
		return
	}

	var userPackage entity.UserPackage
	if err := db.Where("user_id = ?", req.UserID).First(&userPackage).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ไม่พบข้อมูลแพ็กเกจของผู้ใช้"})
		return
	}

	switch req.RoomType {
	case "meeting":
		userPackage.MeetingRoomUsed += 1
	case "training":
		userPackage.TrainingRoomUsed += 1
	case "multi":
		userPackage.MultiFunctionRoomUsed += 1
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "ประเภทห้องไม่ถูกต้อง"})
		return
	}

	if err := db.Save(&userPackage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถอัปเดตข้อมูลได้"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "อัปเดตจำนวนสิทธิ์เรียบร้อย"})
}
