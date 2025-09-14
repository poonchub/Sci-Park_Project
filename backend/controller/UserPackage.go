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
// GET /room-discount/:id
func GetRoomDiscountByID(c *gin.Context) {
    db := config.DB()
    id := c.Param("id")

    var user entity.User
    if err := db.Preload("UserPackages.Package").Where("id = ?", id).First(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "load user package failed", "detail": err.Error()})
        return
    }

    // default = 0
    resp := gin.H{
        "meeting": gin.H{"total": 0, "used": 0, "remaining": 0},
        "training": gin.H{"total": 0, "used": 0, "remaining": 0},
        "multi": gin.H{"total": 0, "used": 0, "remaining": 0},
    }

    // เลือกแพ็กเกจตัวล่าสุดของ user (หรือใส่ logic เลือกตัว active ที่ต้องการ)
    if len(user.UserPackages) > 0 {
        up := user.UserPackages[len(user.UserPackages)-1]
        // totals
        mt, tt, ft := up.Package.MeetingRoomLimit, up.Package.TrainingRoomLimit, up.Package.MultiFunctionRoomLimit
        // used
        mu, tu, fu := up.MeetingRoomUsed, up.TrainingRoomUsed, up.MultiFunctionRoomUsed

        resp["meeting"] = gin.H{"total": mt, "used": mu, "remaining": max(mt-mu, 0)}
        resp["training"] = gin.H{"total": tt, "used": tu, "remaining": max(tt-tu, 0)}
        resp["multi"] = gin.H{"total": ft, "used": fu, "remaining": max(ft-fu, 0)}
    }

    c.JSON(http.StatusOK, resp)
}

func max(a, b int) int {
    if a > b { return a }
    return b
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
