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
		{
			TypeName:    "Small Meeting Room",
			RoomSize:    18,
			HalfDayRate: 500.0,
			FullDayRate: 1000.0,
		},
		{
			TypeName:    "Medium Meeting Room",
			RoomSize:    63,
			HalfDayRate: 1000.0,
			FullDayRate: 2000.0,
		},
		{
			TypeName:    "Medium Training / Seminar Room",
			RoomSize:    135,
			HalfDayRate: 6000.0,
			FullDayRate: 12000.0,
		},
		{
			TypeName:    "Large Training / Seminar Room",
			RoomSize:    273,
			HalfDayRate: 7500.0,
			FullDayRate: 15000.0,
		},
		{
			TypeName:    "Event Hall",
			RoomSize:    1218,
			HalfDayRate: 25000.0,
			FullDayRate: 50000.0,
		},
		{
			TypeName:    "NE2 Hall 1",
			RoomSize:    1180,
			HalfDayRate: 32500.0,
			FullDayRate: 65000.0,
		},
		{
			TypeName:    "NE2 Hall 2",
			RoomSize:    487,
			HalfDayRate: 17500.0,
			FullDayRate: 35000.0,
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
			ProfilePath:    "",
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
		{RoomNumber: "A302", FloorID: 1, RoomStatusID: 1, RoomTypeID: 1},
		{RoomNumber: "A303", FloorID: 1, RoomStatusID: 1, RoomTypeID: 1},
		{RoomNumber: "A304", FloorID: 1, RoomStatusID: 1, RoomTypeID: 1},
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
		{TimeSlotName: "เช้า", StartTime: parseTime("08:00"), EndTime: parseTime("12:00")},
		{TimeSlotName: "บ่าย", StartTime: parseTime("13:00"), EndTime: parseTime("17:00")},
		{TimeSlotName: "เต็มวัน", StartTime: parseTime("08:00"), EndTime: parseTime("17:00")},
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
		{Price: 500, TimeSlotID: 1, RoomTypeID: 1},  // เช้า
		{Price: 500, TimeSlotID: 2, RoomTypeID: 1},  // บ่าย
		{Price: 1000, TimeSlotID: 3, RoomTypeID: 1}, // เต็มวัน

		{Price: 1000, TimeSlotID: 1, RoomTypeID: 2}, // เช้า
		{Price: 1000, TimeSlotID: 2, RoomTypeID: 2}, // บ่าย
		{Price: 2000, TimeSlotID: 3, RoomTypeID: 2}, // เต็มวัน
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

	// 🔹 ข้อมูล BookingRoom (User: users[6] คือ Internal 1, Room: rooms[0] = A302, TimeSlot: 1 = เช้า)
	bookingRooms := []entity.BookingRoom{
		{
			Date:       parseDate("2025-06-25"),
			Purpose:    "ประชุมแผนงานวิจัย",
			UserID:     users[6].ID,
			RoomID:     rooms[0].ID,
			TimeSlotID: 1,
		},
		{
			Date:       parseDate("2025-06-26"),
			Purpose:    "อบรมพนักงานใหม่",
			UserID:     users[7].ID,
			RoomID:     rooms[1].ID,
			TimeSlotID: 2,
		},
	}

	fmt.Println("📌 Seeding BookingRooms")
	for _, br := range bookingRooms {
		result := db.FirstOrCreate(&br, entity.BookingRoom{
			Date:       br.Date,
			RoomID:     br.RoomID,
			UserID:     br.UserID,
			TimeSlotID: br.TimeSlotID,
			Purpose:    br.Purpose,
		})
		fmt.Printf("🧪 BookingRoom: Date=%s RoomID=%d TimeSlotID=%d UserID=%d | RowsAffected: %d | Error: %v\n",
			br.Date, br.RoomID, br.TimeSlotID, br.UserID, result.RowsAffected, result.Error)
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

	fmt.Println("📌 Seeding Payments")
	payments := []entity.Payment{
		{
			PaymentsDate:  "2025-06-25",
			Amount:        500.00,
			SlipPath:      "/slips/payment1.jpg",
			Note:          "จองห้องประชุมเช้า",
			UserID:        users[6].ID, // internaluser1
			BookingRoomID: 1,           // อิงจาก seed BookingRoom ด่านบน
		},
		{
			PaymentsDate:  "2025-06-26",
			Amount:        1000.00,
			SlipPath:      "/slips/payment2.jpg",
			Note:          "อบรมพนักงานใหม่",
			UserID:        users[7].ID, // internaluser2
			BookingRoomID: 2,
		},
	}
	for _, p := range payments {
		result := db.FirstOrCreate(&p, entity.Payment{
			BookingRoomID: p.BookingRoomID,
			UserID:        p.UserID,
			Amount:        p.Amount,
		})
		fmt.Printf("🧾 Payment: BookingRoomID=%d Amount=%.2f | RowsAffected: %d\n", p.BookingRoomID, p.Amount, result.RowsAffected)
	}

	fmt.Println("✅ Sample data added successfully!")
}
