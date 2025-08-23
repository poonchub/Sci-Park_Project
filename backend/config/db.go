package config

import (
	"fmt"
	"log"
	"sci-park_web-application/entity"
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
	database, err := gorm.Open(sqlite.Open("sci-park_web-application.db?cache=shared"), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect database:", err)
	}

	fmt.Println("✅ Connected to database")
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
		&entity.Invoice{},
		&entity.InvoiceItem{},
		&entity.TitlePrefix{},
		&entity.BookingDate{}, // ← ✅ ต้องใส่ให้ migrate ตาราง booking_dates
		&entity.BookingStatus{},
		&entity.CollaborationPlan{},
	)

	if err != nil {
		log.Fatal("❌ Failed to migrate database:", err)
	}

	fmt.Println("✅ Database migrated successfully!")

	SeedDatabase()
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
		{Name: "Software Developer"},
		{Name: "System Administrator"},
		{Name: "Project Manager"},
		{Name: "Business Analyst"},
		{Name: "Data Scientist"},
		{Name: "Network Engineer"},
		{Name: "Quality Assurance"},
		{Name: "UI/UX Designer"},
		{Name: "DevOps Engineer"},
		{Name: "Product Manager"},
		{Name: "Research Assistant"},
		{Name: "Lab Technician"},
		{Name: "Administrative Staff"},
		{Name: "Marketing Specialist"},
		{Name: "Financial Analyst"},
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
	floors := []entity.Floor{{Number: 1}, {Number: 2}}
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
			Name:        "Waiting For Review", // Waiting for review
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

	// 🔹 ข้อมูล RoomType
	roomTypes := []entity.RoomType{
		{
			TypeName: "Small Meeting Room", // ห้องประชุมขนาดเล็ก
			RoomSize: 18,
		},
		{
			TypeName: "Medium Meeting Room", // ห้องประชุมขนาดกลาง
			RoomSize: 63,
		},
		{
			TypeName: "Medium Seminar Room", // ห้องอบรม สัมมนา ขนาดกลาง
			RoomSize: 135,
		},
		{
			TypeName: "Large Seminar Room", // ห้องอบรม สัมมนา ขนาดใหญ่
			RoomSize: 273,
		},
		{
			TypeName: "EVENT HALL",
			RoomSize: 1218,
		},
		{
			TypeName: "NE2 HALL 1",
			RoomSize: 1180,
		},
		{
			TypeName: "NE2 HALL 2",
			RoomSize: 487,
		},
		{
			TypeName:         "Rental Space",
			ForRental:        true,
			HasMultipleSizes: true,
		},
	}
	for _, roomType := range roomTypes {
		db.FirstOrCreate(&roomType, entity.RoomType{
			TypeName: roomType.TypeName,
		})
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

	// 🔹 ข้อมูล RoomTypeLayout
	roomTypeLayout := []entity.RoomTypeLayout{
		// ห้องประชุมขนาดเล็ก
		{
			Capacity:     6,
			RoomLayoutID: 2,
			RoomTypeID:   1,
		},

		// ห้องประชุมขนาดกลาง
		{
			Capacity:     12,
			RoomLayoutID: 2,
			RoomTypeID:   2,
		},

		// ห้องอบรม สัมมนา ขนาดกลาง
		{
			Capacity:     60,
			RoomLayoutID: 1,
			RoomTypeID:   3,
		},
		{
			Capacity:     90,
			RoomLayoutID: 3,
			RoomTypeID:   3,
		},
		{
			Capacity:     40,
			RoomLayoutID: 4,
			RoomTypeID:   3,
		},

		// ห้องอบรม สัมมนา ขนาดใหญ่
		{
			Capacity:     120,
			RoomLayoutID: 1,
			RoomTypeID:   4,
		},
		{
			Capacity:     120,
			RoomLayoutID: 2,
			RoomTypeID:   4,
		},
		{
			Capacity:     180,
			RoomLayoutID: 3,
			RoomTypeID:   4,
		},
		{
			Capacity:     80,
			Note:         "20 Group",
			RoomLayoutID: 4,
			RoomTypeID:   4,
		},

		// NE2 HALL 1
		{
			Capacity:     300,
			RoomLayoutID: 1,
			RoomTypeID:   6,
		},
		{
			Capacity:     250,
			RoomLayoutID: 2,
			RoomTypeID:   6,
		},
		{
			Capacity:     500,
			RoomLayoutID: 3,
			RoomTypeID:   6,
		},
		{
			Capacity:     400,
			Note:         "100 Group",
			RoomLayoutID: 4,
			RoomTypeID:   6,
		},

		// NE2 HALL 2
		{
			Capacity:     120,
			RoomLayoutID: 1,
			RoomTypeID:   7,
		},
		{
			Capacity:     100,
			RoomLayoutID: 2,
			RoomTypeID:   7,
		},
		{
			Capacity:     200,
			RoomLayoutID: 3,
			RoomTypeID:   7,
		},
		{
			Capacity:     120,
			Note:         "30 Group",
			RoomLayoutID: 4,
			RoomTypeID:   7,
		},
	}
	for _, typelayout := range roomTypeLayout {
		db.FirstOrCreate(&typelayout, entity.RoomTypeLayout{
			RoomLayoutID: typelayout.RoomLayoutID,
			RoomTypeID:   typelayout.RoomTypeID,
		})
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
			RoleID:         5,             // Admin (ID 5)
			JobPositionID:  &[]uint{1}[0], // Software Developer
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
			RoleID:         4,             // Manager (ID 4)
			JobPositionID:  &[]uint{3}[0], // Project Manager
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
			RoleID:         4,              // Manager (ID 4)
			JobPositionID:  &[]uint{10}[0], // Product Manager
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
			JobPositionID:  &[]uint{2}[0], // System Administrator
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
			JobPositionID:  &[]uint{6}[0], // Network Engineer
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
			RoleID:         3,             // Document Operator (ID 3)
			JobPositionID:  &[]uint{4}[0], // Business Analyst
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
			RoleID:         3,             // Document Operator (ID 3)
			JobPositionID:  &[]uint{7}[0], // Quality Assurance
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
			JobPositionID:  &[]uint{5}[0], // Data Scientist
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
			JobPositionID:  &[]uint{11}[0], // Research Assistant
			GenderID:       1,
			IsEmployee:     true,
		},
		{
			CompanyName:    "MediCare",
			BusinessDetail: "Healthcare Services",
			FirstName:      "External",
			LastName:       "1",
			Email:          "externaluser1@gmail.com",
			Password:       "123456",
			Phone:          "1232323111",
			ProfilePath:    "",
			RoleID:         1,
			JobPositionID:  &[]uint{12}[0], // Lab Technician
			GenderID:       2,
			IsEmployee:     false,
		},
		{
			CompanyName:    "Global Innovations Hub",
			BusinessDetail: "Technology Solutions",
			FirstName:      "External",
			LastName:       "2",
			Email:          "externaluser2@gmail.com",
			Password:       "123456",
			Phone:          "9876543211",
			ProfilePath:    "",
			RoleID:         1,
			JobPositionID:  &[]uint{13}[0], // Administrative Staff
			GenderID:       1,
			IsEmployee:     false,
		},
	}
	for i, user := range users {
		users[i].Password, _ = HashPassword(user.Password)
		db.FirstOrCreate(&users[i], entity.User{Email: user.Email})
	}

	// 🔹 ข้อมูล Rooms
	rooms := []entity.Room{
		{RoomNumber: "A101", FloorID: 1, RoomStatusID: 3, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A102", FloorID: 1, RoomStatusID: 3, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A103", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A104", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A105", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A106", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A107", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A108", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A109", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 212},
		{RoomNumber: "A110", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 176},
		{RoomNumber: "A111", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 176},
		{RoomNumber: "A112", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 212},

		{RoomNumber: "B101", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B102", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B103", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B104", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B105", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B106", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "B107", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 252},
		{RoomNumber: "B108", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 252},
		{RoomNumber: "B109", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 252},
		{RoomNumber: "B110", FloorID: 1, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 36},

		{RoomNumber: "A201", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A202", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A203", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A204", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A205", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 56},
		{RoomNumber: "A206", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 36},
		{RoomNumber: "A207", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A208", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A209", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A210", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 57},
		{RoomNumber: "A211", FloorID: 2, RoomStatusID: 1, RoomTypeID: 8, RoomSize: 216},

		{RoomNumber: "A302", FloorID: 1, RoomStatusID: 1, RoomTypeID: 1, Capacity: 19},
		{RoomNumber: "A303", FloorID: 1, RoomStatusID: 1, RoomTypeID: 1, Capacity: 30},
		{RoomNumber: "A304", FloorID: 1, RoomStatusID: 2, RoomTypeID: 1},
		{RoomNumber: "A306", FloorID: 1, RoomStatusID: 2, RoomTypeID: 1},
		{RoomNumber: "A307", FloorID: 1, RoomStatusID: 2, RoomTypeID: 1},
		{RoomNumber: "A308", FloorID: 1, RoomStatusID: 2, RoomTypeID: 1},

		{RoomNumber: "A301", FloorID: 1, RoomStatusID: 1, RoomTypeID: 2},
		{RoomNumber: "A309", FloorID: 1, RoomStatusID: 1, RoomTypeID: 2},

		{RoomNumber: "B404", FloorID: 1, RoomStatusID: 1, RoomTypeID: 3},
		{RoomNumber: "B408", FloorID: 1, RoomStatusID: 1, RoomTypeID: 3},

		{RoomNumber: "B405", FloorID: 1, RoomStatusID: 1, RoomTypeID: 4},
		{RoomNumber: "B407", FloorID: 1, RoomStatusID: 1, RoomTypeID: 4},

		{RoomNumber: "A305", FloorID: 1, RoomStatusID: 1, RoomTypeID: 6},

		{RoomNumber: "A406", FloorID: 1, RoomStatusID: 1, RoomTypeID: 7},
	}
	for _, room := range rooms {
		db.FirstOrCreate(&room, entity.Room{RoomNumber: room.RoomNumber})
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
		{
			Description:       "Fix the AC",
			StartTime:         startTime,
			EndTime:           endTime,
			UserID:            7,
			RoomID:            3,
			RequestStatusID:   2,
			AreaID:            1,
			MaintenanceTypeID: 2,
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

	// 🔹 ข้อมูล TimeSlot
	timeSlots := []entity.TimeSlot{
		{TimeSlotName: "morning", StartTime: parseTime("08:00"), EndTime: parseTime("12:00")},
		{TimeSlotName: "afternoon", StartTime: parseTime("13:00"), EndTime: parseTime("17:00")},
		{TimeSlotName: "fullDay", StartTime: parseTime("08:00"), EndTime: parseTime("17:00")},
		{TimeSlotName: "08:00-09:00", StartTime: parseTime("08:00"), EndTime: parseTime("09:00")},
		{TimeSlotName: "09:00-10:00", StartTime: parseTime("09:00"), EndTime: parseTime("10:00")},
		{TimeSlotName: "10:00-11:00", StartTime: parseTime("10:00"), EndTime: parseTime("11:00")},
		{TimeSlotName: "11:00-12:00", StartTime: parseTime("11:00"), EndTime: parseTime("12:00")},
		{TimeSlotName: "12:00-13:00", StartTime: parseTime("12:00"), EndTime: parseTime("13:00")},
		{TimeSlotName: "13:00-14:00", StartTime: parseTime("13:00"), EndTime: parseTime("14:00")},
		{TimeSlotName: "14:00-15:00", StartTime: parseTime("14:00"), EndTime: parseTime("15:00")},
		{TimeSlotName: "15:00-16:00", StartTime: parseTime("15:00"), EndTime: parseTime("16:00")},
		{TimeSlotName: "16:00-17:00", StartTime: parseTime("16:00"), EndTime: parseTime("17:00")},
	}
	fmt.Println("📌 Seeding TimeSlots")
	for _, slot := range timeSlots {
		result := db.FirstOrCreate(&slot, entity.TimeSlot{
			TimeSlotName: slot.TimeSlotName,
			StartTime:    slot.StartTime,
			EndTime:      slot.EndTime,
		})
		fmt.Printf("🧪 TimeSlot: %s | RowsAffected: %d | Error: %v\n", slot.TimeSlotName, result.RowsAffected, result.Error)
	}

	// 🔹 ข้อมูล Roomprice (สมมุติว่าห้องขนาดเล็ก = RoomTypeID 1, TimeSlotID ตามข้างบน)
	roomPrices := []entity.RoomPrice{
		// ✅ เดิม (3 แบบ: เช้า/บ่าย/เต็มวัน)
		{Price: 500, TimeSlotID: 1, RoomTypeID: 1},  // เช้า
		{Price: 500, TimeSlotID: 2, RoomTypeID: 1},  // บ่าย
		{Price: 1000, TimeSlotID: 3, RoomTypeID: 1}, // เต็มวัน

		{Price: 1000, TimeSlotID: 1, RoomTypeID: 2}, // เช้า
		{Price: 1000, TimeSlotID: 2, RoomTypeID: 2}, // บ่าย
		{Price: 2000, TimeSlotID: 3, RoomTypeID: 2}, // เต็มวัน

		// ✅ ใหม่: รายชั่วโมงสำหรับ RoomTypeID 1
		{Price: 200, TimeSlotID: 4, RoomTypeID: 1},  // 09:00–10:00
		{Price: 200, TimeSlotID: 5, RoomTypeID: 1},  // 10:00–11:00
		{Price: 200, TimeSlotID: 6, RoomTypeID: 1},  // 11:00–12:00
		{Price: 200, TimeSlotID: 7, RoomTypeID: 1},  // 13:00–14:00
		{Price: 200, TimeSlotID: 8, RoomTypeID: 1},  // 14:00–15:00
		{Price: 200, TimeSlotID: 9, RoomTypeID: 1},  // 15:00–16:00
		{Price: 200, TimeSlotID: 10, RoomTypeID: 1}, // 16:00–17:00

		// ✅ ใหม่: รายชั่วโมงสำหรับ RoomTypeID 2
		{Price: 400, TimeSlotID: 4, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 5, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 6, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 7, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 8, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 9, RoomTypeID: 2},
		{Price: 400, TimeSlotID: 10, RoomTypeID: 2},
	}

	fmt.Println("📌 Seeding Roomprices")
	for _, rp := range roomPrices {
		result := db.FirstOrCreate(&rp, entity.RoomPrice{
			TimeSlotID: rp.TimeSlotID,
			RoomTypeID: rp.RoomTypeID,
			Price:      rp.Price,
		})
		fmt.Printf("🧪 Roomprice: RoomTypeID=%d TimeSlotID=%d Price=%d | RowsAffected: %d | Error: %v\n",
			rp.RoomTypeID, rp.TimeSlotID, rp.Price, result.RowsAffected, result.Error)
	}

	bookingStatus := []entity.BookingStatus{
		{StatusName: "confirmed"},
		{StatusName: "unconfirmed"},
		{StatusName: "canceled"},
	}
	for _, bs := range bookingStatus {
		db.FirstOrCreate(&bs, entity.BookingStatus{StatusName: bs.StatusName})
	}

	// 🔹 ข้อมูล Equipment
	equipments := []entity.Equipment{
		{EquipmentName: "โปรเจคเตอร์"},
		{EquipmentName: "ไมโครโฟน"},
		{EquipmentName: "กระดานไวท์บอร์ด"},
		{EquipmentName: "โต๊ะ"},
		{EquipmentName: "เก้าอี้"},
	}
	for _, e := range equipments {
		db.FirstOrCreate(&e, entity.Equipment{EquipmentName: e.EquipmentName})
	}

	fmt.Println("📌 Seeding RoomEquipment")
	roomEquipments := []entity.RoomEquipment{
		{RoomTypeID: 1, EquipmentID: 1, Quantity: 1},  // A302 มีโปรเจคเตอร์ 1 ตัว
		{RoomTypeID: 1, EquipmentID: 2, Quantity: 2},  // A302 มีไมโครโฟน 2 ตัว
		{RoomTypeID: 2, EquipmentID: 3, Quantity: 1},  // A303 มีไวท์บอร์ด 1 อัน
		{RoomTypeID: 2, EquipmentID: 4, Quantity: 10}, // A303 มีโต๊ะ 10 ตัว
		{RoomTypeID: 2, EquipmentID: 5, Quantity: 20}, // A303 มีเก้าอี้ 20 ตัว
	}
	for _, re := range roomEquipments {
		result := db.FirstOrCreate(&re, entity.RoomEquipment{
			RoomTypeID:  re.RoomTypeID,
			EquipmentID: re.EquipmentID,
			Quantity:    re.Quantity,
		})
		fmt.Printf("🧪 RoomEquipment: RoomID=%d EquipmentID=%d Quantity=%d | RowsAffected: %d\n",
			re.RoomTypeID, re.EquipmentID, re.Quantity, result.RowsAffected)
	}

	payments := []entity.Payment{
		{

			PaymentDate:   time.Date(2025, 6, 25, 0, 0, 0, 0, time.Local),
			Amount:        500.00,
			SlipPath:      "/slips/payment1.jpg",
			Note:          "จองห้องประชุมเช้า",
			PayerID:       users[6].ID, // internaluser1
			BookingRoomID: 1,           // อิงจาก seed BookingRoom ด่านบน
			StatusID:      1,
		},
		{
			PaymentDate:   time.Date(2025, 6, 26, 0, 0, 0, 0, time.Local),
			Amount:        1000.00,
			SlipPath:      "/slips/payment2.jpg",
			Note:          "อบรมพนักงานใหม่",
			PayerID:       users[7].ID, // internaluser2
			BookingRoomID: 2,
			StatusID:      2,
		},
	}
	for _, p := range payments {
		result := db.FirstOrCreate(&p, entity.Payment{
			BookingRoomID: p.BookingRoomID,
			PayerID:       p.PayerID,
			Amount:        p.Amount,
		})
		fmt.Printf("🧾 Payment: BookingRoomID=%d Amount=%.2f | RowsAffected: %d\n", p.BookingRoomID, p.Amount, result.RowsAffected)
	}

	// สมมติ TimeSlotID 1=เช้า, 2=บ่าย, 3=เต็มวัน
	type SeedBooking struct {
		RoomID      uint
		Date        time.Time
		TimeSlotIDs []uint
	}

	bookings := []SeedBooking{
		{
			RoomID:      1,
			Date:        time.Date(2025, 7, 20, 0, 0, 0, 0, time.Local),
			TimeSlotIDs: []uint{1, 2}, // เช้า + บ่าย
		},
		{
			RoomID:      1,
			Date:        time.Date(2025, 7, 21, 0, 0, 0, 0, time.Local),
			TimeSlotIDs: []uint{2}, // เช้า: 2, // บ่าย
		},
		{
			RoomID:      1,
			Date:        time.Date(2025, 7, 22, 0, 0, 0, 0, time.Local),
			TimeSlotIDs: []uint{3}, // เต็มวัน
		},
	}

	for _, b := range bookings {
		// สร้าง BookingRoom ก่อน
		bookingRoom := entity.BookingRoom{
			RoomID:    b.RoomID,
			TimeSlots: timeSlots, // ใส่หลายช่วงเวลา
			StatusID:  1,
			// ใส่ข้อมูลอื่น ๆ เช่น UserID, Purpose ตามจำเป็น
		}

		result := db.FirstOrCreate(&bookingRoom, entity.BookingRoom{
			RoomID:    b.RoomID,
			TimeSlots: timeSlots, // ใส่หลายช่วงเวลา
		})

		if result.Error != nil {
			fmt.Printf("❌ Error creating BookingRoom: %v\n", result.Error)
			continue
		}

		// สร้าง BookingDate เชื่อมกับ BookingRoom
		bookingDate := entity.BookingDate{
			Date:          b.Date,
			BookingRoomID: bookingRoom.ID,
		}

		err := db.FirstOrCreate(&bookingDate, entity.BookingDate{
			Date:          b.Date,
			BookingRoomID: bookingRoom.ID,
		}).Error

		if err != nil {
			fmt.Printf("❌ Error creating BookingDate: %v\n", err)
			continue
		}

		fmt.Printf("📅 Booking created: RoomID=%d Date=%s Slot=%d\n",
			b.RoomID, b.Date.Format("2006-01-02"), b.TimeSlotIDs)
	}

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
		{Name: "IT Software & digital content"},
		{Name: "Agriculture & Food"},
		{Name: "Energy Tech & material"},
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

	// PaymentStatus
	paymentStatuses := []entity.PaymentStatus{
		{Name: "Pending Payment"},      // ยังไม่ได้จ่าย
		{Name: "Pending Verification"}, // จ่ายแล้วแต่รอเจ้าหน้าที่ตรวจสอบสลิป
		{Name: "Paid"},                 // จ่ายแล้วและตรวจสอบเรียบร้อย
		{Name: "Rejected"},             // สลิปไม่ถูกต้อง / ต้องอัพโหลดใหม่
		{Name: "Refunded"},             // คืนเงินแล้ว
	}
	for _, status := range paymentStatuses {
		db.FirstOrCreate(&status, entity.PaymentStatus{
			Name: status.Name,
		})
	}

	// Invoice
	invoices := []entity.Invoice{
		{
			InvoiceNumber: "NE2/001",
			IssueDate:     time.Date(2025, 8, 1, 0, 0, 0, 0, time.UTC),
			DueDate:       time.Date(2025, 8, 15, 0, 0, 0, 0, time.UTC),
			BillingPeriod: time.Date(2025, 7, 1, 0, 0, 0, 0, time.UTC),
			TotalAmount:   18000.00,
			StatusID:      1,
			CreaterID:     1,
			CustomerID:    1,
			RoomID:        1,
		},
	}
	for _, invoice := range invoices {
		db.FirstOrCreate(&invoice, entity.Invoice{InvoiceNumber: invoice.InvoiceNumber})
	}

	// Invoice Items
	invoiceItems := []entity.InvoiceItem{
		{
			Description: "ค่าพื้นที่",
			Amount:      15000,
			InvoiceID:   1,
		},
		{
			Description: "ค่าไฟ",
			Amount:      3000,
			InvoiceID:   1,
		},
	}
	for _, item := range invoiceItems {
		db.FirstOrCreate(&item, entity.InvoiceItem{
			Description: item.Description,
			Amount:      item.Amount,
			InvoiceID:   item.InvoiceID,
		})
	}

	// Request Service Area
	requestServiceAreas := []entity.RequestServiceArea{
		{
			UserID:                             1,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Project Alpha",
			NumberOfEmployees:                  5,
			ActivitiesInBuilding:               "Research and Development",
			SupportingActivitiesForSciencePark: "Collaboration with startups",
			ServiceRequestDocument:             "/files/service_requests/request1.pdf",
		},
		{
			UserID:                             2,
			RequestStatusID:                    2,
			PurposeOfUsingSpace:                "Project Beta",
			NumberOfEmployees:                  3,
			ActivitiesInBuilding:               "Workshop and prototyping",
			SupportingActivitiesForSciencePark: "Innovation lab support",
			ServiceRequestDocument:             "/files/service_requests/request2.pdf",
		},
	}
	for _, req := range requestServiceAreas {
		db.FirstOrCreate(&req, entity.RequestServiceArea{
			UserID: req.UserID,
		})
	}

	// Service Area Document
	serviceAreaDocuments := []entity.ServiceAreaDocument{
		{
			RequestServiceAreaID:    1,
			ServiceContractDocument: "/files/contracts/contract1.pdf",
			AreaHandoverDocument:    "/files/handover/handover1.pdf",
			QuotationDocument:       "/files/quotation/quotation1.pdf",
			RoomID:                  1,
			ServiceUserTypeID:       1,
		},
		{
			RequestServiceAreaID:    2,
			ServiceContractDocument: "/files/contracts/contract2.pdf",
			AreaHandoverDocument:    "/files/handover/handover2.pdf",
			QuotationDocument:       "/files/quotation/quotation2.pdf",
			RoomID:                  2,
			ServiceUserTypeID:       2,
		},
	}

	for _, doc := range serviceAreaDocuments {
		db.FirstOrCreate(&doc, entity.ServiceAreaDocument{
			RequestServiceAreaID: doc.RequestServiceAreaID,
			RoomID:               doc.RoomID,
		})
	}

	// AboutCompany data
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
	}

	for _, aboutCompany := range aboutCompanies {
		db.FirstOrCreate(&aboutCompany, entity.AboutCompany{
			UserID: aboutCompany.UserID,
		})
	}

}
