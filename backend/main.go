package main

import (
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/middlewares"
	"sci-park_web-application/controller"

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

	// 🌍 Public API (ไม่ต้องใช้ Token)
	public := r.Group("/")
	{
		public.POST("/auth/login", controller.UserLogin)

		// Send Email OTP
		public.POST("/send-otp-email", controller.ResetPasswordController)

		
	}

	// 🔒 Protected API (ต้องใช้ Token)
	protected := r.Group("/")
	protected.Use(middlewares.Authorizes()) // ✅ Middleware ตรวจสอบ Token
	{

		// protected.GET("/users", controller.GetAllUsers)

		

		// Areas
		protected.GET("/areas", controller.ListAreas)

		// RequestStatuses
		protected.GET("/request-statuses", controller.ListRequestStatuses)

		// Rooms
		protected.GET("/rooms", controller.ListRooms)

		// RoomTypes
		protected.GET("/room-types", controller.ListRoomTypes)

		// Users
		protected.POST("/create-user", controller.CreateUser)
		r.GET("/user", middlewares.Authorizes(), controller.GetUserByID)

		// MaintenanceRequests
		protected.GET("/maintenance-requests", controller.ListMaintenanceRequests)
		protected.POST("/create-maintenance-request", controller.CreateMaintenanceRequest)

		// MaintenanceTypes
		protected.GET("/maintenance-types", controller.ListMaintenanceTypes)

		// MaintenanceImages
		protected.POST("/create-maintenance-images", controller.CreateMaintenanceImages)

		// Floor
		protected.GET("/floors", controller.ListFloors)

		// Gender
		protected.GET("/genders",controller.ListGenders)

		// Role
		protected.GET("/roles",controller.ListRoles)

		// Package
		protected.GET("/packages",controller.ListPackages)
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
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
