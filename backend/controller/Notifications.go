package controller

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"

	"github.com/gin-gonic/gin"
)

type TaskNotificationDTO struct {
	ID     uint
	IsRead bool
	TaskID uint
	UserID uint
}

type RentalRoomInvoiceNotificationDTO struct {
	ID                  uint
	IsRead              bool
	RentalRoomInvoiceID uint
	UserID              uint
}

type ServiceAreaRequestNotificationDTO struct {
	ID                   uint
	IsRead               bool
	ServiceAreaRequestID uint
	UserID               uint
}

type ServiceAreaTaskNotificationDTO struct {
	ID                uint
	IsRead            bool
	ServiceAreaTaskID uint
	UserID            uint
}

type BookingRoomNotificationDTO struct {
	ID            uint
	IsRead        bool
	BookingRoomID uint
	UserID        uint
}

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
	var serviceAreaRequestCount int64
	var serviceAreaTaskCount int64
	var bookingRoomCount int64

	db := config.DB()

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND request_id != 0 AND user_id = ?", false, userID).
		Count(&requestCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND task_id != 0 AND user_id = ?", false, userID).
		Count(&taskCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND rental_room_invoice_id != 0 AND user_id = ?", false, userID).
		Count(&invoiceCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND service_area_request_id != 0 AND user_id = ?", false, userID).
		Count(&serviceAreaRequestCount)

	// เพิ่มการนับ service_area_task_id (เฉพาะที่ไม่มี service_area_request_id)
	db.Model(&entity.Notification{}).
		Where("is_read = ? AND service_area_task_id != 0 AND service_area_request_id = 0 AND user_id = ?", false, userID).
		Count(&serviceAreaTaskCount)

	db.Model(&entity.Notification{}).
		Where("is_read = ? AND booking_room_id != 0 AND user_id = ?", false, userID).
		Count(&bookingRoomCount)

	c.JSON(http.StatusOK, gin.H{
		"UnreadRequests":            requestCount,
		"UnreadTasks":               taskCount,
		"UnreadInvoice":             invoiceCount,
		"UnreadServiceAreaRequests": serviceAreaRequestCount + serviceAreaTaskCount, // รวม service area requests และ tasks
		"UnreadBookingRoom":         bookingRoomCount,
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
	err := db.Where("rental_room_invoice_id = ? AND user_id = ?", taskID, userID).First(&notifications).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": notifications})
}

// POST /notification
func CreateNotification(c *gin.Context) {
	var notificationInput struct {
		RequestID            uint
		TaskID               uint
		RentalRoomInvoiceID  uint
		ServiceAreaRequestID uint
		ServiceAreaTaskID    uint
		BookingRoomID        uint
	}
	if err := c.ShouldBindJSON(&notificationInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if at least one ID is provided
	if notificationInput.RequestID == 0 && notificationInput.TaskID == 0 &&
		notificationInput.RentalRoomInvoiceID == 0 && notificationInput.ServiceAreaRequestID == 0 &&
		notificationInput.ServiceAreaTaskID == 0 && notificationInput.BookingRoomID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please specify at least one request_id, task_id, rental_room_invoice_id, booking_room_id, service_area_request_id, or service_area_task_id."})
		return
	}

	db := config.DB()

	switch {
	case notificationInput.RequestID != 0:
		var request entity.MaintenanceRequest
		if err := db.First(&request, notificationInput.RequestID).Error; err != nil {
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

		exists := false
		for _, u := range recipients {
			if u.ID == request.UserID {
				exists = true
				break
			}
		}
		if !exists {
			notiForUser := entity.Notification{
				IsRead:    true,
				RequestID: notificationInput.RequestID,
				UserID:    request.UserID,
			}
			if err := db.Create(&notiForUser).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Notification."})
				return
			}
			createdNotifications = append(createdNotifications, notiForUser)
		}

		var dtoList []TaskNotificationDTO
		for _, noti := range createdNotifications {
			dtoList = append(dtoList, TaskNotificationDTO{
				ID:     noti.ID,
				IsRead: noti.IsRead,
				TaskID: noti.TaskID,
				UserID: noti.UserID,
			})
		}
		services.NotifySocketEvent("notification_created", dtoList)

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
			IsRead: false,
			TaskID: notificationInput.TaskID,
			UserID: operator.ID,
		}

		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for operator."})
			return
		}

		// ส่ง socket event และตอบกลับ
		dto := TaskNotificationDTO{
			ID:     noti.ID,
			IsRead: noti.IsRead,
			TaskID: noti.TaskID,
			UserID: noti.UserID,
		}

		services.NotifySocketEvent("notification_created", []TaskNotificationDTO{dto})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   1,
			"data":    noti,
		})
	case notificationInput.RentalRoomInvoiceID != 0:
		var invoice entity.RentalRoomInvoice
		if err := db.First(&invoice, notificationInput.RentalRoomInvoiceID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified invoice was not found."})
			return
		}

		var customer entity.User
		if err := db.First(&customer, invoice.CustomerID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The customer was not found."})
			return
		}

		createdNotifications := []entity.Notification{}

		// สร้าง Notification สำหรับ customer
		noti := entity.Notification{
			IsRead:              false,
			RentalRoomInvoiceID: notificationInput.RentalRoomInvoiceID,
			UserID:              customer.ID,
		}
		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for customer."})
			return
		}
		createdNotifications = append(createdNotifications, noti)

		if invoice.CreaterID != customer.ID {
			notiForUser := entity.Notification{
				IsRead:              true,
				RentalRoomInvoiceID: notificationInput.RentalRoomInvoiceID,
				UserID:              invoice.CreaterID,
			}
			if err := db.Create(&notiForUser).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for creater."})
				return
			}
			createdNotifications = append(createdNotifications, notiForUser)
		}

		var dtoList []RentalRoomInvoiceNotificationDTO
		for _, noti := range createdNotifications {
			dtoList = append(dtoList, RentalRoomInvoiceNotificationDTO{
				ID:                  noti.ID,
				IsRead:              noti.IsRead,
				RentalRoomInvoiceID: noti.RentalRoomInvoiceID,
				UserID:              noti.UserID,
			})
		}

		services.NotifySocketEvent("notification_created", dtoList)

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   len(createdNotifications),
			"data":    createdNotifications,
		})
	case notificationInput.ServiceAreaRequestID != 0:
		var request entity.RequestServiceArea
		if err := db.First(&request, notificationInput.ServiceAreaRequestID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified service area request was not found."})
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

		// สร้าง Notification สำหรับ user ที่สร้าง request
		noti := entity.Notification{
			IsRead:               false,
			ServiceAreaRequestID: notificationInput.ServiceAreaRequestID,
			UserID:               request.UserID,
		}

		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for service area request."})
			return
		}

		dto := ServiceAreaRequestNotificationDTO{
			ID:                   noti.ID,
			IsRead:               noti.IsRead,
			ServiceAreaRequestID: noti.ServiceAreaRequestID,
			UserID:               noti.UserID,
		}

		services.NotifySocketEvent("notification_created", []ServiceAreaRequestNotificationDTO{dto})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   1,
			"data":    noti,
		})
	case notificationInput.ServiceAreaTaskID != 0:
		var task entity.ServiceAreaTask
		if err := db.First(&task, notificationInput.ServiceAreaTaskID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified service area task was not found."})
			return
		}

		// สร้าง Notification สำหรับ operator
		noti := entity.Notification{
			IsRead:            false,
			ServiceAreaTaskID: notificationInput.ServiceAreaTaskID,
			UserID:            task.UserID,
		}

		if err := db.Create(&noti).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create notification for service area task."})
			return
		}

		dto := ServiceAreaTaskNotificationDTO{
			ID:                noti.ID,
			IsRead:            noti.IsRead,
			ServiceAreaTaskID: noti.ServiceAreaTaskID,
			UserID:            noti.UserID,
		}

		services.NotifySocketEvent("notification_created", []ServiceAreaTaskNotificationDTO{dto})

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   1,
			"data":    noti,
		})
	case notificationInput.BookingRoomID != 0:
		var bookingRoom entity.BookingRoom
		if err := db.First(&bookingRoom, notificationInput.BookingRoomID).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "The specified booking room was not found."})
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

		// ดึง admin และ manager ทุกคน
		var recipients []entity.User
		if err := db.Where("role_id = ? OR role_id = ?", adminRole.ID, managerRole.ID).Find(&recipients).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to retrieve admins and managers."})
			return
		}

		var createdNotifications []entity.Notification

		for _, user := range recipients {
			noti := entity.Notification{
				IsRead:        false,
				BookingRoomID: notificationInput.BookingRoomID,
				UserID:        user.ID,
			}
			if err := db.Create(&noti).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Notification."})
				return
			}
			createdNotifications = append(createdNotifications, noti)
		}

		exists := false
		for _, u := range recipients {
			if u.ID == bookingRoom.UserID {
				exists = true
				break
			}
		}
		if !exists {
			notiForUser := entity.Notification{
				IsRead:        true,
				BookingRoomID: notificationInput.BookingRoomID,
				UserID:        bookingRoom.UserID,
			}
			if err := db.Create(&notiForUser).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create Notification."})
				return
			}
			createdNotifications = append(createdNotifications, notiForUser)
		}

		var dtoList []BookingRoomNotificationDTO
		for _, noti := range createdNotifications {
			dtoList = append(dtoList, BookingRoomNotificationDTO{
				ID:            noti.ID,
				IsRead:        noti.IsRead,
				BookingRoomID: noti.BookingRoomID,
				UserID:        noti.UserID,
			})
		}

		services.NotifySocketEvent("notification_created", dtoList)

		c.JSON(http.StatusCreated, gin.H{
			"message": "Created success",
			"count":   len(createdNotifications),
			"data":    createdNotifications,
		})
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Please specify at least one request_id, task_id, rental_room_invoice_id, service_area_request_id, or service_area_task_id."})
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

// PATCH /notifications/service-area-request/:service_area_request_id
func UpdateNotificationsByServiceAreaRequestID(c *gin.Context) {
	serviceAreaRequestID := c.Param("service_area_request_id")

	db := config.DB()

	// ดึง notifications ทั้งหมดที่มี service_area_request_id ตรงกัน
	var notifications []entity.Notification
	if err := db.Where("service_area_request_id = ?", serviceAreaRequestID).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notifications"})
		return
	}

	if len(notifications) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No notifications found for this service area request ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดต notifications ทั้งหมดที่มี service_area_request_id ตรงกัน
	if err := db.Model(&entity.Notification{}).Where("service_area_request_id = ?", serviceAreaRequestID).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service area notifications updated successfully"})
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
		"updated": updateData,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Notifications updated successfully",
		"data":    updateData,
	})
}

// PATCH /notifications/service-area-task/:service_area_task_id
func UpdateNotificationsByServiceAreaTaskID(c *gin.Context) {
	serviceAreaTaskID := c.Param("service_area_task_id")

	db := config.DB()

	// ดึง notifications ทั้งหมดที่มี service_area_task_id ตรงกัน
	var notifications []entity.Notification
	if err := db.Where("service_area_task_id = ?", serviceAreaTaskID).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notifications"})
		return
	}

	if len(notifications) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No notifications found for this service area task ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดต notifications ทั้งหมดที่มี service_area_task_id ตรงกัน
	if err := db.Model(&entity.Notification{}).Where("service_area_task_id = ?", serviceAreaTaskID).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Service area task notifications updated successfully"})
}

// PATCH /notifications/booking-room/:booking_room_id
func UpdateNotificationsByBookingRoomID(c *gin.Context) {
	bookingID := c.Param("booking_room_id")

	db := config.DB()

	// ดึง notifications ทั้งหมดที่มี booking_room_id ตรงกัน
	var notifications []entity.Notification
	if err := db.Where("booking_room_id = ?", bookingID).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find notifications"})
		return
	}

	if len(notifications) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No notifications found for this booking room ID"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	// อัปเดตแบบ bulk
	if err := db.Model(&entity.Notification{}).
		Where("booking_room_id = ?", bookingID).
		Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	// Broadcast socket event (optional)
	services.NotifySocketEvent("notification_updated_bulk", gin.H{
		"booking_room_id": bookingID,
		"updated":         updateData,
	})

	c.JSON(http.StatusOK, gin.H{
		"message": "Notifications updated successfully",
		"data":    updateData,
	})
}
