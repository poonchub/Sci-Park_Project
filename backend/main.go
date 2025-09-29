package main

import (
	"flag"
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/controller"
	"sci-park_web-application/middlewares"
	"sci-park_web-application/services"
	"time"

	"github.com/gin-gonic/gin"
)

const PORT = "8000"

func main() {
	// Parse command line flags
	testMode := flag.Bool("test", false, "Run in test mode (empty database, no mockup data)")
	flag.Parse()

	// โหลดค่าจาก .env ก่อนเชื่อมต่อฐานข้อมูล
	config.LoadEnv()
	config.ConnectDB()

	// Setup database with or without mockup data
	if *testMode {
		log.Println("🧪 Running in TEST MODE - Database will be empty (migrations only)")
		config.SetupDatabaseTestMode()
	} else {
		log.Println("🔄 Running in NORMAL MODE - Database with mockup data")
		config.SetupDatabase()
	}

	// ตั้งค่า CORS Middleware
	r := gin.Default()
	r.Use(CORSMiddleware())

	r.Static("/images", "./images")

	// 🌍 Public API (ไม่ต้องใช้ Token)
	public := r.Group("/")
	{
		public.POST("/auth/login", controller.UserLogin)

		// Send Email OTP
		public.POST("/send-otp-email", controller.ResetPasswordController)
		// Validate OTP
		public.POST("/validate-otp", controller.ValidateResetTokenController)

		public.POST("/send-maintenance-status-email/:id", controller.SendMaintenanceStatusEmail)

		// Genders
		public.GET("/genders", controller.ListGenders)

		//Register
		public.POST("/register", controller.CreateUserExternalOnly)

		// OrganizationInfo
		public.GET("/organization-info", controller.GetOrganizationInfo)

		// DeveloperInfo

		public.GET("/contributors", controller.ListContributors)

		//BookingRoom

		// public.PUT("/booking-rooms/:id/cancel", controller.CancelBookingRoom)

		// Payments

		// public.GET("/pending-payments", controller.GetPendingPayments)
		// public.PUT("/update-payment", controller.UpdatePaymentStatus)

	}

	// 🔒 Protected API (ต้องใช้ Token)
	protected := r.Group("/")
	protected.Use(middlewares.Authorizes(middlewares.User)) // ✅ Middleware ตรวจสอบ Token
	{
		// Users
		protected.GET("/user/:id", controller.GetUserByID)
		protected.PATCH("/user/:id", controller.UpdateUserByID)
		protected.POST("/create-user", controller.CreateUser)
		protected.PATCH("/update-user/:id", controller.UpdateUserByID)

		protected.POST("/user/upload-profile/:id", controller.UpdateProfileImage)
		protected.POST("/user/upload-signature/:id", controller.UpdateSignatureImage)
		protected.DELETE("/user/delete-signature/:id", controller.DeleteSignature)
		protected.GET("/operators", controller.ListOperators)
		protected.GET("/document-operators", controller.ListDocumentOperators)
		protected.PATCH("/update-profile/:id", controller.UpdateProfileImage)
		protected.PATCH("/change-password", controller.ChangePassword)

		// Analytics
		protected.POST("/analytics/track", controller.TrackPageVisit)
		protected.GET("/analytics/user/:user_id", controller.GetUserAnalytics)
		protected.GET("/analytics/page/:page_path", controller.GetPageAnalytics)
		protected.GET("/analytics/system", controller.GetSystemAnalytics)
		protected.GET("/analytics/dashboard", controller.GetAnalyticsDashboard)
		protected.GET("/analytics/visits-range", controller.GetVisitsRange)
		protected.GET("/analytics/popular-pages-by-period", controller.GetPopularPagesByPeriod)
		protected.GET("/analytics/performance", controller.GetPerformanceAnalytics)

		protected.GET("/get-quota/:id", controller.GetRoomDiscountByID)
		protected.GET("/rooms/roomtype/:id", controller.GetRoomsByRoomTypeID)

		// Areas
		protected.GET("/areas", controller.ListAreas)

		// RequestStatuses
		protected.GET("/request-statuses", controller.ListRequestStatuses)

		// Rooms
		protected.GET("/rooms", controller.ListRooms)
		protected.GET("/rooms/allrooms", controller.GetAllRooms)

		// RoomTypes
		protected.GET("/room-types", controller.ListRoomTypes)
		protected.GET("/room-types-for-booking", controller.ListRoomTypesForBooking)
		protected.GET("/room-type/:id", controller.GetRoomTypeByID)

		// RoomStatuses
		protected.GET("/room-status", controller.ListRoomStatus)

		// MaintenanceRequests
		protected.GET("/maintenance-requests", controller.ListMaintenanceRequests)
		protected.GET("/maintenance-request/:id", controller.GetMaintenanceRequestByID)
		protected.GET("/maintenance-request-user/:id", controller.GetMaintenanceRequestByUserID)
		protected.POST("/maintenance-request", controller.CreateMaintenanceRequest)
		protected.PATCH("/maintenance-request/:id", controller.UpdateMaintenanceRequestByID)
		protected.DELETE("/maintenance-request/:id", controller.DeleteMaintenanceRequestByID)
		protected.GET("/maintenance-requests-option-for-user", controller.GetMaintenanceRequestsForUser)

		// MaintenanceTypes
		protected.GET("/maintenance-types", controller.ListMaintenanceTypes)

		// MaintenanceImages
		protected.PATCH("/maintenance-images", controller.UpdateMaintenanceImages)
		protected.POST("/maintenance-images", controller.CreateMaintenanceImages)

		// Floors
		protected.GET("/floors", controller.ListFloors)

		// Room
		protected.GET("/room/:id", controller.GetRoomByID)

		// Roles
		protected.GET("/roles", controller.ListRoles)

		// JobPositions
		protected.GET("/job-positions", controller.ListJobPositions)
		protected.GET("/job-position/:id", controller.GetJobPositionByID)

		// TitlePrefixes
		protected.GET("/title-prefixes", controller.ListTitlePrefixes)
		protected.GET("/title-prefix/:id", controller.GetTitlePrefixByID)

		// Packages
		protected.GET("/packages", controller.ListPackages)

		// RequestTypes
		protected.GET("/request-types", controller.ListRequestType)

		// ManagerApprovals
		protected.POST("/manager-approval", controller.CreateManagerApproval)

		// MaintenanceTasks
		protected.POST("/maintenance-task", controller.CreateMaintenanceTask)
		protected.PATCH("/maintenance-task/:id", controller.UpdateMaintenanceTaskByID)

		// Inspections
		protected.POST("/inspection", controller.CreateInspection)

		// HandoverImages
		protected.PATCH("/handover-images", controller.UpdateHandoverImages)
		protected.DELETE("/handover-images/:id", controller.DeleteHandoverImagesByTaskID)

		// Notifications
		protected.GET("/notifications", controller.ListNotifications)
		protected.GET("/notifications/count/:id", controller.GetUnreadNotificationCountsByUserID)
		protected.GET("/notification/by-request/:request_id/:user_id", controller.GetNotificationByRequestAndUser)
		protected.GET("/notification/by-task/:task_id/:user_id", controller.GetNotificationByTaskAndUser)
		protected.GET("/notification/by-invoice/:invoice_id/:user_id", controller.GetNotificationByInvoiceAndUser)
		protected.GET("/notification/by-room-booking/:booking_id/:user_id", controller.GetNotificationByRoomBookingAndUser)
		protected.POST("/notification", controller.CreateNotification)
		protected.PATCH("/notification/:id", controller.UpdateNotificationByID)
		protected.PATCH("/notifications/request/:request_id", controller.UpdateNotificationsByRequestID)
		protected.PATCH("/notifications/task/:task_id", controller.UpdateNotificationsByTaskID)
		protected.PATCH("/notifications/service-area-request/:service_area_request_id", controller.UpdateNotificationsByServiceAreaRequestID)
		protected.PATCH("/notifications/service-area-task/:service_area_task_id", controller.UpdateNotificationsByServiceAreaTaskID)
		protected.PATCH("/notifications/booking-room/:booking_room_id", controller.UpdateNotificationsByBookingRoomID)

		// News
		protected.GET("/news", controller.ListNews)
		protected.GET("/news/pinned-period", controller.ListPinnedNewsPeriod)
		protected.GET("/news/ordered-period", controller.ListNewsOrderedPeriod)
		protected.GET("/news/unpinned-period", controller.ListUnpinnedNewsPeriod)

		// BusinessGroups
		protected.GET("/business-groups", controller.ListBusinessGroups)
		protected.GET("/business-groups/:id", controller.GetBusinessGroupByID)

		// CompanySizes
		protected.GET("/company-sizes", controller.ListCompanySizes)
		protected.GET("/company-sizes/:id", controller.GetCompanySizeByID)

		// ServiceUserTypes
		protected.GET("/service-user-types", controller.GetAllServiceUserTypes)
		protected.GET("/service-user-types/:id", controller.GetServiceUserTypeByID)
		protected.POST("/service-user-types", controller.CreateServiceUserType)
		protected.PUT("/service-user-types/:id", controller.UpdateServiceUserType)
		protected.DELETE("/service-user-types/:id", controller.DeleteServiceUserType)

		// ServiceAreaDocuments
		protected.POST("/service-area-documents/:request_service_area_id", controller.CreateServiceAreaDocument)
		protected.GET("/service-area-documents/:request_service_area_id", controller.GetServiceAreaDocumentByRequestID)
		protected.PUT("/service-area-documents/:request_service_area_id", controller.UpdateServiceAreaDocument)
		protected.PUT("/service-area-documents/:request_service_area_id/cancellation", controller.UpdateServiceAreaDocumentForCancellation)
		protected.DELETE("/service-area-documents/:request_service_area_id", controller.DeleteServiceAreaDocument)

		// ServiceAreaDocument Edit
		protected.GET("/service-area-documents/:request_service_area_id/edit", controller.GetServiceAreaDocumentForEdit)
		protected.PATCH("/service-area-documents/:request_service_area_id/edit", controller.UpdateServiceAreaDocumentForEdit)

		// RequestServiceArea & AboutCompany
		protected.POST("/request-service-area/:user_id", controller.CreateRequestServiceAreaAndAboutCompany)
		protected.GET("/request-service-area/:user_id", controller.GetRequestServiceAreaByUserID)
		protected.GET("/request-service-areas", controller.ListRequestServiceAreas)
		protected.GET("/request-service-areas/user/:user_id", controller.GetRequestServiceAreasByUserID)
		protected.GET("/request-service-area-document/:id", controller.DownloadServiceRequestDocument)
		protected.GET("/service-contract-document/:id", controller.DownloadServiceContractDocument)
		protected.GET("/area-handover-document/:id", controller.DownloadAreaHandoverDocument)
		protected.GET("/quotation-document/:id", controller.DownloadQuotationDocument)
		protected.GET("/refund-guarantee-document/:id", controller.DownloadRefundGuaranteeDocument)
		protected.GET("/cancellation-document/:id", controller.DownloadCancellationDocument)
		protected.GET("/bank-account-document/:id", controller.DownloadBankAccountDocument)
		protected.GET("/about-company/:user_id", controller.GetAboutCompanyByUserID)
		protected.PATCH("/request-service-area/:id", controller.UpdateRequestServiceArea)
		protected.PATCH("/request-service-area/:id/status", controller.UpdateRequestServiceAreaStatus)
		protected.PATCH("/request-service-area/:id/reject", controller.RejectServiceAreaRequest)

		protected.GET("/request-service-area/details/:id", controller.GetServiceAreaDetailsByID)
		protected.POST("/request-service-area/cancel/:request_id", controller.CancelRequestServiceArea)
		protected.GET("/cancel-request-service-area/:request_service_area_id/edit", controller.GetCancelRequestServiceAreaForEdit)
		protected.PATCH("/cancel-request-service-area/:request_service_area_id/edit", controller.UpdateCancelRequestServiceArea)
		protected.PATCH("/about-company/:user_id", controller.UpdateAboutCompany)

		// CollaborationPlans
		protected.GET("/collaboration-plans", controller.GetCollaborationPlansByRequestID)
		protected.PATCH("/collaboration-plans", controller.UpdateCollaborationPlans)

		// Payment
		protected.GET("/payments/:userId", controller.GetPaymentByUserID)
		protected.GET("/payments-option", controller.GetPaymentByOption)
		protected.POST("/payment", controller.CreatePayment)
		protected.PATCH("/payment/:id", controller.UpdatePaymentByID)

		// SlipOK
		protected.POST("/proxy/slipok", controller.ProxySlipOK)
		protected.GET("/proxy/slipok/quota", controller.ProxySlipOKQuota)

		// Invoice
		protected.GET("/invoice/:id/pdf", controller.GetInvoicePDF)
		protected.GET("/room-invoice-option", controller.GetInvoiceByOption)
		protected.GET("/invoice/:id", controller.GetInvoiceByID)
		protected.PATCH("/invoice/:id", controller.UpdateInvoiceByID)

		// PaymentStatus
		protected.GET("/payment-statuses", controller.ListPaymentStatuses)

		// BookingRooms
		// protected.GET("/booking-rooms/user/:id", controller.ListBookingRoomsByUser)
		protected.GET("/booking-room-option-for-user", controller.ListBookingRoomsForUser)

		//-----------------------------------------------------------------------
		protected.GET("/timeslots", controller.GetTimeSlots)
		protected.POST("/timeslots", controller.CreateTimeSlot)
		protected.GET("/get-timeslots-roomprices/:id", controller.GetRoomByIDwithBookings)
		protected.POST("/booking-rooms", controller.CreateBookingRoom)
		protected.PATCH("/user-packages/use-quota", controller.UseRoomQuota)
		protected.GET("/roomlayouts", controller.GetAllRoomLayouts)
		protected.GET("/roomtypes/:id/equipment", controller.GetEquipmentByRoomType)
		protected.GET("/layouts", controller.GetAllRoomLayouts)
		protected.POST("/payments/receipt/:payment_id", controller.UploadPaymentReceipt)
		protected.DELETE("/payments/receipt/:payment_id", controller.DeletePaymentReceipt)
		protected.POST("/booking-rooms/:id/payments", controller.SubmitPaymentSlip)
		protected.PATCH("/booking-rooms/:id/cancel", controller.CancelBookingRoom)
		protected.GET("/booking-rooms/:id", controller.GetBookingRoomByID)
		//---------------------------------------------

		// RoomBookingInvoices (moved to main section below)

		// PaymentType
		protected.GET("/payment-types", controller.ListPaymentTypes)

		// PaymentOptions
		protected.GET("/payment-options", controller.ListPaymentOptions)
	}

	protected.Use(middlewares.Authorizes(middlewares.MaintenanceOperator)) // ✅ Middleware ตรวจสอบ Token
	{
		// MaintenanceTasks
		protected.GET("/maintenance-task/:id", controller.GetMaintenanceTaskByID)
		protected.GET("/maintenance-tasks-option-id", controller.GetMaintenanceTasksByOperatorID)

		protected.DELETE("/maintenance-task/:id", controller.DeleteMaintenanceTaskByID)

		// HondoverImages
		protected.POST("/handover-images", controller.CreateHandoverImages)

		// Room
		protected.GET("/room-rental-space-option", controller.GetRoomRentalSpaceByOption)
		protected.GET("/room-rental-space/:id", controller.GetRoomRentalSpaceByID)
		protected.GET("/rooms/rental-space-summary", controller.GetRentalSpaceRoomSummary)

	}

	protected.Use(middlewares.Authorizes(middlewares.DocumentOperator)) // ✅ Middleware ตรวจสอบ Token
	{
		// Service Area Tasks
		protected.GET("/service-area-tasks/user/:user_id", controller.GetServiceAreaTasksByUserID)

		// Payments
		protected.DELETE("/payment-receipt/:id", controller.DeletePaymentReceiptByID)
		protected.GET("/booking-room-payments/by-date", controller.ListBookingRoomPaymentsByDateRange)
		protected.GET("/invoice-payments/by-date", controller.ListInvoicePaymentsByDateRange)

		// Invoice
		protected.GET("/invoices", controller.ListInvoices)
		protected.GET("/invoices/next-number", controller.GetNextInvoiceNumber)
		protected.POST("/invoice", controller.CreateInvoice)
		protected.POST("/invoice/upload-pdf", controller.UploadInvoicePDF)
		protected.DELETE("/invoice/:id", controller.DeleteInvoiceByID)
		protected.GET("/invoices/by-date", controller.ListInvoiceByDateRange)
		protected.GET("/invoices/previous-month-summary", controller.GetPreviousMonthInvoiceSummary)

		// InvoiceItems
		protected.GET("/invoice-items", controller.ListInvoiceItems)
		protected.GET("/invoice-item/:id", controller.GetInvoiceItemByID)
		protected.POST("/invoice-items", controller.CreateInvoiceItem)
		protected.PATCH("/invoice-item/:id", controller.UpdateInvoiceItemsByID)
		protected.DELETE("/invoice-item/:id", controller.DeleteInvoiceItemByID)
	}

	protected.Use(middlewares.Authorizes(middlewares.Manager)) // ✅ Middleware ตรวจสอบ Token
	{
		// Maintenance
		protected.GET("/maintenance-requests-option-for-admin", controller.GetMaintenanceRequestsForAdmin)
		protected.GET("/maintenance-requests/by-date", controller.ListMaintenanceRequestsByDateRange)

		// BookingRooms
		// protected.GET("/booking-rooms", controller.ListBookingRooms)
		protected.GET("/booking-rooms/by-date", controller.ListBookingRoomByDateRange)
		protected.GET("/booking-room-option-for-admin", controller.ListBookingRoomsForAdmin)

		//-------------------------------------------------------------------

		protected.POST("/booking-rooms/:id/approve", controller.ApproveBookingRoom)
		protected.POST("/booking-rooms/:id/reject", controller.RejectBookingRoom)
		protected.POST("/payments/:id/approve", controller.ApprovePayment)
		protected.POST("/payments/:id/reject", controller.RejectPayment)
		protected.PUT("/payments/:id/refund", controller.RefundPaymentByAdmin)

		//-----------------------------------------------------------------------

		// Service_area
		protected.POST("/service-area-approval", controller.CreateServiceAreaApproval)
		protected.POST("/cancellation-task", controller.CreateCancellationTask)
		protected.POST("/assign-cancellation-task", controller.AssignCancellationTask)

		// News
		protected.GET("/news/pinned", controller.ListPinnedNews)
		protected.GET("/news/unpinned", controller.ListUnpinnedNews)
		protected.GET("/news/ordered", controller.ListNewsOrdered)
		protected.POST("/news", controller.CreateNews)
		protected.PATCH("/news/:id", controller.UpdateNewsByID)
		protected.DELETE("/news/:id", controller.DeleteNewsByID)

		// NewsImages
		protected.POST("/news-images", controller.CreateNewsImages)
		protected.PATCH("/news-images", controller.UpdateNewsImages)
		protected.DELETE("/news-images/:newsID", controller.DeleteNewsImagesByNewsID)

		// OrganizationInfo
		protected.PATCH("/organization-info/:id", controller.UpdateOrganizationInfoByID)

		// UserPackage Reset (Manager only)
		protected.POST("/reset-user-packages", controller.ResetUserPackages)
		protected.POST("/reset-user-packages/:year", controller.ResetUserPackagesForYear)
		protected.GET("/user-package-usage-stats", controller.GetUserPackageUsageStats)
		protected.POST("/test-reset-user-packages", controller.TestResetUserPackages)

		// Rooms
		protected.GET("/rooms/meeting-room-summary-today", controller.GetMeetingRoomSummaryToday)
		protected.GET("/booking-rooms/summary-current-month", controller.GetBookingRoomSummary)

		// RoomBookingInvoices
		protected.GET("/room-booking-invoice/:id", controller.GetRoomBookingInvoiceByID)
		protected.GET("/room-booking-invoice/next-number", controller.GetNextRoomBookingInvoiceNumber)
		protected.POST("/room-booking-invoice", controller.CreateRoomBookingInvoice)
		protected.POST("/room-booking-invoice/upload-pdf", controller.UploadRoomBookingInvoicePDF)

		// RoomBookingInvoiceItems
		protected.POST("/room-booking-invoice-item", controller.CreateRoomBookingInvoiceItem)
	}

	protected.Use(middlewares.Authorizes(middlewares.Admin)) // ✅ Middleware ตรวจสอบ Token
	{
		// Users
		protected.GET("/users", controller.ListUsers)

		// JobPositions
		protected.POST("/create-job-position", controller.CreateJobPosition)
		protected.PATCH("/update-job-position/:id", controller.UpdateJobPositionByID)
		protected.DELETE("/job-position/:id", controller.DeleteJobPositionByID)

		// TitlePrefixes
		protected.POST("/create-title-prefix", controller.CreateTitlePrefix)
		protected.PATCH("/update-title-prefix/:id", controller.UpdateTitlePrefixByID)
		protected.DELETE("/title-prefix/:id", controller.DeleteTitlePrefixByID)

		// Rooms
		protected.GET("/listset-room", controller.ListSetRooms)
		protected.POST("/create-room", controller.CreateRoom)
		protected.PATCH("/update-room/:id", controller.UpdateRoom)
		protected.DELETE("/delete-room/:id", controller.DeleteRoom)

		// Floors
		protected.POST("/create-floor", controller.CreateFloor)
		protected.PATCH("/update-floor/:id", controller.UpdateFloor)

		// RoomTypes
		protected.POST("/create-room-type", controller.CreateRoomType)
		protected.PATCH("/update-room-type/:id", controller.UpdateRoomType)

		//---------------------------------------------------------------
		protected.DELETE("/room-types/:id", controller.DeleteRoomType)
		protected.POST("/layouts", controller.CreateLayout)
		protected.GET("/equipments", controller.GetEquipments)
		protected.GET("/equipments/:id", controller.GetEquipment)
		protected.POST("/equipments", controller.CreateEquipment)
		protected.PATCH("/equipments/:id", controller.UpdateEquipment)
		protected.DELETE("/equipments/:id", controller.DeleteEquipment)
		//--------------------------------------------------------------

		// BookingRooms
		protected.PATCH("/booking-room/:id", controller.UpdateBookingRoomByID)

	}

	// 🌍 Root Route
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

	// 🕐 Start UserPackage Reset Scheduler
	scheduler := services.NewScheduler()
	scheduler.StartDailyCheck()
	log.Println("UserPackage Reset Scheduler started")

	go func() {
		for {
			now := time.Now()
			// หาว่าต้องรออีกกี่นาทีถึง 00:05 ของวันถัดไป
			next := time.Date(now.Year(), now.Month(), now.Day()+1, 0, 5, 0, 0, now.Location())
			d := time.Until(next)

			time.Sleep(d) // รอจนถึงเวลา

			// เรียกฟังก์ชัน auto-cancel
			if n, err := controller.AutoCancelUnpaidBookings(24); err != nil {
				log.Println("[auto-cancel] error:", err)
			} else {
				log.Println("[auto-cancel] cancelled bookings:", n)
			}
		}
	}()

	// 🚀 Start Server
	r.Run("localhost:" + PORT) // ✅

}

// 🛠 CORS Middleware
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, x-authorization")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, PATCH, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}
