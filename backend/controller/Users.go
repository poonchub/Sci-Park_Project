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
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"time"
)

func CreateUser(c *gin.Context) {
	var user entity.User

	// รับข้อมูลจาก form-data
	user.CompanyName = c.PostForm("company_name")
	user.BusinessDetail = c.PostForm("business_detail")
	user.FirstName = c.PostForm("first_name")
	user.LastName = c.PostForm("last_name")
	user.Email = c.PostForm("email")
	user.Password = c.PostForm("password")
	user.Phone = c.PostForm("phone")

	// Default UserPackageID to 1 if not provided
	packageIDStr := c.PostForm("package_id")
	if packageIDStr == "" {
		// กรณีที่ไม่ส่ง package_id มา ให้ใช้ค่าเริ่มต้นเป็น "1"
		packageIDStr = "1"
	}
	
	packageID, err := strconv.Atoi(packageIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid package_id"})
		return
	}
	

	// Convert packageID (int) to uint
	packageIDUint := uint(packageID)
	user.UserPackageID = &packageIDUint


	// รับ RoleID และ GenderID จากฟอร์ม, ถ้าไม่ส่งค่าเข้ามาจะใช้ค่าเริ่มต้น
	roleIDStr := c.DefaultPostForm("role_id", "1")
	genderIDStr := c.DefaultPostForm("gender_id", "1")

	// แปลง roleID และ genderID จาก string เป็น uint
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role_id"})
		return
	}
	user.RoleID = uint(roleID)

	genderID, err := strconv.ParseUint(genderIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid gender_id"})
		return
	}
	user.GenderID = uint(genderID)

	// ตรวจสอบการมีอยู่ของอีเมล
	var existingUser entity.User
	if err := config.DB().Where("email = ?", user.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email already in use"})
		return
	}

	// แฮชรหัสผ่าน
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	user.Password = string(hashedPassword)

	// รับไฟล์ภาพโปรไฟล์จาก form-data (ไฟล์เป็น optional)
	var filePath string
	file, err := c.FormFile("profile_image") // 'profile_image' คือชื่อฟิลด์ในฟอร์ม
	if err == nil {
		// สร้างโฟลเดอร์สำหรับเก็บไฟล์หากยังไม่มี
		profileFolder := "./images/Profiles"
		if _, err := os.Stat(profileFolder); os.IsNotExist(err) {
			err := os.MkdirAll(profileFolder, os.ModePerm)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create directory"})
				return
			}
		}

		// กำหนด path ของไฟล์ที่จะเก็บ
		filePath = path.Join(profileFolder, fmt.Sprintf("%s-%s", user.Email, file.Filename))

		// บันทึกไฟล์ในโฟลเดอร์ที่กำหนด
		if err := c.SaveUploadedFile(file, filePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
			return
		}
	}

	// ตั้งค่า path ของไฟล์ที่บันทึก (ถ้ามี)
	if filePath != "" {
		user.ProfilePath = filePath
	}

	// บันทึกข้อมูลผู้ใช้ใหม่ในฐานข้อมูล
	if err := config.DB().Create(&user).Error; err != nil {
		if err == gorm.ErrDuplicatedKey {
			c.JSON(http.StatusConflict, gin.H{"error": "User already exists"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Unable to create user"})
		}
		return
	}

	// สร้าง UserPackage โดยอ้างอิงจาก User ที่เพิ่งสร้าง
	userPackage := entity.UserPackage{
		UserID:      &user.ID,    // Link the user
		PackageID:   uint(packageID), // Link the selected package
		MeetingRoomUsed: 0,  // Default usage values
		TrainingRoomUsed: 0,
		MultiFunctionRoomUsed: 0,
	}

	// บันทึกข้อมูล UserPackage
	if err := config.DB().Create(&userPackage).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user package"})
		return
	}

	user.UserPackageID = &userPackage.ID  // ตั้งค่า UserPackageID ให้เป็น ID ของ userPackage ที่สร้างล่าสุด

	// อัพเดตข้อมูลของ User ในฐานข้อมูล
	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update User with UserPackageID"})
		return
	}

	// ตอบกลับเมื่อสร้างผู้ใช้สำเร็จ
	c.JSON(http.StatusCreated, gin.H{"message": "User and UserPackage created successfully", "data": user})
}

// GET /user-token/:id
func GetUserByID(c *gin.Context) {
	var user entity.User
	id := c.Param("id")

	db := config.DB()
	if err := db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}
func ChangePassword(c *gin.Context) {
	var changePasswordRequest struct {
		ID          uint   `json:"id" binding:"required"`
		NewPassword string `json:"password" binding:"required"`
	}

	// รับข้อมูลจาก JSON request
	if err := c.ShouldBindJSON(&changePasswordRequest); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// ค้นหาผู้ใช้จาก ID
	var user entity.User
	if err := config.DB().First(&user, changePasswordRequest.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// แฮชรหัสผ่านใหม่
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(changePasswordRequest.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash new password"})
		return
	}

	// อัปเดตรหัสผ่าน + ล้าง ResetToken และ Expiry
	user.Password = string(hashedPassword)
	user.ResetToken = ""
	user.ResetTokenExpiry = time.Time{} // set เป็น zero value

	if err := config.DB().Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// ตอบกลับเมื่อเปลี่ยนรหัสผ่านสำเร็จ
	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// GET /operators
func ListOperators(c *gin.Context) {
	var users []entity.User

	db := config.DB()

	operatorRoleID := 6

	if err := db.Where("role_id = ?", operatorRoleID).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, users)
}
