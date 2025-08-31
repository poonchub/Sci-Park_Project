export const apiUrl = "http://localhost:8000";
export const socketUrl = "http://localhost:3001";
import { InspectionsInterface } from "../../interfaces/IInspections";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import { ManagerApprovalsInterface } from "../../interfaces/IManagerApprovals";
import { QuarryInterface } from "../../interfaces/IQuarry";
import { UserInterface } from "../../interfaces/IUser";
import { RoomsInterface } from "../../interfaces/IRooms";
import axios from "axios";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { handleSessionExpiration } from "../../utils/sessionManager";
import { NewsImagesInterface } from "../../interfaces/NewsImages";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import { IUserPackages } from "../../interfaces/IUserPackages";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";
import { CompanySizeInterface } from "../../interfaces/ICompanySize";
import { AboutCompanyInterface } from "../../interfaces/IAboutCompany";
import { RequestServiceAreaInterface } from "../../interfaces/IRequestServiceArea";
import { ServiceAreaDocumentInterface } from "../../interfaces/IServiceAreaDocument";
import { ServiceUserTypeInterface } from "../../interfaces/IServiceUserType";
import { InvoiceInterface } from "../../interfaces/IInvoices";
import { InvoiceItemInterface } from "../../interfaces/IInvoiceItems";
import { PaymentStatusInterface } from "../../interfaces/IPaymentStatuses";

// สร้าง axios instance สำหรับจัดการ interceptor
const axiosInstance = axios.create({
    baseURL: apiUrl,
    timeout: 10000,
});

// Request interceptor - เพิ่ม token ในทุก request
axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - จัดการ token หมดอายุ
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // ตรวจสอบว่าเป็น error 401 (Unauthorized) หรือ token หมดอายุ
        if (error.response?.status === 401) {
            const errorMessage = error.response?.data?.error || error.response?.data?.Error;

            // ตรวจสอบว่าเป็น token หมดอายุหรือไม่
            if (errorMessage && (errorMessage.includes("JWT is expired") || errorMessage.includes("expired") || errorMessage.includes("token") || errorMessage.includes("unauthorized"))) {
                // ใช้ utility function สำหรับจัดการ session หมดอายุ
                handleSessionExpiration();
            }
        }
        return Promise.reject(error);
    }
);

// ==================== SERVICE AREA DOCUMENT FUNCTIONS ====================

// ดึงข้อมูล Rooms ทั้งหมด
async function GetAllRooms() {
    try {
        const response = await axiosInstance.get('/rooms/allrooms');
        return response.data;
    } catch (error) {
        console.error('Error fetching rooms:', error);
        throw error;
    }
}

// ดึงข้อมูล Service User Types ทั้งหมด
async function GetAllServiceUserTypes() {
    try {
        const response = await axiosInstance.get('/service-user-types');
        return response.data;
    } catch (error) {
        console.error('Error fetching service user types:', error);
        throw error;
    }
}


// ==================== AUTH FUNCTIONS ====================

// ฟังก์ชันสำหรับการ Login
async function UserLogin(data: UserInterface) {
    const requestOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    return await axios
        .post(`${apiUrl}/auth/login`, data, requestOptions)
        .then((res) => res)
        .catch((e) => e.response);
}

async function SendOTP(data: UserInterface) {
    const requestOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    return await axios
        .post(`${apiUrl}/send-otp-email`, data, requestOptions)
        .then((res) => res)
        .catch((e) => e.response);
}

async function ValidateOTP(data: any) {
    const requestOptions = {
        headers: {
            "Content-Type": "application/json",
        },
    };
    return await axios
        .post(`${apiUrl}/validate-otp`, data, requestOptions)
        .then((res) => res)
        .catch((e) => e.response);
}

async function ChangePassword(data: any) {
    const requestOptions = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };
    return await axios
        .patch(`${apiUrl}/change-password`, data, requestOptions)
        .then((res) => res)
        .catch((e) => e.response);
}

async function GetUserById(id: number) {
    try {
        const response = await axiosInstance.get(`/user/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user:", error);
        return false;
    }
}

async function ListUsers(data: QuarryInterface) {
    try {
        // สร้าง query string ตามค่าที่ส่งมาจาก function parameters
        const params = new URLSearchParams();

        // ตรวจสอบและแปลงค่าก่อนเพิ่มลงใน query string
        if (data.roleID && data.roleID > 0) params.append("role_id", String(data.roleID));
        if (data.packageID && data.packageID > 0) params.append("package_id", String(data.packageID));
        params.append("page", String(data.page)); // แปลง page เป็น string
        params.append("limit", String(data.limit)); // แปลง limit เป็น string
        if (data.isemployee !== undefined) {
            params.append("isemployee", String(data.isemployee)); // เช็คว่า isEmployee มีค่าหรือไม่
        }
        if (data.search && data.search.trim() !== "") {
            params.append("search", data.search.trim()); // เพิ่ม search parameter
        }

        const response = await axiosInstance.get(`/users?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching users:", error);
        return false;
    }
}

async function CreateUser(data: any) {
    const formData = new FormData();
    formData.append("company_name", data.CompanyName || "");
    formData.append("business_detail", data.BusinessDetail || "");
    formData.append("first_name", data.FirstName || "");
    formData.append("last_name", data.LastName || "");
    formData.append("gender_id", data.GenderID.toString());
    formData.append("email", data.Email || "");
    formData.append("password", data.Password || "");
    formData.append("phone", data.Phone || "");
    formData.append("role_id", (data.RoleID ?? 1).toString());
    formData.append("employee_id", data.EmployeeID || "");
    formData.append("is_employee", data.IsEmployee || "");
    formData.append("request_type_id", (data.RequestTypeID ?? 1).toString());

    if (data.Profile_Image) {
        formData.append("profile_image", data.Profile_Image);
    }

    formData.append("package_id", data.UserPackageID?.toString() || "1");

    try {
        // Send FormData with axiosInstance
        const response = await axiosInstance.post(`/create-user`, formData);

        // Handle the response and return a custom object
        if (response.status === 201) {
            return {
                status: "success",
                message: "User created successfully",
                data: response.data, // You can return response data
            };
        } else {
            return {
                status: "error",
                message: "Failed to create user",
                data: response.data, // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || "An error occurred while creating the user";

            return {
                status: "error",
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: "error",
                message: "An unexpected error occurred",
                data: null,
            };
        }
    }
}

async function UpdateUserbyID(data: any) {
    try {
        const formData = new FormData();
        formData.append("company_name", data.CompanyName || "");
        formData.append("business_detail", data.BusinessDetail || "");
        formData.append("first_name", data.FirstName || "");
        formData.append("last_name", data.LastName || "");
        formData.append("gender_id", (data.GenderID || 1).toString());
        formData.append("email", data.Email || "");
        // Only append password if user entered a new password (explicitly provided)
        if (data.Password && data.Password.trim() !== "") {
            formData.append("password", data.Password);
        }
        formData.append("phone", data.Phone || "");
        formData.append("role_id", (data.RoleID || 1).toString());
        formData.append("employee_id", data.EmployeeID || "");
        formData.append("profile_check", data.ImageCheck || "");
        formData.append("request_type_id", (data.RequestTypeID || 1).toString());

    if (data.Profile_Image) {
        formData.append("profile_image", data.Profile_Image);
    }
    
    // Add signature handling
    formData.append("signature_check", data.SignatureCheck || "");
    if (data.Signature_Image) {
        formData.append("signature_image", data.Signature_Image);
    }
    
    const UserID = data.UserID;
    formData.append("package_id", data.UserPackageID?.toString() || "1");

    const token = localStorage.getItem("token");
    const requestOptions = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    try {
        // Send FormData with requestOptions
        const response = await axios.patch(`${apiUrl}/update-user/${UserID}`, formData, requestOptions);

        // Handle the response and return a custom object
        if (response.status === 200) {
            return {
                status: "success",
                message: "User updated successfully",
                data: response.data, // You can return response data
            };
        } else {
            return {
                status: "error",
                message: "Failed to updated user",
                data: response.data, // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || "An error occurred while creating the user";

            return {
                status: "error",
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: "error",
                message: "An unexpected error occurred",
                data: null,
            };
        }
    }
    } catch (error) {
        console.error("Error in UpdateUserbyID:", error);
        return {
            status: "error",
            message: "An unexpected error occurred while updating user",
            data: null,
        };
    }
}

async function UpdateUserSignature(data: any) {
    const formData = new FormData();
    formData.append("signature_check", "true");
    formData.append("signature_image", data.Signature_Image);
    
    const UserID = data.UserID;

    const token = localStorage.getItem("token");
    const requestOptions = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    try {
        const response = await axios.patch(`${apiUrl}/update-user/${UserID}`, formData, requestOptions);

        if (response.status === 200) {
            return {
                status: "success",
                message: "Signature updated successfully",
                data: response.data,
            };
        } else {
            return {
                status: "error",
                message: "Failed to update signature",
                data: response.data,
            };
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            const errorMessage = error.response?.data?.error || error.message || "An error occurred while updating signature";

            return {
                status: "error",
                message: errorMessage,
                data: null,
            };
        } else {
            return {
                status: "error",
                message: "An unexpected error occurred",
                data: null,
            };
        }
    }
}

async function CreateUserExternalOnly(data: any) {
    const formData = new FormData();
    formData.append("company_name", data.CompanyName || "");
    formData.append("business_detail", data.BusinessDetail || "");
    formData.append("first_name", data.FirstName || "");
    formData.append("last_name", data.LastName || "");
    formData.append("gender_id", data.GenderID.toString());
    formData.append("email", data.Email || "");
    formData.append("password", data.Password || "");
    formData.append("phone", data.Phone || "");
    formData.append("role_id", (1).toString());

    formData.append("package_id", data.UserPackageID?.toString() || "1");

    const requestOptions = {
        headers: {},
    };

    try {
        // Send FormData with requestOptions

        const response = await axios.post(`${apiUrl}/register`, formData, requestOptions);

        // Handle the response and return a custom object
        if (response.status === 201) {
            return {
                status: "success",
                message: "User created successfully",
                data: response.data, // You can return response data
            };
        } else {
            return {
                status: "error",
                message: "Failed to create user",
                data: response.data, // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || "An error occurred while creating the user";

            return {
                status: "error",
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: "error",
                message: "An unexpected error occurred",
                data: null,
            };
        }
    }
}

async function GetOperators() {
    try {
        const response = await axiosInstance.get(`/operators`);
        return response.data;
    } catch (error) {
        console.error("Error fetching operators:", error);
        return false;
    }
}

async function GetDocumentOperators() {
    try {
        const response = await axiosInstance.get(`/document-operators`);
        return response.data;
    } catch (error) {
        console.error("Error fetching document operators:", error);
        return false;
    }
}

// Request Statuses
async function GetRequestStatuses() {
    try {
        const response = await axiosInstance.get(`/request-statuses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching request statuses:", error);
        return false;
    }
}

// Areas
async function GetAreas() {
    try {
        const response = await axiosInstance.get(`/areas`);
        return response.data;
    } catch (error) {
        console.error("Error fetching areas:", error);
        return false;
    }
}

// Rooms
async function GetRooms() {
    try {
        const response = await axiosInstance.get(`/rooms`);
        return response.data;
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return false;
    }
}
async function GetRoomRentalSpaceByOption(page: number, limit: number, floorId?: number, roomStatusId?: number){
    try {
        const response = await axiosInstance.get(`/room-rental-space-option?floorId=${floorId}&roomStatusId=${roomStatusId}&page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function GetRoomRentalSpaceByID(roomId: number){
    try {
        const response = await axiosInstance.get(`/room-rental-space/${roomId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching room by id:", error);
        throw error;
    }
}
async function GetRentalSpaceRoomSummary() {
    try {
        const response = await axiosInstance.get(`/rooms/rental-space-summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching rooms:", error);
        return false;
    }
}
async function CreateRoom(roomData: RoomsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomData),
    };

    let res = await fetch(`${apiUrl}/create-room`, requestOptions).then((res) => {
        if (res) {
            return res.json(); // Success: Return the created room data
        } else {
            return false; // Failure
        }
    });

    return res;
}

async function UpdateProfileImage(file: File) {
    const formData = new FormData();
    formData.append("profile_image", file);

    const requestOptions = {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: formData,
    };

    let res = await fetch(`${apiUrl}/update-profile/${localStorage.getItem("userId")}`, requestOptions).then((res) => {
        if (res) {
            return res; // Success: Return the updated room data
        } else {
            return false; // Failure
        }
    });

    return res;
}

async function UpdateRoom(roomData: RoomsInterface) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomData),
    };

    let res = await fetch(`${apiUrl}/update-room/${roomData.ID}`, requestOptions).then((res) => {
        if (res) {
            return res.json(); // Success: Return the updated room data
        } else {
            return false; // Failure
        }
    });

    return res;
}

async function GetRoomByID(id: number) {
    try {
        const response = await axiosInstance.get(`/room/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}

// RoomTypes
async function CreateRoomType(roomTypeData: RoomtypesInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomTypeData),
    };

    let res = await fetch(`${apiUrl}/create-room-type`, requestOptions).then((res) => {
        if (res) {
            return res.json(); // Success: Return the created room type data
        } else {
            return false; // Failure
        }
    });

    return res;
}

async function UpdateRoomType(roomTypeData: RoomtypesInterface) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomTypeData),
    };

    let res = await fetch(`${apiUrl}/update-room-type/${roomTypeData.ID}`, requestOptions).then((res) => {
        if (res.status === 200) {
            return res.json(); // Success: Return the updated room type data
        } else {
            return false; // Failure
        }
    });

    return res;
}

// Roomtypes
async function GetRoomTypes() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListRoomTypesForBooking() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types-for-booking`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function GetRoomTypesByID(id: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-type/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// RoomTypes
async function GetRoomStatus() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-status`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Floors
async function GetFloors() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/floors`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function CreateFloor(floorData: FloorsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(floorData),
    };

    let res = await fetch(`${apiUrl}/create-floor`, requestOptions).then((res) => {
        if (res) {
            return res.json(); // Success: Return the created floor data
        } else {
            return false; // Failure
        }
    });

    return res;
}

async function UpdateFloor(floorData: FloorsInterface) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(floorData),
    };

    let res = await fetch(`${apiUrl}/update-floor/${floorData.ID}`, requestOptions).then((res) => {
        if (res.status === 200) {
            return res.json(); // Success: Return the updated floor data
        } else {
            return false; // Failure
        }
    });

    return res;
}

// MaintenanceTypes
async function GetMaintenanceTypes() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-types`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// MaintenanceRequests
async function ListMaintenanceRequests() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListMaintenanceRequestsByDateRange(startDate: string | null, endDate: string | null) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests/by-date?start_date=${startDate}&end_date=${endDate}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function GetMaintenanceRequestsForUser(statusID: string, page: number, limit: number, createdAt?: string | undefined, userId?: number | undefined) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests-option-for-user?status=${statusID}&page=${page}&limit=${limit}&createdAt=${createdAt}&userId=${userId}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function GetMaintenanceRequestsForAdmin(
    statusID: string,
    page: number,
    limit: number,
    maintenanceType: number,
    createdAt?: string | undefined,
    requestType?: string | undefined,
    userId?: number | undefined
) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(
        `${apiUrl}/maintenance-requests-option-for-admin?status=${statusID}&page=${page}&limit=${limit}&maintenanceType=${maintenanceType}&createdAt=${createdAt}&userId=${userId}&requestType=${requestType}`,
        requestOptions
    ).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function GetMaintenanceRequestByID(id: Number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-request/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function CreateMaintenanceRequest(data: MaintenanceRequestsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-request`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateMaintenanceRequestByID(data: MaintenanceRequestsInterface, id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-request/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function DeleteMaintenanceRequestByID(bookingID: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-request/${bookingID}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// MaintenanceImages
async function CreateMaintenanceImages(data: FormData) {
    const requestOptions = {
        method: "POST",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-images`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateMaintenanceImages(data: FormData) {
    const requestOptions = {
        method: "PATCH",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-images`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Genders
async function ListGenders() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/genders`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Roles
async function ListRoles() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/roles`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// JobPositions
async function ListJobPositions() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/job-positions`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function GetJobPositionByID(id: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/job-position/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function ListRequestTypes() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/request-types`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Packages
async function ListPackages() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/packages`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// ManagerApprovals
async function CreateManagerApproval(data: ManagerApprovalsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/manager-approval`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// MaintenanceTasks
async function GetMaintenanceTask(statusID: string, page: number, limit: number, maintenanceType: number, createdAt: string | undefined) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    const userID = localStorage.getItem("userId");

    let res = await fetch(
        `${apiUrl}/maintenance-tasks-option-id?page=${page}&status=${statusID}&limit=${limit}&maintenanceType=${maintenanceType}&createdAt=${createdAt || ""}&operator=${userID}`,
        requestOptions
    ).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function GetMaintenanceTaskByID(id: Number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function CreateMaintenanceTask(data: ManagerApprovalsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-task`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateMaintenanceTaskByID(data: MaintenanceTasksInterface, id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function DeleteMaintenanceTaskByID(taskID: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${taskID}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// HandoverImages
async function CreateHandoverImages(data: FormData) {
    const requestOptions = {
        method: "POST",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/handover-images`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateHandoverImages(data: FormData) {
    const requestOptions = {
        method: "PATCH",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/handover-images`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function DeleteHandoverImagesByTaskID(taskID: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/handover-images/${taskID}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Inspections
async function CreateInspection(data: InspectionsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/inspection`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function ListSetRooms(data: QuarryInterface) {
    // สร้าง query string ตามค่าที่ส่งมาจาก function parameters
    const params = new URLSearchParams();

    // ตรวจสอบและแปลงค่าก่อนเพิ่มลงใน query string
    if (data.floor && data.floor > 0) params.append("floor", String(data.floor)); // กรองตาม floor
    if (data.roomType && data.roomType > 0) params.append("room_type", String(data.roomType)); // กรองตาม room_type
    if (data.roomStatus && data.roomStatus > 0) params.append("room_status", String(data.roomStatus)); // กรองตาม room_status
    params.append("page", String(data.page)); // แปลง page เป็น string
    params.append("limit", String(data.limit)); // แปลง limit เป็น string

    // ถ้า isEmployee มีค่า (true/false) ให้เพิ่มลงใน query string

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // การส่ง token เพื่อให้สิทธิการเข้าถึง
        },
    };

    // ใช้ fetch กับ URL ที่ประกอบไปด้วย query parameters
    let res = await fetch(`${apiUrl}/listset-room?${params.toString()}`, requestOptions).then((res) => {
        if (res.status === 200) {
            return res.json(); // ถ้าสถานะเป็น 200 OK ให้ return ข้อมูล JSON
        } else {
            return false; // ถ้ามีข้อผิดพลาดใน API
        }
    });

    return res;
}

// Note: GetRoomCapacity is currently unused; keeping implementation commented for future use.

// Email
async function SendMaintenanceStatusEmail(id: number) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/send-maintenance-status-email/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Notification
async function ListNotifications() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/notifications`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function GetUnreadNotificationCountsByUserID(id?: number) {
    if (!id) return;
    try {
        const response = await axiosInstance.get(`/notifications/count/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notification counts:", error);
        return false;
    }
}
async function GetNotificationsByRequestAndUser(request_id: number, user_id: number) {
    try {
        const response = await axiosInstance.get(`/notification/by-request/${request_id}/${user_id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notification:", error);
        throw error;
    }
}
async function GetNotificationsByTaskAndUser(task_id: number, user_id: number) {
    try {
        const response = await axiosInstance.get(`/notification/by-task/${task_id}/${user_id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notification:", error);
        throw error;
    }
}
async function GetNotificationsByInvoiceAndUser(invoice_id: number, user_id: number) {
    try {
        const response = await axiosInstance.get(`/notification/by-invoice/${invoice_id}/${user_id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notification:", error);
        throw error;
    }
}
async function CreateNotification(data: NotificationsInterface) {
    try {
        const response = await axiosInstance.post(`/notification`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating notification:", error);
        throw error;
    }
}
async function UpdateNotificationByID(data: NotificationsInterface, id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notification/${id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating notification:", error);
        throw error;
    }
}

async function UpdateNotificationsByRequestID(data: NotificationsInterface, request_id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notifications/request/${request_id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating notification:", error);
        throw error;
    }
}
async function UpdateNotificationsByTaskID(data: NotificationsInterface, task_id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notifications/task/${task_id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating notification:", error);
        throw error;
    }
}

// BookingRooms
async function ListBookingRooms() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/booking-rooms`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListBookingRoomByDateRange(startDate: string | null, endDate: string | null) {
    try {
        const response = await axiosInstance.get(`/booking-rooms/by-date?start_date=${startDate}&end_date=${endDate}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}

// Analytics API
export async function getSystemAnalytics() {
    try {
        const response = await axiosInstance.get("/analytics/system");
        return response.data;
    } catch (error) {
        console.error("Error fetching system analytics:", error);
        return false;
    }
}

export async function getDashboardAnalytics() {
    try {
        const response = await axiosInstance.get("/analytics/dashboard");
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard analytics:", error);
        return false;
    }
}

export async function trackPageVisit(data: any) {
    try {
        const response = await axiosInstance.post("/analytics/track", data);
        return response.data;
    } catch (error: any) {
        console.error("Error tracking page visit:", error);
        if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Response status:", error.response.status);
        }
        return false;
    }
}

export async function getVisitsRange(start: string, end: string) {
    try {
        const response = await axiosInstance.get(`/analytics/visits-range?start=${start}&end=${end}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching visits range:", error);
        return false;
    }
}

export async function getPopularPagesByPeriod(period: string) {
    try {
        const response = await axiosInstance.get(`/analytics/popular-pages-by-period?period=${period}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching popular pages by period:", error);
        return false;
    }
}

export async function getPerformanceAnalytics(start: string, end: string) {
    try {
        console.log("HTTP: Calling performance analytics API with:", { start, end });
        const response = await axiosInstance.get(`/analytics/performance?start=${start}&end=${end}`);
        console.log("HTTP: Performance analytics API response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching performance analytics:", error);
        return false;
    }
}

// News
async function ListNews() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListPinnedNews(limit?: number) {
    const params = new URLSearchParams();

    if (limit && limit > 0) {
        params.append("limit", limit.toString());
    }

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/pinned?${params.toString()}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListPinnedNewsPeriod(limit?: number) {
    const params = new URLSearchParams();

    if (limit && limit > 0) {
        params.append("limit", limit.toString());
    }

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/pinned-period?${params.toString()}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListUnpinnedNews(limit?: number) {
    const params = new URLSearchParams();

    if (limit && limit > 0) {
        params.append("limit", limit.toString());
    }

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/unpinned?${params.toString()}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListUnpinnedNewsPeriod(limit?: number) {
    const params = new URLSearchParams();

    if (limit && limit > 0) {
        params.append("limit", limit.toString());
    }

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/unpinned-period?${params.toString()}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListNewsOrdered() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/ordered`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListNewsOrderedPeriod() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/ordered-period`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function CreateNews(data: NewsImagesInterface) {
    try {
        const response = await axiosInstance.post(`/news`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating news:", error);
        throw error;
    }
}

async function GetTimeSlots(id?: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/get-timeslots-roomprices/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

async function GetRoomQuota(userId?: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // ✅ เพิ่ม Token ถ้ามี
        },
    };

    const res = await fetch(`${apiUrl}/get-quota/${userId}`, requestOptions)
        .then((res) => {
            if (res.status === 200) {
                return res.json();
            } else {
                console.error("โหลดสิทธิ์ไม่สำเร็จ", res.status);
                return false;
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            return false;
        });

    return res;
}


async function GetRoomsByRoomTypeID(roomTypeId?: number): Promise<RoomsInterface[]> {
  const requestOptions = {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  };

    const res = await fetch(`${apiUrl}/rooms/roomtype/${roomTypeId}`, requestOptions)
        .then((res) => {
            if (res.status === 200) {
                return res.json();
            } else {
                console.error("ไม่สามารถโหลดห้องได้", res.status);
                return false;
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            return false;
        });

    return res;
}

async function CreateBookingRoom(data: BookingRoomsInterface) {
console.log("56",data);
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  };
  const res = await fetch(`${apiUrl}/booking-rooms`, requestOptions);

  if (res.status === 200 || res.status === 201 || res.status === 204) {
    try {
      const json = await res.json().catch(() => null);
      return { status: res.status, data: json };
    } catch {
      return { status: res.status, data: null };
    }
  } else {
    return { status: res.status, data: null };
  }
}


async function GetEquipmentByRoomType(id: number): Promise<{ EquipmentName: string }[]> {
    try {
        const response = await axiosInstance.get(`/roomtypes/${id}/equipment`);
        return response.data.equipment; // คืนค่าเฉพาะ array equipment
    } catch (error) {
        console.error("Error fetching equipment by room type:", error);
        return [];
    }
}

async function GetAllRoomLayouts(): Promise<{ ID: number; LayoutName: string }[]> {
    try {
        const response = await axiosInstance.get("/roomlayouts");
        console.log("fffff", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching room layouts:", error);
        return [];
    }
}

async function UseRoomQuota(data: IUserPackages) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    const res = await fetch(`http://localhost:8000/user-packages/use-quota`, requestOptions);

    if (res.status === 200 || res.status === 204) {
        try {
            const json = await res.json().catch(() => null);
            return { status: res.status, data: json };
        } catch {
            return { status: res.status, data: null };
        }
    } else {
        const error = await res.json().catch(() => null);
        return { status: res.status, data: error };
    }
}

async function UpdateNewsByID(data: NewsImagesInterface, id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/news/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function DeleteNewsByID(id: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news/${id}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// NewsImages
async function CreateNewsImages(data: FormData) {
    const requestOptions = {
        method: "POST",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news-images`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateNewsImages(data: FormData) {
    const requestOptions = {
        method: "PATCH",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news-images`, requestOptions).then((res) => {
        console.log(res);
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function DeleteNewsImagesByNewsID(newsID: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/news-images/${newsID}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// OrganizationInfo
async function GetOrganizationInfo() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/organization-info`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateOrganizationInfo(data: FormData, id: number) {
    const requestOptions = {
        method: "PATCH",
        body: data,
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/organization-info/${id}`, requestOptions).then((res) => {
        console.log(res);
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Contributors
async function ListContributors() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/contributors`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Payment
async function GetPaymentByUserID() {
    try {
        const userId = localStorage.getItem("userId")
        const response = await axiosInstance.get(`/payments/${userId}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}
async function ListBookingRoomPaymentsByDateRange(startDate: string | null, endDate: string | null) {
    try {
        const response = await axiosInstance.get(`/booking-room-payments/by-date?start_date=${startDate}&end_date=${endDate}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}
async function ListInvoicePaymentsByDateRange(startDate: string | null, endDate: string | null) {
    try {
        const response = await axiosInstance.get(`/invoice-payments/by-date?start_date=${startDate}&end_date=${endDate}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}
async function GetPaymentByOption(page: number, limit: number, payerID?: number) {
    try {
        const response = await axiosInstance.get(`/payments-option?payerID=${payerID}&page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}
async function CreatePayment(data: FormData) {
    try {
        const response = await axiosInstance.post(`/payment`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating payment:", error);
        throw error;
    }
}
async function UpdatePaymentByID(id: number, data: FormData) {
    try {
        const response = await axiosInstance.patch(`/payment/${id}`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating invoice items:", error);
        throw error;
    }
}
async function DeletePaymentReceiptByID(paymentID: number): Promise<any> {
    try {
        const response = await axiosInstance.delete(`/payment-receipt/${paymentID}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting receipt:", error);
        throw error;
    }
}
async function CheckSlip(data: FormData) {
    try {
        const response = await axiosInstance.post(`/proxy/slipok`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error check slip:", error);
        throw error;
    }
}
async function GetQuota() {
    try {
        const response = await axiosInstance.get(`/proxy/slipok/quota`);
        return response.data;
    } catch (error) {
        console.error("Error giting quota:", error);
        throw error;
    }
}

// BusinessGroup functions
async function ListBusinessGroups(): Promise<BusinessGroupInterface[]> {
    try {
        const response = await axiosInstance.get(`/business-groups`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching business groups:", error);
        throw error;
    }
}

async function GetBusinessGroupByID(id: number): Promise<BusinessGroupInterface> {
    try {
        const response = await axiosInstance.get(`/business-groups/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching business group:", error);
        throw error;
    }
}

// CompanySize functions
async function ListCompanySizes(): Promise<CompanySizeInterface[]> {
    try {
        const response = await axiosInstance.get(`/company-sizes`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching company sizes:", error);
        throw error;
    }
}

async function GetCompanySizeByID(id: number): Promise<CompanySizeInterface> {
    try {
        const response = await axiosInstance.get(`/company-sizes/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching company size:", error);
        throw error;
    }
}

// ServiceUserType functions
async function ListServiceUserTypes(): Promise<ServiceUserTypeInterface[]> {
    try {
        const response = await axiosInstance.get(`/service-user-types`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching service user types:", error);
        throw error;
    }
}

async function GetServiceUserTypeByID(id: number): Promise<ServiceUserTypeInterface> {
    try {
        const response = await axiosInstance.get(`/service-user-types/${id}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching service user type:", error);
        throw error;
    }
}

// ServiceAreaDocument functions
async function CreateServiceAreaDocument(requestServiceAreaID: number, formData: FormData): Promise<any> {
    try {
        const response = await axiosInstance.post(`/service-area-documents/${requestServiceAreaID}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating service area document:", error);
        throw error;
    }
}

async function GetServiceAreaDocumentByRequestID(requestServiceAreaID: number): Promise<ServiceAreaDocumentInterface> {
    try {
        const response = await axiosInstance.get(`/service-area-documents/${requestServiceAreaID}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching service area document:", error);
        throw error;
    }
}

async function UpdateServiceAreaDocument(requestServiceAreaID: number, formData: FormData): Promise<any> {
    try {
        const response = await axiosInstance.put(`/service-area-documents/${requestServiceAreaID}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating service area document:", error);
        throw error;
    }
}

async function DeleteServiceAreaDocument(requestServiceAreaID: number): Promise<any> {
    try {
        const response = await axiosInstance.delete(`/service-area-documents/${requestServiceAreaID}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting service area document:", error);
        throw error;
    }
}

// RequestServiceArea functions
async function CreateRequestServiceAreaAndAboutCompany(userID: number, formData: FormData): Promise<any> {
    try {
        console.log('Making API call to create request service area...');
        console.log('User ID:', userID);
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }
        
        const token = localStorage.getItem("token");
        console.log('Token exists:', !!token);
        
        const response = await axiosInstance.post(`/request-service-area/${userID}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
            },
        });
        console.log('API call successful:', response);
        return response.data;
    } catch (error) {
        console.error("Error creating request service area and about company:", error);
        throw error;
    }
}

async function GetRequestServiceAreaByUserID(userID: number): Promise<RequestServiceAreaInterface[]> {
    try {
        const response = await axiosInstance.get(`/request-service-area/${userID}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching request service area by user ID:", error);
        throw error;
    }
}

async function UpdateRequestServiceArea(requestID: number, formData: FormData): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/request-service-area/${requestID}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating request service area:", error);
        throw error;
    }
}

async function UpdateRequestServiceAreaStatus(requestID: number, requestStatusID: number): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/request-service-area/${requestID}/status`, {
            request_status_id: requestStatusID
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating request service area status:", error);
        throw error;
    }
}

async function RejectServiceAreaRequest(requestID: number, note: string): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/request-service-area/${requestID}/reject`, {
            note: note
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error rejecting service area request:", error);
        throw error;
    }
}

async function GetServiceAreaDetailsByID(serviceAreaID: number): Promise<any> {
    try {
        const response = await axiosInstance.get(`/request-service-area/details/${serviceAreaID}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching service area details by ID:", error);
        throw error;
    }
}

async function CreateServiceAreaApproval(payload: { user_id: number; request_service_area_id: number; operator_user_id: number; note?: string; }) {
    try {
        const response = await axiosInstance.post(`/service-area-approval`, payload, {
            headers: {
                "Content-Type": "application/json",
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating service area approval:", error);
        throw error;
    }
}

// Secure download for Service Request Document with Authorization header
async function DownloadServiceRequestDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/request-service-area-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `service_request_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading service request document:", error);
        throw error;
    }
}

// AboutCompany functions
async function GetAboutCompanyByUserID(userID: number): Promise<AboutCompanyInterface> {
    try {
        const response = await axiosInstance.get(`/about-company/${userID}`);
        return response.data.data;
    } catch (error) {
        console.error("Error fetching about company by user ID:", error);
        throw error;
    }
}

async function UpdateAboutCompany(userID: number, formData: FormData): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/about-company/${userID}`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating about company:", error);
        throw error;
    }
}

// Invoice
async function ListInvoices(): Promise<InvoiceInterface[]> {
    try {
        const response = await axiosInstance.get(`/invoices`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        throw error;
    }
}
async function GetPreviousMonthInvoiceSummary() {
    try {
        const response = await axiosInstance.get(`/invoices/previous-month-summary`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        throw error;
    }
}
async function GetInvoiceByID(id: number) {
    try {
        const response = await axiosInstance.get(`/invoice/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function GetInvoicePDF(id: number): Promise<Blob> {
    try {
        const response = await axiosInstance.get(`/invoice/${id}/pdf`, {
            responseType: "blob",
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice pdf by id:", error);
        throw error;
    }
}
async function ListInvoiceByDateRange(startDate: string | null, endDate: string | null) {
    try {
        const response = await axiosInstance.get(`/invoices/by-date?start_date=${startDate}&end_date=${endDate}`);
        return response.data;
    } catch (error) {
        console.error("Error giting payments:", error);
        throw error;
    }
}
async function CreateInvoice(data: InvoiceInterface) {
    try {
        const response = await axiosInstance.post(`/invoice`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating invoice:", error);
        throw error;
    }
}
async function GetInvoiceByOption(page: number, limit: number, roomId?: number, statusId?: number, customerId?: number){
    try {
        const response = await axiosInstance.get(`/room-invoice-option?roomId=${roomId}&statusId=${statusId}&page=${page}&limit=${limit}&customerId=${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function UpdateInvoiceByID(invoiceID: number, data: InvoiceInterface): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/invoice/${invoiceID}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating invoice:", error);
        throw error;
    }
}
async function DeleteInvoiceByID(invoiceID: number): Promise<any> {
    try {
        const response = await axiosInstance.delete(`/invoice/${invoiceID}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting invoice:", error);
        throw error;
    }
}

// InvoiceItems
async function CreateInvoiceItems(data: InvoiceItemInterface) {
    try {
        const response = await axiosInstance.post(`/invoice-items`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating invoice items:", error);
        throw error;
    }
}
async function UpdateInvoiceItemsByID(id: number, data: InvoiceItemInterface): Promise<InvoiceItemInterface> {
    try {
        const response = await axiosInstance.patch(`/invoice-item/${id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating invoice items:", error);
        throw error;
    }
}
async function DeleteInvoiceItemByID(invoiceItemID: number): Promise<any> {
    try {
        const response = await axiosInstance.delete(`/invoice-item/${invoiceItemID}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting invoice item:", error);
        throw error;
    }
}

// PaymentStatus
async function ListPaymentStatus(): Promise<PaymentStatusInterface[]> {
    try {
        const response = await axiosInstance.get(`/payment-statuses`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}

// ListRequestServiceAreas ดึงรายการ Request Service Area ทั้งหมดพร้อม pagination และ filtering
async function ListRequestServiceAreas(
    requestStatusID: string,
    page: number,
    limit: number,
    search?: string | undefined,
    createdAt?: string | undefined
) {
    console.log("🔍 [DEBUG] ListRequestServiceAreas called with:", {
        requestStatusID,
        page,
        limit,
        search,
        createdAt
    });

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    // สร้าง URL parameters ที่มีเฉพาะค่าที่ไม่ใช่ 0, undefined, หรือ empty
    const params = new URLSearchParams();
    
    // เพิ่ม page และ limit เสมอ
    params.append("page", page.toString());
    params.append("limit", limit.toString());
    
    // เพิ่ม request_status_id เฉพาะเมื่อไม่ใช่ "0" หรือ "undefined"
    if (requestStatusID && requestStatusID !== "0" && requestStatusID !== "undefined") {
        params.append("request_status_id", requestStatusID);
    }
    
    // เพิ่ม search เฉพาะเมื่อมีข้อความและไม่ใช่ "undefined"
    if (search && search.trim() !== "" && search !== "undefined") {
        params.append("search", search.trim());
    }
    
    // เพิ่ม created_at เฉพาะเมื่อมีค่าและไม่ใช่ "undefined"
    if (createdAt && createdAt.trim() !== "" && createdAt !== "undefined") {
        params.append("created_at", createdAt.trim());
    }

    const finalUrl = `${apiUrl}/request-service-areas?${params.toString()}`;
    console.log("🔍 [DEBUG] Final API URL:", finalUrl);

    let res = await fetch(
        finalUrl,
        requestOptions
    ).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            console.error("🔍 [DEBUG] API Error:", res.status, res.statusText);
            return false;
        }
    });

    console.log("🔍 [DEBUG] API Response:", res);
    return res;
}

// Service Area Tasks by Operator User ID
async function GetServiceAreaTasksByUserID(userId: number, options?: {
    month_year?: string; // รูปแบบ MM/YYYY เช่น "08/2025"
    business_group_id?: number;
    page?: number;
    limit?: number;
}) {
    try {
        
        
        const params = new URLSearchParams();
        
        if (options?.month_year) {
            params.append('month_year', options.month_year);
        }
        
        if (options?.business_group_id) {
            params.append('business_group_id', options.business_group_id.toString());
        }

        if (options?.page) {
            params.append('page', options.page.toString());
        }

        if (options?.limit) {
            params.append('limit', options.limit.toString());
        }
        
        const queryString = params.toString();
        const url = `/service-area-tasks/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        

        const response = await axiosInstance.get(url);
        
        return response.data;
    } catch (error: any) {
        console.error("Error fetching service area tasks by user id:", error);
        throw error;
    }
}

export {
    // RequestStatuses
    GetRequestStatuses,

    // Users
    GetUserById,
    UserLogin,
    CreateUser,
    SendOTP,
    ListUsers,
    ValidateOTP,
    ChangePassword,
    GetOperators,
    GetDocumentOperators,
    UpdateUserbyID,
    UpdateUserSignature,
    UpdateProfileImage,
    CreateUserExternalOnly,

    // Areas
    GetAreas,
    GetServiceAreaTasksByUserID,

    // Rooms
    GetRooms,
    GetRentalSpaceRoomSummary,
    CreateRoom,
    UpdateRoom,
    GetRoomByID,
    GetRoomRentalSpaceByOption,
    GetRoomRentalSpaceByID,
    GetAllRooms,

    // RoomTypes
    GetRoomTypes,
    ListRoomTypesForBooking,
    CreateRoomType,
    UpdateRoomType,

    // RoomStatus
    GetRoomStatus,

    // RequestTypes
    ListRequestTypes,

    // Floors
    GetFloors,
    CreateFloor,
    UpdateFloor,

    // MaintenanceTypes
    GetMaintenanceTypes,

    // MaintenanceRequests
    ListMaintenanceRequests,
    ListMaintenanceRequestsByDateRange,
    GetMaintenanceRequestsForUser,
    GetMaintenanceRequestsForAdmin,
    GetMaintenanceRequestByID,
    CreateMaintenanceRequest,
    UpdateMaintenanceRequestByID,
    DeleteMaintenanceRequestByID,

    // MaintenanceImages
    CreateMaintenanceImages,
    UpdateMaintenanceImages,

    // Genders
    ListGenders,

    // Packages
    ListPackages,

    // Roles
    ListRoles,

    // JobPositions
    ListJobPositions,
    GetJobPositionByID,

    // ManagerApprovals
    CreateManagerApproval,

    // MaintenanceTasks
    GetMaintenanceTask,
    GetMaintenanceTaskByID,
    CreateMaintenanceTask,
    UpdateMaintenanceTaskByID,
    DeleteMaintenanceTaskByID,

    // HandoverImages
    CreateHandoverImages,
    UpdateHandoverImages,
    DeleteHandoverImagesByTaskID,

    // Inspections
    CreateInspection,
    ListSetRooms,

    // Email
    SendMaintenanceStatusEmail,

    // Notifications
    ListNotifications,
    GetUnreadNotificationCountsByUserID,
    GetNotificationsByRequestAndUser,
    GetNotificationsByTaskAndUser,
    GetNotificationsByInvoiceAndUser,
    CreateNotification,
    UpdateNotificationByID,
    UpdateNotificationsByRequestID,
    UpdateNotificationsByTaskID,

    // BookingRooms
    ListBookingRooms,
    ListBookingRoomByDateRange,

    // News
    ListNews,
    ListPinnedNews,
    ListPinnedNewsPeriod,
    ListNewsOrdered,
    ListNewsOrderedPeriod,
    ListUnpinnedNews,
    ListUnpinnedNewsPeriod,
    CreateNews,
    UpdateNewsByID,
    DeleteNewsByID,

    // NewsImages
    CreateNewsImages,
    UpdateNewsImages,
    DeleteNewsImagesByNewsID,

    // OrganizationInfo
    GetOrganizationInfo,
    UpdateOrganizationInfo,

    // DeveloperInfo
    ListContributors,
    GetTimeSlots,
    GetRoomQuota,
    GetRoomsByRoomTypeID,
    CreateBookingRoom,
    GetRoomTypesByID,
    GetEquipmentByRoomType,
    UseRoomQuota,
    GetAllRoomLayouts,

    // Payment
    GetPaymentByUserID,
    GetPaymentByOption,
    ListBookingRoomPaymentsByDateRange,
    ListInvoicePaymentsByDateRange,
    CreatePayment,
    UpdatePaymentByID,
    CheckSlip,
    GetQuota,
    DeletePaymentReceiptByID,

    // BusinessGroups
    ListBusinessGroups,
    GetBusinessGroupByID,

    // CompanySizes
    ListCompanySizes,
    GetCompanySizeByID,

    // ServiceUserTypes
    ListServiceUserTypes,
    GetServiceUserTypeByID,
    GetAllServiceUserTypes,

    // ServiceAreaDocuments
    CreateServiceAreaDocument,
    GetServiceAreaDocumentByRequestID,
    UpdateServiceAreaDocument,
    DeleteServiceAreaDocument,

    // RequestServiceArea
    CreateRequestServiceAreaAndAboutCompany,
    GetRequestServiceAreaByUserID,
    UpdateRequestServiceArea,
    	UpdateRequestServiceAreaStatus,
	RejectServiceAreaRequest,
    GetServiceAreaDetailsByID,
    CreateServiceAreaApproval,
    DownloadServiceRequestDocument,
    ListRequestServiceAreas,

    // AboutCompany
    GetAboutCompanyByUserID,
    UpdateAboutCompany,

    // Invoices
    ListInvoices,
    GetPreviousMonthInvoiceSummary,
    GetInvoiceByID,
    GetInvoicePDF,
    ListInvoiceByDateRange,
    CreateInvoice,
    GetInvoiceByOption,
    DeleteInvoiceByID,
    UpdateInvoiceByID,

    // InvoiceItems
    CreateInvoiceItems,
    UpdateInvoiceItemsByID,
    DeleteInvoiceItemByID,

    // PaymentStatuses
    ListPaymentStatus,
};
