package middlewares

import (
	"net/http"
	"strings"

	"sci-park_web-application/config"
	"sci-park_web-application/services"
	"github.com/gin-gonic/gin"
)

// Role levels for comparison
const (
	Outsider   = 1
	Enterprise = 2
	Employee   = 3
	Manager    = 4
	Operator  = 4  // ผู้ใช้งานที่มีระดับเดียวกับ Manager
	Admin      = 5
	SuperAdmin = 6
)

// Authorization เป็นฟังก์ชั่นตรวจเช็ค JWT และตรวจสอบบทบาท (role) ตามระดับ
func Authorizes(roleLevel int) gin.HandlerFunc {
	return func(c *gin.Context) {
		clientToken := c.Request.Header.Get("Authorization")
		if clientToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No Authorization header provided"})
			return
		}

		extractedToken := strings.Split(clientToken, "Bearer ")

		if len(extractedToken) == 2 {
			clientToken = strings.TrimSpace(extractedToken[1])
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Incorrect Format of Authorization Token"})
			return
		}

		// สร้าง jwtWrapper สำหรับตรวจสอบโทเค็น
		jwtWrapper := services.JwtWrapper{
			SecretKey: config.GetSecretKey(),
			Issuer:    "AuthService",
		}

		// Validate token
		claims, err := jwtWrapper.ValidateToken(clientToken)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}

		// เปรียบเทียบ Role ระดับของผู้ใช้
		role := claims.Role // role ที่ได้จาก JWT
		roleLevelUser := getRoleLevel(role)

		// ตรวจสอบว่า role ของผู้ใช้มีระดับเท่ากับหรือสูงกว่าระดับที่กำหนด
		if roleLevelUser < roleLevel {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			return
		}

		// เก็บข้อมูล user_id และ role ลงใน context
		c.Set("user_id", claims.Id)
		c.Set("user_role", claims.Role)
		c.Next()
	}
}

// ฟังก์ชั่นสำหรับแปลง role string เป็นระดับ
func getRoleLevel(role string) int {
	switch role {
	case "SuperAdmin":
		return SuperAdmin
	case "Admin":
		return Admin
	case "Enterprise":
		return Enterprise
	case "Employee":
		return Employee
	case "Manager":
		return Manager
	case "Operator":
		return Operator
	case "Outsider":
		return Outsider
	default:
		return 0 // ถ้า role ไม่ถูกกำหนดให้กลับ 0
	}
}
