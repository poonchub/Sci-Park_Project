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
		{Name: "Operator"},
		{Name: "Manager"},
		{Name: "Admin"},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{Name: role.Name})
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
		{Name: "ห้องประชุม/ห้องทำงาน"},
		{Name: "บริเวณอื่น ๆ"},
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

	// 🔹 ข้อมูล RoomStatus
	roomStatuses := []entity.RoomStatus{
		{StatusName: "Reserved"},
		{StatusName: "Not Reserved"},
	}
	for _, status := range roomStatuses {
		db.FirstOrCreate(&status, entity.RoomStatus{StatusName: status.StatusName})
	}

	// 🔹 ข้อมูล RoomType
	roomTypes := []entity.RoomType{
		{TypeName: "Meeting Room", HalfDayRate: 1000.0, FullDayRate: 2000.0},
		{TypeName: "Training Room", HalfDayRate: 1500.0, FullDayRate: 3000.0},
	}
	for _, roomType := range roomTypes {
		db.FirstOrCreate(&roomType, entity.RoomType{TypeName: roomType.TypeName})
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
			ProfilePath:    "/profiles/Admin.jpg",
			RoleID:         4,
			GenderID:       1,
			IsEmployee:     true,
			RequestTypeID:  3,
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
			ProfilePath:    "/profiles/john.jpg",
			RoleID:         3,
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
			ProfilePath:    "/profiles/Pink.jpg",
			RoleID:         3,
			GenderID:       1,
			IsEmployee:     true,
			RequestTypeID:  2,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Operator",
			EmployeeID:     "EMP003",
			LastName:       "1",
			Email:          "operator1@gmail.com",
			Password:       "123456",
			Phone:          "1232323221",
			ProfilePath:    "/profiles/Jaya.jpg",
			RoleID:         2,
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Operator",
			EmployeeID:     "EMP004",
			LastName:       "2",
			Email:          "operator2@gmail.com",
			Password:       "123456",
			Phone:          "1232323222",
			ProfilePath:    "/profiles/Martin.jpg",
			RoleID:         2,
			GenderID:       2,
			IsEmployee:     true,
		},
		{
			CompanyName:    "Regional Science Park Northeast 2",
			BusinessDetail: "Research & Development Hub",
			FirstName:      "Operator",
			EmployeeID:     "457005",
			LastName:       "3",
			Email:          "operator3@gmail.com",
			Password:       "123456",
			Phone:          "1232323223",
			ProfilePath:    "/profiles/Connan.jpg",
			RoleID:         2,
			GenderID:       2,
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
			ProfilePath:    "/profiles/alice.jpg",
			RoleID:         1,
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
			ProfilePath:    "/profiles/vangard.jpg",
			RoleID:         1,
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
			ProfilePath:    "/profiles/Jaydee.jpg",
			RoleID:         1,
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
			ProfilePath:    "/profiles/Emily.jpg",
			RoleID:         1,
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
		{RoomNumber: "A01", FloorID: 1, Capacity: 10, RoomStatusID: 1, RoomTypeID: 1},
		{RoomNumber: "A02", FloorID: 1, Capacity: 10, RoomStatusID: 2, RoomTypeID: 1},
		{RoomNumber: "A03", FloorID: 1, Capacity: 10, RoomStatusID: 2, RoomTypeID: 1},
		{RoomNumber: "B01", FloorID: 2, Capacity: 20, RoomStatusID: 1, RoomTypeID: 2},
		{RoomNumber: "B02", FloorID: 2, Capacity: 20, RoomStatusID: 2, RoomTypeID: 2},
		{RoomNumber: "B02", FloorID: 2, Capacity: 20, RoomStatusID: 2, RoomTypeID: 2},
	}
	for _, room := range rooms {
		db.FirstOrCreate(&room, entity.Room{FloorID: room.FloorID, Capacity: room.Capacity})
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
		{TypeName: "งานไฟฟ้า"},
		{TypeName: "งานเครื่องปรับอากาศ"},
		{TypeName: "งานอินเทอร์เน็ต"},
		{TypeName: "งานประปา"},
		{TypeName: "งานโครงสร้าง"},
		{TypeName: "งานอื่นๆ"},
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

	fmt.Println("✅ Sample data added successfully!")
}
