package controller

import (
	"log"
	"net/http"
	"sci-park_web-application/services"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

var userPackageResetService = services.NewUserPackageResetService()

// ResetUserPackages รีเซ็ต UserPackage ทั้งหมด
// POST /reset-user-packages
func ResetUserPackages(c *gin.Context) {
	if err := userPackageResetService.ResetUserPackages(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to reset UserPackages",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "UserPackages reset successfully",
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
	})
}

// ResetUserPackagesForYear รีเซ็ต UserPackage สำหรับปีที่กำหนด
// POST /reset-user-packages/:year
func ResetUserPackagesForYear(c *gin.Context) {
	yearStr := c.Param("year")
	year, err := strconv.Atoi(yearStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid year format",
		})
		return
	}

	// ตรวจสอบว่าเป็นปีที่สมเหตุสมผล
	currentYear := time.Now().Year()
	if year < 2020 || year > currentYear+1 {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Year must be between 2020 and " + strconv.Itoa(currentYear+1),
		})
		return
	}

	if err := userPackageResetService.ResetUserPackagesForYear(year); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to reset UserPackages for year " + yearStr,
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "UserPackages reset successfully for year " + yearStr,
		"year":      year,
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
	})
}

// GetUserPackageUsageStats ดึงสถิติการใช้งาน UserPackage
// GET /user-package-usage-stats
func GetUserPackageUsageStats(c *gin.Context) {
	stats, err := userPackageResetService.GetUserPackageUsageStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get usage statistics",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":      stats,
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
	})
}

// TestReset ฟังก์ชันสำหรับทดสอบการรีเซ็ต
// POST /test-reset-user-packages
func TestResetUserPackages(c *gin.Context) {
	// ตรวจสอบว่าเป็น development environment หรือไม่
	// ใน production ควรเพิ่ม authentication/authorization

	log.Println("Test reset UserPackages requested")

	if err := userPackageResetService.ResetUserPackages(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to test reset UserPackages",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Test reset completed successfully",
		"note":      "This is a test reset - all UserPackage usage counts have been reset to 0",
		"timestamp": time.Now().Format("2006-01-02 15:04:05"),
	})
}
