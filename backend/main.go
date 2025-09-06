package main

import (
	"log"
	"net/http"
	"sci-park_web-application/config"
	"sci-park_web-application/controller"
	"sci-park_web-application/middlewares"
	"time"

	"github.com/gin-gonic/gin"
)

const PORT = "8000"

func main() {
	// โหลดค่าจาก .env ก่อนเชื่อมต่อฐานข้อมูล
	config.LoadEnv()
	config.ConnectDB()
	config.SetupDatabase()

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

		public.GET("/get-timeslots-roomprices/:id", controller.GetRoomByIDwithBookings)

		public.POST("/booking-rooms", controller.CreateBookingRoom)

		public.GET("/pending-payments", controller.GetPendingPayments)
		public.PUT("/update-payment", controller.UpdatePaymentStatus)
		public.PATCH("/booking-rooms/:id/cancel", controller.CancelBookingRoom)
		public.GET("/roomtypes/:id/equipment", controller.GetEquipmentByRoomType)
		public.PATCH("/user-packages/use-quota", controller.UseRoomQuota)
		public.GET("/roomlayouts", controller.GetAllRoomLayouts)
		public.DELETE("/room-types/:id", controller.DeleteRoomType)
		public.PUT("/booking-rooms/:id/cancel", controller.CancelBookingRoom)
		// delete

		r.GET("/equipments", controller.GetEquipments)
		r.GET("/equipments/:id", controller.GetEquipment)
		r.POST("/equipments", controller.CreateEquipment)
		r.PATCH("/equipments/:id", controller.UpdateEquipment)
		r.DELETE("/equipments/:id", controller.DeleteEquipment)

		r.GET("/timeslots", controller.GetTimeSlots)
		r.POST("/timeslots", controller.CreateTimeSlot)

		r.GET("/layouts", controller.GetAllRoomLayouts)
		r.POST("/layouts", controller.CreateLayout)

		// router.go (ตัวอย่าง)

		r.GET("/booking-rooms/:id", controller.GetBookingRoomByID)
		r.POST("/booking-rooms/:id/approve", controller.ApproveBookingRoom)
		r.POST("/booking-rooms/:id/reject", controller.RejectBookingRoom)
		r.POST("/booking-rooms/:id/complete", controller.CompleteBookingRoom)

		r.POST("/booking-rooms/:id/payments", controller.SubmitPaymentSlip)
		r.POST("/payments/:id/approve", controller.ApprovePayment)
		r.POST("/payments/:id/reject", controller.RejectPayment)
		r.PUT("/payments/:id/refund", controller.RefundedBookingRoom)
		r.POST("/payments/:id/mark-paid", controller.MarkPaymentPaid)

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
		protected.POST("/notification", controller.CreateNotification)
		protected.PATCH("/notification/:id", controller.UpdateNotificationByID)
		protected.PATCH("/notifications/request/:request_id", controller.UpdateNotificationsByRequestID)
		protected.PATCH("/notifications/task/:task_id", controller.UpdateNotificationsByTaskID)

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
		protected.DELETE("/service-area-documents/:request_service_area_id", controller.DeleteServiceAreaDocument)

		// RequestServiceArea & AboutCompany
		protected.POST("/request-service-area/:user_id", controller.CreateRequestServiceAreaAndAboutCompany)
		protected.GET("/request-service-area/:user_id", controller.GetRequestServiceAreaByUserID)
		protected.GET("/request-service-areas", controller.ListRequestServiceAreas)
		protected.GET("/request-service-areas/user/:user_id", controller.GetRequestServiceAreasByUserID)
		protected.GET("/request-service-area-document/:id", controller.DownloadServiceRequestDocument)
		protected.GET("/about-company/:user_id", controller.GetAboutCompanyByUserID)
		protected.PATCH("/request-service-area/:id", controller.UpdateRequestServiceArea)
		protected.PATCH("/request-service-area/:id/status", controller.UpdateRequestServiceAreaStatus)
		protected.PATCH("/request-service-area/:id/reject", controller.RejectServiceAreaRequest)

		protected.GET("/request-service-area/details/:id", controller.GetServiceAreaDetailsByID)
		protected.POST("/request-service-area/cancel/:request_id", controller.CancelRequestServiceArea)
		protected.PATCH("/about-company/:user_id", controller.UpdateAboutCompany)

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
		protected.GET("/booking-rooms/user/:id", controller.ListBookingRoomsByUser)
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
	}

	protected.Use(middlewares.Authorizes(middlewares.Manager)) // ✅ Middleware ตรวจสอบ Token
	{
		// Maintenance
		protected.GET("/maintenance-requests-option-for-admin", controller.GetMaintenanceRequestsForAdmin)
		protected.GET("/maintenance-requests/by-date", controller.ListMaintenanceRequestsByDateRange)

		// BookingRooms
		protected.GET("/booking-rooms", controller.ListBookingRooms)
		protected.GET("/booking-rooms/by-date", controller.ListBookingRoomByDateRange)

		// Service_area
		protected.POST("/service-area-approval", controller.CreateServiceAreaApproval)

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

		// Payments
		protected.DELETE("/payment-receipt/:id", controller.DeletePaymentReceiptByID)
		protected.GET("/booking-room-payments/by-date", controller.ListBookingRoomPaymentsByDateRange)
		protected.GET("/invoice-payments/by-date", controller.ListInvoicePaymentsByDateRange)

		// Rooms
		protected.GET("/rooms/meeting-room-summary-today", controller.GetMeetingRoomSummaryToday)
		protected.GET("/booking-rooms/summary-current-month", controller.GetBookingRoomSummary)

		// Invoice
		protected.GET("/invoices", controller.ListInvoices)
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

		// Floors
		protected.POST("/create-floor", controller.CreateFloor)
		protected.PATCH("/update-floor/:id", controller.UpdateFloor)

		// RoomTypes
		protected.POST("/create-room-type", controller.CreateRoomType)
		protected.PATCH("/update-room-type/:id", controller.UpdateRoomType)

	}

	// 🌍 Root Route
	r.GET("/", func(c *gin.Context) {
		c.String(http.StatusOK, "API RUNNING... PORT: %s", PORT)
	})

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
