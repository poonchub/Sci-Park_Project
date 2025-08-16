package controller

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// CreateRequestServiceAreaAndAboutCompany สร้างข้อมูล RequestServiceArea และ AboutCompany พร้อมกัน
func CreateRequestServiceAreaAndAboutCompany(c *gin.Context) {
	fmt.Println("=== CreateRequestServiceAreaAndAboutCompany called ===")

	// รับ user_id จาก path parameter
	userIDStr := c.Param("user_id")
	fmt.Printf("User ID from param: %s\n", userIDStr)

	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		fmt.Printf("Error parsing user_id: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}
	fmt.Printf("Parsed User ID: %d\n", userID)

	// ตรวจสอบว่า User มีอยู่จริงหรือไม่
	fmt.Println("Checking if user exists...")
	var user entity.User
	if err := config.DB().First(&user, userID).Error; err != nil {
		fmt.Printf("User not found error: %v\n", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	fmt.Printf("User found: %s %s\n", user.FirstName, user.LastName)

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// ===== REQUEST SERVICE AREA =====
	fmt.Println("Creating RequestServiceArea...")
	fmt.Printf("Purpose: %s\n", c.PostForm("purpose_of_using_space"))
	fmt.Printf("Employees: %s\n", c.PostForm("number_of_employees"))
	fmt.Printf("Activities: %s\n", c.PostForm("activities_in_building"))
	fmt.Printf("Plan: %s\n", c.PostForm("collaboration_plan"))
	fmt.Printf("Budget: %s\n", c.PostForm("collaboration_budget"))
	fmt.Printf("Start Date: %s\n", c.PostForm("project_start_date"))
	fmt.Printf("End Date: %s\n", c.PostForm("project_end_date"))
	fmt.Printf("Supporting Activities: %s\n", c.PostForm("supporting_activities_for_science_park"))

	// สร้าง RequestServiceArea ใหม่เสมอ
	requestServiceArea := entity.RequestServiceArea{
		UserID:                             uint(userID),
		RequestStatusID:                    2, // Status เริ่มต้นเป็น ID 2
		PurposeOfUsingSpace:                c.PostForm("purpose_of_using_space"),
		NumberOfEmployees:                  parseInt(c.PostForm("number_of_employees")),
		ActivitiesInBuilding:               c.PostForm("activities_in_building"),
		SupportingActivitiesForSciencePark: c.PostForm("supporting_activities_for_science_park"),
	}

	// บันทึก RequestServiceArea (สร้างใหม่เสมอ) ก่อนเพื่อได้ ID
	fmt.Println("Saving RequestServiceArea to database...")
	if err := tx.Create(&requestServiceArea).Error; err != nil {
		fmt.Printf("Error creating RequestServiceArea: %v\n", err)
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request service area"})
		return
	}
	fmt.Printf("RequestServiceArea created with ID: %d\n", requestServiceArea.ID)

	// ===== COLLABORATION PLANS =====
	// รับข้อมูล Collaboration Plans จาก form array
	collaborationPlans := c.PostFormArray("collaboration_plan[]")
	collaborationBudgets := c.PostFormArray("collaboration_budgets[]")
	projectStartDates := c.PostFormArray("project_start_dates[]")

	fmt.Printf("Received %d collaboration plans\n", len(collaborationPlans))
	fmt.Printf("Collaboration plans: %v\n", collaborationPlans)
	fmt.Printf("Collaboration budgets: %v\n", collaborationBudgets)
	fmt.Printf("Project start dates: %v\n", projectStartDates)

	// Debug: ตรวจสอบข้อมูลทั้งหมดที่ส่งมา
	fmt.Println("=== All form data ===")
	for key, values := range c.Request.PostForm {
		fmt.Printf("%s: %v\n", key, values)
	}
	fmt.Println("=== End form data ===")

	// สร้าง CollaborationPlan สำหรับแต่ละ index
	for i := 0; i < len(collaborationPlans); i++ {
		fmt.Printf("Processing collaboration plan %d: %s\n", i+1, collaborationPlans[i])
		if collaborationPlans[i] != "" {
			// ตรวจสอบว่าข้อมูล budget และ date มีอยู่หรือไม่
			var budget float64
			var startDate time.Time

			if i < len(collaborationBudgets) {
				budget = parseFloat(collaborationBudgets[i])
			}

			if i < len(projectStartDates) {
				startDate = parseDate(projectStartDates[i])
			}

			collaborationPlan := entity.CollaborationPlan{
				RequestServiceAreaID: requestServiceArea.ID,
				CollaborationPlan:    collaborationPlans[i],
				CollaborationBudget:  budget,
				ProjectStartDate:     startDate,
			}

			fmt.Printf("Creating collaboration plan: %+v\n", collaborationPlan)

			if err := tx.Create(&collaborationPlan).Error; err != nil {
				fmt.Printf("Error creating CollaborationPlan %d: %v\n", i+1, err)
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create collaboration plan %d", i+1)})
				return
			}
			fmt.Printf("CollaborationPlan %d created with ID: %d\n", i+1, collaborationPlan.ID)
		} else {
			fmt.Printf("Skipping empty collaboration plan %d\n", i+1)
		}
	}

	// จัดการไฟล์ ServiceRequestDocument (หลังจากได้ Request ID แล้ว)
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
		// ใช้ UserID + RequestID เพื่อป้องกันไฟล์ซ้ำ
		filePath := path.Join(documentFolder, fmt.Sprintf("service_doc_%d_%d%s", userID, requestServiceArea.ID, fileExtension))
		requestServiceArea.ServiceRequestDocument = filePath

		// บันทึกไฟล์
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}

		// อัพเดท path ในฐานข้อมูล
		if err := tx.Save(&requestServiceArea).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update file path"})
			return
		}
	}

	// ===== ABOUT COMPANY =====
	// แปลง BusinessGroupID และ CompanySizeID
	var businessGroupID *uint
	if businessGroupIDStr := c.PostForm("business_group_id"); businessGroupIDStr != "" {
		if id, err := strconv.ParseUint(businessGroupIDStr, 10, 32); err == nil {
			tempID := uint(id)
			businessGroupID = &tempID
		}
	}

	var companySizeID *uint
	if companySizeIDStr := c.PostForm("company_size_id"); companySizeIDStr != "" {
		if id, err := strconv.ParseUint(companySizeIDStr, 10, 32); err == nil {
			tempID := uint(id)
			companySizeID = &tempID
		}
	}

	// ตรวจสอบว่า AboutCompany มีอยู่แล้วหรือไม่
	var existingAboutCompany entity.AboutCompany
	var isUpdate bool
	if err := tx.Where("user_id = ?", userID).First(&existingAboutCompany).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// ไม่มีอยู่ → สร้างใหม่
			isUpdate = false
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing about company"})
			return
		}
	} else {
		// มีอยู่แล้ว → อัพเดท
		isUpdate = true
	}

	if isUpdate {
		// อัพเดท AboutCompany ที่มีอยู่
		existingAboutCompany.CorporateRegistrationNumber = c.PostForm("corporate_registration_number")
		existingAboutCompany.BusinessGroupID = businessGroupID
		existingAboutCompany.CompanySizeID = companySizeID
		existingAboutCompany.MainServices = c.PostForm("main_services")
		existingAboutCompany.RegisteredCapital = parseFloat(c.PostForm("registered_capital"))
		existingAboutCompany.HiringRate = parseInt(c.PostForm("hiring_rate"))
		existingAboutCompany.ResearchInvestmentValue = parseFloat(c.PostForm("research_investment_value"))
		existingAboutCompany.ThreeYearGrowthForecast = c.PostForm("three_year_growth_forecast")

		if err := tx.Save(&existingAboutCompany).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update about company"})
			return
		}
	} else {
		// สร้าง AboutCompany ใหม่
		newAboutCompany := entity.AboutCompany{
			UserID:                      uint(userID),
			CorporateRegistrationNumber: c.PostForm("corporate_registration_number"),
			BusinessGroupID:             businessGroupID,
			CompanySizeID:               companySizeID,
			MainServices:                c.PostForm("main_services"),
			RegisteredCapital:           parseFloat(c.PostForm("registered_capital")),
			HiringRate:                  parseInt(c.PostForm("hiring_rate")),
			ResearchInvestmentValue:     parseFloat(c.PostForm("research_investment_value")),
			ThreeYearGrowthForecast:     c.PostForm("three_year_growth_forecast"),
		}

		if err := tx.Create(&newAboutCompany).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create about company"})
			return
		}
		existingAboutCompany = newAboutCompany
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	action := "created"
	if isUpdate {
		action = "updated"
	}

	fmt.Printf("=== Success: Request service area created and about company %s ===\n", action)
	fmt.Printf("RequestServiceArea ID: %d\n", requestServiceArea.ID)
	fmt.Printf("AboutCompany action: %s\n", action)

	// โหลด CollaborationPlans ที่เพิ่งสร้าง
	var loadedCollaborationPlans []entity.CollaborationPlan
	if err := config.DB().Where("request_service_area_id = ?", requestServiceArea.ID).Find(&loadedCollaborationPlans).Error; err != nil {
		fmt.Printf("Error loading collaboration plans: %v\n", err)
	}

	fmt.Printf("Loaded %d collaboration plans from database\n", len(loadedCollaborationPlans))
	for i, plan := range loadedCollaborationPlans {
		fmt.Printf("CollaborationPlan %d: ID=%d, Plan=%s, Budget=%.2f, StartDate=%s\n",
			i+1, plan.ID, plan.CollaborationPlan, plan.CollaborationBudget, plan.ProjectStartDate.Format("2006-01-02"))
	}

	// อัปเดต requestServiceArea ให้มี CollaborationPlans
	requestServiceArea.CollaborationPlans = loadedCollaborationPlans

	c.JSON(http.StatusCreated, gin.H{
		"message": fmt.Sprintf("Request service area created and about company %s successfully", action),
		"data": gin.H{
			"request_service_area": requestServiceArea,
			"about_company":        existingAboutCompany,
			"about_company_action": action,
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
	if err := config.DB().Preload("RequestStatus").Preload("CollaborationPlans").Where("user_id = ?", userID).Find(&requestServiceAreas).Error; err != nil {
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
	if err := config.DB().Preload("BusinessGroup").Preload("CompanySize").Where("user_id = ?", userID).First(&aboutCompany).Error; err != nil {
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
	if requestStatusIDStr := c.PostForm("request_status_id"); requestStatusIDStr != "" {
		if requestStatusID, err := strconv.ParseUint(requestStatusIDStr, 10, 32); err == nil {
			requestServiceArea.RequestStatusID = uint(requestStatusID)
		}
	}
	if purpose := c.PostForm("purpose_of_using_space"); purpose != "" {
		requestServiceArea.PurposeOfUsingSpace = purpose
	}
	if employees := c.PostForm("number_of_employees"); employees != "" {
		requestServiceArea.NumberOfEmployees = parseInt(employees)
	}
	if activities := c.PostForm("activities_in_building"); activities != "" {
		requestServiceArea.ActivitiesInBuilding = activities
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

	// อัปเดต CollaborationPlans (ถ้ามีการส่งมา)
	collaborationPlans := c.PostFormArray("collaboration_plans[]")
	collaborationBudgets := c.PostFormArray("collaboration_budgets[]")
	projectStartDates := c.PostFormArray("project_start_dates[]")

	if len(collaborationPlans) > 0 {
		// ลบ CollaborationPlans เดิม
		if err := config.DB().Where("request_service_area_id = ?", requestServiceArea.ID).Delete(&entity.CollaborationPlan{}).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing collaboration plans"})
			return
		}

		// สร้าง CollaborationPlans ใหม่
		for i := 0; i < len(collaborationPlans); i++ {
			if collaborationPlans[i] != "" {
				collaborationPlan := entity.CollaborationPlan{
					RequestServiceAreaID: requestServiceArea.ID,
					CollaborationPlan:    collaborationPlans[i],
					CollaborationBudget:  parseFloat(collaborationBudgets[i]),
					ProjectStartDate:     parseDate(projectStartDates[i]),
				}

				if err := config.DB().Create(&collaborationPlan).Error; err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to create collaboration plan %d", i+1)})
					return
				}
			}
		}
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
	if businessGroupIDStr := c.PostForm("business_group_id"); businessGroupIDStr != "" {
		if id, err := strconv.ParseUint(businessGroupIDStr, 10, 32); err == nil {
			tempID := uint(id)
			aboutCompany.BusinessGroupID = &tempID
		}
	}
	if companySizeIDStr := c.PostForm("company_size_id"); companySizeIDStr != "" {
		if id, err := strconv.ParseUint(companySizeIDStr, 10, 32); err == nil {
			tempID := uint(id)
			aboutCompany.CompanySizeID = &tempID
		}
	}
	if mainServices := c.PostForm("main_services"); mainServices != "" {
		aboutCompany.MainServices = mainServices
	}
	if registeredCapital := c.PostForm("registered_capital"); registeredCapital != "" {
		aboutCompany.RegisteredCapital = parseFloat(registeredCapital)
	}
	if hiringRate := c.PostForm("hiring_rate"); hiringRate != "" {
		aboutCompany.HiringRate = parseInt(hiringRate)
	}
	if researchInvestment := c.PostForm("research_investment_value"); researchInvestment != "" {
		aboutCompany.ResearchInvestmentValue = parseFloat(researchInvestment)
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

// ListRequestServiceAreas ดึงรายการ Request Service Area ทั้งหมดพร้อม pagination และ filtering
func ListRequestServiceAreas(c *gin.Context) {
	var requestServiceAreas []entity.RequestServiceArea

	// รับค่าจาก Query Parameters
	requestStatusID, _ := strconv.Atoi(c.DefaultQuery("request_status_id", "0"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	search := c.DefaultQuery("search", "")        // รับค่า search จาก query parameter
	createdAt := c.DefaultQuery("created_at", "") // รับค่า created_at จาก query parameter

	// ตรวจสอบค่าที่ส่งมา
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// เชื่อมต่อกับฐานข้อมูล
	db := config.DB()

	// การกรองตาม request_status_id (ถ้ามีค่า)
	if requestStatusID > 0 {
		db = db.Where("request_status_id = ?", requestStatusID)
	}

	// การกรองตาม search (ถ้ามีค่า) - ค้นหาจากชื่อ User
	if search != "" {
		searchTerm := "%" + search + "%"
		db = db.Joins("JOIN users ON users.id = request_service_areas.user_id").
			Where("(users.first_name LIKE ? OR users.last_name LIKE ? OR users.email LIKE ? OR users.company_name LIKE ?)",
				searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// การกรองตาม created_at (ถ้ามีค่า)
	if createdAt != "" {
		// คาดหวังรูปแบบ YYYY-MM-DD
		db = db.Where("DATE(request_service_areas.created_at) = ?", createdAt)
	}

	// ดึงข้อมูล Request Service Area จากฐานข้อมูล
	query := db.Preload("User").Preload("RequestStatus").Preload("CollaborationPlans")

	// แก้ไขการ ORDER โดยใช้ `request_service_areas.created_at` เพื่อระบุคอลัมน์ที่มาจากตาราง `request_service_areas`
	if err := query.Order("request_service_areas.created_at DESC").Limit(limit).Offset(offset).Find(&requestServiceAreas).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request service areas"})
		return
	}

	// คำนวณจำนวนทั้งหมดแยกออกจาก Query หลัก
	var total int64
	countQuery := config.DB().Model(&entity.RequestServiceArea{})

	if requestStatusID > 0 {
		countQuery = countQuery.Where("request_status_id = ?", requestStatusID)
	}

	// การกรองตาม search สำหรับ count query (ถ้ามีค่า)
	if search != "" {
		searchTerm := "%" + search + "%"
		countQuery = countQuery.Joins("JOIN users ON users.id = request_service_areas.user_id").
			Where("(users.first_name LIKE ? OR users.last_name LIKE ? OR users.email LIKE ? OR users.company_name LIKE ?)",
				searchTerm, searchTerm, searchTerm, searchTerm)
	}

	// การกรองตาม created_at สำหรับ count query (ถ้ามีค่า)
	if createdAt != "" {
		countQuery = countQuery.Where("DATE(request_service_areas.created_at) = ?", createdAt)
	}

	countQuery.Count(&total)

	// จัดรูปแบบข้อมูลที่ส่งกลับให้เป็น PascalCase
	var requestServiceAreaResponses []map[string]interface{}
	for _, requestServiceArea := range requestServiceAreas {
		requestServiceAreaResponse := map[string]interface{}{
			"ID":                                 requestServiceArea.ID,
			"UserID":                             requestServiceArea.UserID,
			"RequestStatusID":                    requestServiceArea.RequestStatusID,
			"PurposeOfUsingSpace":                requestServiceArea.PurposeOfUsingSpace,
			"NumberOfEmployees":                  requestServiceArea.NumberOfEmployees,
			"ActivitiesInBuilding":               requestServiceArea.ActivitiesInBuilding,
			"SupportingActivitiesForSciencePark": requestServiceArea.SupportingActivitiesForSciencePark,
			"ServiceRequestDocument":             requestServiceArea.ServiceRequestDocument,
			"CreatedAt":                          requestServiceArea.CreatedAt,
			"UpdatedAt":                          requestServiceArea.UpdatedAt,
			"DeletedAt":                          requestServiceArea.DeletedAt,
		}

		// เพิ่มข้อมูล User
		if requestServiceArea.User.ID != 0 {
			requestServiceAreaResponse["User"] = map[string]interface{}{
				"ID":          requestServiceArea.User.ID,
				"FirstName":   requestServiceArea.User.FirstName,
				"LastName":    requestServiceArea.User.LastName,
				"Email":       requestServiceArea.User.Email,
				"CompanyName": requestServiceArea.User.CompanyName,
				"EmployeeID":  requestServiceArea.User.EmployeeID,
				"IsEmployee":  requestServiceArea.User.IsEmployee,
			}
		}

		// เพิ่มข้อมูล RequestStatus
		if requestServiceArea.RequestStatus.ID != 0 {
			requestServiceAreaResponse["RequestStatus"] = map[string]interface{}{
				"ID":   requestServiceArea.RequestStatus.ID,
				"Name": requestServiceArea.RequestStatus.Name,
			}
		}

		// เพิ่มข้อมูล CollaborationPlans
		if len(requestServiceArea.CollaborationPlans) > 0 {
			var collaborationPlans []map[string]interface{}
			for _, plan := range requestServiceArea.CollaborationPlans {
				collaborationPlan := map[string]interface{}{
					"ID":                  plan.ID,
					"CollaborationPlan":   plan.CollaborationPlan,
					"CollaborationBudget": plan.CollaborationBudget,
					"ProjectStartDate":    plan.ProjectStartDate,
				}
				collaborationPlans = append(collaborationPlans, collaborationPlan)
			}
			requestServiceAreaResponse["CollaborationPlans"] = collaborationPlans
		}

		requestServiceAreaResponses = append(requestServiceAreaResponses, requestServiceAreaResponse)
	}

	// ส่งข้อมูล Request Service Area ทั้งหมดกลับไปในรูปแบบ JSON
	c.JSON(http.StatusOK, gin.H{
		"data":       requestServiceAreaResponses,
		"page":       page,
		"limit":      limit,
		"total":      total,
		"totalPages": (total + int64(limit) - 1) / int64(limit), // คำนวณจำนวนหน้าทั้งหมด
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

func parseDate(s string) time.Time {
	if s == "" {
		return time.Time{}
	}
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}
	}
	return t
}
