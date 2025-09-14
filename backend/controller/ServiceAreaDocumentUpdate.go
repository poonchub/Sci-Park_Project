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
	"gorm.io/gorm"
)

// UpdateServiceAreaDocumentForEdit อัปเดต ServiceAreaDocument สำหรับการแก้ไข
func UpdateServiceAreaDocumentForEdit(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	// ตรวจสอบว่า ServiceAreaDocument มีอยู่หรือไม่
	var existingDoc entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&existingDoc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
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
	updateData := entity.ServiceAreaDocument{}

	// Contract Information
	if contractNumber := c.PostForm("contract_number"); contractNumber != "" {
		updateData.ContractNumber = contractNumber
	}
	if finalContractNumber := c.PostForm("final_contract_number"); finalContractNumber != "" {
		updateData.FinalContractNumber = finalContractNumber
	}
	if contractStartAt := c.PostForm("contract_start_at"); contractStartAt != "" {
		if startDate, err := time.Parse("2006-01-02", contractStartAt); err == nil {
			updateData.ContractStartAt = startDate
		}
	}
	if contractEndAt := c.PostForm("contract_end_at"); contractEndAt != "" {
		if endDate, err := time.Parse("2006-01-02", contractEndAt); err == nil {
			updateData.ContractEndAt = endDate
		}
	}

	// Room and Service Information
	var newRoomID uint
	if roomIDStr := c.PostForm("room_id"); roomIDStr != "" {
		if roomID, err := strconv.ParseUint(roomIDStr, 10, 32); err == nil {
			newRoomID = uint(roomID)
			updateData.RoomID = newRoomID
		}
	}
	if serviceUserTypeIDStr := c.PostForm("service_user_type_id"); serviceUserTypeIDStr != "" {
		if serviceUserTypeID, err := strconv.ParseUint(serviceUserTypeIDStr, 10, 32); err == nil {
			updateData.ServiceUserTypeID = uint(serviceUserTypeID)
		}
	}

	// จัดการไฟล์เอกสาร
	documentFields := map[string]string{
		"service_contract_document": "ServiceContractDocument",
		"area_handover_document":    "AreaHandoverDocument",
		"quotation_document":        "QuotationDocument",
		"refund_guarantee_document": "RefundGuaranteeDocument",
	}

	for formField, structField := range documentFields {
		if file, err := c.FormFile(formField); err == nil && file != nil {
			// ลบไฟล์เก่า (ถ้ามี)
			oldPath := getFieldValue(&existingDoc, structField)
			if oldPath != "" {
				deleteOldFile(oldPath)
			}

			// สร้างโฟลเดอร์ใหม่
			uploadDir := fmt.Sprintf("./images/ServiceAreaDocuments/%d", uint(requestServiceAreaID))
			if err := os.MkdirAll(uploadDir, 0755); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
				return
			}

			// สร้างชื่อไฟล์ใหม่
			fileExt := filepath.Ext(file.Filename)
			newFileName := fmt.Sprintf("%s_%d%s", formField, time.Now().Unix(), fileExt)
			filePath := filepath.Join(uploadDir, newFileName)

			// บันทึกไฟล์ใหม่
			if err := c.SaveUploadedFile(file, filePath); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded file"})
				return
			}

			// อัปเดต path ในฐานข้อมูล
			setFieldValue(&updateData, structField, filePath)
		}
	}

	// จัดการการเปลี่ยนสถานะห้อง (ถ้ามีการเปลี่ยนห้อง)
	if newRoomID != 0 && newRoomID != existingDoc.RoomID {
		// ปลดล็อคห้องเก่า (เปลี่ยนจาก unavailable เป็น available)
		if existingDoc.RoomID != 0 {
			if err := updateRoomStatus(tx, existingDoc.RoomID, "available"); err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlock old room"})
				return
			}
		}

		// ล็อคห้องใหม่ (เปลี่ยนจาก available เป็น unavailable)
		if err := updateRoomStatus(tx, newRoomID, "unavailable"); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock new room"})
			return
		}
	}

	// อัปเดตข้อมูลในฐานข้อมูล
	if err := tx.Model(&existingDoc).Updates(updateData).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service area document"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service area document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service area document updated successfully",
		"data":    existingDoc,
	})
}

// getFieldValue ดึงค่าจาก field ของ struct โดยใช้ reflection
func getFieldValue(doc *entity.ServiceAreaDocument, fieldName string) string {
	switch fieldName {
	case "ServiceContractDocument":
		return doc.ServiceContractDocument
	case "AreaHandoverDocument":
		return doc.AreaHandoverDocument
	case "QuotationDocument":
		return doc.QuotationDocument
	case "RefundGuaranteeDocument":
		return doc.RefundGuaranteeDocument
	default:
		return ""
	}
}

// setFieldValue ตั้งค่า field ของ struct โดยใช้ reflection
func setFieldValue(doc *entity.ServiceAreaDocument, fieldName, value string) {
	switch fieldName {
	case "ServiceContractDocument":
		doc.ServiceContractDocument = value
	case "AreaHandoverDocument":
		doc.AreaHandoverDocument = value
	case "QuotationDocument":
		doc.QuotationDocument = value
	case "RefundGuaranteeDocument":
		doc.RefundGuaranteeDocument = value
	}
}

// deleteOldFile ลบไฟล์เก่า
func deleteOldFile(filePath string) {
	if filePath == "" {
		return
	}

	// ตรวจสอบว่าไฟล์มีอยู่จริง
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return
	}

	// ลบไฟล์
	if err := os.Remove(filePath); err != nil {
		fmt.Printf("Warning: Failed to delete old file %s: %v\n", filePath, err)
	}
}

// GetServiceAreaDocumentForEdit ดึงข้อมูล ServiceAreaDocument สำหรับการแก้ไข
func GetServiceAreaDocumentForEdit(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	var doc entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&doc).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
		return
	}

	// ดึงข้อมูล Room และ ServiceUserType
	var room entity.Room
	var serviceUserType entity.ServiceUserType

	if doc.RoomID != 0 {
		config.DB().First(&room, doc.RoomID)
	}
	if doc.ServiceUserTypeID != 0 {
		config.DB().First(&serviceUserType, doc.ServiceUserTypeID)
	}

	response := gin.H{
		"ID":                      doc.ID,
		"RequestServiceAreaID":    doc.RequestServiceAreaID,
		"ContractNumber":          doc.ContractNumber,
		"FinalContractNumber":     doc.FinalContractNumber,
		"ContractStartAt":         doc.ContractStartAt.Format("2006-01-02"),
		"ContractEndAt":           doc.ContractEndAt.Format("2006-01-02"),
		"RoomID":                  doc.RoomID,
		"ServiceUserTypeID":       doc.ServiceUserTypeID,
		"ServiceContractDocument": doc.ServiceContractDocument,
		"AreaHandoverDocument":    doc.AreaHandoverDocument,
		"QuotationDocument":       doc.QuotationDocument,
		"RefundGuaranteeDocument": doc.RefundGuaranteeDocument,
		"Room":                    room,
		"ServiceUserType":         serviceUserType,
	}

	c.JSON(http.StatusOK, gin.H{
		"data": response,
	})
}

// updateRoomStatus อัปเดตสถานะของห้อง
func updateRoomStatus(tx *gorm.DB, roomID uint, statusCode string) error {
	// หา RoomStatusID จาก code ของสถานะ
	var roomStatus entity.RoomStatus
	if err := tx.Where("code = ?", statusCode).First(&roomStatus).Error; err != nil {
		return fmt.Errorf("room status with code '%s' not found: %v", statusCode, err)
	}

	// อัปเดตสถานะของห้อง
	if err := tx.Model(&entity.Room{}).Where("id = ?", roomID).Update("room_status_id", roomStatus.ID).Error; err != nil {
		return fmt.Errorf("failed to update room status: %v", err)
	}

	return nil
}
