package main

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/controller"
	"sci-park_web-application/middlewares"

	"github.com/gin-gonic/gin"
)

const PORT = "8000"

func main() {
	// โหลดค่าจาก .env ก่อนเชื่อมต่อฐานข้อมูล
	config.LoadEnv()
	config.ConnectDB()
	config.SetupDatabase()

	// ตั้งค่า CORS Middleware
	r := gin.Default()
	r.Use(CORSMiddleware())

	r.Static("/images", "./images")

	// 🌍 Public API (ไม่ต้องใช้ Token)
	public := r.Group("/")
	{
		public.POST("/auth/login", controller.UserLogin)

		// Send Email OTP
		public.POST("/send-otp-email", controller.ResetPasswordController)
		// Validate OTP
		public.POST("/validate-otp", controller.ValidateResetTokenController)

		public.POST("/send-maintenance-status-email/:id", controller.SendMaintenanceStatusEmail)

		// Genders
		public.GET("/genders", controller.ListGenders)

		//Register
		public.POST("/register", controller.CreateUserExternalOnly)

	}

	// 🔒 Protected API (ต้องใช้ Token)
	protected := r.Group("/")
	protected.Use(middlewares.Authorizes(middlewares.User)) // ✅ Middleware ตรวจสอบ Token
	{
		// Users
		protected.GET("/users", controller.ListUsers)
		protected.GET("/user/:id", controller.GetUserByID)
		protected.POST("/user", controller.CreateUser)
		protected.PATCH("/user/:id", controller.UpdateUserByID)

		protected.POST("/user/upload-profile/:id", controller.UpdateProfileImage)

		// Analytics
		protected.POST("/analytics/track", controller.TrackPageVisit)
		protected.GET("/analytics/user/:user_id", controller.GetUserAnalytics)
		protected.GET("/analytics/page/:page_path", controller.GetPageAnalytics)
		protected.GET("/analytics/system", controller.GetSystemAnalytics)
		protected.GET("/analytics/dashboard", controller.GetAnalyticsDashboard)
		protected.GET("/analytics/visits-range", controller.GetVisitsRange)
		protected.GET("/analytics/popular-pages-by-period", controller.GetPopularPagesByPeriod)
		protected.GET("/analytics/performance", controller.GetPerformanceAnalytics)

		// Areas
		protected.GET("/areas", controller.ListAreas)

		// RequestStatuses
		protected.GET("/request-statuses", controller.ListRequestStatuses)

		// Rooms
		protected.GET("/rooms", controller.ListRooms)

		// RoomTypes
		protected.GET("/room-types", controller.ListRoomTypes)
		protected.GET("/room-types-for-booking", controller.ListRoomTypesForBooking)

		// RoomStatuses
		protected.GET("/room-status", controller.ListRoomStatus)

		// Users
		protected.POST("/create-user", controller.CreateUser)
		protected.PATCH("/update-user/:id", controller.UpdateUserByID)

		protected.PATCH("/change-password", controller.ChangePassword)
		protected.GET("/operators", controller.ListOperators)
		protected.PATCH("/update-profile/:id", controller.UpdateProfileImage)

		// MaintenanceRequests
		protected.GET("/maintenance-requests", controller.ListMaintenanceRequests)
		protected.GET("/maintenance-request/:id", controller.GetMaintenanceRequestByID)
		protected.GET("/maintenance-request-user/:id", controller.GetMaintenanceRequestByUserID)
		protected.POST("/maintenance-request", controller.CreateMaintenanceRequest)
		protected.PATCH("/maintenance-request/:id", controller.UpdateMaintenanceRequestByID)
		protected.DELETE("/maintenance-request/:id", controller.DeleteMaintenanceRequestByID)
		protected.GET("/maintenance-requests-option-for-user", controller.GetMaintenanceRequestsForUser)

		// MaintenanceTypes
		protected.GET("/maintenance-types", controller.ListMaintenanceTypes)

		// MaintenanceImages
		protected.PATCH("/maintenance-images", controller.UpdateMaintenanceImages)
		protected.POST("/maintenance-images", controller.CreateMaintenanceImages)

		// Floors
		protected.GET("/floors", controller.ListFloors)

		// Room
		protected.GET("/room/:id", controller.GetRoomByID)

		// Roles
		protected.GET("/roles", controller.ListRoles)

		// Packages
		protected.GET("/packages", controller.ListPackages)

		// RequestTypes
		protected.GET("/request-types", controller.ListRequestType)

		// ManagerApprovals
		protected.POST("/manager-approval", controller.CreateManagerApproval)

		// MaintenanceTasks
		protected.POST("/maintenance-task", controller.CreateMaintenanceTask)
		protected.PATCH("/maintenance-task/:id", controller.UpdateMaintenanceTaskByID)

		// Inspections
		protected.POST("/inspection", controller.CreateInspection)

		// HandoverImages
		protected.PATCH("/handover-images", controller.UpdateHandoverImages)
		protected.DELETE("/handover-images/:id", controller.DeleteHandoverImagesByTaskID)

		// Notifications
		protected.GET("/notifications", controller.ListNotifications)
		protected.GET("/notifications/count/:id", controller.GetUnreadNotificationCountsByUserID)
		protected.GET("/notification/by-request/:request_id/:user_id", controller.GetNotificationByRequestAndUser)
		protected.GET("/notification/by-task/:task_id/:user_id", controller.GetNotificationByTaskAndUser)
		protected.POST("/notification", controller.CreateNotification)
		protected.PATCH("/notification/:id", controller.UpdateNotificationByID)
		protected.PATCH("/notifications/request/:request_id", controller.UpdateNotificationsByRequestID)
		protected.PATCH("/notifications/task/:task_id", controller.UpdateNotificationsByTaskID)

		// News
		protected.GET("/news", controller.ListNews)
		protected.GET("/news/pinned-period", controller.ListPinnedNewsPeriod)
		protected.GET("/news/ordered-period", controller.ListNewsOrderedPeriod)
		protected.GET("/news/unpinned-period", controller.ListUnpinnedNewsPeriod)
	}

	protected.Use(middlewares.Authorizes(middlewares.Operator)) // ✅ Middleware ตรวจสอบ Token
	{
		// MaintenanceTasks
		protected.GET("/maintenance-task/:id", controller.GetMaintenanceTaskByID)
		protected.GET("/maintenance-tasks-option-id", controller.GetMaintenanceTasksByOperatorID)

		protected.DELETE("/maintenance-task/:id", controller.DeleteMaintenanceTaskByID)

		// HondoverImages
		protected.POST("/handover-images", controller.CreateHandoverImages)
	}

	protected.Use(middlewares.Authorizes(middlewares.Manager)) // ✅ Middleware ตรวจสอบ Token
	{	
		// Maintenance
		protected.GET("/maintenance-requests-option-for-admin", controller.GetMaintenanceRequestsForAdmin)
		protected.GET("/maintenance-requests/by-date", controller.ListMaintenanceRequestsByDateRange)

		// BookingRooms
		protected.GET("/booking-rooms", controller.ListBookingRooms)

		// News
		protected.GET("/news/pinned", controller.ListPinnedNews)
		protected.GET("/news/unpinned", controller.ListUnpinnedNews)
		protected.GET("/news/ordered", controller.ListNewsOrdered)
		protected.POST("/news", controller.CreateNews)
		protected.PATCH("/news/:id", controller.UpdateNewsByID)
		protected.DELETE("/news/:id", controller.DeleteNewsByID)

		// NewsImages
		protected.POST("/news-images", controller.CreateNewsImages)
		protected.PATCH("/news-images", controller.UpdateNewsImages)
		protected.DELETE("/news-images/:newsID", controller.DeleteNewsImagesByNewsID)
	}

	protected.Use(middlewares.Authorizes(middlewares.Admin)) // ✅ Middleware ตรวจสอบ Token
	{
		// Rooms
		protected.GET("/listset-room", controller.ListSetRooms)
		protected.POST("/create-room", controller.CreateRoom)
		protected.PATCH("/update-room/:id", controller.UpdateRoom)

		// Floors
		protected.POST("/create-floor", controller.CreateFloor)
		protected.PATCH("/update-floor/:id", controller.UpdateFloor)

		// RoomTypes
		protected.POST("/create-room-type", controller.CreateRoomType)
		protected.PATCH("/update-room-type/:id", controller.UpdateRoomType)

	}

	// 🌍 Root Route
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// 🚀 Start Server
	r.Run("localhost:" + PORT) // ✅ รองรับการเข้าถึงจากเครือข่ายอื่น
}

// 🛠 CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, PATCH, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
