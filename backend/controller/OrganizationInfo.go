package controller

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"sci-park_web-application/config"
	"sci-park_web-application/entity"

	"github.com/gin-gonic/gin"
)

// GET /organization-info
func GetOrganizationInfo(c *gin.Context) {
	var organizationInfo entity.OrganizationInfo

	db := config.DB()

	db.Find(&organizationInfo)

	c.JSON(http.StatusOK, &organizationInfo)
}

// PATCH  /organization-info:id
func UpdateOrganizationInfoByID(c *gin.Context) {
	ID := c.Param("id")

	db := config.DB()

	var organization entity.OrganizationInfo
	if err := db.First(&organization, ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ID not found"})
		return
	}

	// ข้อมูล JSON ที่ไม่รวมไฟล์
	var input entity.OrganizationInfo
	if err := c.ShouldBind(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Bad request, unable to map payload"})
		return
	}

	// อัปเดต field ทีละตัว เพื่อไม่ให้ overwrite ด้วยค่า default
	organization.NameTH = input.NameTH
	organization.NameEN = input.NameEN
	organization.Slogan = input.Slogan
	organization.Description = input.Description
	organization.Address = input.Address
	organization.Email = input.Email
	organization.Phone = input.Phone
	organization.FacebookUrl = input.FacebookUrl

	// อัปโหลดไฟล์รูปภาพ
	form, err := c.MultipartForm()
	if err == nil {
		files := form.File["files"]
		if len(files) > 0 {
			file := files[0]

			if organization.LogoPath != "" {
                os.Remove(organization.LogoPath)
            }

			// เตรียมโฟลเดอร์
			folderPath := "images/organization/logo"
			if err := os.MkdirAll(folderPath, os.ModePerm); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create folder"})
				return
			}

			// สร้างชื่อไฟล์ใหม่
			ext := ".png"
			newFileName := fmt.Sprintf("logo_%s%s", ID, ext)
			fullPath := path.Join(folderPath, newFileName)

			// บันทึกไฟล์
			if err := c.SaveUploadedFile(file, fullPath); err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to save file"})
				return
			}

			// บันทึก path ไฟล์ลงใน database
			organization.LogoPath = fullPath // หรือใช้ URL prefix ตามเว็บคุณ
		}
	}

	// บันทึกข้อมูลทั้งหมด
	if err := db.Save(&organization).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to update organization info"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Update successful",
		"data":    organization,
	})
}
