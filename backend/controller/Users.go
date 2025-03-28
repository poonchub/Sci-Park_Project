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
	user.EmployeeID = c.PostForm("employee_id")

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

	if user.EmployeeID != "" {
		// ตรวจสอบว่า EmployeeID นี้มีในฐานข้อมูลแล้วหรือไม่
		var existingUser entity.User
		if err := config.DB().Where("employee_id = ?", user.EmployeeID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "EmployeeID already in use"})
			return
		}
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

		fileExtension := path.Ext(file.Filename)

    	// กำหนด path ของไฟล์ที่จะเก็บ โดยใช้อีเมลของผู้ใช้และนามสกุลไฟล์
    	filePath := path.Join(profileFolder, fmt.Sprintf("%s%s", user.Email, fileExtension))
		

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
	// รับค่า id จาก param
	id := c.Param("id")

	// ตรวจสอบให้แน่ใจว่า id ไม่ว่างเปล่า
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ID is required"})
		return
	}
	var user entity.User
	db := config.DB()
	// ค้นหาผู้ใช้จากฐานข้อมูลโดยใช้ id
	if err := db.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	// ส่งข้อมูลผู้ใช้กลับไปในรูปแบบ JSON
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


// GET /users
func ListUsers(c *gin.Context) {
    var users []entity.User

    // รับค่าจาก Query Parameters
    roleID, _ := strconv.Atoi(c.DefaultQuery("role_id", "0"))
    packageID, _ := strconv.Atoi(c.DefaultQuery("package_id", "0"))
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

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

    // การกรองตาม role_id และ package_id (ค้นหาจาก UserPackage)
    if roleID > 0 {
        db = db.Where("role_id = ?", roleID)
    }

    if packageID > 0 {
        // ใช้ Joins เพื่อค้นหาจาก UserPackage แทนที่จะใช้ user_package_id ใน User
        db = db.Joins("JOIN user_packages ON user_packages.user_id = users.id").
            Where("user_packages.package_id = ?", packageID)
    }

		// ดึงข้อมูลผู้ใช้จากฐานข้อมูล
	query := db.Preload("UserPackages").Preload("UserPackages.Package").Preload("Role")

	// แก้ไขการ ORDER โดยใช้ `users.created_at` เพื่อระบุคอลัมน์ที่มาจากตาราง `users`
	if err := query.Order("users.created_at DESC").Limit(limit).Offset(offset).Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

    // คำนวณจำนวนทั้งหมดแยกออกจาก Query หลัก
    var total int64
    countQuery := config.DB().Model(&entity.User{})

    if roleID > 0 {
        countQuery = countQuery.Where("role_id = ?", roleID)
    }

    if packageID > 0 {
        countQuery = countQuery.Joins("JOIN user_packages ON user_packages.user_id = users.id").
            Where("user_packages.package_id = ?", packageID)
    }

    countQuery.Count(&total)

    // จัดรูปแบบข้อมูลที่ส่งกลับให้เป็น PascalCase
    var userResponses []map[string]interface{}
    for _, user := range users {
        userResponse := map[string]interface{}{
            "ID":             user.ID,
            "CompanyName":    user.CompanyName,
            "BusinessDetail": user.BusinessDetail,
            "FirstName":      user.FirstName,
            "LastName":       user.LastName,
            "GenderID":       user.GenderID,
            "Gender":         user.Gender.Name,
            "Email":          user.Email,
            "Phone":          user.Phone,
            "ProfilePath":    user.ProfilePath,
            "UserPackageID":  user.UserPackageID,
            "RoleID":         user.RoleID,
            "Role":           user.Role.Name,
            "EmployeeID":     user.EmployeeID,
            "UserNameCombined": user.FirstName + " " + user.LastName,
        }

        // ดึงข้อมูล PackageName จาก UserPackage ที่ Preload มา
        if len(user.UserPackages) > 0 {
            userResponse["PackageName"] = user.UserPackages[0].Package.PackageName
        }

        userResponses = append(userResponses, userResponse)
    }

    // ส่งข้อมูลผู้ใช้ทั้งหมดกลับไปในรูปแบบ JSON
    c.JSON(http.StatusOK, gin.H{
        "data":       userResponses,
        "page":       page,
        "limit":      limit,
        "total":      total,
        "totalPages": (total + int64(limit) - 1) / int64(limit), // คำนวณจำนวนหน้าทั้งหมด
    })
}


// รับข้อมูลจาก form-data
func UpdateUserByID(c *gin.Context) {
    var updateUserData struct {
        CompanyName    string `form:"company_name"`
        BusinessDetail string `form:"business_detail"`
        FirstName      string `form:"first_name"`
        LastName       string `form:"last_name"`
		Password	   string `form:"password"`
        Email          string `form:"email"`
        Phone          string `form:"phone"`
        EmployeeID     string `form:"employee_id"`
        RoleID         uint   `form:"role_id"`
        GenderID       uint   `form:"gender_id"`
        PackageID      uint   `form:"package_id"`
        ProfileCheck   string `form:"profile_check"` // สำหรับรับโปรไฟล์ภาพจาก form-data
    }

    // Bind form-data ที่รับมา
    if err := c.ShouldBind(&updateUserData); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    // ดึง UserID จาก URL parameter
    userID := c.Param("id")

    // ค้นหาผู้ใช้จาก ID
    var user entity.User
    if err := config.DB().First(&user, userID).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    // อัปเดตข้อมูลผู้ใช้
    if updateUserData.CompanyName != "" {
        user.CompanyName = updateUserData.CompanyName
    }
    if updateUserData.BusinessDetail != "" {
        user.BusinessDetail = updateUserData.BusinessDetail
    }
    if updateUserData.FirstName != "" {
        user.FirstName = updateUserData.FirstName
    }
    if updateUserData.LastName != "" {
        user.LastName = updateUserData.LastName
    }
    if updateUserData.Email != "" {
        user.Email = updateUserData.Email
    }
    if updateUserData.Phone != "" {
        user.Phone = updateUserData.Phone
    }
    if updateUserData.EmployeeID != "" {
        user.EmployeeID = updateUserData.EmployeeID
    }
    if updateUserData.RoleID != 0 {
        user.RoleID = updateUserData.RoleID
    }
    if updateUserData.GenderID != 0 {
        user.GenderID = updateUserData.GenderID
    }
		// หากมีการเปลี่ยนแปลงรหัสผ่าน
	if updateUserData.Password != "" {
		// แฮชรหัสผ่านใหม่
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(updateUserData.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
		user.Password = string(hashedPassword)  // อัปเดตรหัสผ่านใน user
	}


    // หากมีการเปลี่ยนแปลง PackageID, อัปเดต UserPackage
    if updateUserData.PackageID != 0 {
        var userPackage entity.UserPackage
        if err := config.DB().Where("user_id = ?", user.ID).First(&userPackage).Error; err != nil {
            c.JSON(http.StatusNotFound, gin.H{"error": "UserPackage not found"})
            return
        }

        // อัปเดต PackageID ใน UserPackage
        userPackage.PackageID = updateUserData.PackageID
        if err := config.DB().Save(&userPackage).Error; err != nil {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user package"})
            return
        }
    }

		// หากมีการเปลี่ยนแปลงโปรไฟล์, ลบไฟล์โปรไฟล์เก่า
	if updateUserData.ProfileCheck != "" {
		// ลบไฟล์เก่าถ้ามี
		if user.ProfilePath != "" {
			err := os.Remove(user.ProfilePath) // ลบไฟล์โปรไฟล์เก่าที่อยู่ใน path
			if err != nil {
				// ถ้าลบไฟล์เก่าไม่ได้ ให้ข้ามขั้นตอนนี้ไป และไม่ต้องตอบกลับ error
				fmt.Println("Failed to delete old profile image, but continuing...") 
			}
		}

		// รับไฟล์โปรไฟล์จาก form-data (ไฟล์เป็น optional)
		file, err := c.FormFile("profile_image")
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "No file uploaded"})
			return
		}

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
		fileExtension := path.Ext(file.Filename)

    	// กำหนด path ของไฟล์ที่จะเก็บ โดยใช้อีเมลของผู้ใช้และนามสกุลไฟล์
    	newProfilePath := path.Join(profileFolder, fmt.Sprintf("%s%s", user.Email, fileExtension))

		// บันทึกไฟล์ในโฟลเดอร์ที่กำหนด
		if err := c.SaveUploadedFile(file, newProfilePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save new profile image"})
			return
		}

		// อัปเดต path ของโปรไฟล์ในฐานข้อมูล
		user.ProfilePath = newProfilePath
	}

    // บันทึกข้อมูลผู้ใช้ที่อัปเดตลงฐานข้อมูล
    if err := config.DB().Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
        return
    }

    // ส่งข้อมูลผู้ใช้ที่อัปเดตกลับ
    c.JSON(http.StatusOK, gin.H{
        "message": "User updated successfully",
        "data": user,
    })
}
