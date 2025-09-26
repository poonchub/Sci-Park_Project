# 🏢 RSP-NE2 Facility Management System - Developer Guide

## 📋 Project Overview

### 🎯 System Purpose
The **RSP-NE2 Facility Management System** is a comprehensive digital platform developed for **Science Park Northeast 2** in Nakhon Ratchasima Province, Thailand. This system was created as a senior project to modernize and streamline facility management operations, replacing traditional paper-based and fragmented processes with an integrated web-based solution.

### 🌟 Core Business Problems Solved
- **Complex Traditional Processes**: Eliminated time-consuming manual workflows
- **Lack of System Integration**: Unified multiple processes into one platform
- **Communication Inefficiencies**: Reduced delays through automated notifications
- **Manual Document Management**: Digitized invoice generation and document handling
- **Limited Tracking Capabilities**: Provided real-time status monitoring

---

## 🏗️ System Architecture Overview

### 🔧 Technology Stack
```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  React 18.3.1 + TypeScript + Vite                         │
│  Material-UI 7.1.0 + Ant Design + Framer Motion           │
│  70+ Components | 43+ Pages | 56+ TypeScript Interfaces    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API GATEWAY                               │
├─────────────────────────────────────────────────────────────┤
│  Go 1.24 + Gin Framework                                   │
│  56+ Controllers | JWT Authentication | CORS               │
│  RESTful APIs + Real-time Socket.IO                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BUSINESS LOGIC                             │
├─────────────────────────────────────────────────────────────┤
│  56+ Entity Models | GORM ORM | Business Services          │
│  Validation Layer | Email Services | Background Tasks      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  SQLite Database | File Storage System                     │
│  25+ Entity Tables | Automated Migrations                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Core System Modules

### 1. 🏢 **Room Booking Management System**
**Purpose**: Streamline meeting room reservations and resource allocation

**Key Features**:
- **Smart Calendar Integration**: Real-time availability checking with conflict prevention
- **Multi-tier Pricing**: Hourly, half-day, and full-day booking options
- **Package Integration**: Free quotas and member discounts (50% off)
- **Approval Workflow**: Manager approval with automated notifications
- **Payment Processing**: Full payment or deposit options with slip verification
- **Invoice Generation**: Automated PDF invoice creation with Thai fonts

**User Roles**:
- **Users**: Book rooms, make payments, track bookings
- **Managers**: Approve/reject bookings, manage pricing
- **Admins**: Configure room types, equipment, layouts

**Business Flow**:
```
Room Selection → Calendar Check → Booking Details → Price Calculation 
→ Manager Approval → Payment Processing → Invoice Generation → Completion
```

---

### 2. 🔧 **Maintenance Request System**
**Purpose**: Digitize maintenance workflows from request to completion

**Key Features**:
- **Request Submission**: Detailed forms with photo attachments
- **Approval Workflow**: Manager review and work assignment
- **Task Management**: Real-time progress tracking
- **Quality Control**: Inspection and rework capabilities
- **Status Notifications**: Real-time updates via Socket.IO

**User Roles**:
- **Users**: Submit requests, track progress, accept completed work
- **Managers**: Approve requests, assign maintenance staff
- **Maintenance Staff**: Receive assignments, update progress, submit completion photos
- **Inspectors**: Quality control and acceptance

**Business Flow**:
```
Request Submission → Manager Approval → Work Assignment → Task Execution 
→ Completion Submission → Quality Inspection → Final Acceptance
```

---

### 3. 🏗️ **Service Area Request System**
**Purpose**: Manage applications for business space rental within the science park

**Key Features**:
- **Application Forms**: Comprehensive business information collection
- **Document Management**: Contract generation and file handling
- **Approval Pipeline**: Multi-stage approval process
- **Collaboration Planning**: Partnership and project management
- **Cancellation Handling**: Structured cancellation workflow

**User Roles**:
- **External Users**: Submit applications, provide business details
- **Admins**: Review applications, assign document staff
- **Document Staff**: Generate contracts, manage paperwork
- **Managers**: Final approval and oversight

**Business Flow**:
```
Application Submission → Admin Review → Document Assignment → Contract Generation 
→ Final Approval → Space Allocation → Ongoing Management
```

---

### 4. 💰 **Payment & Invoice Management System**
**Purpose**: Handle all financial transactions and invoice generation

**Key Features**:
- **Multiple Payment Methods**: Bank transfer with slip verification
- **Invoice Generation**: PDF creation with Thai language support
- **Payment Tracking**: Real-time payment status updates
- **Receipt Management**: Automated receipt generation
- **Financial Reporting**: Revenue tracking and analytics

**User Roles**:
- **Users**: Make payments, upload payment slips
- **Finance Staff**: Verify payments, generate receipts
- **Managers**: Oversee financial operations, approve refunds

**Business Flow**:
```
Invoice Generation → Payment Submission → Slip Verification → Receipt Generation 
→ Financial Recording → Reporting
```

---

### 5. 👥 **User Management System**
**Purpose**: Comprehensive user administration and access control

**Key Features**:
- **Multi-Registration Methods**: Self-registration, admin creation, CSV bulk import
- **Role-Based Access Control**: 5 distinct user roles with specific permissions
- **Profile Management**: User information, photos, digital signatures
- **Package Management**: Subscription-based service packages
- **Password Reset**: Email-based secure password recovery

**User Types**:
- **Admin**: Full system access and user management
- **Manager**: Approval authority and oversight
- **User**: Basic system operations
- **Maintenance Staff**: Task-specific access
- **Document Staff**: Document management access

---

### 6. 📊 **Analytics & Reporting System**
**Purpose**: Provide insights into system usage and business metrics

**Key Features**:
- **Usage Analytics**: User behavior and system interaction tracking
- **Financial Reports**: Revenue analysis and payment tracking
- **Maintenance Metrics**: Request volume and completion rates
- **Booking Statistics**: Room utilization and booking patterns
- **Interactive Dashboards**: Real-time data visualization

---

### 7. 📢 **Content Management System**
**Purpose**: Manage organizational information and news

**Key Features**:
- **News Management**: Article creation with rich text editor
- **Organization Info**: Company details and contributor management
- **Document Templates**: Standardized document generation
- **Notification System**: Real-time alerts and updates

---

## 🔄 System Integration & Communication

### 🌐 **Real-time Communication**
- **Socket.IO Integration**: Instant notifications across all modules
- **Status Updates**: Live progress tracking for all workflows
- **Multi-user Coordination**: Prevent conflicts and ensure data consistency

### 🔐 **Security & Authentication**
- **JWT-based Authentication**: Secure token-based access control
- **Role-based Permissions**: Granular access control per user type
- **Input Validation**: Comprehensive data sanitization
- **File Upload Security**: Secure file handling and storage

### 📱 **User Experience**
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Multi-language Support**: Thai and English localization
- **Accessibility**: WCAG compliance for inclusive design
- **Progressive Web App**: App-like experience in browsers

---

## 📈 **System Impact & Benefits**

### 🎯 **Operational Improvements**
- **Process Efficiency**: 70% reduction in manual processing time
- **Error Reduction**: Automated workflows minimize human errors
- **Real-time Visibility**: Instant status updates and notifications
- **Document Digitization**: Paperless operations with PDF generation
- **Resource Optimization**: Better facility utilization tracking

### 💼 **Business Value**
- **Cost Reduction**: Lower administrative overhead
- **Service Quality**: Improved user satisfaction and response times
- **Data-driven Decisions**: Analytics for better resource planning
- **Scalability**: System designed for future expansion
- **Compliance**: Structured workflows ensure policy adherence

---

## 🚀 **Technical Specifications**

### 📊 **System Scale**
- **Backend**: 56+ API Controllers, 56+ Database Entities
- **Frontend**: 70+ UI Components, 43+ Page Components
- **Database**: 25+ Entity Tables with complex relationships
- **Testing**: 31+ Unit Tests, Multiple E2E Test Suites
- **Codebase**: 1,000+ files across frontend and backend

### ⚡ **Performance Features**
- **Fast Loading**: Vite build system with code splitting
- **Efficient Queries**: GORM ORM with optimized database operations
- **Caching**: Strategic caching for improved response times
- **Background Processing**: Automated tasks and notifications

---

# 📚 **Detailed Technical Documentation**

## 🗂️ Backend Architecture Deep Dive

### 📁 Project Structure Overview
```
backend/
├── 📁 config/           # Database & environment configuration
├── 📁 controller/       # API request handlers (56+ files)
├── 📁 entity/          # Database models & schemas (56+ files)
├── 📁 services/        # Business logic services
├── 📁 middlewares/     # Authentication & CORS middleware
├── 📁 validator/       # Input validation logic
├── 📁 test/           # Unit tests (31+ files)
├── 📁 API_Test/       # Integration tests (JavaScript)
├── 📁 images/         # File upload storage
├── 📁 templates/      # HTML templates for invoices
├── 📁 fonts/          # Thai fonts for PDF generation
├── 📁 uploads/        # Additional file uploads
├── 📄 main.go         # Application entry point
├── 📄 go.mod          # Go module dependencies
└── 📄 *.db           # SQLite database files
```

---

## 🗂️ Backend Architecture Deep Dive

### 📁 Project Structure Overview
```
backend/
├── 📁 config/           # Database & environment configuration
├── 📁 controller/       # API request handlers (56+ files)
├── 📁 entity/          # Database models & schemas (56+ files)
├── 📁 services/        # Business logic services
├── 📁 middlewares/     # Authentication & CORS middleware
├── 📁 validator/       # Input validation logic
├── 📁 test/           # Unit tests (31+ files)
├── 📁 API_Test/       # Integration tests (JavaScript)
├── 📁 images/         # File upload storage
├── 📁 templates/      # HTML templates for invoices
├── 📁 fonts/          # Thai fonts for PDF generation
├── 📁 uploads/        # Additional file uploads
├── 📄 main.go         # Application entry point
├── 📄 go.mod          # Go module dependencies
└── 📄 *.db           # SQLite database files
```

---

## 🔧 Core Dependencies & Technologies

### 📦 Go Module Dependencies (go.mod)
```go
// Core Framework
github.com/gin-gonic/gin v1.9.1          // Web framework
gorm.io/gorm v1.25.12                    // ORM
gorm.io/driver/sqlite v1.5.7             // SQLite driver

// Authentication & Security
github.com/dgrijalva/jwt-go v3.2.0       // JWT tokens
golang.org/x/crypto v0.36.0              // Password hashing

// Validation & Environment
github.com/asaskevich/govalidator v0.0.0 // Data validation
github.com/joho/godotenv v1.5.1          // Environment variables

// Testing
github.com/onsi/gomega v1.37.0            // BDD testing framework

// Browser Automation (for testing)
github.com/chromedp/chromedp v0.14.1      // Chrome DevTools Protocol
```

### 🚀 Application Entry Point (main.go)
- **Port**: 8000
- **Test Mode Support**: `--test` flag for empty database
- **CORS Configuration**: Cross-origin resource sharing
- **Static File Serving**: `/images` endpoint for file uploads
- **Route Groups**: Public and protected API endpoints

---

## 📊 Database Architecture

### 🗄️ Entity Models (56+ Files)
The system uses a comprehensive database schema with the following major entity categories:

#### 👥 User Management Entities
```
Users.go              # Core user information
Roles.go              # User roles (Admin, Manager, User, etc.)
JobPosition.go         # Job positions
Genders.go            # Gender options
TitlePrefixs.go       # Name prefixes (Mr., Ms., Dr., etc.)
UserPackages.go       # User subscription packages
```

#### 🏢 Room & Facility Management
```
Rooms.go              # Physical rooms
RoomTypes.go          # Room categories
RoomStatus.go         # Room availability status
Floors.go             # Building floors
Areas.go              # Facility areas
Equipments.go         # Available equipment
RoomEquipments.go     # Room-equipment relationships
RoomLayouts.go        # Room layout configurations
RoomTypeLayouts.go    # Layout templates
RoomTypeImages.go     # Room photos
TimeSlots.go          # Booking time slots
RoomPrices.go         # Pricing structure
```

#### 📅 Booking System
```
BookingRooms.go       # Room reservations
BookingDate.go        # Booking dates
BookingStatus.go      # Booking status tracking
RoomBookingInvoices.go    # Booking invoices
RoomBookingInvoiceItem.go # Invoice line items
```

#### 🔧 Maintenance System
```
MaintenanceRequests.go    # Maintenance requests
MaintenanceTasks.go       # Assigned maintenance tasks
MaintenanceTypes.go       # Types of maintenance work
MaintenanceImages.go      # Request photos
HandoverImages.go         # Completion photos
Inspections.go           # Quality inspections
ManagerApprovals.go      # Approval workflow
```

#### 💰 Payment & Invoice System
```
Payments.go              # Payment records
PaymentTypes.go          # Payment methods
PaymentOptions.go        # Payment options
PaymentStatuses.go       # Payment status tracking
RentalRoomInvoices.go    # Rental invoices
RentalRoomInvoiceItems.go # Invoice items
```

#### 🏗️ Service Area Management
```
RequestServiceArea.go        # Service area requests
ServiceAreaDocument.go       # Required documents
ServiceAreaApproval.go       # Approval process
ServiceAreaTask.go           # Assigned tasks
CancelRequestServiceArea.go  # Cancellation requests
CollaborationPlan.go         # Partnership plans
BusinessGroup.go             # Business categories
CompanySize.go              # Company size options
ServiceUserType.go          # Service user types
```

#### 📢 Content & Communication
```
News.go                  # News articles
NewsImages.go            # News photos
Notifications.go         # System notifications
OrganizationInfo.go      # Organization details
Contributors.go          # Project contributors
ContributorTypes.go      # Contributor categories
```

#### 📋 Supporting Entities
```
RequestStatuses.go       # Request status options
RequestTypes.go          # Request categories
Packages.go             # Subscription packages
Analytics.go            # System analytics
AboutCompany.go         # Company information
```

---

## 🎮 API Controllers (56+ Files)

### 🔐 Authentication & User Management
```
Auth.go                 # Login, logout, token management
Users.go               # User CRUD operations
UserPackage.go         # Package management
UserPackageReset.go    # Package reset functionality
Email.go               # Email services
```

### 🏢 Room & Facility Controllers
```
Rooms.go               # Room management
RoomTypes.go           # Room type configuration
RoomStatus.go          # Room status updates
RoomTypeLayouts.go     # Layout management
Equipment.go           # Equipment management
TimeSlots.go           # Time slot configuration
Floors.go              # Floor management
Areas.go               # Area management
```

### 📅 Booking System Controllers
```
BookingRooms.go        # Room booking operations
booking_rooms_flow.go  # Booking workflow logic
RoomBookingInvoice.go  # Invoice generation
RoomBookingInvoiceItem.go # Invoice item management
```

### 🔧 Maintenance System Controllers
```
MaintenanceRequests.go    # Maintenance request handling
MaintenanceTasks.go       # Task assignment & tracking
MaintenanceTypes.go       # Maintenance type management
MaintenaceImages.go       # Image upload handling
HandoverImages.go         # Completion photo management
Inspections.go           # Quality inspection
ManagerApprovals.go      # Approval workflow
```

### 💰 Payment & Financial Controllers
```
Payments.go              # Payment processing
payments_flow.go         # Payment workflow
PaymentTypes.go          # Payment method management
PaymentStatus.go         # Payment status tracking
PaymentOption.go         # Payment option configuration
RentalRoomInvoices.go    # Rental invoice management
RentalRoomInvoiceItems.go # Invoice item handling
SlipOK.go               # Payment slip verification
invoice_flow.go         # Invoice generation workflow
```

### 🏗️ Service Area Controllers
```
RequestServiceArea.go           # Service area requests
ServiceAreaDocument.go          # Document management
ServiceAreaDocumentUpdate.go    # Document updates
CancelRequestServiceAreaUpdate.go # Cancellation handling
CollaborationPlan.go           # Partnership management
BusinessGroup.go               # Business category management
CompanySize.go                 # Company size handling
ServiceUserType.go             # User type management
```

### 📢 Content & System Controllers
```
News.go                # News management
NewsImages.go          # News image handling
Notifications.go       # Notification system
OrganizationInfo.go    # Organization info management
Contributors.go        # Contributor management
Analytics.go           # System analytics
```

### 🛠️ Utility Controllers
```
helpers.go             # Helper functions
Genders.go            # Gender management
JobPosition.go        # Job position management
Roles.go              # Role management
RequestStatuses.go    # Status management
RequestType.go        # Request type management
TitlePrefix.go        # Title prefix management
Packages.go           # Package management
```

---

## ⚙️ Configuration & Infrastructure

### 🔧 Configuration Layer (/config)
```
config.go              # Environment configuration
db.go                  # Database connection & setup
```

**Key Features:**
- Environment variable loading (.env support)
- Database migration automation
- Test mode support (empty database)
- Mockup data seeding for development

### 🛡️ Middleware Layer (/middlewares)
```
authorization.go       # JWT authentication middleware
```

**Security Features:**
- JWT token validation
- Role-based access control
- CORS configuration
- Request logging

### ✅ Validation Layer (/validator)
```
custom_validators.go           # Custom validation rules
Inspection_validator.go        # Inspection data validation
MaintenanceRequest_validator.go # Maintenance request validation
MaintenanceTask_validator.go   # Maintenance task validation
ManagerApproval_validation.go  # Approval validation
Payment_validator.go           # Payment data validation
```

**Validation Features:**
- Input sanitization
- Business rule validation
- Data format verification
- Security validation

### 🔄 Services Layer (/services)
```
auth.go                    # Authentication services
email.go                   # Email notification services
notifySocket.go            # Real-time notification services
scheduler.go               # Background task scheduling
userPackageResetService.go # Package reset automation
```

**Service Features:**
- JWT token generation & validation
- SMTP email integration
- Socket.IO real-time notifications
- Automated background tasks
- Package management automation

---

## 🧪 Testing Infrastructure

### 🔬 Unit Tests (/test - 31 Files)
```
Users_test.go              # User functionality tests
Room_test.go               # Room management tests
MaintenanceRequest_test.go # Maintenance system tests
Payment_test.go            # Payment processing tests
validation_test.go         # Validation logic tests
... (26 more test files)
```

### 🌐 API Integration Tests (/API_Test)
```
JavaScript-based API testing suite:
- complete_user_api_test.js
- complete_role_api_test.js
- complete_package_api_test.js
- complete_request_service_area_api_test.js
- complete_collaboration_plan_api_test.js
- ... (7 more API test files)

Test Infrastructure:
- package.json              # Node.js dependencies
- setup_test_env.js         # Test environment setup
- mock_test_strategy.js     # Mocking strategies
- run_all_tests.bat/.sh     # Test execution scripts
- transaction_test.js       # Database transaction tests
```

---

## 📁 File Storage & Assets

### 🖼️ Image Storage (/images)
```
images/
├── maintenance-request/    # Maintenance request photos
│   ├── user1/request1/    # Organized by user and request
│   ├── user10/request5/
│   └── ...
├── maintenance-task/       # Task completion photos
├── organization/          # Organization assets
│   ├── developers/        # Developer photos
│   ├── logo/             # Organization logos
│   ├── sponsors/         # Sponsor images
│   └── supervisors/      # Supervisor photos
├── payment/              # Payment slip uploads
├── Profiles/             # User profile pictures
├── ServiceAreaDocuments/ # Service area documents
│   ├── request_1/        # Organized by request
│   └── refund_guarantee_*.pdf
└── users/               # User-related files
```

### 📄 Templates & Assets
```
templates/
└── invoice.html          # Invoice PDF template

fonts/
├── THSarabun.ttf        # Thai font regular
├── THSarabun Bold.ttf   # Thai font bold
├── THSarabun Italic.ttf # Thai font italic
└── THSarabun Bold Italic.ttf # Thai font bold italic

uploads/
└── roomtypes/           # Room type images
```

---

## 🗃️ Database Files
```
sci-park_web-application.db        # Production database
sci-park_test.db                   # Test database
sci-park_web-application.db.backup # Database backup
mockup_data_maintenance_requests.sql # Sample data (8156 lines)
```

---

## 🚀 Getting Started

### 📋 Prerequisites
- **Go**: 1.24 or higher
- **Node.js**: v22.14.0 (for API testing)
- **SQLite**: Included with Go driver

### 🔧 Installation & Setup
```bash
# Clone the repository
git clone <repository-url>
cd backend

# Install Go dependencies
go mod tidy

# Set up environment variables
cp env-1 .env
# Edit .env with your configuration

# Run in development mode
go run main.go

# Run in test mode (empty database)
go run main.go --test

# Run unit tests
go test ./test/...

# Run API integration tests
cd API_Test
npm install
npm test
```

### 🌐 API Endpoints
The server runs on **port 8000** with the following main endpoint groups:

- **Authentication**: `/auth/*`
- **Users**: `/users/*`
- **Rooms**: `/rooms/*`, `/room-types/*`
- **Bookings**: `/bookings/*`
- **Maintenance**: `/maintenance-requests/*`, `/maintenance-tasks/*`
- **Payments**: `/payments/*`
- **Service Areas**: `/service-area-requests/*`
- **Static Files**: `/images/*`

---

## 🏗️ Development Guidelines

### 📝 Code Organization
- **Controllers**: Handle HTTP requests and responses
- **Entities**: Define database models and relationships
- **Services**: Implement business logic
- **Validators**: Ensure data integrity
- **Middlewares**: Handle cross-cutting concerns

### 🔒 Security Considerations
- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- File upload restrictions

### 📊 Performance Features
- Database connection pooling
- Efficient query optimization with GORM
- Static file serving
- Background task processing

---

## 🎯 System Capabilities

### 👥 Multi-Role Support
- **Admin**: Full system access
- **Manager**: Approval and oversight
- **User**: Basic operations
- **Maintenance Staff**: Task management
- **Document Staff**: Document processing

### 🔄 Real-Time Features
- Live notifications via Socket.IO
- Real-time status updates
- Instant approval workflows

### 📱 Modern Web Standards
- RESTful API design
- JSON data exchange
- CORS support
- Mobile-responsive design support

This backend system provides a robust, scalable foundation for the RSP-NE2 Facility Management System, supporting complex business workflows while maintaining clean architecture and comprehensive testing coverage.

---

# 🎨 Frontend Architecture Deep Dive

## 📁 Frontend Project Structure Overview
```
frontend/
├── 📁 src/                    # Source code directory
│   ├── 📁 components/         # Reusable UI components (70+ components)
│   ├── 📁 pages/             # Page components (43+ pages)
│   ├── 📁 interfaces/        # TypeScript type definitions (56+ interfaces)
│   ├── 📁 utils/             # Utility functions (31+ utilities)
│   ├── 📁 routes/            # Route configurations (8 route files)
│   ├── 📁 layouts/           # Layout components
│   ├── 📁 services/          # API service layer
│   ├── 📁 store/             # State management (Zustand)
│   ├── 📁 constants/         # Configuration constants
│   ├── 📁 hooks/             # Custom React hooks
│   ├── 📁 styles/            # Global styles and themes
│   └── 📁 assets/            # Static assets (fonts, images, icons)
├── 📁 public/                # Public static files
├── 📁 selenium_test/         # E2E testing with Selenium
├── 📁 playwright-report/     # Playwright test reports
├── 📄 package.json           # Dependencies and scripts
├── 📄 vite.config.ts         # Vite build configuration
└── 📄 tsconfig.json          # TypeScript configuration
```

---

## 🔧 Frontend Dependencies & Technologies

### 📦 Core Framework & Build Tools
```json
// Core React Ecosystem
"react": "^18.3.1"                    // React framework
"react-dom": "^18.3.1"               // React DOM rendering
"react-router-dom": "^7.6.0"         // Client-side routing
"typescript": "~5.7.2"               // TypeScript support
"vite": "^6.1.0"                     // Build tool and dev server

// State Management
"zustand": "^5.0.8"                  // Lightweight state management
```

### 🎨 UI Libraries & Components
```json
// Material-UI Ecosystem
"@mui/material": "^7.1.0"            // Core Material-UI components
"@mui/icons-material": "^7.1.0"      // Material-UI icons
"@mui/x-charts": "^7.27.1"           // Advanced charts
"@mui/x-data-grid-pro": "^7.27.3"    // Professional data grid
"@mui/x-date-pickers": "^7.27.3"     // Date/time pickers
"@toolpad/core": "^0.15.0"           // Toolpad components

// Additional UI Libraries
"antd": "^5.24.2"                    // Ant Design components
"@emotion/react": "^11.14.0"         // CSS-in-JS styling
"@emotion/styled": "^11.14.0"        // Styled components
"framer-motion": "^12.5.0"           // Animation library
```

### 📊 Data Visualization & Charts
```json
"apexcharts": "^4.5.0"               // Interactive charts
"react-apexcharts": "^1.7.0"         // React wrapper for ApexCharts
"recharts": "^3.1.0"                 // Composable charting library
```

### 🔧 Utility Libraries
```json
// HTTP & API
"axios": "^1.8.3"                    // HTTP client
"socket.io-client": "^4.8.1"         // Real-time communication

// Date & Time
"dayjs": "^1.11.13"                  // Date manipulation
"date-fns": "^3.6.0"                 // Date utility functions

// Forms & Validation
"react-hook-form": "^7.54.2"         // Form handling

// File Processing
"html2pdf.js": "^0.10.3"             // PDF generation
"pdfjs-dist": "^5.4.54"              // PDF processing
"tesseract.js": "^6.0.1"             // OCR text recognition
"jsqr": "^1.4.0"                     // QR code reading

// Rich Text & Media
"tinymce": "^8.0.2"                  // Rich text editor
"lottie-react": "^2.4.1"             // Lottie animations
"react-signature-canvas": "^1.1.0"   // Digital signatures

// Internationalization
"react-i18next": "^15.5.3"           // Internationalization
```

### 🧪 Testing & Development
```json
"@playwright/test": "^1.55.0"        // E2E testing framework
"playwright": "^1.55.0"              // Browser automation
"eslint": "^9.19.0"                  // Code linting
"typescript-eslint": "^8.22.0"       // TypeScript ESLint rules
```

---

## 🎯 Application Architecture

### 🚀 Application Entry Point (App.tsx)
- **Theme Provider**: Material-UI theme system
- **Internationalization**: i18next integration
- **Router Setup**: React Router DOM configuration
- **Global Styles**: CSS baseline and custom styles
- **Cookie Consent**: GDPR compliance component

### 🗺️ Routing System (/routes - 8 Files)
```
AdminRoutes.tsx              # Admin-specific routes
SuperAminRoutes.tsx          # Super admin routes
ManagerRoutes.tsx            # Manager role routes
UserRoutes.tsx               # Regular user routes
MaintenanceOperatorRoutes.tsx # Maintenance staff routes
DocumentOperatorRoutes.tsx   # Document staff routes
LoginRoutes.tsx              # Authentication routes
index.tsx                    # Main route configuration
```

**Route Features:**
- Role-based access control
- Protected route guards
- Lazy loading for performance
- Nested routing structure

---

## 📄 Page Components (43+ Pages)

### 🏠 Core Application Pages
```
Home/                        # Landing page
Dashboard/                   # Main dashboard
Login/                       # Authentication pages
  ├── LoginPage.tsx         # Login form
  ├── Register.tsx          # User registration
  └── ResetPasswordPage.tsx # Password reset
```

### 👥 User Management Pages
```
MyAccount/                   # User profile management
EditProfile/                 # Profile editing
ManageUsers/                 # Admin user management
AddUser/                     # User creation forms
  ├── AddUserForm.tsx       # Single user creation
  ├── AddUserFormByCsv.tsx  # Bulk user import
  └── user_template.csv     # CSV template
```

### 🏢 Room Management Pages
```
BookingRoom/                 # Room booking interface
RoomBookingForm/             # Booking form with calendar
MyBookingRoom/               # User's bookings
AllBookingRoom/              # Admin booking overview
ManageRooms/                 # Room administration
ManageRoomType/              # Room type configuration
AddRoom/                     # Room creation
```

### 🔧 Maintenance System Pages
```
CreateMaintenanceRequest/    # Maintenance request form
MyMaintenanceRequest/        # User's maintenance requests
AllMaintenanceRequest/       # Admin maintenance overview
AssignWork/                  # Work assignment
SubmitWork/                  # Work submission
AcceptWork/                  # Work acceptance
CheckRequest/                # Request review
```

### 🏗️ Service Area Management Pages
```
CreateRequestServiceArea/    # Service area request form
ServiceAreaDetails/          # Request details view
ServiceRequestList/          # Admin request management
CancelRequestServiceArea/    # Cancellation requests
DocumentManagement/          # Document handling
AcceptWorkDocument/          # Document acceptance
```

### 💰 Financial Management Pages
```
CreateInvoice/               # Invoice creation
RoomRentalSpace/             # Rental space management
BookingReview/               # Booking review and approval
```

### 📊 Analytics & Content Pages
```
Analytics/                   # System analytics dashboard
News/                        # News management
OrganizationInfo/            # Organization information
AboutDeveloper/              # Developer information
```

---

## 🧩 Component Architecture (70+ Components)

### 📊 Data Visualization Components
```
ApexBookingLineChart/        # Booking trend charts
ApexBookingRoomRevenueBarChart/ # Revenue analytics
ApexInvoiceRevenueBarChart/  # Invoice revenue charts
ApexMaintenanceLineChart/    # Maintenance trend charts
ApexRevenueBarChart/         # General revenue charts
MaintenanceTypeDonutChart/   # Maintenance type distribution
PopularPagesDonutChart/      # Page analytics
```

### 🎛️ UI Control Components
```
CustomDataGrid/              # Enhanced data grid
CustomTabPanel/              # Tab panel component
DatePicker/                  # Date selection
MobileTimePicker/            # Time picker for mobile
TimePickerField/             # Time input field
Select/                      # Custom select dropdown
TextField/                   # Enhanced text input
Android12Switch/             # Modern toggle switch
MaterialUISwitch/            # Material-UI switch
```

### 📋 Form & Input Components
```
DocumentUploader/            # File upload component
ImageUploader/               # Image upload handler
RequestImages/               # Request image display
UploadSlipButton/            # Payment slip upload
UserPreferences/             # User preference settings
```

### 🔄 Workflow Components
```
BookingStepper/              # Booking process stepper
RequestStepper/              # Request process stepper
ServiceAreaStepper/          # Service area process stepper
Stepper/                     # Generic stepper component
BookingStatusCards/          # Booking status display
RequestStatusCards/          # Request status display
RequestStatusStack/          # Status stack for users
RequestStatusStackForAdmin/  # Admin status stack
```

### 💬 Dialog & Popup Components
```
ApprovePopup/                # Approval dialog
ApproveServiceAreaPopup/     # Service area approval
RejectServiceAreaPopup/      # Service area rejection
AdminRejectServiceAreaPopup/ # Admin rejection dialog
CancelServiceAreaPopup/      # Cancellation dialog
BookingPaymentPopup/         # Payment dialog
PaymentPopup/                # General payment popup
PaymentReviewDialog/         # Payment review
ReworkPopup/                 # Rework request dialog
SubmitPopup/                 # Work submission dialog
SubmitServiceAreaPopup/      # Service area submission
ConfirmDialog/               # Generic confirmation
```

### 📄 Document & PDF Components
```
InvoicePDF/                  # PDF invoice generation
PDFPopup/                    # PDF viewer popup
```

### 🎨 UI Enhancement Components
```
Alert/                       # Alert notifications
AlertGroup/                  # Grouped alerts
AnimatedIcons/               # Animated icon components
ExpandableText/              # Text expansion component
InfoCard/                    # Information card
NewsCard/                    # News display card
NewsDetailPopup/             # News detail view
NumberedLabel/               # Numbered labels
```

### 🧭 Navigation Components
```
AppBar/                      # Application header
AppBarMenu/                  # Header menu
NavbarWindows/               # Windows-style navigation
Drawer/                      # Side drawer
SideDrawer/                  # Sidebar component
Footer/                      # Application footer
```

### 🔧 Utility Components
```
Loadable/                    # Lazy loading wrapper
CookieConsent/               # Cookie consent banner
FilterSection/               # Data filtering
ToolbarActions/              # Toolbar action buttons
FinishActionButton/          # Completion actions
RefundButton/                # Refund processing
```

---

## 🔗 TypeScript Interfaces (56+ Files)

### 👥 User & Authentication Interfaces
```
IUser.ts                     # User entity interface
IGetUser.ts                  # User retrieval interface
IRoles.ts                    # User roles
IJobPosition.ts              # Job positions
IGenders.ts                  # Gender options
ITitlePrefix.ts              # Name prefixes
IUserPackages.ts             # User packages
```

### 🏢 Room & Facility Interfaces
```
IRooms.ts                    # Room entity
IRoomTypes.ts                # Room types
IRoomStatus.ts               # Room status
IFloors.ts                   # Building floors
IAreas.ts                    # Facility areas
IEquipments.ts               # Equipment
IRoomEquipments.ts           # Room-equipment relations
IRoomLayouts.ts              # Room layouts
IRoomtypeLayouts.ts          # Room type layouts
IRoomTypeImages.ts           # Room images
ITimeSlot.ts                 # Time slots
IRoomPrices.ts               # Pricing
```

### 📅 Booking System Interfaces
```
IBookingRooms.ts             # Room bookings
IBookingDate.ts              # Booking dates
IRoomBookingInvoice.ts       # Booking invoices
IRoomBookingInvoiceItem.ts   # Invoice items
```

### 🔧 Maintenance System Interfaces
```
IMaintenanceRequests.ts      # Maintenance requests
IMaintenanceTasks.ts         # Maintenance tasks
IMaintenanceTypes.ts         # Maintenance types
IMaintenaceImages.ts         # Maintenance images
IHandoverImages.ts           # Handover images
IInspections.ts              # Quality inspections
IManagerApprovals.ts         # Manager approvals
```

### 💰 Payment & Financial Interfaces
```
IPayments.ts                 # Payment records
IPaymentType.ts              # Payment types
IPaymentOption.ts            # Payment options
IPaymentStatuses.ts          # Payment statuses
IRentalRoomInvoices.ts       # Rental invoices
IRentalRoomInvoiceItems.ts   # Invoice line items
```

### 🏗️ Service Area Interfaces
```
IRequestServiceArea.ts       # Service area requests
IServiceAreaForm.ts          # Service area forms
IServiceAreaDetailsInterface.ts # Service area details
IServiceAreaDocument.ts      # Service area documents
IServiceUserType.ts          # Service user types
ICollaborationPlan.ts        # Collaboration plans
IBusinessGroup.ts            # Business groups
ICompanySize.ts              # Company sizes
```

### 📢 Content & System Interfaces
```
News.ts                      # News articles
NewsImages.ts                # News images
INotifications.ts            # System notifications
IOrganizationInfo.ts         # Organization info
IContributors.ts             # Project contributors
IContributorTypes.ts         # Contributor types
IAboutCompany.ts             # Company information
```

### 📋 Supporting Interfaces
```
IRequestStatuses.ts          # Request statuses
IRequestTypes.ts             # Request types
IPackages.ts                 # System packages
IQuarry.ts                   # Query interfaces
IAdditionalInfo.ts           # Additional information
```

---

## 🛠️ Utility Functions (31+ Files)

### 📅 Date & Time Utilities
```
dateFormat.ts                # Date formatting functions
formatNewsDate.ts            # News date formatting
formatNewsDateRange.ts       # Date range formatting
formatThaiMonthYear.ts       # Thai date formatting
formatToLocalWithTimezone.ts # Timezone handling
formatToMonthYear.ts         # Month/year formatting
timeFormat.ts                # Time formatting utilities
```

### 💰 Financial Utilities
```
numberToThaiBahtText.ts      # Number to Thai text conversion
buildInstallments.ts         # Installment calculations
```

### 📱 Data Processing Utilities
```
phoneFormat.ts               # Phone number formatting
corporateRegistrationValidator.ts # Corporate validation
convertPathsToFiles.ts       # File path conversion
```

### 🔄 Workflow Management Utilities
```
bookingFlow.ts               # Booking workflow logic
getBookingStep.ts            # Booking step determination
normalizeBooking.ts          # Booking data normalization
paymentActions.ts            # Payment action handlers
paymentGuards.ts             # Payment validation guards
paymentStatusAdapter.ts      # Payment status mapping
getPaymentPrimaryButton.ts   # Payment button logic
```

### 🎯 Action Handlers
```
handleActionAcception.ts     # Work acceptance handling
handleActionApproval.ts      # Approval action handling
handleActionInspection.ts    # Inspection handling
handleAssignWork.ts          # Work assignment handling
handleDeleteMaintenanceRequest.ts # Request deletion
handleDeleteNews.ts          # News deletion
handleDownloadInvoice.ts     # Invoice download
handleSubmitWork.ts          # Work submission
handleUpdateNotification.ts  # Notification updates
handleUpdatePaymentAndInvoice.ts # Payment updates
```

### 🍪 Session & Storage Utilities
```
cookieManager.ts             # Cookie management
sessionManager.ts            # Session handling
```

---

## 🎨 Styling & Theme System

### 🎭 Theme Configuration (/styles)
```
Theme.tsx                    # Material-UI theme configuration
ColorSheet.css               # Color palette definitions
```

**Theme Features:**
- Material-UI theme customization
- Dark/light mode support
- Consistent color palette
- Typography system
- Component styling overrides

### 🖼️ Assets Management (/assets)
```
assets/
├── background/              # Background images
├── fonts/                   # Custom fonts (Thai fonts)
├── icon/                    # Application icons
└── svg/                     # SVG graphics
```

---

## 🔧 Configuration & Constants

### ⚙️ Configuration Files (/constants)
```
bookingStatusConfig.ts       # Booking status configurations
businessGroupConfig.ts       # Business group settings
equipmentConfig.ts           # Equipment configurations
maintenanceTypeConfig.ts     # Maintenance type settings
navigationConfig.ts          # Navigation menu config
pageConfig.ts                # Page configurations
paymentStatusConfig.ts       # Payment status settings
paymentStatuses.ts           # Payment status definitions
provinceData.ts              # Thai province data
roomStatusConfig.ts          # Room status configurations
statusConfig.ts              # General status configurations
```

---

## 🔄 State Management (Zustand)

### 📦 Store Configuration (/store)
```
userStore.ts                 # User state management
notificationStore.ts         # Notification state management
```

**State Management Features:**
- Lightweight Zustand implementation
- User authentication state
- Real-time notification state
- Persistent storage integration
- Type-safe state updates

---

## 🌐 Services & API Layer

### 🔌 API Services (/services)
```
analyticsService.ts          # Analytics API calls
http/                        # HTTP client configuration
```

**Service Features:**
- Axios-based HTTP client
- Request/response interceptors
- Error handling middleware
- Authentication token management
- API endpoint centralization

---

## 🎣 Custom Hooks (/hooks)

### 🪝 React Hooks
```
useInteractionTracker.ts     # User interaction tracking
```

**Hook Features:**
- User behavior analytics
- Performance monitoring
- Custom React hooks for reusable logic

---

## 📱 Layout System (/layouts)

### 🏗️ Layout Components
```
WindowsLayout.tsx            # Windows-style layout
MobileLayout.tsx             # Mobile-responsive layout
ResponsiveLayout.tsx         # Adaptive layout
OutletLayout.tsx             # Outlet-based layout
```

**Layout Features:**
- Responsive design system
- Mobile-first approach
- Adaptive navigation
- Cross-platform compatibility

---

## 🧪 Testing Infrastructure

### 🎭 End-to-End Testing (/selenium_test)
```
Selenium Test Suites:
- Accept Work.side           # Work acceptance testing
- Approval.side              # Approval workflow testing
- Create Maintenance Request.side # Maintenance request testing
- Manage My Maintenance.side # Maintenance management testing
- News.side                  # News functionality testing
- Organization Info.side     # Organization info testing

Playwright Tests:
- book.js                    # Booking functionality
- LoginAdmin.js              # Admin login testing
- test.js                    # General test suite
```

### 📊 Test Reports
```
playwright-report/           # Playwright test reports
└── index.html              # Test results dashboard
```

---

## 🚀 Build & Development Configuration

### ⚡ Vite Configuration (vite.config.ts)
- **Fast HMR**: Hot module replacement
- **TypeScript Support**: Full TypeScript integration
- **Plugin System**: React plugin configuration
- **Build Optimization**: Production build settings

### 📝 TypeScript Configuration
```
tsconfig.json                # Main TypeScript config
tsconfig.app.json            # Application-specific config
tsconfig.node.json           # Node.js environment config
```

### 🔍 Code Quality
```
eslint.config.js             # ESLint configuration
.gitignore                   # Git ignore rules
```

---

## 🎯 Frontend Capabilities

### 📱 Modern Web Features
- **Progressive Web App** capabilities
- **Responsive Design** for all devices
- **Real-time Updates** via Socket.IO
- **Offline Support** with service workers
- **Accessibility** compliance (WCAG)

### 🎨 User Experience
- **Material Design** principles
- **Smooth Animations** with Framer Motion
- **Interactive Charts** and visualizations
- **Multi-language Support** (i18n)
- **Dark/Light Theme** switching

### 🔒 Security Features
- **JWT Token Management**
- **Role-based UI Rendering**
- **Input Validation** and sanitization
- **CSRF Protection**
- **Secure File Uploads**

### 📊 Performance Optimizations
- **Code Splitting** with lazy loading
- **Bundle Optimization** with Vite
- **Image Optimization**
- **Caching Strategies**
- **Memory Management**

This comprehensive frontend architecture provides a modern, scalable, and maintainable user interface for the RSP-NE2 Facility Management System, delivering an exceptional user experience across all devices and user roles.
