package config

import (
	"fmt"
	"log"
	"sci-park_web-application/entity"

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
	genders := []entity.Gender{{Name: "Male"}, {Name: "Female"}}
	for _, gender := range genders {
		db.FirstOrCreate(&gender, entity.Gender{Name: gender.Name})
	}

	// 🔹 ข้อมูล Role
	roles := []entity.Role{{Name: "Employee"}, {Name: "Outsider"}, {Name: "Manager"}, {Name: "Admin"}}
	for _, role := range roles {
		db.FirstOrCreate(&role, entity.Role{Name: role.Name})
	}

	// 🔹 ข้อมูล Floor
	floors := []entity.Floor{{Number: 1}, {Number: 2}}
	for _, floor := range floors {
		db.FirstOrCreate(&floor, entity.Floor{Number: floor.Number})
	}

	// 🔹 ข้อมูล Area
	areas := []entity.Area{{Name: "Top room F11"}, {Name: "Outside behind green bin"}}
	for _, area := range areas {
		db.FirstOrCreate(&area, entity.Area{Name: area.Name})
	}

	// 🔹 ข้อมูล RequestStatus
	requestStatuses := []entity.RequestStatus{
		{Name: "Pending"}, {Name: "Approved"}, {Name: "Rejected"},
		{Name: "In Progress"}, {Name: "Completed"}, {Name: "Failed"},
	}
	for _, status := range requestStatuses {
		db.FirstOrCreate(&status, entity.RequestStatus{Name: status.Name})
	}

	// 🔹 ข้อมูล RoomStatus
	roomStatuses := []entity.RoomStatus{{StatusName: "Reserved"}, {StatusName: "Not Reserved"}}
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
		{CompanyName: "TechCorp", BusinessDetail: "Tech Solutions", FirstName: "John", LastName: "Doe", Email: "john.doe@example.com", Password: "password123", Phone: "123456789", ProfilePath: "/profiles/john.jpg", RoleID: 3, GenderID: 1},
		{CompanyName: "MediCare", BusinessDetail: "Healthcare Services", FirstName: "Alice", LastName: "Smith", Email: "alice.smith@example.com", Password: "securepass", Phone: "987654321", ProfilePath: "/profiles/alice.jpg", RoleID: 1, GenderID: 2},
	}
	for i, user := range users {
		users[i].Password, _ = HashPassword(user.Password)
		db.FirstOrCreate(&users[i], entity.User{Email: user.Email})
	}

	// 🔹 ข้อมูล Rooms
	rooms := []entity.Room{
		{FloorID: 1, Capacity: 10, RoomStatusID: 1, RoomTypeID: 1},
		{FloorID: 2, Capacity: 20, RoomStatusID: 2, RoomTypeID: 2},
	}
	for _, room := range rooms {
		db.FirstOrCreate(&room, entity.Room{FloorID: room.FloorID, Capacity: room.Capacity})
	}

	// 🔹 ข้อมูล Packages
	packages := []entity.Package{
		{PackageName: "Silver", MeetingRoomLimit: 10, TrainingRoomLimit: 5, MultiFunctionRoomLimit: 3},
		{PackageName: "Gold", MeetingRoomLimit: 20, TrainingRoomLimit: 10, MultiFunctionRoomLimit: 5},
	}
	for _, pkg := range packages {
		db.FirstOrCreate(&pkg, entity.Package{PackageName: pkg.PackageName})
	}

	// 🔹 ข้อมูล UserPackage
	userPackage := entity.UserPackage{UserID: &users[0].ID, PackageID: packages[0].ID, MeetingRoomUsed: 2, TrainingRoomUsed: 1, MultiFunctionRoomUsed: 0}
	db.FirstOrCreate(&userPackage)

	// 🔹 ข้อมูล MaintenanceRequest
	maintenanceRequest := entity.MaintenanceRequest{Description: "Fix the AC", UserID: users[0].ID, RoomID: rooms[0].ID, RequestStatusID: 1}
	db.FirstOrCreate(&maintenanceRequest)

	// 🔹 ข้อมูล MaintenanceTask
	maintenanceTask := entity.MaintenanceTask{Description: "Repairing air conditioning", UserID: users[1].ID, RequestID: maintenanceRequest.ID, RequestStatusID: 4} // In Progress
	db.FirstOrCreate(&maintenanceTask)

	// 🔹 ข้อมูล Inspection
	inspection := entity.Inspection{Description: "Routine safety check", UserID: users[1].ID, RequestID: maintenanceRequest.ID, RequestStatusID: 5} // Completed
	db.FirstOrCreate(&inspection)

	// 🔹 ข้อมูล MaintenanceImage
	maintenanceImage := entity.MaintenanceImage{FilePath: "/images/ac_repair.jpg", RequestID: maintenanceRequest.ID}
	db.FirstOrCreate(&maintenanceImage)

	fmt.Println("✅ Sample data added successfully!")
}
