package config

import (
	"fmt"
	"log"
	"os"
	"sci-park_web-application/entity"
	"strings"
	"time"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var db *gorm.DB

// ฟังก์ชันสำหรับเรียกใช้งานฐานข้อมูล
func DB() *gorm.DB {
	return db
}

// ฟังก์ชันเชื่อมต่อฐานข้อมูล
func ConnectDB() {
	var err error

	// อ่าน DB_NAME จาก environment variable
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "sci-park_web-application.db" // default
	}

	database, err := gorm.Open(sqlite.Open(dbName+"?cache=shared"), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect database:", err)
	}

	fmt.Printf("✅ Connected to database: %s\n", dbName)
	db = database
}

// เพิ่ม function สำหรับแปลง "08:00" เป็น time.Time
func parseTime(s string) time.Time {
	t, err := time.Parse("15:04", s)
	if err != nil {
		log.Fatalf("❌ parseTime error: %v", err)
	}
	return t
}

func parseDate(dateStr string) time.Time {
	t, err := time.Parse("2006-01-02", dateStr) // รูปแบบวันที่มาตรฐานของ Go
	if err != nil {
		panic("❌ Invalid date format: " + dateStr)
	}
	return t
}

// ฟังก์ชันสร้างตารางในฐานข้อมูล
func SetupDatabase() {
	if db == nil {
		log.Fatal("❌ Database connection is nil. Please call ConnectDB() first.")
	}

	err := db.AutoMigrate(
		&entity.User{},
		&entity.UserPackage{},
		&entity.RoomType{},
		&entity.RoomStatus{},
		&entity.Room{},
		&entity.Role{},
		&entity.JobPosition{},
		&entity.RequestStatus{},
		&entity.Package{},
		&entity.ManagerApproval{},
		&entity.MaintenanceTask{},
		&entity.MaintenanceRequest{},
		&entity.MaintenanceImage{},
		&entity.Inspection{},
		&entity.Gender{},
		&entity.Floor{},
		&entity.Area{},
		&entity.HandoverImage{},
		&entity.RequestType{},
		&entity.RoomLayout{},
		&entity.RoomTypeLayout{},
		&entity.Notification{},
		&entity.TimeSlot{},
		&entity.RoomPrice{},
		&entity.BookingRoom{},
		&entity.Payment{},
		&entity.RoomTypeImage{},
		&entity.Equipment{},
		&entity.RoomEquipment{},
		&entity.Analytics{},
		&entity.UserAnalyticsSummary{},
		&entity.PageAnalytics{},
		&entity.SystemAnalytics{},
		&entity.News{},
		&entity.NewsImage{},
		&entity.OrganizationInfo{},
		&entity.Contributor{},
		&entity.ContributorType{},
		&entity.RequestServiceArea{},
		&entity.BusinessGroup{},
		&entity.CompanySize{},
		&entity.AboutCompany{},
		&entity.PaymentStatus{},
		&entity.BusinessGroup{},
		&entity.CompanySize{},
		&entity.ServiceUserType{},
		&entity.ServiceAreaDocument{},
		&entity.CancelRequestServiceArea{},
		&entity.RentalRoomInvoice{},
		&entity.RentalRoomInvoiceItem{},
		&entity.TitlePrefix{},
		&entity.BookingDate{}, // ← ✅ ต้องใส่ให้ migrate ตาราง booking_dates
		&entity.BookingStatus{},
		&entity.CollaborationPlan{},
		&entity.ServiceAreaApproval{},
		&entity.ServiceAreaTask{},
		&entity.RoomBookingInvoice{},
		&entity.RoomBookingInvoiceItem{},
		&entity.PaymentType{},
		&entity.PaymentOption{},
	)

	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}

	fmt.Println("✅ Database migrated successfully!")

	SeedDatabase()

}

// ฟังก์ชันสร้างตารางในฐานข้อมูลสำหรับ Test Mode (ไม่มีข้อมูล mockup)
func SetupDatabaseTestMode() {
	if db == nil {
		log.Fatal("❌ Database connection is nil. Please call ConnectDB() first.")
	}

	err := db.AutoMigrate(
		&entity.User{},
		&entity.UserPackage{},
		&entity.RoomType{},
		&entity.RoomStatus{},
		&entity.Room{},
		&entity.Role{},
		&entity.JobPosition{},
		&entity.RequestStatus{},
		&entity.Package{},
		&entity.ManagerApproval{},
		&entity.MaintenanceTask{},
		&entity.MaintenanceRequest{},
		&entity.MaintenanceImage{},
		&entity.Inspection{},
		&entity.Gender{},
		&entity.Floor{},
		&entity.Area{},
		&entity.HandoverImage{},
		&entity.RequestType{},
		&entity.RoomLayout{},
		&entity.RoomTypeLayout{},
		&entity.Notification{},
		&entity.TimeSlot{},
		&entity.RoomPrice{},
		&entity.BookingRoom{},
		&entity.Payment{},
		&entity.RoomTypeImage{},
		&entity.Equipment{},
		&entity.RoomEquipment{},
		&entity.Analytics{},
		&entity.UserAnalyticsSummary{},
		&entity.PageAnalytics{},
		&entity.SystemAnalytics{},
		&entity.News{},
		&entity.NewsImage{},
		&entity.OrganizationInfo{},
		&entity.Contributor{},
		&entity.ContributorType{},
		&entity.RequestServiceArea{},
		&entity.BusinessGroup{},
		&entity.CompanySize{},
		&entity.AboutCompany{},
		&entity.PaymentStatus{},
		&entity.BusinessGroup{},
		&entity.CompanySize{},
		&entity.ServiceUserType{},
		&entity.ServiceAreaDocument{},
		&entity.CancelRequestServiceArea{},
		&entity.RentalRoomInvoice{},
		&entity.RentalRoomInvoiceItem{},
		&entity.TitlePrefix{},
		&entity.BookingDate{},
		&entity.BookingStatus{},
		&entity.CollaborationPlan{},
		&entity.ServiceAreaApproval{},
		&entity.ServiceAreaTask{},
		&entity.RoomBookingInvoice{},
		&entity.RoomBookingInvoiceItem{},
		&entity.PaymentType{},
		&entity.PaymentOption{},
	)

	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}

	fmt.Println("✅ Database migrated successfully! (Test Mode - No mockup data)")
}

// ฟังก์ชันเพิ่มข้อมูลตัวอย่าง
func SeedDatabase() {
	// 🔹 ข้อมูล Gender
	genders := []entity.Gender{
		{Name: "Male"},
		{Name: "Female"},
	}
	for _, gender := range genders {
		db.FirstOrCreate(&gender, entity.Gender{Name: gender.Name})
	}

	// 🔹 ข้อมูล Role
	roles := []entity.Role{
		{Name: "User"},
		{Name: "Maintenance Operator"},
		{Name: "Document Operator"},
		{Name: "Manager"},
		{Name: "Admin"},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{Name: role.Name})
	}

	// 🔹 ข้อมูล JobPosition
	jobPositions := []entity.JobPosition{
		{Name: "Head of Central Administration and Infrastructure Development Unit"},
		{Name: "Central Administration and Infrastructure Development Unit"},
		{Name: "Head of Innovation and Key Account Services Unit (IKD)"},
		{Name: "Innovation and Key Account Services Unit (IKD)"},
		{Name: "Head of Network Coordination Unit"},
		{Name: "Network Coordination Unit"},
		{Name: "Head of Business Development and Innovation Cluster Unit (BCD)"},
		{Name: "Business Development and Innovation Cluster Unit (BCD)"},
		{Name: "Head of Future Learning and Skills Innovation Unit"},
		{Name: "Future Learning and Skills Innovation Unit"},
		{Name: "Head of Marketing, Customer Service and Public Relations Unit"},
		{Name: "Marketing, Customer Service and Public Relations Unit"},
		{Name: "Regional Operations Support Unit"},
	}
	for _, jobPosition := range jobPositions {
		db.FirstOrCreate(&jobPosition, entity.JobPosition{Name: jobPosition.Name})
	}

	// 🔹 ข้อมูล TitlePrefix
	titlePrefixes := []entity.TitlePrefix{
		{PrefixTH: "นาย", PrefixEN: "Mr."},
		{PrefixTH: "นาง", PrefixEN: "Mrs."},
		{PrefixTH: "นางสาว", PrefixEN: "Ms."},
		{PrefixTH: "ดร.", PrefixEN: "Dr."},
	}
	for _, prefix := range titlePrefixes {
		db.FirstOrCreate(&prefix, entity.TitlePrefix{
			PrefixTH: prefix.PrefixTH,
			PrefixEN: prefix.PrefixEN,
		})
	}

	// 🔹 ข้อมูล RequestType
	requestTypes := []entity.RequestType{
		{TypeName: "Internal"},
		{TypeName: "External"},
		{TypeName: "Both"},
	}
	for _, requestType := range requestTypes {
		db.FirstOrCreate(&requestType, entity.RequestType{TypeName: requestType.TypeName})
	}

	// 🔹 ข้อมูล Floor
	floors := []entity.Floor{{Number: 1}, {Number: 2}, {Number: 3}, {Number: 4}}
	for _, floor := range floors {
		db.FirstOrCreate(&floor, entity.Floor{Number: floor.Number})
	}

	// 🔹 ข้อมูล Area
	areas := []entity.Area{
		{Name: "Meeting Room / Workspace"},
		{Name: "Other Areas"},
	}
	for _, area := range areas {
		db.FirstOrCreate(&area, entity.Area{Name: area.Name})
	}

	requestStatuses := []entity.RequestStatus{
		{
			Name:        "Created",
			Description: "The maintenance request has been initiated and is awaiting further action.",
		},
		{
			Name:        "Pending", // Waiting for action
			Description: "The request is awaiting approval or further action from the responsible party.",
		},
		{
			Name:        "Approved", // Approved
			Description: "The request has been approved and is ready for processing.",
		},
		{
			Name:        "In Progress", // In Progress
			Description: "The request is currently being worked on (repair or maintenance ongoing).",
		},
		{
			Name:        "Waiting for Review", // Waiting for review
			Description: "The task is completed and is awaiting review from the requester.",
		},
		{
			Name:        "Completed", // Completed
			Description: "The request is completed and has been confirmed by the requester.",
		},
		{
			Name:        "Rework Requested", // Rework requested
			Description: "The requester has asked for additional work or corrections to be made.",
		},
		{
			Name:        "Unsuccessful", // Unsuccessful
			Description: "The maintenance was unsuccessful and could not be completed.",
		},
		{
			Name:        "Cancellation In Progress", // Cancellation In Progress
			Description: "The service area request cancellation is currently being processed.",
		},
		{
			Name:        "Cancellation Assigned", // Cancellation Assigned
			Description: "The cancellation request has been assigned to an operator for processing.",
		},
		{
			Name:        "Successfully Cancelled", // Successfully Cancelled
			Description: "The service area request has been successfully cancelled and the process is complete.",
		},
	}
	for _, status := range requestStatuses {
		db.FirstOrCreate(&status, entity.RequestStatus{Name: status.Name})
	}

	// 🔹 RoomStatus Data
	roomStatuses := []entity.RoomStatus{
		{StatusName: "Available", Code: "available"},
		{StatusName: "Under Maintenance", Code: "maintenance"},
		{StatusName: "Unavailable", Code: "unavailable"},
		{StatusName: "Damaged", Code: "damaged"},
	}

	for _, status := range roomStatuses {
		db.FirstOrCreate(&status, entity.RoomStatus{Code: status.Code})

	}

	db.Exec("DELETE FROM room_types")
	db.Exec("DELETE FROM sqlite_sequence WHERE name = 'room_types'")
	roomTypes := []entity.RoomType{
		{TypeName: "Small Meeting Room", RoomSize: 18, Category: "meetingroom", EmployeeDiscount: 20},
		{TypeName: "Medium Meeting Room", RoomSize: 63, Category: "meetingroom", EmployeeDiscount: 20},
		{TypeName: "Training Room", RoomSize: 135, Category: "trainingroom", EmployeeDiscount: 20},
		{TypeName: "EVENT HALL", RoomSize: 1218, Category: "multifunctionroom", EmployeeDiscount: 20},
		{TypeName: "NE2 HALL 1", RoomSize: 1180, Category: "multifunctionroom", EmployeeDiscount: 20},
		{TypeName: "NE2 HALL 2", RoomSize: 487, Category: "multifunctionroom", EmployeeDiscount: 20},
		{TypeName: "Rental Space", ForRental: true, HasMultipleSizes: true, Category: "multifunctionroom"},
	}

	typeNameToID := map[string]uint{}
	for _, rt := range roomTypes {
		if strings.TrimSpace(rt.TypeName) == "" {
			fmt.Println("⚠️ Skip RoomType with empty name")
			continue
		}

		row := entity.RoomType{
			TypeName:         rt.TypeName,
			RoomSize:         rt.RoomSize,
			Category:         rt.Category,
			EmployeeDiscount: rt.EmployeeDiscount,
			ForRental:        rt.ForRental,
			HasMultipleSizes: rt.HasMultipleSizes,
		}

		if err := db.Where("type_name = ?", rt.TypeName).
			FirstOrCreate(&row).Error; err != nil {
			panic(err)
		}

		fmt.Printf("✅ Seeded RoomType: %s\n", row.TypeName)
		typeNameToID[row.TypeName] = row.ID
	}

	// จากนั้นใช้ typeNameToID กับ seed ห้องของคุณได้ตามเดิม

	var types []entity.RoomType
	db.Select("id, type_name").Find(&types)
	for _, t := range types {
		fmt.Println("RoomType:", t.ID, t.TypeName)
	}

	// 🔹 ข้อมูล RoomLayout
	roomLayout := []entity.RoomLayout{
		{LayoutName: "Class Room"},
		{LayoutName: "U-Shape"},
		{LayoutName: "Theater"},
		{LayoutName: "Group"},
	}
	for _, layout := range roomLayout {
		db.FirstOrCreate(&layout, entity.RoomLayout{
			LayoutName: layout.LayoutName,
		})
	}

	// สร้าง map ชื่อ → id
	typeNameToID = map[string]uint{}
	{
		var types []entity.RoomType
		if err := db.Find(&types).Error; err != nil {
			panic(err)
		}
		for _, t := range types {
			typeNameToID[t.TypeName] = t.ID
		}
	}

	type layoutSeed struct {
		Capacity     int
		RoomLayoutID uint
		TypeName     string
		Note         string
	}

	roomTypeLayouts := []layoutSeed{
		// Small Meeting Room
		{Capacity: 6, RoomLayoutID: 2, TypeName: "Small Meeting Room"},

		// Medium Meeting Room
		{Capacity: 12, RoomLayoutID: 2, TypeName: "Medium Meeting Room"},

		// Training Room
		{Capacity: 60, RoomLayoutID: 1, TypeName: "Training Room"},
		{Capacity: 90, RoomLayoutID: 3, TypeName: "Training Room"},
		{Capacity: 40, RoomLayoutID: 4, TypeName: "Training Room"},

		// NE2 HALL 1
		{Capacity: 300, RoomLayoutID: 1, TypeName: "NE2 HALL 1"},
		{Capacity: 250, RoomLayoutID: 2, TypeName: "NE2 HALL 1"},
		{Capacity: 500, RoomLayoutID: 3, TypeName: "NE2 HALL 1"},
		{Capacity: 400, RoomLayoutID: 4, TypeName: "NE2 HALL 1", Note: "100 Group"},

		// NE2 HALL 2
		{Capacity: 120, RoomLayoutID: 1, TypeName: "NE2 HALL 2"},
		{Capacity: 100, RoomLayoutID: 2, TypeName: "NE2 HALL 2"},
		{Capacity: 200, RoomLayoutID: 3, TypeName: "NE2 HALL 2"},
		{Capacity: 120, RoomLayoutID: 4, TypeName: "NE2 HALL 2", Note: "30 Group"},
	}

	for _, l := range roomTypeLayouts {
		rtID := typeNameToID[l.TypeName]
		if rtID == 0 {
			panic("RoomType not found for layout: " + l.TypeName)
		}

		item := entity.RoomTypeLayout{
			Capacity:     l.Capacity,
			RoomLayoutID: l.RoomLayoutID,
			RoomTypeID:   rtID,
			Note:         l.Note,
		}

		if err := db.Where(&entity.RoomTypeLayout{
			RoomLayoutID: item.RoomLayoutID,
			RoomTypeID:   item.RoomTypeID,
		}).Assign(item).FirstOrCreate(&item).Error; err != nil {
			panic(err)
		}
	}

	// 🔹 ข้อมูล Users
	users := []entity.User{
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Admin",
			EmployeeID:     "EMP000",
			LastName:       "Admin",
			Email:          "admin@gmail.com",
			Password:       "123456",
			Phone:          "1234567890",
			ProfilePath:    "",
			SignaturePath:  "images/users/user_1/signature.jpg",
			RoleID:         5, // Admin (ID 5)
			JobPositionID:  1, // Software Developer
			GenderID:       1,
			IsEmployee:     true,
			RequestTypeID:  3,
			PrefixID:       1,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Manager",
			EmployeeID:     "EMP001",
			LastName:       "1",
			Email:          "manager1@gmail.com",
			Password:       "123456",
			Phone:          "1234567890",
			ProfilePath:    "",
			RoleID:         4, // Manager (ID 4)
			JobPositionID:  3, // Project Manager
			GenderID:       1,
			IsEmployee:     true,
			RequestTypeID:  1,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Manager",
			EmployeeID:     "EMP002",
			LastName:       "2",
			Email:          "manager2@gmail.com",
			Password:       "123456",
			Phone:          "1234567890",
			ProfilePath:    "",
			RoleID:         4,  // Manager (ID 4)
			JobPositionID:  10, // Product Manager
			GenderID:       1,
			IsEmployee:     true,
			RequestTypeID:  2,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Maintenance Operator",
			EmployeeID:     "EMP003",
			LastName:       "1",
			Email:          "maintenanceoperator1@gmail.com",
			Password:       "123456",
			Phone:          "1232323221",
			ProfilePath:    "",
			RoleID:         2,
			JobPositionID:  2, // System Administrator
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Maintenance Operator",
			EmployeeID:     "EMP004",
			LastName:       "2",
			Email:          "maintenanceoperator2@gmail.com",
			Password:       "123456",
			Phone:          "1232323222",
			ProfilePath:    "",
			RoleID:         2,
			JobPositionID:  2, // Network Engineer
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Document Operator",
			EmployeeID:     "EMP005",
			LastName:       "1",
			Email:          "documentoperator1@gmail.com",
			Password:       "123456",
			Phone:          "1232323223",
			ProfilePath:    "",
			RoleID:         3, // Document Operator (ID 3)
			JobPositionID:  2, // Business Analyst
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Document Operator",
			EmployeeID:     "EMP006",
			LastName:       "2",
			Email:          "documentoperator2@gmail.com",
			Password:       "123456",
			Phone:          "1232323224",
			ProfilePath:    "",
			RoleID:         3, // Document Operator (ID 3)
			JobPositionID:  4, // Quality Assurance
			GenderID:       1,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Internal",
			EmployeeID:     "879006",
			LastName:       "1",
			Email:          "internaluser1@gmail.com",
			Password:       "123456",
			Phone:          "9876543210",
			ProfilePath:    "",
			RoleID:         1,
			JobPositionID:  5, // Data Scientist
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Internal",
			EmployeeID:     "567007",
			LastName:       "2",
			Email:          "internaluser2@gmail.com",
			Password:       "123456",
			Phone:          "9876543210",
			ProfilePath:    "",
			RoleID:         1,
			JobPositionID:  2, // Research Assistant
			GenderID:       1,
			IsEmployee:     true,
		},
	}
	for i, user := range users {
		users[i].Password, _ = HashPassword(user.Password)
		db.FirstOrCreate(&users[i], entity.User{Email: user.Email})
	}

	rentalRooms := []entity.Room{
		{RoomNumber: "A101", FloorID: 1, RoomStatusID: 3, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A102", FloorID: 1, RoomStatusID: 3, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A103", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A104", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A105", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A106", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A107", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A108", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A109", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 212},
		{RoomNumber: "A110", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 176},
		{RoomNumber: "A111", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 176},
		{RoomNumber: "A112", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 212},

		{RoomNumber: "B101", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B102", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B103", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B104", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B105", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B106", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B107", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 252},
		{RoomNumber: "B108", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 252},
		{RoomNumber: "B109", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 252},
		{RoomNumber: "B110", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 36},

		{RoomNumber: "A201", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A202", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A203", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A204", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A205", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 56},
		{RoomNumber: "A206", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 36},
		{RoomNumber: "A207", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A208", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A209", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A210", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "A211", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 216},

		{RoomNumber: "B201", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B202", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B203", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B204", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B205", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B206", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 57},
		{RoomNumber: "B207", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 76},
		{RoomNumber: "B208", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 76},
		{RoomNumber: "B209", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 58},
		{RoomNumber: "B210", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 58},
		{RoomNumber: "B211", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 76},
		{RoomNumber: "B212", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 76},
		{RoomNumber: "B213", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B214", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B215", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B216", FloorID: 2, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},

		{RoomNumber: "B301", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 15},
		{RoomNumber: "B302", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 15},
		{RoomNumber: "B303", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 30},
		{RoomNumber: "B304", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 30},
		{RoomNumber: "B306", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 30},
		{RoomNumber: "B307", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 30},
		{RoomNumber: "B308", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 15},
		{RoomNumber: "B309", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 15},
		{RoomNumber: "B310", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B311", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B312", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B313", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B314", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B315", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B316", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B317", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B318", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B319", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B320", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B321", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B322", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B323", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
		{RoomNumber: "B324", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},
		{RoomNumber: "B325", FloorID: 3, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 100},

		{RoomNumber: "B402", FloorID: 4, RoomStatusID: 1, RoomTypeID: 7, RoomSize: 50},
	}
	for _, room := range rentalRooms {
		db.FirstOrCreate(&room, entity.Room{RoomNumber: room.RoomNumber})
	}

	type roomSeed struct {
		RoomNumber   string
		FloorID      uint
		RoomStatusID uint
		TypeName     string
	}

	rooms := []roomSeed{
		// Small meeting room
		{"A302", 1, 1, "Small Meeting Room"},
		{"A303", 1, 1, "Small Meeting Room"},
		{"A304", 1, 1, "Small Meeting Room"},
		{"A306", 1, 1, "Small Meeting Room"},
		{"A307", 1, 1, "Small Meeting Room"},
		{"A308", 1, 1, "Small Meeting Room"},

		// Medium room
		{"A301", 1, 1, "Medium Meeting Room"},
		{"A309", 1, 1, "Medium Meeting Room"},
		{"A102", 1, 1, "Medium Meeting Room"},
		{"B403", 1, 1, "Medium Meeting Room"},
		{"B409", 1, 1, "Medium Meeting Room"},

		// Training room
		{"B405", 1, 1, "Training Room"},
		{"B407", 1, 1, "Training Room"},
		{"B404", 1, 1, "Training Room"},
		{"B408", 1, 1, "Training Room"},

		// NE2 Hall 1
		{"A305", 1, 1, "NE2 HALL 1"},

		// NE2 Hall 2 (✅ แก้เป็น B406)
		{"B406", 1, 1, "NE2 HALL 2"},

		// Event Hall — ตามเดิม (มีอะไรก็ใช้ชื่อที่มีอยู่ เช่น LARGE-01)
		// {"LARGE-01", 1, 1, "EVENT HALL"},
	}

	for _, r := range rooms {
		rtID := typeNameToID[r.TypeName]
		if rtID == 0 {
			panic("RoomType not found for room: " + r.TypeName)
		}

		room := entity.Room{
			RoomNumber:   r.RoomNumber,
			FloorID:      r.FloorID,
			RoomStatusID: r.RoomStatusID,
			RoomTypeID:   rtID,
		}

		if err := db.Where(&entity.Room{RoomNumber: room.RoomNumber}).
			Assign(room).
			FirstOrCreate(&room).Error; err != nil {
			panic(err)
		}
	}

	// (ออปชัน) ถ้าเคยมี A406 ผิดประเภทอยู่ ลบทิ้ง
	if err := db.Where("room_number = ?", "A406").Delete(&entity.Room{}).Error; err != nil {
		panic(err)
	}

	// 🔹 ข้อมูล Packages
	packages := []entity.Package{

		{
			PackageName:            "None",
			MeetingRoomLimit:       0,
			TrainingRoomLimit:      0,
			MultiFunctionRoomLimit: 0,
		},
		{
			PackageName:            "Silver",
			MeetingRoomLimit:       2,
			TrainingRoomLimit:      5,
			MultiFunctionRoomLimit: 3,
		},
		{
			PackageName:            "Gold",
			MeetingRoomLimit:       5,
			TrainingRoomLimit:      10,
			MultiFunctionRoomLimit: 5,
		},
		{
			PackageName:            "Platinum",
			MeetingRoomLimit:       7,
			TrainingRoomLimit:      12,
			MultiFunctionRoomLimit: 7,
		},
		{
			PackageName:            "Diamond",
			MeetingRoomLimit:       10,
			TrainingRoomLimit:      15,
			MultiFunctionRoomLimit: 19,
		},
	}
	for _, pkg := range packages {
		db.FirstOrCreate(&pkg, entity.Package{PackageName: pkg.PackageName})
	}

	// 🔹 ข้อมูล UserPackage
	userPackage := entity.UserPackage{
		UserID:                &users[0].ID,
		PackageID:             packages[0].ID,
		MeetingRoomUsed:       2,
		TrainingRoomUsed:      1,
		MultiFunctionRoomUsed: 0,
	}
	db.FirstOrCreate(&userPackage)

	// 🔹 ข้อมูล MaintenanceTypes
	maintenanceTypes := []entity.MaintenanceType{
		{TypeName: "Electrical Work"},
		{TypeName: "Air Conditioning Work"},
		{TypeName: "Internet Work"},
		{TypeName: "Plumbing Work"},
		{TypeName: "Structural Work"},
		{TypeName: "Other Work"},
	}
	for _, mt := range maintenanceTypes {
		db.FirstOrCreate(&mt, entity.MaintenanceType{TypeName: mt.TypeName})
	}

	// 🔹 ข้อมูล MaintenanceRequest
	startTime, _ := time.Parse("15:04:05", "15:00:00")
	endTime, _ := time.Parse("15:04:05", "18:00:00")
	maintenanceRequests := []entity.MaintenanceRequest{
		{
			Description:       "Fix the AC",
			StartTime:         startTime,
			EndTime:           endTime,
			UserID:            6,
			RoomID:            1,
			RequestStatusID:   2,
			AreaID:            1,
			MaintenanceTypeID: 1,
		},
		{
			Description:       "Fix the AC",
			StartTime:         startTime,
			EndTime:           endTime,
			UserID:            9,
			RoomID:            2,
			RequestStatusID:   4,
			AreaID:            1,
			MaintenanceTypeID: 3,
		},
	}
	for _, mr := range maintenanceRequests {
		db.FirstOrCreate(&mr, entity.MaintenanceRequest{
			Description: mr.Description,
			StartTime:   mr.StartTime,
			EndTime:     mr.EndTime,
			UserID:      mr.UserID,
			RoomID:      mr.RoomID,
		})
	}

	// 🔹 ข้อมูล ManagerApproval
	managerApproval := entity.ManagerApproval{
		UserID:          3,
		RequestID:       2,
		RequestStatusID: 3,
	}
	db.FirstOrCreate(&managerApproval)

	// 🔹 ข้อมูล MaintenanceTask
	maintenanceTask := entity.MaintenanceTask{
		UserID:          5,
		RequestID:       2,
		RequestStatusID: 4,
	} // In Progress
	db.FirstOrCreate(&maintenanceTask)

	// 🔹 ข้อมูล MaintenanceImage
	maintenanceImage := entity.MaintenanceImage{
		FilePath:  "/images/ac_repair.jpg",
		RequestID: 1,
	}
	db.FirstOrCreate(&maintenanceImage)

	// 🔹 ข้อมูล TimeSlot (เวอร์ชันใหม่ 08:30–16:30)
	timeSlots := []entity.TimeSlot{
		// ครึ่งวัน / เต็มวัน
		{TimeSlotName: "Morning", StartTime: parseTime("08:30"), EndTime: parseTime("12:30")},
		{TimeSlotName: "Afternoon", StartTime: parseTime("12:30"), EndTime: parseTime("16:30")},
		{TimeSlotName: "Fullday", StartTime: parseTime("08:30"), EndTime: parseTime("16:30")},

		// รายชั่วโมง (8 ช่วง)
		{TimeSlotName: "08:30-09:30", StartTime: parseTime("08:30"), EndTime: parseTime("09:30")},
		{TimeSlotName: "09:30-10:30", StartTime: parseTime("09:30"), EndTime: parseTime("10:30")},
		{TimeSlotName: "10:30-11:30", StartTime: parseTime("10:30"), EndTime: parseTime("11:30")},
		{TimeSlotName: "11:30-12:30", StartTime: parseTime("11:30"), EndTime: parseTime("12:30")},
		{TimeSlotName: "12:30-13:30", StartTime: parseTime("12:30"), EndTime: parseTime("13:30")},
		{TimeSlotName: "13:30-14:30", StartTime: parseTime("13:30"), EndTime: parseTime("14:30")},
		{TimeSlotName: "14:30-15:30", StartTime: parseTime("14:30"), EndTime: parseTime("15:30")},
		{TimeSlotName: "15:30-16:30", StartTime: parseTime("15:30"), EndTime: parseTime("16:30")},
	}

	for _, slot := range timeSlots {
		db.FirstOrCreate(&slot, entity.TimeSlot{
			TimeSlotName: slot.TimeSlotName,
			StartTime:    slot.StartTime,
			EndTime:      slot.EndTime,
		})

	}

	roomPrices := []entity.RoomPrice{
		// ----- RoomTypeID 1 (ห้องเล็ก) -----
		{Price: 500, TimeSlotID: 1, RoomTypeID: 1},  // เช้า
		{Price: 500, TimeSlotID: 2, RoomTypeID: 1},  // บ่าย
		{Price: 1000, TimeSlotID: 3, RoomTypeID: 1}, // เต็มวัน
		{Price: 200, TimeSlotID: 4, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 5, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 6, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 7, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 8, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 9, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 10, RoomTypeID: 1},
		{Price: 200, TimeSlotID: 11, RoomTypeID: 1},

		// ----- RoomTypeID 2..7 (ราคาเท่ากัน) -----
		// ถ้าต้องการแตกต่างในอนาคต แก้เฉพาะบล็อคของ rt นั้น ๆ ได้เลย
	}

	// เพิ่มรายการของ RoomType 2..7 (morning/afternoon/fullDay + hourly)
	for rt := 2; rt <= 7; rt++ {
		roomPrices = append(roomPrices,
			entity.RoomPrice{Price: 1000, TimeSlotID: 1, RoomTypeID: uint(rt)}, // เช้า
			entity.RoomPrice{Price: 1000, TimeSlotID: 2, RoomTypeID: uint(rt)}, // บ่าย
			entity.RoomPrice{Price: 2000, TimeSlotID: 3, RoomTypeID: uint(rt)}, // เต็มวัน
			entity.RoomPrice{Price: 400, TimeSlotID: 4, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 5, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 6, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 7, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 8, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 9, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 10, RoomTypeID: uint(rt)},
			entity.RoomPrice{Price: 400, TimeSlotID: 11, RoomTypeID: uint(rt)},
		)
	}

	// เขียนลงฐาน: ถ้ามีอยู่แล้ว → อัปเดตราคา, ถ้าไม่มี → สร้าง
	for _, rp := range roomPrices {
		var out entity.RoomPrice
		db.
			Where("room_type_id = ? AND time_slot_id = ?", rp.RoomTypeID, rp.TimeSlotID).
			Assign(&entity.RoomPrice{Price: rp.Price}).
			FirstOrCreate(&out)

	}

	for _, rp := range roomPrices {
		db.FirstOrCreate(&rp, entity.RoomPrice{
			TimeSlotID: rp.TimeSlotID,
			RoomTypeID: rp.RoomTypeID,
			Price:      rp.Price,
		})

	}

	bookingStatus := []entity.BookingStatus{
		{StatusName: "pending approval"},
		{StatusName: "Pending Payment"},
		{StatusName: "Partially Paid"},
		{StatusName: "Awaiting Receipt"},
		{StatusName: "Completed"},
		{StatusName: "Cancelled"},
	}
	for _, bs := range bookingStatus {
		db.FirstOrCreate(&bs, entity.BookingStatus{StatusName: bs.StatusName})
	}

	// 🔹 ข้อมูล Equipment
	equipments := []entity.Equipment{
		{EquipmentName: "Projector"},
		{EquipmentName: "Microphone"},
		{EquipmentName: "Whiteboard"},
		{EquipmentName: "Table"},
		{EquipmentName: "Chair"},
	}
	for _, e := range equipments {
		db.FirstOrCreate(&e, entity.Equipment{EquipmentName: e.EquipmentName})
	}

	roomEquipments := []entity.RoomEquipment{
		{RoomTypeID: 1, EquipmentID: 1, Quantity: 1},  // A302 มีโปรเจคเตอร์ 1 ตัว
		{RoomTypeID: 1, EquipmentID: 2, Quantity: 2},  // A302 มีไมโครโฟน 2 ตัว
		{RoomTypeID: 2, EquipmentID: 3, Quantity: 1},  // A303 มีไวท์บอร์ด 1 อัน
		{RoomTypeID: 2, EquipmentID: 4, Quantity: 10}, // A303 มีโต๊ะ 10 ตัว
		{RoomTypeID: 2, EquipmentID: 5, Quantity: 20}, // A303 มีเก้าอี้ 20 ตัว
	}
	for _, re := range roomEquipments {
		db.FirstOrCreate(&re, entity.RoomEquipment{
			RoomTypeID:  re.RoomTypeID,
			EquipmentID: re.EquipmentID,
			Quantity:    re.Quantity,
		})

	}

	// Payment
	// now := time.Now()
	// payments := []entity.Payment{}
	// for i := 0; i < 7; i++ {
	// 	p := entity.Payment{
	// 		PaymentDate:   now.AddDate(0, 0, -i),
	// 		Amount:        float64(500 + i*100),
	// 		SlipPath:      fmt.Sprintf("/slips/booking_payment%d.jpg", i+1),
	// 		Note:          fmt.Sprintf("Payment for BookingRoom %d", i+1),
	// 		PayerID:       users[2+i%len(users)].ID,
	// 		StatusID:      2,
	// 		BookingRoomID: uint(i + 1),
	// 	}
	// 	payments = append(payments, p)
	// }

	// for i := 0; i < 7; i++ {
	// 	p := entity.Payment{
	// 		PaymentDate:         now.AddDate(0, 0, -i),
	// 		Amount:              float64(1000 + i*200),
	// 		SlipPath:            fmt.Sprintf("/slips/invoice_payment%d.jpg", i+1),
	// 		Note:                fmt.Sprintf("Payment for Invoice %d", i+3),
	// 		PayerID:             users[2+i%len(users)].ID,
	// 		StatusID:            4,
	// 		RentalRoomInvoiceID: uint(i + 3),
	// 	}
	// 	payments = append(payments, p)
	// }
	// for _, p := range payments {
	// 	db.FirstOrCreate(&p, entity.Payment{
	// 		BookingRoomID:       p.BookingRoomID,
	// 		RentalRoomInvoiceID: p.RentalRoomInvoiceID,
	// 		PayerID:             p.PayerID,
	// 		Amount:              p.Amount,
	// 	})

	// }
	// 🔹 ข้อมูล News
	news := []entity.News{
		{
			Title:        "Announcement: Holiday Closure",
			Summary:      "The office will be closed next week due to the holiday.",
			FullContent:  "📢 [Announcement: Holiday Closure]\n\nPlease be informed that our office will be closed from Monday to Friday next week due to the annual holiday. During this period, all services including support and operations will be temporarily suspended. We apologize for any inconvenience this may cause and appreciate your understanding.\n\n📆 Office will reopen as usual on the following Monday. Have a great holiday!",
			DisplayStart: time.Now(),
			DisplayEnd:   time.Now().Add(7 * 24 * time.Hour),
			IsPinned:     true,
			UserID:       1,
		},
		{
			Title:        "New Lab Equipment Arrival",
			Summary:      "Brand new lab equipment has just arrived and is now available!",
			FullContent:  "🧪 [New Lab Equipment Now Available]\n\nWe’re excited to announce the arrival of new state-of-the-art laboratory equipment! These tools are now available for reservation and use by registered users. Whether you're working on research, development, or testing – the new equipment is here to support your innovation.\n\n💡 Please log in to the reservation system to book your preferred time slots. For more info, contact the Lab Management Team.",
			DisplayStart: time.Now(),
			DisplayEnd:   time.Now().Add(10 * 24 * time.Hour),
			IsPinned:     true,
			UserID:       1,
		},
		{
			Title:        "Maintenance Notice",
			Summary:      "Scheduled server maintenance this Friday night.",
			FullContent:  "⚙️ [Maintenance Notification]\n\nPlease be advised that there will be a scheduled server maintenance this Friday (10 PM - 2 AM). During this time, some services may be temporarily unavailable, including the website and internal systems.\n\n🔧 This maintenance is essential to ensure long-term system stability and improve performance. We recommend saving your work and logging out before 10 PM.\n\nThank you for your patience and cooperation.",
			DisplayStart: time.Now(),
			DisplayEnd:   time.Now().Add(5 * 24 * time.Hour),
			IsPinned:     true,
			UserID:       1,
		},
		{
			Title:        "Workshop: AI for Beginners",
			Summary:      "Join our free AI workshop for beginners next month!",
			FullContent:  "🤖 [Free Workshop: AI for Beginners]\n\nAre you curious about Artificial Intelligence but don't know where to start? We’ve got you covered! Our beginner-friendly AI workshop will be held next month and is open to all students and staff interested in technology and data science.\n\n📚 Topics include: Intro to AI, Machine Learning Basics, and Hands-On Sessions. No prior coding experience is required.\n\n📍 Limited seats available — Register now via our website!",
			DisplayStart: time.Now(),
			DisplayEnd:   time.Now().Add(14 * 24 * time.Hour),
			IsPinned:     false,
			UserID:       1,
		},
		{
			Title:        "Internship Program Open",
			Summary:      "Applications for our internship program are now open!",
			FullContent:  "🚀 [Internship Program Now Accepting Applications]\n\nAre you ready to kickstart your career? Our Internship Program for the upcoming semester is now officially open! This is a fantastic opportunity to gain real-world experience, work with expert mentors, and build valuable skills in your field of interest.\n\n📌 Open to undergraduate and graduate students.\n📝 Apply online before the deadline: [insert date here]\n\nDon't miss this chance to grow your future with us!",
			DisplayStart: time.Now(),
			DisplayEnd:   time.Now().Add(30 * 24 * time.Hour),
			IsPinned:     false,
			UserID:       1,
		},
	}
	for _, n := range news {
		db.FirstOrCreate(&n, entity.News{
			Title: n.Title,
		})
	}

	// 🔹 ข้อมูล OrganizationInfo
	orInfo := entity.OrganizationInfo{
		NameTH:      "อุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2",
		NameEN:      "Regional Science Park Northeast 2",
		Slogan:      "A leading science and technology center committed to innovation and supporting efficient work processes.",
		LogoPath:    "images/organization/logo/logo_1.png",
		Description: "Dedicated to developing and supporting research in science and technology to enhance quality of life and drive the nation's economy. We provide a comprehensive support system including repair requests, meeting room bookings, and many other services to enable personnel to work at their highest efficiency.",
		Address:     "Science Center Building \nNo. 123 Science Road \nBangkok 10900",
		Phone:       "02-123-4567",
		Email:       "contact@scipark.org",
		FacebookUrl: "https://www.facebook.com/RSPNortheast2",
	}
	db.FirstOrCreate(&orInfo, entity.RequestType{})

	// 🔹 ข้อมูล BusinessGroup
	businessGroups := []entity.BusinessGroup{
		{Name: "IT Software & Digital Content"},
		{Name: "Agriculture & Food"},
		{Name: "Energy Tech & Material"},
		{Name: "Medical & Bio-Tech"},
	}
	for _, businessGroup := range businessGroups {
		db.FirstOrCreate(&businessGroup, entity.BusinessGroup{Name: businessGroup.Name})
	}

	// 🔹 ข้อมูล CompanySize
	companySizes := []entity.CompanySize{
		{Name: "Small (1-50 employees)"},
		{Name: "Medium (51-200 employees)"},
		{Name: "Large (201-1000 employees)"},
		{Name: "Enterprise (1000+ employees)"},
	}
	for _, companySize := range companySizes {
		db.FirstOrCreate(&companySize, entity.CompanySize{Name: companySize.Name})
	}

	// 🔹 ข้อมูล ServiceUserType
	serviceUserTypes := []entity.ServiceUserType{
		{Name: "Direct R&D", Description: "ผู้ใช้บริการวิจัยและพัฒนาระยะตรง"},
		{Name: "R&D Support", Description: "ผู้ใช้บริการสนับสนุนการวิจัยและพัฒนา"},
		{Name: "Strategic Partners", Description: "พันธมิตรเชิงกลยุทธ์"},
		{Name: "Ecosystem", Description: "ผู้ใช้บริการในระบบนิเวศ"},
	}
	for _, serviceUserType := range serviceUserTypes {
		db.FirstOrCreate(&serviceUserType, entity.ServiceUserType{Name: serviceUserType.Name})
	}

	// 🔹 ข้อมูล ContributorType
	contributorTypes := []entity.ContributorType{
		{Name: "Developer"},
		{Name: "Supervisor"},
		{Name: "Sponsor"},
	}
	for _, contributorType := range contributorTypes {
		db.FirstOrCreate(&contributorType, entity.Contributor{
			Name: contributorType.Name,
		})
	}

	// 🔹 ข้อมูล Contributor
	devInfos := []entity.Contributor{
		{
			Name:              "Mr. Warawut Mueanduang",
			Email:             "ohmjares.22@gmail.com",
			GithubUrl:         "https://github.com/jares22",
			FacebookUrl:       "https://www.facebook.com/ome.warawut.9",
			Phone:             "064-317-7232",
			ProfilePath:       "images/organization/developers/Warawut_Mueanduang.jpg",
			Role:              "Full Stack Developer",
			Bio:               "Passionate Full Stack Developer with a growth mindset, focused on clean architecture, seamless web apps, and always ready to collaborate.",
			ContributorTypeID: 1,
		},
		{
			Name:              "Mr. Chanchai Lertsri",
			Email:             "chanchai.radsee@gmail.com",
			GithubUrl:         "https://github.com/Chanchai2004",
			FacebookUrl:       "https://www.facebook.com/got.chanchai.2025",
			Phone:             "093-304-3468",
			ProfilePath:       "images/organization/developers/Chanchai_Lertsri.jpg",
			Role:              "Full Stack Developer",
			Bio:               "Full Stack Developer with a growth mindset, dedicated to crafting high-quality web applications with clean architecture and seamless user experiences.",
			ContributorTypeID: 1,
		},
		{
			Name:              "Mr. Poonchub Nanawan",
			Email:             "poonchubnanawan310@gmail.com",
			GithubUrl:         "https://github.com/poonchub",
			FacebookUrl:       "https://www.facebook.com/poonsub.nanawan/",
			Phone:             "098-594-4576",
			ProfilePath:       "images/organization/developers/Poonchub_Nanawan.jpg",
			Role:              "Full Stack Developer",
			Bio:               "Full Stack Developer with a passion for creating clean, efficient, and user-friendly web applications.",
			ContributorTypeID: 1,
		},
		{
			Name:              "Dr. Komsan Srivisut",
			Email:             "komsan@sut.ac.th",
			GithubUrl:         "",
			FacebookUrl:       "https://www.facebook.com/srivisut",
			Phone:             "",
			ProfilePath:       "images/organization/supervisors/Komsan_Srivisut.jpg",
			Role:              "Supervisor",
			Bio:               "",
			ContributorTypeID: 2,
		},
		{
			Name:              "Asst. Prof. Dr. Paphakorn Pittayachaval",
			Email:             "paphakorn@sut.ac.th",
			GithubUrl:         "",
			FacebookUrl:       "https://www.facebook.com/srivisut",
			Phone:             "",
			ProfilePath:       "images/organization/sponsors/Paphakorn_Pittayachaval.jpg",
			Role:              "Industry Sponsor",
			Bio:               "Director of the Regional Science Park Northeast 2 and Lecturer in Industrial Engineering, School of Engineering",
			ContributorTypeID: 3,
		},
	}
	for _, devInfo := range devInfos {
		db.FirstOrCreate(&devInfo, entity.Contributor{
			Name:  devInfo.Name,
			Email: devInfo.Email,
		})
	}

	// PaymentStatus (ใช้ร่วมกันทั้ง Payment และ Invoice)
	paymentStatuses := []entity.PaymentStatus{
		// ---- สาย Payment (เดิม) ----
		{Name: "Pending Payment"},      // ยังไม่ได้จ่าย/รอจ่าย
		{Name: "Pending Verification"}, // จ่ายแล้วแต่รอเจ้าหน้าที่ตรวจสลิป
		{Name: "Awaiting Receipt"},     // ตรวจสลิปแล้ว รอออกใบเสร็จ
		{Name: "Paid"},                 // จ่ายแล้วและตรวจสอบเรียบร้อย
		{Name: "Rejected"},             // สลิปไม่ถูกต้อง / ต้องอัปโหลดใหม่
		{Name: "Refunded"},             // คืนเงินแล้ว

		// ---- สาย Invoice (ใหม่) ----
		{Name: "Unpaid"},         // ออกใบแจ้งหนี้แล้วยังไม่ชำระ
		{Name: "Partially Paid"}, // ชำระมาแล้วบางส่วน
		{Name: "Overdue"},        // เกินกำหนดชำระ (เช็กด้วย job รายวัน)
		{Name: "Voided"},         // ยกเลิกใบแจ้งหนี้ (ไม่ใช้เรียกเก็บแล้ว)

	}
	for _, status := range paymentStatuses {
		db.FirstOrCreate(&status, entity.PaymentStatus{
			Name: status.Name,
		})
	}

	// PaymentTypes
	paymentTypes := []entity.PaymentType{
		{TypeName: "Deposit"},
		{TypeName: "Balance"},
		{TypeName: "Full"},
	}
	for _, ptype := range paymentTypes {
		db.FirstOrCreate(&ptype, entity.PaymentType{
			TypeName: ptype.TypeName,
		})
	}

	// PaymentOptions
	paymentOptions := []entity.PaymentOption{
		{OptionName: "Deposit"},
		{OptionName: "Full"},
	}
	for _, op := range paymentOptions {
		db.FirstOrCreate(&op, entity.PaymentOption{
			OptionName: op.OptionName,
		})
	}

	// Request Service Area
	requestServiceAreas := []entity.RequestServiceArea{
		{
			UserID:                             10,
			RequestStatusID:                    2, // Pending
			PurposeOfUsingSpace:                "Project Alpha - AI Research Lab",
			NumberOfEmployees:                  5,
			ActivitiesInBuilding:               "Research and Development of AI algorithms",
			SupportingActivitiesForSciencePark: "Collaboration with startups and research institutions",
			ServiceRequestDocument:             "images/ServiceAreaDocuments/request_3/contracts/contract_0.pdf",
		},
		{
			UserID:                             10,
			RequestStatusID:                    3, // In Progress
			PurposeOfUsingSpace:                "Project Beta - Biotech Innovation Center",
			NumberOfEmployees:                  3,
			ActivitiesInBuilding:               "Workshop and prototyping for biotech products",
			SupportingActivitiesForSciencePark: "Innovation lab support and mentorship programs",
			ServiceRequestDocument:             "images/ServiceAreaDocuments/request_4/contracts/contract_0.pdf",
		},
		{
			UserID:                             11,
			RequestStatusID:                    6, // Completed
			PurposeOfUsingSpace:                "Project Gamma - Clean Energy Solutions",
			NumberOfEmployees:                  8,
			ActivitiesInBuilding:               "Development of renewable energy technologies",
			SupportingActivitiesForSciencePark: "Supporting green technology startups",
			ServiceRequestDocument:             "images/ServiceAreaDocuments/request_7/contracts/contract_0.pdf",
		},
		{
			UserID:                             12,
			RequestStatusID:                    3, // In Progress
			PurposeOfUsingSpace:                "Project Delta - Fintech Innovation Hub",
			NumberOfEmployees:                  6,
			ActivitiesInBuilding:               "Financial technology development and testing",
			SupportingActivitiesForSciencePark: "Supporting fintech startups and financial innovation",
			ServiceRequestDocument:             "images/ServiceAreaDocuments/request_8/contracts/contract_0.pdf",
		},
		{
			UserID:                             13,
			RequestStatusID:                    6, // Completed
			PurposeOfUsingSpace:                "Project Epsilon - IoT Solutions Lab",
			NumberOfEmployees:                  4,
			ActivitiesInBuilding:               "Internet of Things device development and testing",
			SupportingActivitiesForSciencePark: "Supporting IoT startups and smart city initiatives",
			ServiceRequestDocument:             "images/ServiceAreaDocuments/request_9/contracts/contract_0.pdf",
		},
	}
	for _, req := range requestServiceAreas {
		db.FirstOrCreate(&req, entity.RequestServiceArea{
			UserID: req.UserID,
		})
	}

	// Service Area Tasks (สำหรับงานที่ assign ให้ Operator)
	serviceAreaTasks := []entity.ServiceAreaTask{
		{
			UserID:               6, // Operator ID
			RequestServiceAreaID: 2, // Project Beta (In Progress)
			Note:                 "Assigned to review and process biotech innovation center setup",
			IsCancel:             false,
		},
		{
			UserID:               6, // Operator ID
			RequestServiceAreaID: 4, // Project Delta (In Progress)
			Note:                 "Assigned to review and process fintech innovation hub setup",
			IsCancel:             false,
		},
		{
			UserID:               6, // Operator ID
			RequestServiceAreaID: 1, // Project Alpha (Pending)
			Note:                 "Assigned to review AI research lab requirements",
			IsCancel:             false,
		},
	}
	for _, task := range serviceAreaTasks {
		db.FirstOrCreate(&task, entity.ServiceAreaTask{
			UserID:               task.UserID,
			RequestServiceAreaID: task.RequestServiceAreaID,
		})
	}

	// Service Area Documents (สำหรับงานที่ Complete แล้ว)
	serviceAreaDocuments := []entity.ServiceAreaDocument{
		{
			RequestServiceAreaID:    3, // Project Gamma (Completed)
			ServiceContractDocument: "images/ServiceAreaDocuments/request_7/contracts/contract_0.pdf",
			AreaHandoverDocument:    "images/ServiceAreaDocuments/request_7/handovers/handover_0.pdf",
			QuotationDocument:       "images/ServiceAreaDocuments/request_7/quotations/quotation_0.pdf",
			RefundGuaranteeDocument: "images/ServiceAreaDocuments/refund_guarantee_11_1757311043.pdf",
			ContractNumber:          "SC-2024-001",
			ContractStartAt:         time.Date(2024, 1, 15, 0, 0, 0, 0, time.UTC),
			ContractEndAt:           time.Date(2024, 12, 31, 0, 0, 0, 0, time.UTC),
			RoomID:                  1,
			ServiceUserTypeID:       1,
		},
		{
			RequestServiceAreaID:    5, // Project Epsilon (Completed)
			ServiceContractDocument: "images/ServiceAreaDocuments/request_9/contracts/contract_0.pdf",
			AreaHandoverDocument:    "images/ServiceAreaDocuments/request_9/handovers/handover_0.pdf",
			QuotationDocument:       "images/ServiceAreaDocuments/request_9/quotations/quotation_0.pdf",
			RefundGuaranteeDocument: "images/ServiceAreaDocuments/refund_guarantee_11_1757311043.pdf",
			ContractNumber:          "SC-2024-002",
			ContractStartAt:         time.Date(2024, 2, 1, 0, 0, 0, 0, time.UTC),
			ContractEndAt:           time.Date(2024, 11, 30, 0, 0, 0, 0, time.UTC),
			RoomID:                  2,
			ServiceUserTypeID:       2,
		},
	}
	for _, doc := range serviceAreaDocuments {
		db.FirstOrCreate(&doc, entity.ServiceAreaDocument{
			RequestServiceAreaID: doc.RequestServiceAreaID,
		})
	}

	// AboutCompany data for internal users
	aboutCompanies := []entity.AboutCompany{
		{
			UserID:                      1,
			CorporateRegistrationNumber: "1234567890123",
			BusinessGroupID:             &[]uint{1}[0], // IT Software & digital content
			CompanySizeID:               &[]uint{1}[0], // Small (1-50 employees)
			MainServices:                "Software Development, Digital Content Creation",
			RegisteredCapital:           1000000.00,
			HiringRate:                  5,
			ResearchInvestmentValue:     500000.00,
			ThreeYearGrowthForecast:     "Expected 50% growth in software development services",
		},
		{
			UserID:                      2,
			CorporateRegistrationNumber: "9876543210987",
			BusinessGroupID:             &[]uint{2}[0], // Agriculture & Food
			CompanySizeID:               &[]uint{2}[0], // Medium (51-200 employees)
			MainServices:                "Agricultural Research, Food Processing",
			RegisteredCapital:           5000000.00,
			HiringRate:                  15,
			ResearchInvestmentValue:     2000000.00,
			ThreeYearGrowthForecast:     "Expected 30% growth in agricultural technology",
		},
		// เพิ่ม AboutCompany สำหรับ internal users ที่เหลือ
		{
			UserID:                      3,
			CorporateRegistrationNumber: "1111111111111",
			BusinessGroupID:             &[]uint{3}[0], // Energy Tech & Material
			CompanySizeID:               &[]uint{1}[0], // Small (1-50 employees)
			MainServices:                "Energy Research & Development",
			RegisteredCapital:           2000000.00,
			HiringRate:                  8,
			ResearchInvestmentValue:     300000.00,
			ThreeYearGrowthForecast:     "Expected 40% growth in energy technology",
		},
		{
			UserID:                      4,
			CorporateRegistrationNumber: "2222222222222",
			BusinessGroupID:             &[]uint{4}[0], // Medical & Bio-Tech
			CompanySizeID:               &[]uint{2}[0], // Medium (51-200 employees)
			MainServices:                "Medical Research & Biotechnology",
			RegisteredCapital:           3000000.00,
			HiringRate:                  12,
			ResearchInvestmentValue:     400000.00,
			ThreeYearGrowthForecast:     "Expected 35% growth in medical technology",
		},
		{
			UserID:                      5,
			CorporateRegistrationNumber: "3333333333333",
			BusinessGroupID:             &[]uint{1}[0], // IT Software & Digital Content
			CompanySizeID:               &[]uint{1}[0], // Small (1-50 employees)
			MainServices:                "Digital Content & Software Solutions",
			RegisteredCapital:           1500000.00,
			HiringRate:                  6,
			ResearchInvestmentValue:     250000.00,
			ThreeYearGrowthForecast:     "Expected 45% growth in digital content",
		},
		{
			UserID:                      6,
			CorporateRegistrationNumber: "4444444444444",
			BusinessGroupID:             &[]uint{2}[0], // Agriculture & Food
			CompanySizeID:               &[]uint{1}[0], // Small (1-50 employees)
			MainServices:                "Agricultural Technology & Food Innovation",
			RegisteredCapital:           1800000.00,
			HiringRate:                  7,
			ResearchInvestmentValue:     280000.00,
			ThreeYearGrowthForecast:     "Expected 38% growth in agricultural technology",
		},
	}

	for _, aboutCompany := range aboutCompanies {
		db.FirstOrCreate(&aboutCompany, entity.AboutCompany{
			UserID: aboutCompany.UserID,
		})
	}

	// ===== Mock External Users with AboutCompany, RequestServiceArea, CollaborationPlans =====
	// Step 1: Create 5 External Users
	externalUsers := []entity.User{
		{CompanyName: "MediCare", FirstName: "External", LastName: "A", Email: "ext.a@example.com", Password: "123456", BusinessDetail: "Healthcare Services", Phone: "0800000001", RoleID: 1, IsEmployee: false, IsBusinessOwner: true},
		{CompanyName: "AgriNova", FirstName: "External", LastName: "B", Email: "ext.b@example.com", Password: "123456", BusinessDetail: "Smart Farming", Phone: "0800000002", RoleID: 1, IsEmployee: false, IsBusinessOwner: true},
		{CompanyName: "EnergyTech Co.", FirstName: "External", LastName: "C", Email: "ext.c@example.com", Password: "123456", BusinessDetail: "Renewable Energy Materials", Phone: "0800000003", RoleID: 1, IsEmployee: false, IsBusinessOwner: true},
		{CompanyName: "BioHealth Ltd.", FirstName: "External", LastName: "D", Email: "ext.d@example.com", Password: "123456", BusinessDetail: "BioTech R&D", Phone: "0800000004", RoleID: 1, IsEmployee: false, IsBusinessOwner: true},
		{CompanyName: "SoftLab Studio", FirstName: "External", LastName: "E", Email: "ext.e@example.com", Password: "123456", BusinessDetail: "Software & Digital", Phone: "0800000005", RoleID: 1, IsEmployee: false, IsBusinessOwner: true},
	}
	for i := range externalUsers {
		externalUsers[i].Password, _ = HashPassword(externalUsers[i].Password)
		db.FirstOrCreate(&externalUsers[i], entity.User{Email: externalUsers[i].Email})
	}

	// Helper to get pointer to uint
	ptr := func(u uint) *uint { return &u }

	// Step 2: AboutCompany for each external user (map to business groups: IT, Agriculture, Energy, Medical, IT)
	aboutCompaniesExt := []entity.AboutCompany{
		{UserID: externalUsers[0].ID, CorporateRegistrationNumber: "1329901260944", BusinessGroupID: ptr(4), CompanySizeID: ptr(1), MainServices: "Healthcare Services", RegisteredCapital: 1000000, HiringRate: 20, ResearchInvestmentValue: 17000, ThreeYearGrowthForecast: "Growth 10%"},
		{UserID: externalUsers[1].ID, CorporateRegistrationNumber: "2299012601234", BusinessGroupID: ptr(2), CompanySizeID: ptr(2), MainServices: "Smart Farming", RegisteredCapital: 5000000, HiringRate: 15, ResearchInvestmentValue: 25000, ThreeYearGrowthForecast: "Growth 15%"},
		{UserID: externalUsers[2].ID, CorporateRegistrationNumber: "3399012605678", BusinessGroupID: ptr(3), CompanySizeID: ptr(3), MainServices: "Renewable Energy Materials", RegisteredCapital: 8000000, HiringRate: 25, ResearchInvestmentValue: 35000, ThreeYearGrowthForecast: "Growth 20%"},
		{UserID: externalUsers[3].ID, CorporateRegistrationNumber: "4499012609876", BusinessGroupID: ptr(4), CompanySizeID: ptr(2), MainServices: "BioTech R&D", RegisteredCapital: 6000000, HiringRate: 18, ResearchInvestmentValue: 22000, ThreeYearGrowthForecast: "Growth 12%"},
		{UserID: externalUsers[4].ID, CorporateRegistrationNumber: "5599012604321", BusinessGroupID: ptr(1), CompanySizeID: ptr(1), MainServices: "Software & Digital", RegisteredCapital: 3000000, HiringRate: 10, ResearchInvestmentValue: 12000, ThreeYearGrowthForecast: "Growth 25%"},
	}
	for i := range aboutCompaniesExt {
		db.FirstOrCreate(&aboutCompaniesExt[i], entity.AboutCompany{UserID: aboutCompaniesExt[i].UserID})
	}

	// Step 3: For each external user, create 1-2 RequestServiceArea and 1-3 CollaborationPlans per request
	makeRSA := func(user entity.User, idx int) {
		// Create 1 or 2 requests depending on idx
		reqCount := 1
		if idx%2 == 0 { // for some users create 2
			reqCount = 2
		}
		for r := 1; r <= reqCount; r++ {
			req := entity.RequestServiceArea{
				UserID:                             user.ID,
				RequestStatusID:                    2,
				PurposeOfUsingSpace:                fmt.Sprintf("Project %c-%d", 'A'+idx, r),
				NumberOfEmployees:                  3 + r,
				ActivitiesInBuilding:               "R&D Activities",
				SupportingActivitiesForSciencePark: "Collaboration and workshops",
				ServiceRequestDocument:             "/img/testdocfile/test01.pdf",
			}
			db.FirstOrCreate(&req, entity.RequestServiceArea{UserID: user.ID, PurposeOfUsingSpace: req.PurposeOfUsingSpace})
			// Create 1-3 collaboration plans per request
			plans := []entity.CollaborationPlan{
				{RequestServiceAreaID: req.ID, CollaborationPlan: "Joint Research", CollaborationBudget: 10000, ProjectStartDate: time.Now().AddDate(0, 1, 0)},
				{RequestServiceAreaID: req.ID, CollaborationPlan: "Prototype Development", CollaborationBudget: 15000, ProjectStartDate: time.Now().AddDate(0, 2, 0)},
			}
			if r%2 == 0 {
				plans = append(plans, entity.CollaborationPlan{RequestServiceAreaID: req.ID, CollaborationPlan: "Pilot Testing", CollaborationBudget: 8000, ProjectStartDate: time.Now().AddDate(0, 3, 0)})
			}
			for _, p := range plans {
				db.FirstOrCreate(&p, entity.CollaborationPlan{RequestServiceAreaID: req.ID, CollaborationPlan: p.CollaborationPlan})
			}
		}
	}
	for i := range externalUsers {
		makeRSA(externalUsers[i], i)
	}

	serviceDocs := []entity.ServiceAreaDocument{
		{
			RequestServiceAreaID:    1,
			ServiceContractDocument: "path/to/contract1.pdf",
			AreaHandoverDocument:    "path/to/handover1.pdf",
			QuotationDocument:       "path/to/quotation1.pdf",
			RefundGuaranteeDocument: "path/to/refund1.pdf",
			ContractNumber:          "SA-001",
			ContractStartAt:         time.Now(),
			ContractEndAt:           time.Now().AddDate(1, 0, 0),
			RoomID:                  1,
			ServiceUserTypeID:       1,
		},
		{
			RequestServiceAreaID:    2,
			ServiceContractDocument: "path/to/contract2.pdf",
			AreaHandoverDocument:    "path/to/handover2.pdf",
			QuotationDocument:       "path/to/quotation2.pdf",
			RefundGuaranteeDocument: "path/to/refund2.pdf",
			ContractNumber:          "SA-002",
			ContractStartAt:         time.Now(),
			ContractEndAt:           time.Now().AddDate(1, 0, 0),
			RoomID:                  2,
			ServiceUserTypeID:       2,
		},
	}

	for _, doc := range serviceDocs {
		db.FirstOrCreate(&doc, entity.ServiceAreaDocument{
			RequestServiceAreaID: doc.RequestServiceAreaID,
		})
	}

	// 	bookingRooms := []entity.BookingRoom{
	// 		{
	// 			Purpose:        "ประชุมทีมวิจัยโครงการ A",
	// 			UserID:         1,
	// 			RoomID:         1,
	// 			StatusID:       1, // เช่น "จองสำเร็จ"
	// 			AdditionalInfo: "ต้องการโปรเจคเตอร์ และไวท์บอร์ด",
	// 			BookingDates: []entity.BookingDate{
	// 				{Date: beginningOfDayUTC(time.Now())},
	// 				{Date: beginningOfDayUTC(time.Now().AddDate(0, 0, 1))},
	// 			},
	// 		},
	// 		{
	// 			Purpose:        "จัดอบรมการใช้งานระบบใหม่",
	// 			UserID:         2,
	// 			RoomID:         2,
	// 			StatusID:       2,
	// 			AdditionalInfo: "มีการสั่งอาหารว่างเพิ่มเติม",
	// 			BookingDates: []entity.BookingDate{
	// 				{Date: beginningOfDayUTC(time.Now().AddDate(0, 0, 3))},
	// 			},
	// 		},
	// 	}

	// 	for _, booking := range bookingRooms {
	// 		db.FirstOrCreate(&booking, entity.BookingRoom{
	// 			Purpose: booking.Purpose,
	// 			UserID:  booking.UserID,
	// 			RoomID:  booking.RoomID,
	// 		})
	// 	}
	// }

	// func beginningOfDayUTC(t time.Time) time.Time {
	// 	return time.Date(
	// 		t.Year(), t.Month(), t.Day(),
	// 		0, 0, 0, 0, time.UTC,
	// 	)
}
