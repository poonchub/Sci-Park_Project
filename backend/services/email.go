package services

import (
	"fmt"
	"net/smtp"
	"os"
	"github.com/joho/godotenv"
)

// SendEmail ส่งอีเมลด้วย Gmail SMTP
func SendEmail(to, subject, body string) error {

	err1 := godotenv.Load()
	if err1 != nil {
		fmt.Println("Error loading .env file:", err1)
		return err1
	}
	// ข้อมูล SMTP Server
	from := os.Getenv("EMAIL_USER")
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	// เนื้อหาอีเมลพร้อม Header สำหรับ HTML
	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" + // ระบุว่าเป็น HTML
		"\r\n" +
		body + "\r\n")

	// Authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// ส่งอีเมล
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, []string{to}, msg)
	if err != nil {
		fmt.Println("Failed to send email:", err)
		return err
	}

	fmt.Println("Email sent successfully to:", to)
	return nil
}