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
	// สร้างตารางที่เกี่ยวข้องทั้งหมด
	db.AutoMigrate(
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
	)

	// สร้างและเพิ่มข้อมูลตัวอย่างสำหรับ User
	user1 := entity.User{
		CompanyName:   "TechCorp",
		BusinessDetail: "Technology Solutions Provider",
		FirstName:     "John",
		LastName:      "Doe",
		Email:         "john.doe@example.com",
		Password:      "password123",
		Phone:         "123456789",
		ProfilePath:   "/profiles/john.jpg",
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
		RoleID:        1,
	}

	// แฮชรหัสผ่านก่อนบันทึก
	user1.Password, _ = HashPassword(user1.Password)
	user2.Password, _ = HashPassword(user2.Password)

	// ใช้ FirstOrCreate แทน Create
	db.FirstOrCreate(&user1, entity.User{Email: user1.Email})
	db.FirstOrCreate(&user2, entity.User{Email: user2.Email})

	// สร้างและเพิ่ม RoomStatus
	roomStatusReserved := entity.RoomStatus{StatusName: "Reserved"}
	roomStatusNotReserved := entity.RoomStatus{StatusName: "Not Reserved"}
	db.FirstOrCreate(&roomStatusReserved, entity.RoomStatus{StatusName: roomStatusReserved.StatusName})
	db.FirstOrCreate(&roomStatusNotReserved, entity.RoomStatus{StatusName: roomStatusNotReserved.StatusName})

	// สร้างและเพิ่ม RoomType
	roomTypeMeeting := entity.RoomType{TypeName: "Meeting Room", HalfDayRate: 1000.0, FullDayRate: 2000.0}
	roomTypeTraining := entity.RoomType{TypeName: "Training Room", HalfDayRate: 1500.0, FullDayRate: 3000.0}
	db.FirstOrCreate(&roomTypeMeeting, entity.RoomType{TypeName: roomTypeMeeting.TypeName})
	db.FirstOrCreate(&roomTypeTraining, entity.RoomType{TypeName: roomTypeTraining.TypeName})

	// สร้างและเพิ่มห้อง
	room1 := entity.Room{Floor: 1, Capacity: 10, RoomStatusID: roomStatusReserved.ID, RoomTypeID: roomTypeMeeting.ID}
	room2 := entity.Room{Floor: 2, Capacity: 20, RoomStatusID: roomStatusNotReserved.ID, RoomTypeID: roomTypeTraining.ID}
	db.FirstOrCreate(&room1, entity.Room{Floor: room1.Floor, Capacity: room1.Capacity})
	db.FirstOrCreate(&room2, entity.Room{Floor: room2.Floor, Capacity: room2.Capacity})

	// สร้างและเพิ่ม Package
	packageSilver := entity.Package{PackageName: "Silver", MeetingRoomLimit: 10, TrainingRoomLimit: 5, MultiFunctionRoomLimit: 3}
	packageGold := entity.Package{PackageName: "Gold", MeetingRoomLimit: 20, TrainingRoomLimit: 10, MultiFunctionRoomLimit: 5}
	db.FirstOrCreate(&packageSilver, entity.Package{PackageName: packageSilver.PackageName})
	db.FirstOrCreate(&packageGold, entity.Package{PackageName: packageGold.PackageName})

	// สร้าง UserPackage สำหรับ user1
	userPackage := entity.UserPackage{UserID: &user1.ID, PackageID: packageSilver.ID, MeetingRoomUsed: 5, TrainingRoomUsed: 3, MultiFunctionRoomUsed: 1}
	db.FirstOrCreate(&userPackage)
	user1.UserPackageID = &userPackage.ID
	db.Save(&user1)

	// สร้างและเพิ่ม RequestStatus
	requestStatusPending := entity.RequestStatus{Name: "Pending"}
	requestStatusApproved := entity.RequestStatus{Name: "Approved"}
	db.FirstOrCreate(&requestStatusPending, entity.RequestStatus{Name: requestStatusPending.Name})
	db.FirstOrCreate(&requestStatusApproved, entity.RequestStatus{Name: requestStatusApproved.Name})

	// สร้างและเพิ่ม MaintenanceRequest
	maintenanceRequest := entity.MaintenanceRequest{Description: "Fix the AC", UserID: user1.ID, RoomID: room1.ID, RequestStatusID: requestStatusPending.ID}
	db.FirstOrCreate(&maintenanceRequest, entity.MaintenanceRequest{UserID: maintenanceRequest.UserID, RoomID: maintenanceRequest.RoomID, RequestStatusID: maintenanceRequest.RequestStatusID})

	// สร้างและเพิ่ม MaintenanceImage
	maintenanceImage := entity.MaintenanceImage{FilePath: "/images/ac_repair.jpg", RequestID: maintenanceRequest.ID}
	db.FirstOrCreate(&maintenanceImage, entity.MaintenanceImage{RequestID: maintenanceImage.RequestID})

	// สร้างและเพิ่ม ManagerApproval
	managerApproval := entity.ManagerApproval{Description: "Approved for Repair", UserID: user2.ID, RequestID: maintenanceRequest.ID, RequestStatusID: requestStatusApproved.ID}
	db.FirstOrCreate(&managerApproval, entity.ManagerApproval{RequestID: managerApproval.RequestID, UserID: managerApproval.UserID})

	// สร้างและเพิ่ม MaintenanceTask
	maintenanceTask := entity.MaintenanceTask{Description: "AC repair in progress", UserID: user1.ID, RequestID: maintenanceRequest.ID, RequestStatusID: requestStatusApproved.ID}
	db.FirstOrCreate(&maintenanceTask, entity.MaintenanceTask{RequestID: maintenanceTask.RequestID, UserID: maintenanceTask.UserID})

	// สร้างและเพิ่ม Inspection
	inspection := entity.Inspection{Description: "Initial inspection completed", UserID: user2.ID, RequestID: maintenanceRequest.ID, RequestStatusID: requestStatusApproved.ID}
	db.FirstOrCreate(&inspection, entity.Inspection{RequestID: inspection.RequestID, UserID: inspection.UserID})

	fmt.Println("Database migrated and sample data added successfully!")

}
