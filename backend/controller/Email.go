package controller

import (
	"net/http"
	"sci-park_web-application/services" // ให้ระบุ path ที่ถูกต้องที่เก็บฟังก์ชัน SendEmail
	"github.com/gin-gonic/gin"
)

// RequestPayload สำหรับรับข้อมูล JSON จากผู้ใช้
type RequestPayload struct {
	Email string `json:"email" binding:"required"`
}

// SendEmailController ฟังก์ชันสำหรับรับอีเมลจาก JSON และส่งอีเมลไปยังอีเมลนั้น
func SendEmailController(c *gin.Context) {
	var payload RequestPayload
	// Binding JSON ที่ได้รับจากคำขอ
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "กรุณากรอกอีเมลให้ถูกต้อง"})
		return
	}

	// สร้างเนื้อหาของอีเมล
	subject := "ทดสอบการส่งอีเมลจาก Go"
	body := `<h1>สวัสดีค่ะ!</h1><p>นี่คือลองส่งอีเมลจาก Go โดยใช้ SMTP ของ Gmail</p>`

	// เรียกใช้ฟังก์ชัน SendEmail จาก services
	err := services.SendEmail(payload.Email, subject, body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ไม่สามารถส่งอีเมลได้"})
		return
	}

	// ส่ง response กลับ
	c.JSON(http.StatusOK, gin.H{"message": "อีเมลถูกส่งไปยัง " + payload.Email})
}
