package controller

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

// UpdateCancelRequestServiceArea อัปเดต CancelRequestServiceArea สำหรับการแก้ไข
func UpdateCancelRequestServiceArea(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	// ตรวจสอบว่า CancelRequestServiceArea มีอยู่หรือไม่
	var existingCancelRequest entity.CancelRequestServiceArea
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&existingCancelRequest).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cancellation request not found"})
		return
	}

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// อัปเดตข้อมูลพื้นฐาน
	updateData := entity.CancelRequestServiceArea{}

	// Cancellation Information
	if purposeOfCancellation := c.PostForm("purpose_of_cancellation"); purposeOfCancellation != "" {
		updateData.PurposeOfCancellation = purposeOfCancellation
	}
	if projectActivities := c.PostForm("project_activities"); projectActivities != "" {
		updateData.ProjectActivities = projectActivities
	}
	if annualIncomeStr := c.PostForm("annual_income"); annualIncomeStr != "" {
		if annualIncome, err := strconv.ParseFloat(annualIncomeStr, 64); err == nil {
			updateData.AnnualIncome = annualIncome
		}
	}

	// จัดการไฟล์เอกสาร
	documentFields := map[string]string{
		"cancellation_document": "CancellationDocument",
		"bank_account_document": "BankAccountDocument",
	}

	for formField, structField := range documentFields {
		if file, err := c.FormFile(formField); err == nil && file != nil {
			// ลบไฟล์เก่า (ถ้ามี)
			oldPath := getCancelRequestFieldValue(&existingCancelRequest, structField)
			if oldPath != "" {
				deleteOldFile(oldPath)
			}

			// สร้างโฟลเดอร์ใหม่ (ใช้รูปแบบเดียวกับตอนสร้าง)
			uploadDir := fmt.Sprintf("./images/ServiceAreaDocuments/request_%d", uint(requestServiceAreaID))
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
				return
			}

			// สร้างชื่อไฟล์ใหม่ โดยใช้ชื่อไฟล์เดิมที่อัพโหลดมา
			// ใช้ timestamp เพื่อป้องกันการชนกันของชื่อไฟล์
			fileExt := filepath.Ext(file.Filename)
			baseName := filepath.Base(file.Filename)
			// ลบ extension ออกจาก base name
			baseNameWithoutExt := baseName[:len(baseName)-len(fileExt)]
			// สร้างชื่อไฟล์ใหม่: originalname_timestamp.extension
			newFileName := fmt.Sprintf("%s_%d%s", baseNameWithoutExt, time.Now().Unix(), fileExt)
			filePath := filepath.Join(uploadDir, newFileName)

			// บันทึกไฟล์ใหม่
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded file"})
				return
			}

			// แปลง path separator เป็น forward slash สำหรับ cross-platform compatibility
			normalizedPath := filepath.ToSlash(filePath)

			// อัปเดต path ในฐานข้อมูล
			setCancelRequestFieldValue(&updateData, structField, normalizedPath)
		}
	}

	// จัดการไฟล์ RefundGuaranteeDocument (มาจาก ServiceAreaDocument)
	if file, err := c.FormFile("refund_guarantee_document"); err == nil && file != nil {
		// ดึงข้อมูล ServiceAreaDocument
		var serviceAreaDocument entity.ServiceAreaDocument
		if err := tx.Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&serviceAreaDocument).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service area document"})
			return
		}

		// ลบไฟล์เก่า (ถ้ามี)
		if serviceAreaDocument.RefundGuaranteeDocument != "" {
			deleteOldFile(serviceAreaDocument.RefundGuaranteeDocument)
		}

		// สร้างโฟลเดอร์ใหม่ (ใช้รูปแบบเดียวกับตอนสร้าง)
		uploadDir := fmt.Sprintf("./images/ServiceAreaDocuments/request_%d", uint(requestServiceAreaID))
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// สร้างชื่อไฟล์ใหม่
		fileExt := filepath.Ext(file.Filename)
		baseName := filepath.Base(file.Filename)
		baseNameWithoutExt := baseName[:len(baseName)-len(fileExt)]
		newFileName := fmt.Sprintf("%s_%d%s", baseNameWithoutExt, time.Now().Unix(), fileExt)
		filePath := filepath.Join(uploadDir, newFileName)

		// บันทึกไฟล์ใหม่
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded file"})
			return
		}

		// แปลง path separator เป็น forward slash
		normalizedPath := filepath.ToSlash(filePath)

		// อัปเดต RefundGuaranteeDocument ใน ServiceAreaDocument
		if err := tx.Model(&serviceAreaDocument).Update("refund_guarantee_document", normalizedPath).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update refund guarantee document"})
			return
		}
	}

	// อัปเดตข้อมูลในฐานข้อมูล
	if err := tx.Model(&existingCancelRequest).Updates(updateData).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cancellation request"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update cancellation request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Cancellation details updated successfully",
		"data":    existingCancelRequest,
	})
}

// getCancelRequestFieldValue ดึงค่าจาก field ของ CancelRequestServiceArea struct
func getCancelRequestFieldValue(cancelRequest *entity.CancelRequestServiceArea, fieldName string) string {
	switch fieldName {
	case "CancellationDocument":
		return cancelRequest.CancellationDocument
	case "BankAccountDocument":
		return cancelRequest.BankAccountDocument
	default:
		return ""
	}
}

// setCancelRequestFieldValue ตั้งค่า field ของ CancelRequestServiceArea struct
func setCancelRequestFieldValue(cancelRequest *entity.CancelRequestServiceArea, fieldName, value string) {
	switch fieldName {
	case "CancellationDocument":
		cancelRequest.CancellationDocument = value
	case "BankAccountDocument":
		cancelRequest.BankAccountDocument = value
	}
}

// GetCancelRequestServiceAreaForEdit ดึงข้อมูล CancelRequestServiceArea สำหรับการแก้ไข
func GetCancelRequestServiceAreaForEdit(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	var cancelRequest entity.CancelRequestServiceArea
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&cancelRequest).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Cancellation request not found"})
		return
	}

	// ดึงข้อมูล ServiceAreaDocument เพื่อเอา RefundGuaranteeDocument
	var serviceAreaDocument entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&serviceAreaDocument).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service area document"})
		return
	}

	response := gin.H{
		"ID":                      cancelRequest.ID,
		"RequestServiceAreaID":    cancelRequest.RequestServiceAreaID,
		"PurposeOfCancellation":   cancelRequest.PurposeOfCancellation,
		"ProjectActivities":       cancelRequest.ProjectActivities,
		"AnnualIncome":            cancelRequest.AnnualIncome,
		"CancellationDocument":    cancelRequest.CancellationDocument,
		"BankAccountDocument":     cancelRequest.BankAccountDocument,
		"RefundGuaranteeDocument": serviceAreaDocument.RefundGuaranteeDocument,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}
