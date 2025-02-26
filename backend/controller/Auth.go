package controller

import (
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"sci-park_web-application/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

// UserLogin เป็นฟังก์ชันสำหรับให้ User เข้าสู่ระบบ
func UserLogin(c *gin.Context) {
	var loginData struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	// Bind JSON input ไปที่ loginData
	if err := c.ShouldBindJSON(&loginData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"Error": "Invalid input"})
		return
	}

	// เชื่อมต่อฐานข้อมูล
	db := config.DB()
	var user entity.User

	// ค้นหา User จาก Email และโหลด Role
	if err := db.Preload("Role").Where("email = ?", loginData.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "Incorrect email or password"})
		return
	}

	// ตรวจสอบรหัสผ่าน
	if !config.CheckPasswordHash([]byte(loginData.Password), []byte(user.Password)) {
		c.JSON(http.StatusUnauthorized, gin.H{"Error": "Incorrect email or password"})
		return
	}

	// ถ้า Role เป็น `None` หรือไม่มีสิทธิ์เข้าใช้งาน
	if user.Role.Name == "None" {
		c.JSON(http.StatusOK, gin.H{
			"Role": "None",
		})
		return
	}

	// ตั้งค่า JWT Token
	jwtWrapper := services.JwtWrapper{
		SecretKey:       config.GetSecretKey(), // ใช้คีย์จาก config
		Issuer:          "AuthService",
		ExpirationHours: 24,  // หมดอายุใน 24 ชั่วโมง
	}

	// สร้าง Token
	tokenString, err := jwtWrapper.GenerateToken(user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"Error": "Could not generate token"})
		return
	}

	// ส่งข้อมูล User กลับ โดยใช้ PascalCase
	c.JSON(http.StatusOK, gin.H{
		"ID":             user.ID,
		"CompanyName":    user.CompanyName,
		"BusinessDetail": user.BusinessDetail,
		"FirstName":      user.FirstName,
		"LastName":       user.LastName,
		"Email":          user.Email,
		"Phone":          user.Phone,
		"ProfilePath":    user.ProfilePath,
		"UserPackageID":  user.UserPackageID,
		"RoleID":         user.RoleID,
		"Role":           user.Role.Name,
		"Token":          tokenString,
	})
}
