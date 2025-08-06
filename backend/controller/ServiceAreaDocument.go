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

	// แปลง RoomID และ ServiceUserTypeID
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

	// สร้าง ServiceAreaDocument
	serviceAreaDocument := entity.ServiceAreaDocument{
		RequestServiceAreaID: uint(requestServiceAreaID),
		RoomID:               roomID,
		ServiceUserTypeID:    serviceUserTypeID,
	}

	// จัดการไฟล์เอกสารต่างๆ
	documentFolder := "./images/ServiceAreaDocuments"
	if _, err := os.Stat(documentFolder); os.IsNotExist(err) {
		err := os.MkdirAll(documentFolder, os.ModePerm)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
			return
		}
	}

	// จัดการไฟล์ Service Contract Document
	if file, err := c.FormFile("service_contract_document"); err == nil {
		fileExtension := path.Ext(file.Filename)
		filePath := path.Join(documentFolder, fmt.Sprintf("contract_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
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
		filePath := path.Join(documentFolder, fmt.Sprintf("handover_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
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
		filePath := path.Join(documentFolder, fmt.Sprintf("quotation_%d_%d%s", requestServiceAreaID, serviceAreaDocument.ID, fileExtension))
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

// ListServiceUserTypes ดึงรายการ ServiceUserType ทั้งหมด
func ListServiceUserTypes(c *gin.Context) {
	var serviceUserTypes []entity.ServiceUserType
	if err := config.DB().Find(&serviceUserTypes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service user types"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": serviceUserTypes,
	})
}

// GetServiceUserTypeByID ดึงข้อมูล ServiceUserType ตาม ID
func GetServiceUserTypeByID(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid id"})
		return
	}

	var serviceUserType entity.ServiceUserType
	if err := config.DB().First(&serviceUserType, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Service user type not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch service user type"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": serviceUserType,
	})
}
