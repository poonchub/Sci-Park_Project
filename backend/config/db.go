package config

import (
	"fmt"

	"sci-park_web-application/entity"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

// ฟังก์ชันสำหรับเรียกใช้งาน DB
func DB() *gorm.DB {
	return db
}

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
func ConnectionDB() {
	database, err := gorm.Open(sqlite.Open("sci-park_web-application.db?cache=shared"), &gorm.Config{})
	if err != nil {
		panic("failed to connect database")
	}
	fmt.Println("Connected to database")
	db = database
}

// ฟังก์ชันสำหรับสร้างตารางในฐานข้อมูล
func SetupDatabase() {
	db.AutoMigrate(&entity.User{}) // สร้างตาราง Users

	// สร้างข้อมูลตัวอย่าง 2 รายการ
	user1 := entity.User{
		CompanyName:   "TechCorp",
		BusinessDetail: "Technology Solutions Provider",
		FirstName:     "John",
		LastName:      "Doe",
		Email:         "john.doe@example.com",
		Password:      "password123",
		Phone:         "123456789",
		ProfilePath:   "/profiles/john.jpg",
		LevelID:       1,
		RoleID:        2,
	}

	user2 := entity.User{
		CompanyName:   "MediCare",
		BusinessDetail: "Healthcare Services",
		FirstName:     "Alice",
		LastName:      "Smith",
		Email:         "alice.smith@example.com",
		Password:      "securepass",
		Phone:         "987654321",
		ProfilePath:   "/profiles/alice.jpg",
		LevelID:       2,
		RoleID:        1,
	}

	// ใช้ FirstOrCreate เพื่อป้องกันการเพิ่มข้อมูลซ้ำ
	db.FirstOrCreate(&user1, entity.User{Email: user1.Email})
	db.FirstOrCreate(&user2, entity.User{Email: user2.Email})

	user3 := entity.User{
		CompanyName:   "MediCare2",
		BusinessDetail: "Healthcare Services2",
		FirstName:     "Alice",
		LastName:      "Smith",
		Email:         "alice.smith@example.com2",
		Password:      "securepass",
		Phone:         "987654321",
		ProfilePath:   "/profiles/alice.jpg",
		LevelID:       2,
		RoleID:        1,
	}

	// ใช้ FirstOrCreate เพื่อป้องกันการเพิ่มข้อมูลซ้ำ
	db.FirstOrCreate(&user3, entity.User{Email: user3.Email})

	fmt.Println("Database migrated and sample users added successfully")
}

