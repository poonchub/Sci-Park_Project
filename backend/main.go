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
		// Validate OTP
		public.POST("/validate-otp", controller.ValidateResetTokenController)
		
	}

	// 🔒 Protected API (ต้องใช้ Token)
	protected := r.Group("/")
	protected.Use(middlewares.Authorizes(middlewares.Outsider)) // ✅ Middleware ตรวจสอบ Token
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
		protected.GET("/user/:id", controller.GetUserByID)
		
		protected.PATCH("/change-password", controller.ChangePassword)
		protected.GET("/operators", controller.ListOperators)

		// MaintenanceRequests
		protected.GET("/maintenance-requests", controller.ListMaintenanceRequests)
		protected.GET("/maintenance-request/:id", controller.GetMaintenanceRequestByID)
		protected.POST("/maintenance-request", controller.CreateMaintenanceRequest)
		protected.PATCH("/maintenance-request/:id", controller.UpdateMaintenanceRequestByID)
		protected.DELETE("/maintenance-request/:id", controller.DeleteMaintenanceRequestByID)
		protected.GET("/maintenance-requests-option", controller.GetMaintenanceRequests)

		// MaintenanceTypes
		protected.GET("/maintenance-types", controller.ListMaintenanceTypes)

		// MaintenanceImages
		protected.POST("/maintenance-images", controller.CreateMaintenanceImages)

		// Floors
		protected.GET("/floors", controller.ListFloors)

		// Genders
		protected.GET("/genders",controller.ListGenders)

		// Roles
		protected.GET("/roles",controller.ListRoles)

		// Packages
		protected.GET("/packages",controller.ListPackages)

		// ManagerApprovals
		protected.POST("/manager-approval", controller.CreateManagerApproval)

		// MaintenanceTasks
		protected.POST("/maintenance-task", controller.CreateMaintenanceTask)
	}

	protected.Use(middlewares.Authorizes(middlewares.Enterprise)) // ✅ Middleware ตรวจสอบ Token
	{	

	}

	protected.Use(middlewares.Authorizes(middlewares.Employee)) // ✅ Middleware ตรวจสอบ Token
	{	

	}

	protected.Use(middlewares.Authorizes(middlewares.Operators)) // ✅ Middleware ตรวจสอบ Token
	{	

	}

	protected.Use(middlewares.Authorizes(middlewares.Manager)) // ✅ Middleware ตรวจสอบ Token
	{	

	}

	protected.Use(middlewares.Authorizes(middlewares.Admin)) // ✅ Middleware ตรวจสอบ Token
	{	
		// Users
		protected.PATCH("/update-user/:id", controller.UpdateUserByID)
		protected.GET("/users", controller.ListUsers)

	}

	protected.Use(middlewares.Authorizes(middlewares.SuperAdmin)) // ✅ Middleware ตรวจสอบ Token
	{	
		// Users
		
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
