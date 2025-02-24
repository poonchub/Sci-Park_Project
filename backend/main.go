package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"sci-park_web-application/config"
	// "sci-park_web-application/app/controller/users"
	"sci-park_web-application/middlewares"
)

const PORT = "8000"

func main() {
	// เปิดการเชื่อมต่อฐานข้อมูล
	config.ConnectionDB()

	// สร้างตารางฐานข้อมูล
	config.SetupDatabase()

	r := gin.Default()
	r.Use(CORSMiddleware())

	// Auth Routes
	// r.POST("/signup", users.SignUp)
	// r.POST("/signin", users.SignIn)

	// Protected Routes
	router := r.Group("/")
	router.Use(middlewares.Authorizes())
	{
		// router.PUT("/user/:id", users.Update)
		// router.GET("/users", users.GetAll)
		// router.GET("/user/:id", users.Get)
		// router.DELETE("/user/:id", users.Delete)
	}

	// Root Route
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// Run the server
	r.Run("localhost:" + PORT)
}

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
