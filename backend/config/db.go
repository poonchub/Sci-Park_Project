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
		{Name: "Employee"}, 
		{Name: "Outsider"}, 
		{Name: "Manager"}, 
		{Name: "Admin"},
		{Name: "SuperAdmin"},
		{Name: "Operator"},
	}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{Name: role.Name})
	}

	// 🔹 ข้อมูล Floor
	floors := []entity.Floor{{Number: 1}, {Number: 2}}
	for _, floor := range floors {
		db.FirstOrCreate(&floor, entity.Floor{Number: floor.Number})
	}

	// 🔹 ข้อมูล Area
	areas := []entity.Area{
		{Name: "ห้องประชุม/ห้องทำงาน"}, 
		{Name: "บริเวณอื่นๆ"},
	}
	for _, area := range areas {
		db.FirstOrCreate(&area, entity.Area{Name: area.Name})
	}

	// 🔹 ข้อมูล RequestStatus
	requestStatuses := []entity.RequestStatus{
		{Name: "Pending"}, 
		{Name: "Approved"},
		{Name: "Rejected"},
		{Name: "Assigned"},
		{Name: "In Progress"}, 
		{Name: "Completed"}, 
		{Name: "Failed"},
		{Name: "Cancelled"},
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
			CompanyName: "TechCorp", 
			BusinessDetail: "Tech Solutions", 
			FirstName: "John",
			EmployeeID: "EMP001", 
			LastName: "Doe", 
			Email: "admin@gmail.com", 
			Password: "123456", 
			Phone: "123456789", 
			ProfilePath: "/profiles/john.jpg", 
			RoleID: 4, GenderID: 1,
		},
		{
			CompanyName: "MediCare", 
			BusinessDetail: "Healthcare Services", 
			FirstName: "Alice", 
			LastName: "Smith", 
			Email: "outsider@gmail.com", 
			Password: "123456", 
			Phone: "987654321", 
			ProfilePath: "/profiles/alice.jpg", 
			RoleID: 2, GenderID: 2,
		},
		{
			CompanyName: "NO COM", 
			BusinessDetail: "NO Business", 
			FirstName: "Jaydee", 
			EmployeeID: "EMP002",
			LastName: "Somkom", 
			Email: "superadmin@gmail.com", 
			Password: "123456", 
			Phone: "1232323", 
			ProfilePath: "/profiles/alice.jpg", 
			RoleID: 5, GenderID: 2,
		},
		{
			CompanyName: "TechCorp", 
			BusinessDetail: "Tech Solutions", 
			FirstName: "Jaya", 
			LastName: "Kunlee", 
			Email: "operator1@gmail.com", 
			Password: "123456", 
			Phone: "1232323", 
			ProfilePath: "/profiles/alice.jpg", 
			RoleID: 6, GenderID: 2,
		},
		{
			CompanyName: "TechCorp", 
			BusinessDetail: "Tech Solutions", 
			FirstName: "Martin", 
			LastName: "Ninja", 
			Email: "operator2@gmail.com", 
			Password: "123456", 
			Phone: "1232323", 
			ProfilePath: "/profiles/alice.jpg", 
			RoleID: 6, GenderID: 2,
		},
		{
			CompanyName: "TechCorp", 
			BusinessDetail: "Tech Solutions", 
			FirstName: "Connan", 
			LastName: "Gun", 
			Email: "operator3@gmail.com", 
			Password: "123456", 
			Phone: "1232323", 
			ProfilePath: "/profiles/alice.jpg", 
			RoleID: 6, GenderID: 2,
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
			PackageName: "Silver", 
			MeetingRoomLimit: 10, 
			TrainingRoomLimit: 5, 
			MultiFunctionRoomLimit: 3,
		},
		{
			PackageName: "Gold", 
			MeetingRoomLimit: 20, 
			TrainingRoomLimit: 10, 
			MultiFunctionRoomLimit: 5,
		},
	}
	for _, pkg := range packages {
		db.FirstOrCreate(&pkg, entity.Package{PackageName: pkg.PackageName})
	}

	// 🔹 ข้อมูล UserPackage
	userPackage := entity.UserPackage{
		UserID: &users[0].ID, 
		PackageID: packages[0].ID, 
		MeetingRoomUsed: 2, 
		TrainingRoomUsed: 1, 
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
	maintenanceRequest := entity.MaintenanceRequest{
		Description: "Fix the AC", 
		StartTime: startTime,
		EndTime: endTime,
		UserID: users[0].ID, 
		RoomID: rooms[0].ID, 
		RequestStatusID: 1,
		AreaID: 1,
		MaintenanceTypeID: 1,
	}
	db.FirstOrCreate(&maintenanceRequest)

	// 🔹 ข้อมูล MaintenanceTask
	maintenanceTask := entity.MaintenanceTask{
		Description: "Repairing air conditioning", 
		UserID: users[1].ID, 
		RequestID: maintenanceRequest.ID, 
		RequestStatusID: 4,
	} // In Progress
	db.FirstOrCreate(&maintenanceTask)

	// 🔹 ข้อมูล Inspection
	inspection := entity.Inspection{
		Description: "Routine safety check", 
		UserID: users[1].ID, RequestID: 
		maintenanceRequest.ID, 
		RequestStatusID: 5,
	} // Completed
	db.FirstOrCreate(&inspection)

	// 🔹 ข้อมูล MaintenanceImage
	maintenanceImage := entity.MaintenanceImage{
		FilePath: "/images/ac_repair.jpg", 
		RequestID: maintenanceRequest.ID,
	}
	db.FirstOrCreate(&maintenanceImage)

	fmt.Println("✅ Sample data added successfully!")
}