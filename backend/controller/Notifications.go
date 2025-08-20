package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"

	"github.com/asaskevich/govalidator"
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
	var invoiceCount int64

	db := config.DB()

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND request_id != 0 AND user_id = ?", false, userID).
		Count(&requestCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND task_id != 0 AND user_id = ?", false, userID).
		Count(&taskCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND invoice_id != 0 AND user_id = ?", false, userID).
		Count(&invoiceCount)

	c.JSON(http.StatusOK, gin.H{
		"UnreadRequests": requestCount,
		"UnreadTasks":    taskCount,
		"UnreadInvoice": invoiceCount,
	})
}

// GET /notification/by-request/:request_id/:user_id
func GetNotificationByRequestAndUser(c *gin.Context) {
	requestID := c.Param("request_id")
	userID := c.Param("user_id")

	db := config.DB()

	var notifications entity.Notification
	err := db.Where("request_id = ? AND user_id = ?", requestID, userID).First(&notifications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notifications})
}

// GET /notification/by-task/:task_id/:user_id
func GetNotificationByTaskAndUser(c *gin.Context) {
	taskID := c.Param("task_id")
	userID := c.Param("user_id")

	db := config.DB()

	var notifications entity.Notification
	err := db.Where("task_id = ? AND user_id = ?", taskID, userID).First(&notifications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notifications})
}

// GET /notification/by-invoice/:invoice_id/:user_id
func GetNotificationByInvoiceAndUser(c *gin.Context) {
	taskID := c.Param("invoice_id")
	userID := c.Param("user_id")

	db := config.DB()

	var notifications entity.Notification
	err := db.Where("invoice_id = ? AND user_id = ?", taskID, userID).First(&notifications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notifications})
}

// POST /notification
func CreateNotification(c *gin.Context) {
	var notificationInput struct {
		RequestID uint
		TaskID    uint
		InvoiceID uint
	}
	if err := c.ShouldBindJSON(&notificationInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if ok, err := govalidator.ValidateStruct(&notificationInput); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"validation_error": err.Error()})
		return
	}

	db := config.DB()

	switch {
	case notificationInput.RequestID != 0:
		if err := db.First(&entity.MaintenanceRequest{}, notificationInput.RequestID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified request was not found."})
			return
		}
		// ดึง email จาก token
		userEmail := c.GetString("user_email")

		// ดึง user จาก email
		var creator entity.User
		if err := db.Where("email = ?", userEmail).First(&creator).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The user who created the notification was not found."})
			return
		}

		// หา role admin
		var adminRole entity.Role
		if err := db.Where("name = ?", "Admin").First(&adminRole).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The role named Admin was not found."})
			return
		}

		// หา role manager
		var managerRole entity.Role
		if err := db.Where("name = ?", "Manager").First(&managerRole).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The role named Manager was not found."})
			return
		}

		// ดึง admin ทุกคน
		var admins []entity.User
		if err := db.Where("role_id = ?", adminRole.ID).Find(&admins).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve administrator.ด้"})
			return
		}

		var internalType entity.RequestType
		if err := db.Where("type_name = ?", "Internal").First(&internalType).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find request type: Internal"})
			return
		}

		var externalType entity.RequestType
		if err := db.Where("type_name = ?", "External").First(&externalType).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find request type: External"})
			return
		}

		// ดึง manager ตามเงื่อนไข
		var managers []entity.User
		requestTypeID := externalType.ID
		if creator.IsEmployee {
			requestTypeID = internalType.ID
		}
		if err := db.Where("role_id = ? AND request_type_id = ?", managerRole.ID, requestTypeID).Find(&managers).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to get manager"})
			return
		}

		// รวมผู้รับ Notification
		recipients := append(admins, managers...)

		var createdNotifications []entity.Notification

		for _, user := range recipients {
			noti := entity.Notification{
				IsRead:    false,
				RequestID: notificationInput.RequestID,
				UserID:    user.ID,
			}
			if err := db.Create(&noti).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Notification."})
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
	case notificationInput.TaskID != 0:
		var task entity.MaintenanceTask
		if err := db.First(&task, notificationInput.TaskID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified task was not found."})
			return
		}

		var operator entity.User
		if err := db.First(&operator, task.UserID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The assigned operator was not found."})
			return
		}

		// สร้าง Notification สำหรับ operator
		noti := entity.Notification{
			IsRead:    false,
			TaskID:    notificationInput.TaskID,
			UserID:    operator.ID,
		}

		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for operator."})
			return
		}

		// ส่ง socket event และตอบกลับ
		services.NotifySocketEvent("notification_created", []entity.Notification{noti})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   1,
			"data":    noti,
		})
	case notificationInput.InvoiceID != 0:
		var invoice entity.Invoice
		if err := db.First(&invoice, notificationInput.InvoiceID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified invoice was not found."})
			return
		}

		var customer entity.User
		if err := db.First(&customer, invoice.CustomerID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The customer was not found."})
			return
		}

		// สร้าง Notification สำหรับ customer
		noti := entity.Notification{
			IsRead:    false,
			InvoiceID: notificationInput.InvoiceID,
			UserID:    customer.ID,
		}

		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for customer."})
			return
		}

		// ส่ง socket event และตอบกลับ
		services.NotifySocketEvent("notification_created", []entity.Notification{noti})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   1,
			"data":    noti,
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please specify at least one request_id or task_id."})
		return
	}
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

// PATCH /notifications/request/:request_id
func UpdateNotificationsByRequestID(c *gin.Context) {
	requestID := c.Param("request_id")

	db := config.DB()

	// ดึง notifications ทั้งหมดที่มี request_id ตรงกัน
	var notifications []entity.Notification
	if err := db.Where("request_id = ?", requestID).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notifications"})
		return
	}

	if len(notifications) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No notifications found for this request ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดตแบบ bulk
	if err := db.Model(&entity.Notification{}).
		Where("request_id = ?", requestID).
		Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	// Broadcast socket event (optional)
	services.NotifySocketEvent("notification_updated_bulk", gin.H{
		"request_id": requestID,
		"updated":    updateData,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Notifications updated successfully",
		"data":    updateData,
	})
}

// PATCH /notifications/task/:task_id
func UpdateNotificationsByTaskID(c *gin.Context) {
	taskID := c.Param("task_id")

	db := config.DB()

	// ดึง notifications ทั้งหมดที่มี task_id ตรงกัน
	var notifications []entity.Notification
	if err := db.Where("task_id = ?", taskID).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notifications"})
		return
	}

	if len(notifications) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No notifications found for this request ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดตแบบ bulk
	if err := db.Model(&entity.Notification{}).
		Where("task_id = ?", taskID).
		Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	// Broadcast socket event (optional)
	services.NotifySocketEvent("notification_updated_bulk", gin.H{
		"task_id": taskID,
		"updated":    updateData,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Notifications updated successfully",
		"data":    updateData,
	})
}