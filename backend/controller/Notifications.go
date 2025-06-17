package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"

	"github.com/gin-gonic/gin"
)

// GET /notifications
func ListNotifications(c *gin.Context) {
	var notifications []entity.Notification

	db := config.DB()

	results := db.Find(&notifications)
	if results.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": results.Error.Error()})
		return
	}

	c.JSON(http.StatusOK, &notifications)
}

// GET /notifications/count/:id
func GetUnreadNotificationCountsByUserID(c *gin.Context) {
	userID := c.Param("id")
	var requestCount int64
	var taskCount int64

	db := config.DB()

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND request_id != 0 AND user_id = ?", false, userID).
		Count(&requestCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND task_id != 0 AND user_id = ?", false, userID).
		Count(&taskCount)

	c.JSON(http.StatusOK, gin.H{
		"UnreadRequests": requestCount,
		"UnreadTasks":    taskCount,
	})
}

// POST /notification
func CreateNotification(c *gin.Context) {
	var notification entity.Notification

	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	db := config.DB()

	switch {
	case notification.RequestID != 0:
		if err := db.First(&entity.MaintenanceRequest{}, notification.RequestID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Request ที่ระบุ"})
			return
		}
	case notification.TaskID != 0:
		if err := db.First(&entity.MaintenanceTask{}, notification.TaskID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ Task ที่ระบุ"})
			return
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณาระบุ request_id หรือ task_id อย่างน้อยหนึ่งค่า"})
		return
	}

	// ดึง email จาก token
	userEmail := c.GetString("user_email")

	// ดึง user จาก email
	var creator entity.User
	if err := db.Where("email = ?", userEmail).First(&creator).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบผู้ใช้งานที่สร้าง notification"})
		return
	}

	// หา role admin
	var adminRole entity.Role
	if err := db.Where("name = ?", "Admin").First(&adminRole).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ role ชื่อ Admin"})
		return
	}

	// หา role manager
	var managerRole entity.Role
	if err := db.Where("name = ?", "Manager").First(&managerRole).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ไม่พบ role ชื่อ Manager"})
		return
	}

	// ดึง admin ทุกคน
	var admins []entity.User
	if err := db.Where("role_id = ?", adminRole.ID).Find(&admins).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงผู้ดูแลระบบได้"})
		return
	}

	var internalType entity.RequestType
	if err := db.Where("type_name = ?", "Internal").First(&internalType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": ""})
		return
	}

	var externalType entity.RequestType
	if err := db.Where("type_name = ?", "External").First(&externalType).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": ""})
		return
	}

	// ดึง manager ตามเงื่อนไข
	var managers []entity.User
	requestTypeID := externalType
	if creator.IsEmployee {
		requestTypeID = internalType
	}
	if err := db.Where("role_id = ? AND request_type_id = ?", managerRole.ID, requestTypeID).Find(&managers).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถดึงผู้จัดการได้"})
		return
	}

	// รวมผู้รับ Notification
	recipients := append(admins, managers...)

	var createdNotifications []entity.Notification

	for _, user := range recipients {
		noti := entity.Notification{
			IsRead:    false,
			RequestID: notification.RequestID,
			TaskID:    notification.TaskID,
			UserID:    user.ID,
		}
		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "สร้าง Notification ไม่สำเร็จ"})
			return
		}
		createdNotifications = append(createdNotifications, noti)
	}

	services.NotifySocketEvent("notification_created", createdNotifications)

	c.JSON(http.StatusCreated, gin.H{
		"message": "Created success",
		"count":   len(createdNotifications),
		"data":    createdNotifications,
	})
}

// PATCH /notification/:id
func UpdateNotificationByID(c *gin.Context) {
	ID := c.Param("id")

	var notification entity.Notification

	db := config.DB()
	result := db.First(&notification, ID)
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "id not found"})
		return
	}

	if err := c.ShouldBindJSON(&notification); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	result = db.Save(&notification)
	if result.Error != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request"})
		return
	}

	services.NotifySocketEvent("notification_updated", notification)

	c.JSON(http.StatusOK, gin.H{"message": "Updated successful"})
}
