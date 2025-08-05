package controller

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateRequestServiceAreaAndAboutCompany สร้างข้อมูล RequestServiceArea และ AboutCompany พร้อมกัน
func CreateRequestServiceAreaAndAboutCompany(c *gin.Context) {
	// รับ user_id จาก path parameter
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	// ตรวจสอบว่า User มีอยู่จริงหรือไม่
	var user entity.User
	if err := config.DB().First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// สร้าง RequestServiceArea
	requestServiceArea := entity.RequestServiceArea{
		UserID:                             uint(userID),
		PurposeOfUsingSpace:                c.PostForm("purpose_of_using_space"),
		NumberOfEmployees:                  parseInt(c.PostForm("number_of_employees")),
		ActivitiesInBuilding:               c.PostForm("activities_in_building"),
		CollaborationPlan:                  c.PostForm("collaboration_plan"),
		CollaborationBudget:                parseFloat(c.PostForm("collaboration_budget")),
		ProjectDuration:                    c.PostForm("project_duration"),
		SupportingActivitiesForSciencePark: c.PostForm("supporting_activities_for_science_park"),
	}

	// จัดการไฟล์ ServiceRequestDocument
	file, err := c.FormFile("service_request_document")
	if err == nil {
		// สร้างโฟลเดอร์สำหรับเก็บไฟล์
		documentFolder := "./images/ServiceDocuments"
		if _, err := os.Stat(documentFolder); os.IsNotExist(err) {
			err := os.MkdirAll(documentFolder, os.ModePerm)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
				return
			}
		}

		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("service_doc_%d%s", userID, fileExtension))
		requestServiceArea.ServiceRequestDocument = filePath

		// บันทึกไฟล์
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
	}

	// บันทึก RequestServiceArea
	if err := tx.Create(&requestServiceArea).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request service area"})
		return
	}

	// สร้าง AboutCompany
	aboutCompany := entity.AboutCompany{
		UserID:                      uint(userID),
		CorporateRegistrationNumber: c.PostForm("corporate_registration_number"),
		BusinessGroup:               c.PostForm("business_group"),
		CompanySize:                 c.PostForm("company_size"),
		MainServices:                c.PostForm("main_services"),
		RegisteredCapital:           parseInt(c.PostForm("registered_capital")),
		HiringRate:                  parseInt(c.PostForm("hiring_rate")),
		ResearchInvestmentValue:     parseInt(c.PostForm("research_investment_value")),
		ThreeYearGrowthForecast:     c.PostForm("three_year_growth_forecast"),
	}

	// บันทึก AboutCompany
	if err := tx.Create(&aboutCompany).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create about company"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Request service area and about company created successfully",
		"data": gin.H{
			"request_service_area": requestServiceArea,
			"about_company":        aboutCompany,
		},
	})
}

// GetRequestServiceAreaByUserID ดึงข้อมูล RequestServiceArea ของ User
func GetRequestServiceAreaByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	var requestServiceAreas []entity.RequestServiceArea
	if err := config.DB().Where("user_id = ?", userID).Find(&requestServiceAreas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request service areas"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": requestServiceAreas,
	})
}

// GetAboutCompanyByUserID ดึงข้อมูล AboutCompany ของ User
func GetAboutCompanyByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	var aboutCompany entity.AboutCompany
	if err := config.DB().Where("user_id = ?", userID).First(&aboutCompany).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "About company not found for this user"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch about company"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": aboutCompany,
	})
}

// UpdateRequestServiceArea อัปเดตข้อมูล RequestServiceArea
func UpdateRequestServiceArea(c *gin.Context) {
	requestIDStr := c.Param("id")
	requestID, err := strconv.ParseUint(requestIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request id"})
		return
	}

	var requestServiceArea entity.RequestServiceArea
	if err := config.DB().First(&requestServiceArea, requestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request service area not found"})
		return
	}

	// อัปเดตข้อมูล
	if purpose := c.PostForm("purpose_of_using_space"); purpose != "" {
		requestServiceArea.PurposeOfUsingSpace = purpose
	}
	if employees := c.PostForm("number_of_employees"); employees != "" {
		requestServiceArea.NumberOfEmployees = parseInt(employees)
	}
	if activities := c.PostForm("activities_in_building"); activities != "" {
		requestServiceArea.ActivitiesInBuilding = activities
	}
	if plan := c.PostForm("collaboration_plan"); plan != "" {
		requestServiceArea.CollaborationPlan = plan
	}
	if budget := c.PostForm("collaboration_budget"); budget != "" {
		requestServiceArea.CollaborationBudget = parseFloat(budget)
	}
	if duration := c.PostForm("project_duration"); duration != "" {
		requestServiceArea.ProjectDuration = duration
	}
	if activities := c.PostForm("supporting_activities_for_science_park"); activities != "" {
		requestServiceArea.SupportingActivitiesForSciencePark = activities
	}

	// จัดการไฟล์ใหม่ (ถ้ามี)
	file, err := c.FormFile("service_request_document")
	if err == nil {
		documentFolder := "./images/ServiceDocuments"
		if _, err := os.Stat(documentFolder); os.IsNotExist(err) {
			err := os.MkdirAll(documentFolder, os.ModePerm)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
				return
			}
		}

		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("service_doc_%d%s", requestServiceArea.UserID, fileExtension))
		requestServiceArea.ServiceRequestDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
	}

	if err := config.DB().Save(&requestServiceArea).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request service area"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Request service area updated successfully",
		"data":    requestServiceArea,
	})
}

// UpdateAboutCompany อัปเดตข้อมูล AboutCompany
func UpdateAboutCompany(c *gin.Context) {
	userIDStr := c.Param("user_id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	var aboutCompany entity.AboutCompany
	if err := config.DB().Where("user_id = ?", userID).First(&aboutCompany).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "About company not found for this user"})
		return
	}

	// อัปเดตข้อมูล
	if regNumber := c.PostForm("corporate_registration_number"); regNumber != "" {
		aboutCompany.CorporateRegistrationNumber = regNumber
	}
	if businessGroup := c.PostForm("business_group"); businessGroup != "" {
		aboutCompany.BusinessGroup = businessGroup
	}
	if companySize := c.PostForm("company_size"); companySize != "" {
		aboutCompany.CompanySize = companySize
	}
	if mainServices := c.PostForm("main_services"); mainServices != "" {
		aboutCompany.MainServices = mainServices
	}
	if registeredCapital := c.PostForm("registered_capital"); registeredCapital != "" {
		aboutCompany.RegisteredCapital = parseInt(registeredCapital)
	}
	if hiringRate := c.PostForm("hiring_rate"); hiringRate != "" {
		aboutCompany.HiringRate = parseInt(hiringRate)
	}
	if researchInvestment := c.PostForm("research_investment_value"); researchInvestment != "" {
		aboutCompany.ResearchInvestmentValue = parseInt(researchInvestment)
	}
	if growthForecast := c.PostForm("three_year_growth_forecast"); growthForecast != "" {
		aboutCompany.ThreeYearGrowthForecast = growthForecast
	}

	if err := config.DB().Save(&aboutCompany).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update about company"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "About company updated successfully",
		"data":    aboutCompany,
	})
}

// Helper functions
func parseInt(s string) int {
	if s == "" {
		return 0
	}
	i, _ := strconv.Atoi(s)
	return i
}

func parseFloat(s string) float64 {
	if s == "" {
		return 0
	}
	f, _ := strconv.ParseFloat(s, 64)
	return f
}
