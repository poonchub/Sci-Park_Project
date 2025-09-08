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

// CreateServiceAreaDocument สร้าง ServiceAreaDocument ใหม่
func CreateServiceAreaDocument(c *gin.Context) {
	// รับ request_service_area_id จาก path parameter
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	// ตรวจสอบว่า RequestServiceArea มีอยู่จริงหรือไม่
	var requestServiceArea entity.RequestServiceArea
	if err := config.DB().First(&requestServiceArea, requestServiceAreaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request service area not found"})
		return
	}

	// ตรวจสอบว่า ServiceAreaDocument มีอยู่แล้วหรือไม่ (1:1 relationship)
	var existingDocument entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", requestServiceAreaID).First(&existingDocument).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Service area document already exists for this request"})
		return
	}

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// แปลงข้อมูลจาก form
	var roomID uint
	if roomIDStr := c.PostForm("room_id"); roomIDStr != "" {
		if id, err := strconv.ParseUint(roomIDStr, 10, 32); err == nil {
			roomID = uint(id)
		}
	}

	var serviceUserTypeID uint
	if serviceUserTypeIDStr := c.PostForm("service_user_type_id"); serviceUserTypeIDStr != "" {
		if id, err := strconv.ParseUint(serviceUserTypeIDStr, 10, 32); err == nil {
			serviceUserTypeID = uint(id)
		}
	}

	// แปลง ContractStartAt
	var contractStartAt time.Time
	if contractStartAtStr := c.PostForm("contract_start_at"); contractStartAtStr != "" {
		if parsedTime, err := time.Parse("2006-01-02", contractStartAtStr); err == nil {
			contractStartAt = parsedTime
		} else {
			contractStartAt = time.Now() // ถ้า parse ไม่ได้ใช้เวลาปัจจุบัน
		}
	} else {
		contractStartAt = time.Now() // ถ้าไม่ส่งมาใช้เวลาปัจจุบัน
	}

	// แปลง ContractNumber
	contractNumber := c.PostForm("contract_number")

	// สร้าง ServiceAreaDocument
	serviceAreaDocument := entity.ServiceAreaDocument{
		RequestServiceAreaID: uint(requestServiceAreaID),
		RoomID:               roomID,
		ServiceUserTypeID:    serviceUserTypeID,
		ContractStartAt:      contractStartAt,
		ContractNumber:       contractNumber,
	}

	// จัดการไฟล์เอกสารต่างๆ - สร้างโครงสร้างโฟลเดอร์แบบแยกตาม Request ID
	baseFolder := "./images/ServiceAreaDocuments"
	requestFolder := path.Join(baseFolder, fmt.Sprintf("request_%d", requestServiceAreaID))
	// สร้างโฟลเดอร์หลักและโฟลเดอร์ย่อย
	if err := os.MkdirAll(requestFolder, os.ModePerm); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory structure"})
		return
	}

	// สร้างโฟลเดอร์ย่อยสำหรับแต่ละประเภทเอกสาร
	contractFolder := path.Join(requestFolder, "contracts")
	handoverFolder := path.Join(requestFolder, "handovers")
	quotationFolder := path.Join(requestFolder, "quotations")

	if err := os.MkdirAll(contractFolder, os.ModePerm); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create contract folder"})
		return
	}
	if err := os.MkdirAll(handoverFolder, os.ModePerm); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create handover folder"})
		return
	}
	if err := os.MkdirAll(quotationFolder, os.ModePerm); err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create quotation folder"})
		return
	}

	// จัดการไฟล์ Service Contract Document
	if file, err := c.FormFile("service_contract_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		fileName := fmt.Sprintf("contract_%d%s", serviceAreaDocument.ID, fileExtension)
		filePath := path.Join(contractFolder, fileName)
		serviceAreaDocument.ServiceContractDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save service contract document"})
			return
		}
	}

	// จัดการไฟล์ Area Handover Document
	if file, err := c.FormFile("area_handover_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		fileName := fmt.Sprintf("handover_%d%s", serviceAreaDocument.ID, fileExtension)
		filePath := path.Join(handoverFolder, fileName)
		serviceAreaDocument.AreaHandoverDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save area handover document"})
			return
		}
	}

	// จัดการไฟล์ Quotation Document
	if file, err := c.FormFile("quotation_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		fileName := fmt.Sprintf("quotation_%d%s", serviceAreaDocument.ID, fileExtension)
		filePath := path.Join(quotationFolder, fileName)
		serviceAreaDocument.QuotationDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save quotation document"})
			return
		}
	}

	// บันทึก ServiceAreaDocument
	if err := tx.Create(&serviceAreaDocument).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create service area document"})
		return
	}

	// อัปเดตสถานะ Room ให้เป็น "Unavailable" (Code: "unavailable", ID: 3)
	// เมื่อ Document Operator สร้างเอกสารสัญญาเสร็จแล้ว
	if roomID > 0 {
		var room entity.Room
		if err := tx.First(&room, roomID).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to find room"})
			return
		}

		// อัปเดต RoomStatusID เป็น 3 (Unavailable)
		room.RoomStatusID = 3
		if err := tx.Save(&room).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room status"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Service area document created successfully",
		"data":    serviceAreaDocument,
	})
}

// GetServiceAreaDocumentByRequestID ดึงข้อมูล ServiceAreaDocument ตาม RequestServiceArea ID
func GetServiceAreaDocumentByRequestID(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	var serviceAreaDocument entity.ServiceAreaDocument
	if err := config.DB().Preload("Room").Preload("ServiceUserType").Where("request_service_area_id = ?", requestServiceAreaID).First(&serviceAreaDocument).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service area document"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": serviceAreaDocument,
	})
}

// UpdateServiceAreaDocument อัปเดตข้อมูล ServiceAreaDocument
func UpdateServiceAreaDocument(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	var serviceAreaDocument entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", requestServiceAreaID).First(&serviceAreaDocument).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
		return
	}

	// อัปเดตข้อมูล
	if roomIDStr := c.PostForm("room_id"); roomIDStr != "" {
		if roomID, err := strconv.ParseUint(roomIDStr, 10, 32); err == nil {
			serviceAreaDocument.RoomID = uint(roomID)
		}
	}

	if serviceUserTypeIDStr := c.PostForm("service_user_type_id"); serviceUserTypeIDStr != "" {
		if serviceUserTypeID, err := strconv.ParseUint(serviceUserTypeIDStr, 10, 32); err == nil {
			serviceAreaDocument.ServiceUserTypeID = uint(serviceUserTypeID)
		}
	}

	// จัดการไฟล์ใหม่ (ถ้ามี)
	documentFolder := "./images/ServiceAreaDocuments"
	if _, err := os.Stat(documentFolder); os.IsNotExist(err) {
		err := os.MkdirAll(documentFolder, os.ModePerm)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
			return
		}
	}

	// อัปเดต Service Contract Document
	if file, err := c.FormFile("service_contract_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("contract_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
		serviceAreaDocument.ServiceContractDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save service contract document"})
			return
		}
	}

	// อัปเดต Area Handover Document
	if file, err := c.FormFile("area_handover_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("handover_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
		serviceAreaDocument.AreaHandoverDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save area handover document"})
			return
		}
	}

	// อัปเดต Quotation Document
	if file, err := c.FormFile("quotation_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("quotation_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
		serviceAreaDocument.QuotationDocument = filePath

		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save quotation document"})
			return
		}
	}

	if err := config.DB().Save(&serviceAreaDocument).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service area document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service area document updated successfully",
		"data":    serviceAreaDocument,
	})
}

// UpdateServiceAreaDocumentForCancellation อัปเดต ServiceAreaDocument สำหรับการยกเลิก
func UpdateServiceAreaDocumentForCancellation(c *gin.Context) {
	// รับ request_service_area_id จาก path parameter
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	// ตรวจสอบว่า ServiceAreaDocument มีอยู่จริงหรือไม่
	var serviceAreaDocument entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", requestServiceAreaID).First(&serviceAreaDocument).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service area document"})
		}
		return
	}

	// เริ่ม transaction
	tx := config.DB().Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// อัปเดต Contract Number (ถ้ามี)
	if contractNumber := c.PostForm("contract_number"); contractNumber != "" {
		serviceAreaDocument.ContractNumber = contractNumber
	}

	// อัปเดต Contract End Date (ถ้ามี)
	if contractEndDateStr := c.PostForm("contract_end_date"); contractEndDateStr != "" {
		if contractEndDate, err := time.Parse("2006-01-02", contractEndDateStr); err == nil {
			serviceAreaDocument.ContractEndAt = contractEndDate
		} else {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid contract end date format"})
			return
		}
	}

	// จัดการไฟล์ Refund Guarantee Document
	if file, header, err := c.Request.FormFile("security_deposit_refund_document"); err == nil {
		defer file.Close()

		// สร้างโฟลเดอร์ถ้ายังไม่มี
		uploadDir := "images/ServiceAreaDocuments"
		if err := os.MkdirAll(uploadDir, 0755); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}

		// สร้างชื่อไฟล์ใหม่
		fileExt := path.Ext(header.Filename)
		fileName := fmt.Sprintf("refund_guarantee_%d_%d%s", requestServiceAreaID, time.Now().Unix(), fileExt)
		filePath := path.Join(uploadDir, fileName)

		// บันทึกไฟล์
		if err := c.SaveUploadedFile(header, filePath); err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save uploaded file"})
			return
		}

		// ลบไฟล์เก่า (ถ้ามี)
		if serviceAreaDocument.RefundGuaranteeDocument != "" {
			os.Remove(serviceAreaDocument.RefundGuaranteeDocument)
		}

		// อัปเดต path ไฟล์ใหม่
		serviceAreaDocument.RefundGuaranteeDocument = filePath
	}

	// บันทึกการเปลี่ยนแปลง
	if err := tx.Save(&serviceAreaDocument).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update service area document"})
		return
	}

	// อัปเดตสถานะของ RequestServiceArea เป็น "Successfully Cancelled" (ID: 11)
	var requestServiceArea entity.RequestServiceArea
	if err := tx.First(&requestServiceArea, requestServiceAreaID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch request service area"})
		return
	}

	// อัปเดตสถานะเป็น "Successfully Cancelled" (ID: 11)
	requestServiceArea.RequestStatusID = 11
	if err := tx.Save(&requestServiceArea).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request service area status"})
		return
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service area document updated successfully for cancellation and status updated to Successfully Cancelled",
		"data":    serviceAreaDocument,
	})
}

// DeleteServiceAreaDocument ลบ ServiceAreaDocument
func DeleteServiceAreaDocument(c *gin.Context) {
	requestServiceAreaIDStr := c.Param("request_service_area_id")
	requestServiceAreaID, err := strconv.ParseUint(requestServiceAreaIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request_service_area_id"})
		return
	}

	var serviceAreaDocument entity.ServiceAreaDocument
	if err := config.DB().Where("request_service_area_id = ?", requestServiceAreaID).First(&serviceAreaDocument).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Service area document not found"})
		return
	}

	// ลบไฟล์เอกสาร (ถ้ามี)
	if serviceAreaDocument.ServiceContractDocument != "" {
		os.Remove(serviceAreaDocument.ServiceContractDocument)
	}
	if serviceAreaDocument.AreaHandoverDocument != "" {
		os.Remove(serviceAreaDocument.AreaHandoverDocument)
	}
	if serviceAreaDocument.QuotationDocument != "" {
		os.Remove(serviceAreaDocument.QuotationDocument)
	}

	// ลบข้อมูลจากฐานข้อมูล
	if err := config.DB().Delete(&serviceAreaDocument).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete service area document"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Service area document deleted successfully",
	})
}
