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
// รองรับทั้งกรณีที่มี ServiceAreaDocument และไม่มี (สร้างใหม่หรืออัปเดท RequestServiceArea)
func UpdateServiceAreaDocumentForEdit(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	// ตรวจสอบว่า RequestServiceArea มีอยู่หรือไม่ (ต้องมีเสมอ)
	var requestServiceArea entity.RequestServiceArea
	if err := config.DB().First(&requestServiceArea, uint(requestServiceAreaID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request service area not found"})
		return
	}

	// ตรวจสอบว่า ServiceAreaDocument มีอยู่หรือไม่
	var existingDoc entity.ServiceAreaDocument
	var hasServiceAreaDoc bool
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&existingDoc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			hasServiceAreaDoc = false
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		hasServiceAreaDoc = true
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

	// จัดการไฟล์เอกสารสำหรับ ServiceAreaDocument
	documentFields := map[string]string{
		"service_contract_document": "ServiceContractDocument",
		"area_handover_document":    "AreaHandoverDocument",
		"quotation_document":        "QuotationDocument",
		"refund_guarantee_document": "RefundGuaranteeDocument",
	}

	// สร้างโฟลเดอร์ย่อยตามประเภทเอกสาร (เหมือนตอนสร้าง)
	baseFolder := fmt.Sprintf("./images/ServiceAreaDocuments/request_%d", uint(requestServiceAreaID))
	contractFolder := fmt.Sprintf("%s/contracts", baseFolder)
	handoverFolder := fmt.Sprintf("%s/handovers", baseFolder)
	quotationFolder := fmt.Sprintf("%s/quotations", baseFolder)
	refundGuaranteeFolder := fmt.Sprintf("%s/refund_guarantees", baseFolder)
	requestDocumentFolder := fmt.Sprintf("%s/request_documents", baseFolder)
	cancellationFolder := fmt.Sprintf("%s/cancellations", baseFolder)
	bankAccountFolder := fmt.Sprintf("%s/bank_accounts", baseFolder)

	// สร้างโฟลเดอร์ทั้งหมด
	if err := os.MkdirAll(contractFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contract folder"})
		return
	}
	if err := os.MkdirAll(handoverFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create handover folder"})
		return
	}
	if err := os.MkdirAll(quotationFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quotation folder"})
		return
	}
	if err := os.MkdirAll(refundGuaranteeFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create refund guarantee folder"})
		return
	}
	if err := os.MkdirAll(requestDocumentFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create request document folder"})
		return
	}
	if err := os.MkdirAll(cancellationFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create cancellation folder"})
		return
	}
	if err := os.MkdirAll(bankAccountFolder, 0755); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create bank account folder"})
		return
	}

	for formField, structField := range documentFields {
		if file, err := c.FormFile(formField); err == nil && file != nil {
			// ลบไฟล์เก่า (ถ้ามี)
			oldPath := getFieldValue(&existingDoc, structField)
			if oldPath != "" {
				deleteOldFile(oldPath)
			}

			// เลือกโฟลเดอร์ตามประเภทเอกสาร
			var uploadDir string
			switch formField {
			case "service_contract_document":
				uploadDir = contractFolder
			case "area_handover_document":
				uploadDir = handoverFolder
			case "quotation_document":
				uploadDir = quotationFolder
			case "refund_guarantee_document":
				uploadDir = refundGuaranteeFolder
			default:
				uploadDir = baseFolder
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
			setFieldValue(&updateData, structField, normalizedPath)
		}
	}

	// จัดการไฟล์ RequestDocument (มาจาก RequestServiceArea)
	if file, err := c.FormFile("request_document"); err == nil && file != nil {
		// ลบไฟล์เก่า (ถ้ามี)
		if requestServiceArea.ServiceRequestDocument != "" {
			deleteOldFile(requestServiceArea.ServiceRequestDocument)
		}

		// ใช้โฟลเดอร์ request_documents (จัดระเบียบเหมือนเอกสารอื่นๆ)
		uploadDir := requestDocumentFolder
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

		// อัปเดต ServiceRequestDocument ใน RequestServiceArea
		if err := tx.Model(&requestServiceArea).Update("service_request_document", normalizedPath).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request service area document"})
			return
		}
	}

	// จัดการข้อมูลตามกรณี
	if hasServiceAreaDoc {
		// กรณีมี ServiceAreaDocument แล้ว - อัปเดตข้อมูล

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
	} else {
		// กรณีไม่มี ServiceAreaDocument - สร้างใหม่ (ถ้ามีข้อมูล Contract/Room) หรืออัปเดตเฉพาะ RequestServiceArea

		// ตรวจสอบว่ามีข้อมูลที่ต้องสร้าง ServiceAreaDocument หรือไม่
		hasContractData := updateData.ContractNumber != "" || updateData.FinalContractNumber != "" ||
			!updateData.ContractStartAt.IsZero() || !updateData.ContractEndAt.IsZero() ||
			updateData.RoomID != 0 || updateData.ServiceUserTypeID != 0 ||
			updateData.ServiceContractDocument != "" || updateData.AreaHandoverDocument != "" ||
			updateData.QuotationDocument != "" || updateData.RefundGuaranteeDocument != ""

		if hasContractData {
			// สร้าง ServiceAreaDocument ใหม่
			newDoc := entity.ServiceAreaDocument{
				RequestServiceAreaID:    uint(requestServiceAreaID),
				ContractNumber:          updateData.ContractNumber,
				FinalContractNumber:     updateData.FinalContractNumber,
				ContractStartAt:         updateData.ContractStartAt,
				ContractEndAt:           updateData.ContractEndAt,
				RoomID:                  updateData.RoomID,
				ServiceUserTypeID:       updateData.ServiceUserTypeID,
				ServiceContractDocument: updateData.ServiceContractDocument,
				AreaHandoverDocument:    updateData.AreaHandoverDocument,
				QuotationDocument:       updateData.QuotationDocument,
				RefundGuaranteeDocument: updateData.RefundGuaranteeDocument,
			}

			if err := tx.Create(&newDoc).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service area document"})
				return
			}

			// ล็อคห้อง (ถ้ามีการเลือกห้อง)
			if newRoomID != 0 {
				if err := updateRoomStatus(tx, newRoomID, "unavailable"); err != nil {
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to lock room"})
					return
				}
			}

			// Commit transaction
			if err := tx.Commit().Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service area document"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "Service area document created successfully",
				"data":    newDoc,
			})
		} else {
			// ไม่มีข้อมูล Contract/Room - เฉพาะอัปเดต RequestServiceArea (RequestDocument)
			// Commit transaction
			if err := tx.Commit().Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request service area"})
				return
			}

			c.JSON(http.StatusOK, gin.H{
				"message": "Request service area updated successfully",
				"data":    requestServiceArea,
			})
		}
	}
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
// รองรับทั้งกรณีที่มี ServiceAreaDocument และไม่มี (ใช้ข้อมูลจาก RequestServiceArea)
func GetServiceAreaDocumentForEdit(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request service area ID"})
		return
	}

	// ดึงข้อมูล RequestServiceArea ก่อน (ต้องมีเสมอ)
	var requestServiceArea entity.RequestServiceArea
	if err := config.DB().First(&requestServiceArea, uint(requestServiceAreaID)).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request service area not found"})
		return
	}

	// พยายามดึงข้อมูล ServiceAreaDocument (อาจมีหรือไม่มี)
	var doc entity.ServiceAreaDocument
	var hasServiceAreaDoc bool
	if err := config.DB().Where("request_service_area_id = ?", uint(requestServiceAreaID)).First(&doc).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// ไม่มี ServiceAreaDocument ให้ใช้ข้อมูลจาก RequestServiceArea
			hasServiceAreaDoc = false
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	} else {
		hasServiceAreaDoc = true
	}

	// ดึงข้อมูล Room และ ServiceUserType (ถ้ามี)
	var room entity.Room
	var serviceUserType entity.ServiceUserType

	if hasServiceAreaDoc {
		if doc.RoomID != 0 {
			config.DB().First(&room, doc.RoomID)
		}
		if doc.ServiceUserTypeID != 0 {
			config.DB().First(&serviceUserType, doc.ServiceUserTypeID)
		}
	}

	// สร้าง response ตามข้อมูลที่มี
	var response gin.H
	if hasServiceAreaDoc {
		// มี ServiceAreaDocument แล้ว - ใช้ข้อมูลจาก ServiceAreaDocument
		response = gin.H{
			"ID":                          doc.ID,
			"RequestServiceAreaID":        doc.RequestServiceAreaID,
			"ContractNumber":              doc.ContractNumber,
			"FinalContractNumber":         doc.FinalContractNumber,
			"ContractStartAt":             doc.ContractStartAt.Format("2006-01-02"),
			"ContractEndAt":               doc.ContractEndAt.Format("2006-01-02"),
			"RoomID":                      doc.RoomID,
			"ServiceUserTypeID":           doc.ServiceUserTypeID,
			"ServiceContractDocument":     doc.ServiceContractDocument,
			"AreaHandoverDocument":        doc.AreaHandoverDocument,
			"QuotationDocument":           doc.QuotationDocument,
			"RequestDocument":             requestServiceArea.ServiceRequestDocument,
			"Room":                        room,
			"ServiceUserType":             serviceUserType,
			"ServiceContractDocumentPath": doc.ServiceContractDocument,
			"AreaHandoverDocumentPath":    doc.AreaHandoverDocument,
			"QuotationDocumentPath":       doc.QuotationDocument,
			"RequestDocumentPath":         requestServiceArea.ServiceRequestDocument,
		}
	} else {
		// ไม่มี ServiceAreaDocument - ใช้ข้อมูลจาก RequestServiceArea
		response = gin.H{
			"ID":                          0, // ยังไม่มี ServiceAreaDocument
			"RequestServiceAreaID":        requestServiceArea.ID,
			"ContractNumber":              "",
			"FinalContractNumber":         "",
			"ContractStartAt":             "",
			"ContractEndAt":               "",
			"RoomID":                      0,
			"ServiceUserTypeID":           0,
			"ServiceContractDocument":     "",
			"AreaHandoverDocument":        "",
			"QuotationDocument":           "",
			"RequestDocument":             requestServiceArea.ServiceRequestDocument,
			"Room":                        room,
			"ServiceUserType":             serviceUserType,
			"ServiceContractDocumentPath": "",
			"AreaHandoverDocumentPath":    "",
			"QuotationDocumentPath":       "",
			"RequestDocumentPath":         requestServiceArea.ServiceRequestDocument,
		}
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
