# Request Service Area System Architecture

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ RequestServiceArea : "creates"
    RequestServiceArea ||--|| RequestStatus : "has"
    RequestServiceArea ||--o| ServiceAreaDocument : "has"
    RequestServiceArea ||--o| ServiceAreaApproval : "has"
    RequestServiceArea ||--o| ServiceAreaTask : "has"
    RequestServiceArea ||--o| CancelRequestServiceArea : "has"
    RequestServiceArea ||--o{ CollaborationPlan : "has"
    RequestServiceArea ||--o{ Notification : "generates"
    
    ServiceAreaDocument ||--|| Room : "assigned_to"
    ServiceAreaDocument ||--|| ServiceUserType : "has"
    
    ServiceAreaTask ||--|| User : "assigned_to"
    ServiceAreaTask ||--o{ Notification : "generates"
    
    ServiceAreaApproval ||--|| User : "approved_by"
    
    CancelRequestServiceArea ||--|| User : "requested_by"
    CancelRequestServiceArea ||--o{ Notification : "generates"
    
    User {
        uint ID PK
        string FirstName
        string LastName
        string Email
        string CompanyName
    }
    
    RequestServiceArea {
        uint ID PK
        uint UserID FK
        uint RequestStatusID FK
        string PurposeOfUsingSpace
        int NumberOfEmployees
        string ActivitiesInBuilding
        string SupportingActivitiesForSciencePark
        string ServiceRequestDocument
    }
    
    RequestStatus {
        uint ID PK
        string Name
        string Description
    }
    
    ServiceAreaDocument {
        uint ID PK
        uint RequestServiceAreaID FK
        string ServiceContractDocument
        string AreaHandoverDocument
        string QuotationDocument
        string RefundGuaranteeDocument
        string ContractNumber
        time.Time ContractStartAt
        time.Time ContractEndAt
        uint RoomID FK
        uint ServiceUserTypeID FK
    }
    
    ServiceAreaTask {
        uint ID PK
        string Note
        uint UserID FK
        uint RequestServiceAreaID FK
        bool IsCancel
    }
    
    ServiceAreaApproval {
        uint ID PK
        string Note
        uint UserID FK
        uint RequestServiceAreaID FK
    }
    
    CancelRequestServiceArea {
        uint ID PK
        uint RequestServiceAreaID FK
        uint UserID FK
        string PurposeOfCancellation
        string ProjectActivities
        float64 AnnualIncome
        string CancellationDocument
        string BankAccountDocument
    }
    
    CollaborationPlan {
        uint ID PK
        uint RequestServiceAreaID FK
        string CollaborationPlan
        float64 CollaborationBudget
        time.Time ProjectStartDate
    }
    
    Room {
        uint ID PK
        string RoomNumber
        string Description
    }
    
    ServiceUserType {
        uint ID PK
        string Name
        string Description
    }
    
    Notification {
        uint ID PK
        bool IsRead
        uint ServiceAreaRequestID FK
        uint ServiceAreaTaskID FK
        uint CancelServiceAreaRequestID FK
        uint UserID FK
    }
```

## System Workflow Diagram

```mermaid
flowchart TD
    A[User สร้างคำขอ] --> B[RequestServiceArea Created]
    B --> C[Status: Pending]
    C --> D{Manager ตรวจสอบ}
    D -->|อนุมัติ| E[สร้าง ServiceAreaApproval]
    D -->|ปฏิเสธ| F[Status: Unsuccessful]
    E --> G[สร้าง ServiceAreaTask]
    G --> H[Status: Approved]
    H --> I[Document Operator รับงาน]
    I --> J[Status: In Progress]
    J --> K[สร้าง/อัปเดต ServiceAreaDocument]
    K --> L[อัปโหลดเอกสารต่างๆ]
    L --> M[Status: Completed]
    
    C --> N[User ขอยกเลิก]
    N --> O[สร้าง CancelRequestServiceArea]
    O --> P[Status: Cancellation In Progress]
    P --> Q[Manager มอบหมายงานยกเลิก]
    Q --> R[Status: Cancellation Assigned]
    R --> S[Document Operator ดำเนินการยกเลิก]
    S --> T[Status: Successfully Cancelled]
    
    style A fill:#e1f5fe
    style M fill:#c8e6c9
    style F fill:#ffcdd2
    style T fill:#fff3e0
```

## Frontend Pages Architecture

```mermaid
graph TB
    subgraph "Frontend Pages"
        A[ServiceRequestList] --> B[ServiceAreaDetails]
        B --> C[ApproveServiceAreaPopup]
        B --> D[SubmitServiceAreaPopup]
        B --> E[CancelServiceAreaPopup]
        F[AcceptWorkDocument] --> D
        F --> E
        G[DocumentManagement] --> H[Document Viewer]
    end
    
    subgraph "Components"
        I[ServiceAreaStepper]
        J[CustomDataGrid]
        K[AlertGroup]
        L[DocumentUploader]
    end
    
    A --> I
    A --> J
    B --> I
    B --> K
    D --> L
    E --> L
```

## API Endpoints Structure

```mermaid
graph LR
    subgraph "User Endpoints"
        A1[POST /request-service-area/:user_id]
        A2[GET /request-service-area/:user_id]
        A3[GET /request-service-areas/user/:user_id]
        A4[GET /request-service-area/details/:id]
        A5[PATCH /request-service-area/:id]
        A6[POST /request-service-area/cancel/:request_id]
    end
    
    subgraph "Manager Endpoints"
        B1[GET /request-service-areas]
        B2[PATCH /request-service-area/:id/status]
        B3[PATCH /request-service-area/:id/reject]
        B4[POST /service-area-approval]
        B5[POST /assign-cancellation-task]
    end
    
    subgraph "Document Operator Endpoints"
        C1[GET /service-area-tasks/user/:user_id]
        C2[POST /service-area-documents/:request_service_area_id]
        C3[PUT /service-area-documents/:request_service_area_id]
    end
    
    subgraph "Document Download Endpoints"
        D1[GET /request-service-area-document/:id]
        D2[GET /service-contract-document/:id]
        D3[GET /area-handover-document/:id]
        D4[GET /quotation-document/:id]
        D5[GET /refund-guarantee-document/:id]
        D6[GET /cancellation-document/:id]
        D7[GET /bank-account-document/:id]
    end
```

## Status Flow Diagram

```mermaid
stateDiagram-v2
    [*] --> Created: User สร้างคำขอ
    Created --> Pending: ระบบประมวลผล
    Pending --> Approved: Manager อนุมัติ
    Pending --> Unsuccessful: Manager ปฏิเสธ
    Approved --> InProgress: Document Operator รับงาน
    InProgress --> Completed: ส่งเอกสารเสร็จ
    InProgress --> Unsuccessful: ไม่สามารถดำเนินการได้
    
    Pending --> CancellationInProgress: User ขอยกเลิก
    Approved --> CancellationInProgress: User ขอยกเลิก
    InProgress --> CancellationInProgress: User ขอยกเลิก
    CancellationInProgress --> CancellationAssigned: Manager มอบหมายงาน
    CancellationAssigned --> SuccessfullyCancelled: Document Operator ดำเนินการ
    CancellationAssigned --> Unsuccessful: ไม่สามารถยกเลิกได้
    
    Completed --> [*]
    Unsuccessful --> [*]
    SuccessfullyCancelled --> [*]
```

## Technology Stack

```mermaid
graph TB
    subgraph "Frontend"
        A[React 18]
        B[TypeScript]
        C[Material-UI]
        D[React Router]
        E[Socket.IO Client]
        F[Day.js]
        G[Axios]
    end
    
    subgraph "Backend"
        H[Go 1.21+]
        I[Gin Framework]
        J[GORM ORM]
        K[SQLite Database]
        L[Socket.IO Server]
        M[JWT Authentication]
    end
    
    subgraph "File Storage"
        N[Local File System]
        O[PDF Documents]
        P[Image Files]
    end
    
    A --> H
    B --> I
    C --> J
    D --> K
    E --> L
    F --> M
    G --> N
```

## Key Features

### Frontend Features
- 📱 **Responsive Design** - รองรับทุกขนาดหน้าจอ
- 🔔 **Real-time Notifications** - ใช้ Socket.IO
- 📁 **File Upload** - รองรับ PDF, รูปภาพ
- 📊 **Data Grid** - แสดงข้อมูลแบบตารางพร้อม pagination
- 📈 **Stepper Component** - แสดงขั้นตอนการทำงาน
- ⚠️ **Alert System** - แสดงข้อความแจ้งเตือน
- 🔍 **Search & Filter** - ค้นหาและกรองข้อมูล

### Backend Features
- 🔐 **JWT Authentication** - ระบบยืนยันตัวตน
- 🛡️ **Role-based Access Control** - ควบคุมการเข้าถึงตามบทบาท
- 📝 **RESTful API** - API ตามมาตรฐาน REST
- 🗄️ **ORM with GORM** - จัดการฐานข้อมูลด้วย ORM
- 📄 **File Upload/Download** - จัดการไฟล์เอกสาร
- 🔄 **Real-time Updates** - อัปเดตแบบ real-time
- 📊 **Pagination & Filtering** - รองรับการแบ่งหน้าและกรองข้อมูล

### Database Features
- 🏗️ **Relational Database** - ฐานข้อมูลเชิงสัมพันธ์
- 🔗 **Foreign Key Constraints** - ควบคุมความถูกต้องของข้อมูล
- 📈 **Indexing** - เพิ่มประสิทธิภาพการค้นหา
- 🗃️ **Soft Delete** - ลบข้อมูลแบบ soft delete
- ⏰ **Timestamps** - บันทึกเวลาสร้างและอัปเดต
