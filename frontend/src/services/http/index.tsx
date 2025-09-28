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
import { RentalRoomInvoiceInterface } from "../../interfaces/IRentalRoomInvoices";
import { RentalRoomInvoiceItemInterface } from "../../interfaces/IRentalRoomInvoiceItems";
import { PaymentStatusInterface } from "../../interfaces/IPaymentStatuses";
import { RoomBookingInvoiceInterface } from "../../interfaces/IRoomBookingInvoice";
import { RoomBookingInvoiceItemInterface } from "../../interfaces/IRoomBookingInvoiceItem";
import { PaymentTypeInterface } from "../../interfaces/IPaymentType";
import { PaymentOptionInterface } from "../../interfaces/IPaymentOption";

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
    // Debug: Print received data
    console.log('🔍 CreateUser received data:', data);

    const formData = new FormData();
    formData.append("company_name", data.company_name || "");
    formData.append("business_detail", data.business_detail || "");
    formData.append("first_name", data.first_name || "");
    formData.append("last_name", data.last_name || "");
    formData.append("gender_id", data.gender_id || "1");
    formData.append("email", data.email || "");
    formData.append("password", data.password || "");
    formData.append("phone", data.phone || "");
    formData.append("role_id", data.role_id || "1");
    formData.append("employee_id", data.employee_id || "");
    formData.append("is_employee", data.is_employee || "");
    formData.append("request_type_id", data.request_type_id || "1");
    formData.append("prefix_id", data.prefix_id || "1");
    formData.append("job_position_id", data.job_position_id || "");
    formData.append("is_business_owner", data.is_business_owner || "false");

    if (data.profile_image) {
        formData.append("profile_image", data.profile_image);
    }

    formData.append("package_id", data.package_id || "1");

    // Debug: Print FormData contents
    console.log('🔍 FormData contents:');
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    try {
        // Send FormData with axiosInstance
        console.log('🔍 Sending request to:', `/create-user`);
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
        // Debug: Print error details
        console.error('🔍 CreateUser error:', error);
        if (axios.isAxiosError(error)) {
            console.error('🔍 Error response:', error.response?.data);
            console.error('🔍 Error status:', error.response?.status);
        }

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
        formData.append("prefix_id", (data.PrefixID || 1).toString());
        formData.append("job_position_id", (data.JobPositionID || "").toString());
        formData.append("is_business_owner", (data.IsBusinessOwner || false).toString());

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
    // Debug: แสดงข้อมูลที่ได้รับ
    console.log("=== CreateUserExternalOnly Service Debug ===");
    console.log("Received data:", data);

    const formData = new FormData();
    formData.append("company_name", data.CompanyName || "");
    formData.append("business_detail", data.BusinessDetail || "");
    formData.append("first_name", data.FirstName || "");
    formData.append("last_name", data.LastName || "");
    formData.append("gender_id", data.GenderID?.toString() || "1");
    formData.append("email", data.Email || "");
    formData.append("password", data.Password || "");
    formData.append("phone", data.Phone || "");
    formData.append("role_id", (1).toString());

    formData.append("package_id", data.UserPackageID?.toString() || "1");

    // Debug: แสดง FormData ที่จะส่ง
    console.log("FormData being sent:");
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }

    const requestOptions = {
        headers: {},
    };

    try {
        // Send FormData with requestOptions
        console.log("Sending POST request to:", `${apiUrl}/register`);
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
        // Debug: แสดง error details
        console.error("CreateUserExternalOnly error:", error);
        if (axios.isAxiosError(error)) {
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
        }

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
async function GetRoomRentalSpaceByOption(page: number, limit: number, floorId?: number, roomStatusId?: number) {
    try {
        const response = await axiosInstance.get(`/room-rental-space-option?floorId=${floorId}&roomStatusId=${roomStatusId}&page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function GetRoomRentalSpaceByID(roomId: number) {
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

async function UpdateRoomType(id: number, formData: FormData) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            // ❌ อย่าใส่ "Content-Type": "application/json"
            // ✅ fetch จะ set เป็น multipart/form-data ให้เองถ้าใช้ FormData
        },
        body: formData,
    };

    let res = await fetch(`${apiUrl}/update-room-type/${id}`, requestOptions)
        .then((res) => {
            if (res.status === 200) {
                return res.json(); // success
            } else {
                return false; // failure
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
async function DeleteMaintenanceRequestByID(requestID: number | undefined) {
    try {
        const response = await axiosInstance.delete(`/maintenance-request/${requestID}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting maintenance request:", error);
        throw error;
    }
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

// TitlePrefixes
async function ListTitlePrefixes() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/title-prefixes`, requestOptions).then((res) => {
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
async function GetNotificationByRoomBookingAndUser(booking_id: number, user_id: number) {
    try {
        const response = await axiosInstance.get(`/notification/by-room-booking/${booking_id}/${user_id}`);
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

async function UpdateNotificationsByServiceAreaRequestID(data: NotificationsInterface, service_area_request_id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notifications/service-area-request/${service_area_request_id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating service area notification:", error);
        throw error;
    }
}

async function UpdateNotificationsByServiceAreaTaskID(data: NotificationsInterface, service_area_task_id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notifications/service-area-task/${service_area_task_id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating service area task notification:", error);
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
async function UpdateNotificationsByBookingRoomID(data: NotificationsInterface, booking_room_id: Number | undefined) {
    try {
        const response = await axiosInstance.patch(`/notifications/booking-room/${booking_room_id}`, data, {
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
async function ListBookingRoomsByUser(userId: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/booking-rooms/user/${userId}`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function ListBookingRoomByDateRange(startDate: string | null, endDate: string | null, roomId: number) {
    try {
        const response = await axiosInstance.get(`/booking-rooms/by-date?start_date=${startDate}&end_date=${endDate}&room_id=${roomId}`);
        return response.data;
    } catch (error) {
        console.error("Error giting booking room:", error);
        throw error;
    }
}
async function GetBookingRoomSummaryThisMonth() {
    try {
        const response = await axiosInstance.get(`/booking-rooms/summary-current-month`);
        return response.data;
    } catch (error) {
        console.error("Error giting booking room summary:", error);
        throw error;
    }
}
async function GetMeetingRoomSummaryToday() {
    try {
        const response = await axiosInstance.get("/rooms/meeting-room-summary-today");
        return response.data;
    } catch (error) {
        console.error("Error giting meeting room summary:", error);
        throw error;
    }
}
async function ListBookingRoomsForAdmin(
    statusID: string,
    page: number,
    limit: number,
    createdAt?: string | undefined,
    userId?: number | undefined,
    roomId?: number | undefined
) {
    try {
        const response = await axiosInstance.get(`/booking-room-option-for-admin?status=${statusID}&page=${page}&limit=${limit}&createdAt=${createdAt}&userId=${userId}&roomId=${roomId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching room booking:", error);
        throw error;
    }
}
async function ListBookingRoomsForUser(
    statusID: string,
    page: number,
    limit: number,
    createdAt?: string | undefined,
    userId?: number | undefined,
    roomId?: number | undefined
) {
    try {
        const response = await axiosInstance.get(`/booking-room-option-for-user?status=${statusID}&page=${page}&limit=${limit}&createdAt=${createdAt}&userId=${userId}&roomId=${roomId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching room booking:", error);
        throw error;
    }
}
async function UpdateBookingRoomByID(booking_id: number, data: BookingRoomsInterface) {
    try {
        const response = await axiosInstance.patch(`/booking-room/${booking_id}`, data, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading invoice PDF:", error);
        throw error;
    }
}


// ---------------- ROOM TYPES ----------------

// ✅ GET all room types (with optional filters)
export async function ListRoomTypes(params?: {
    page?: number;
    limit?: number;
    search?: string; // Add this line
}) {
    const query = new URLSearchParams();
    if (params?.page) query.append("page", params.page.toString());
    if (params?.limit) query.append("limit", params.limit.toString());
    if (params?.search) query.append("search", params.search);

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types?${query.toString()}`, requestOptions).then((res) => {
        if (res.status === 200) return res.json();
        return false;
    });

    return res;
}

// ✅ GET one room type by ID
export async function GetRoomTypeById(id: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-type/${id}`, requestOptions).then((res) => {
        console.log("ff", res);
        if (res.status === 200) return res.json();
        return false;
    });

    return res;
}

// ✅ CREATE room type
// export async function CreateRoomType(data: any) {
//   const requestOptions = {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//     body: JSON.stringify(data),
//   };

//   let res = await fetch(`${apiUrl}/room-types`, requestOptions).then((res) => {
//     if (res.status === 201) return res.json();
//     return false;
//   });

//   return res;
// }

// ✅ UPDATE room type
// export async function UpdateRoomType(id: number, data: any) {
//   const requestOptions = {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${localStorage.getItem("token")}`,
//     },
//     body: JSON.stringify(data),
//   };

//   let res = await fetch(`${apiUrl}/room-types/${id}`, requestOptions).then((res) => {
//     if (res.status === 200) return res.json();
//     return false;
//   });

//   return res;
// }

// ✅ DELETE room type
export async function DeleteRoomType(id: number) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types/${id}`, requestOptions).then((res) => {
        if (res.status === 200) return true;
        return false;
    });

    return res;
}

// services/http.ts (หรือไฟล์ที่ประกาศ)
export async function RefundedBookingRoom(paymentId: number, payload?: { reason?: string; cancelBooking?: boolean }) {
    const res = await fetch(`${apiUrl}/payments/${paymentId}/refund`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
            reason: payload?.reason ?? "",
            cancelBooking: payload?.cancelBooking ?? true, // default true
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `Refund failed (${res.status})`);
    }
    return res.json();
}


// services/http.ts
export async function CancelBookingRoom(id: number) {
    const res = await fetch(`${apiUrl}/booking-rooms/${id}/cancel`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
        },
    });

    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = { message: text };
    }

    if (!res.ok) {
        throw new Error(data.error || data.message || "ไม่สามารถยกเลิกการจองได้");
    }

    return data;
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

async function apiGet(path: string, withAuth = true) {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (withAuth) {
        const t = localStorage.getItem("token");
        if (t) headers.Authorization = `Bearer ${t}`;
    }
    const res = await fetch(`${apiUrl}${path}`, { headers });
    return res;
}

// ใช้:
async function GetTimeSlots(id: number) {
    const res = await apiGet(`/get-timeslots-roomprices/${id}`, true); // หรือ false ถ้าเปิด public
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
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

async function UpdateServiceAreaDocumentForCancellation(requestServiceAreaID: number, formData: FormData): Promise<any> {
    try {
        const response = await axiosInstance.put(`/service-area-documents/${requestServiceAreaID}/cancellation`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating service area document for cancellation:", error);
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

async function RejectServiceAreaRequest(requestID: number, userID: number, note: string, role: string): Promise<any> {
    try {
        const response = await axiosInstance.patch(`/request-service-area/${requestID}/reject`, {
            user_id: userID,
            note: note,
            role: role
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

async function DownloadServiceContractDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/service-contract-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `service_contract_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading service contract document:", error);
        throw error;
    }
}

async function DownloadAreaHandoverDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/area-handover-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `area_handover_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading area handover document:", error);
        throw error;
    }
}

async function DownloadQuotationDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/quotation-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `quotation_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading quotation document:", error);
        throw error;
    }
}

async function DownloadRefundGuaranteeDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/refund-guarantee-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `refund_guarantee_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading refund guarantee document:", error);
        throw error;
    }
}

async function DownloadCancellationDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/cancellation-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `cancellation_doc_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading cancellation document:", error);
        throw error;
    }
}

async function DownloadBankAccountDocument(requestID: number, filename?: string): Promise<void> {
    try {
        const response = await axiosInstance.get(`/bank-account-document/${requestID}`, {
            responseType: "blob",
        });

        const blob = new Blob([response.data], { type: response.headers["content-type"] || "application/octet-stream" });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        const suggested = filename || `bank_account_doc_${requestID}.pdf`;
        link.download = suggested;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error downloading bank account document:", error);
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
async function ListInvoices(): Promise<RentalRoomInvoiceInterface[]> {
    try {
        const response = await axiosInstance.get(`/invoices`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        throw error;
    }
}
async function GetNextInvoiceNumber() {
    try {
        const response = await axiosInstance.get(`/invoices/next-number`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice number:", error);
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
        console.log("🔍 [DEBUG] GetInvoiceByID response:", response.data);
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
async function CreateInvoice(data: RentalRoomInvoiceInterface) {
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
async function GetInvoiceByOption(page: number, limit: number, roomId?: number, statusId?: number, customerId?: number) {
    try {
        const response = await axiosInstance.get(`/room-invoice-option?roomId=${roomId}&statusId=${statusId}&page=${page}&limit=${limit}&customerId=${customerId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function UpdateInvoiceByID(invoiceID: number, data: RentalRoomInvoiceInterface): Promise<any> {
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
async function UploadInvoicePDF(data: FormData) {
    try {
        const response = await axiosInstance.post(`/invoice/upload-pdf`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading invoice PDF:", error);
        throw error;
    }
}

// InvoiceItems
async function CreateInvoiceItems(data: RentalRoomInvoiceItemInterface) {
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
async function UpdateInvoiceItemsByID(id: number, data: RentalRoomInvoiceItemInterface): Promise<RentalRoomInvoiceItemInterface> {
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
async function CreateCancellationTask(operatorUserId: number, requestServiceAreaId: number, note?: string) {
    try {
        const response = await axiosInstance.post("/cancellation-task", {
            operator_user_id: operatorUserId,
            request_service_area_id: requestServiceAreaId,
            note: note || ""
        });
        return response.data;
    } catch (error) {
        console.error("Error creating cancellation task:", error);
        throw error;
    }
}

async function AssignCancellationTask(payload: { user_id: number; request_service_area_id: number; operator_user_id: number; note?: string; }) {
    try {
        const response = await axiosInstance.post("/assign-cancellation-task", payload);
        return response.data;
    } catch (error) {
        console.error("Error assigning cancellation task:", error);
        throw error;
    }
}

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

// Service Area Requests by User ID (for External Users)
async function GetRequestServiceAreasByUserID(userId: number, page: number = 1, limit: number = 10, options?: {
    month_year?: string; // รูปแบบ MM/YYYY เช่น "08/2025"
}) {
    try {
        const params = new URLSearchParams();

        params.append('page', page.toString());
        params.append('limit', limit.toString());

        if (options?.month_year) {
            params.append('month_year', options.month_year);
        }

        const queryString = params.toString();
        const url = `/request-service-areas/user/${userId}${queryString ? `?${queryString}` : ''}`;

        const response = await axiosInstance.get(url);

        return response.data;
    } catch (error: any) {
        console.error("Error fetching request service areas by user id:", error);
        throw error;
    }
}

// Get Request Service Area by ID
async function GetRequestServiceAreaByID(requestId: number) {
    try {
        const response = await axiosInstance.get(`/request-service-area/details/${requestId}`);
        return response.data;
    } catch (error: any) {
        console.error("Error fetching request service area by id:", error);
        throw error;
    }
}

// Cancel Request Service Area
async function CancelRequestServiceArea(requestId: number, formData: FormData) {
    try {
        const response = await axiosInstance.post(`/request-service-area/cancel/${requestId}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        console.error("Error cancelling request service area:", error);
        throw error;
    }
}






export async function ListEquipments() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/equipments`, requestOptions).then((res) =>
        res.status === 200 ? res.json() : false
    );

    return res;
}

export async function CreateEquipment(data: { EquipmentName: string }) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/equipments`, requestOptions).then((res) =>
        res.status === 201 ? res.json() : false
    );

    return res;
}

export async function ListTimeSlots() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/timeslots`, requestOptions).then((res) =>
        res.status === 200 ? res.json() : false
    );

    return res;
}

export async function CreateTimeSlot(data: { TimeSlotName: string; StartTime: string; EndTime: string }) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/timeslots`, requestOptions).then((res) =>
        res.status === 201 ? res.json() : false
    );

    return res;
}

export async function ListLayouts() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/layouts`, requestOptions).then((res) =>
        res.status === 200 ? res.json() : false
    );

    return res;
}

export async function CreateLayout(data: { LayoutName: string; Description?: string }) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/layouts`, requestOptions).then((res) =>
        res.status === 201 ? res.json() : false
    );

    return res;
}




// ✅ ดึง booking ทั้งหมด
export async function GetBookingRooms() {
    try {
        const res = await axiosInstance.get(`/booking-rooms`);
        return res.data;
    } catch (err) {
        console.error("Error fetching booking rooms:", err);
        return false;
    }
}

// ✅ ดึง booking ตาม id
export async function GetBookingRoomById(id: number) {
    try {
        const res = await axiosInstance.get(`/booking-rooms/${id}`);
        return res.data;
    } catch (err) {
        console.error(`Error fetching booking room ${id}:`, err);
        return false;
    }
}

// ✅ อนุมัติการจอง
export async function ApproveBookingRoom(id: number) {
    try {
        const userId = localStorage.getItem("userId") || "";
        const res = await axiosInstance.post(
            `/booking-rooms/${id}/approve?approver_id=${encodeURIComponent(userId)}`
        );
        return res.data;
    } catch (err) {
        console.error(`Error approving booking room ${id}:`, err);
        return false;
    }
}



// ✅ ปฏิเสธการจอง
export async function RejectBookingRoom(id: number, note: string) {
    try {
        const res = await axiosInstance.post(
            `/booking-rooms/${id}/reject`,
            { note: note?.trim() || "" } // ← ใช้ note จริง ส่งเป็น JSON body
        );
        return res.data;
    } catch (err) {
        console.error(`Error rejecting booking room ${id}:`, err);
        return false;
    }
}


export async function MarkPaymentAsCompleted(id: number) {
    try {
        const res = await axiosInstance.post(`/payments/${id}/mark-paid`);
        return res.data;
    } catch (err) {
        console.error(`Error marking payment ${id} as completed:`, err);
        return false;
    }

}

// ✅ ทำเครื่องหมายเสร็จสิ้น
export async function CompleteBookingRoom(id: number) {
    try {
        const res = await axiosInstance.post(`/booking-rooms/${id}/complete`);
        return res.data;
    } catch (err) {
        console.error(`Error completing booking room ${id}:`, err);
        return false;
    }

}

// services/payments.ts
export async function SubmitPaymentSlip(
    bookingId: number,
    fileLike: File | Blob | string,
    extra?: {
        PaymentID?: number;
        PayerID?: number;
        installment?: "full" | "deposit" | "balance";
        amount?: number;
        transTimestamp?: string;  // จาก CheckSlip
    }
) {
    const toFile = (input: any): File | null => {
        if (input instanceof File) return input;
        if (input instanceof Blob)
            return new File([input], "slip.jpg", { type: input.type || "application/octet-stream" });
        if (typeof input === "string" && input.startsWith("data:")) {
            const [meta, data] = input.split(",");
            const mime = (meta.match(/data:(.*?);/) || [])[1] || "image/png";
            const bin = atob(data);
            const arr = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
            return new File([arr], "slip.png", { type: mime });
        }
        return null;
    };

    const file = toFile(fileLike);
    if (!file) throw new Error("Invalid file payload");

    const fd = new FormData();
    fd.append("slip", file, file.name);
    fd.append("file", file, file.name);


    // ส่งทั้ง snake_case และ PascalCase เพื่อกันพลาดฝั่ง BE
    const map: Record<string, any> = {
        payment_id: extra?.PaymentID,
        PaymentID: extra?.PaymentID,

        payer_id: extra?.PayerID,
        PayerID: extra?.PayerID,

        booking_room_id: bookingId,
        BookingRoomID: bookingId,

        installment: extra?.installment,
        InstallmentKey: extra?.installment,

        // 👇 เพิ่มสองบรรทัดนี้
        PaymentDate: extra?.transTimestamp,
        payment_date: extra?.transTimestamp,

        amount: extra?.amount,
        Amount: extra?.amount,

    };

    Object.entries(map).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") fd.append(k, String(v));
    });

    const res = await fetch(`${apiUrl}/booking-rooms/${bookingId}/payments`, {
        method: "POST", // upsert: มี PaymentID = update, ไม่มี = create
        headers: { Authorization: `Bearer ${localStorage.getItem("token") || ""}` },
        body: fd,
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "upload failed");
        throw new Error(msg);
    }
    return res.json();
}






// ✅ อนุมัติการชำระเงิน
export async function ApprovePayment(paymentId: number) {
    try {
        console.log(`Approving payment ${paymentId}`);
        const res = await axiosInstance.post(`/payments/${paymentId}/approve`);
        return res.data;
    } catch (err) {
        console.error(`Error approving payment ${paymentId}:`, err);
        return false;
    }
}

// ✅ ปฏิเสธการชำระเงิน
export async function RejectPayment(paymentId: number) {
    try {
        const res = await axiosInstance.post(`/payments/${paymentId}/reject`);
        return res.data;
    } catch (err) {
        console.error(`Error rejecting payment ${paymentId}:`, err);
        return false;
    }
}

// RoomBookingInvoice
async function CreateRoomBookingInvoice(data: RoomBookingInvoiceInterface) {
    try {
        const response = await axiosInstance.post(`/room-booking-invoice`, data, {
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
async function GetRoomBookingInvoiceByID(id: number) {
    try {
        const response = await axiosInstance.get(`/room-booking-invoice/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice by id:", error);
        throw error;
    }
}
async function GetNextRoomBookingInvoiceNumber() {
    try {
        const response = await axiosInstance.get(`/room-booking-invoice/next-number`);
        return response.data;
    } catch (error) {
        console.error("Error fetching invoice number:", error);
        throw error;
    }
}
async function UploadRoomBookingInvoicePDF(data: FormData) {
    try {
        const response = await axiosInstance.post(`/room-booking-invoice/upload-pdf`, data, {
            headers: {
                "Content-Type": "multipart/form-data",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading invoice PDF:", error);
        throw error;
    }
}

// RoomBookingInvoiceItem
async function CreateRoomBookingInvoiceItem(data: RoomBookingInvoiceItemInterface) {
    try {
        const response = await axiosInstance.post(`/room-booking-invoice-item`, data, {
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

// PaymentStatus
async function ListPaymentType(): Promise<PaymentTypeInterface[]> {
    try {
        const response = await axiosInstance.get(`/payment-types`);
        return response.data;
    } catch (error) {
        console.error("Error fetching payment types:", error);
        throw error;
    }
}

// PaymentOptions
async function ListPaymentOptions(): Promise<PaymentOptionInterface[]> {
    try {
        const response = await axiosInstance.get(`/payment-options`);
        return response.data;
    } catch (error) {
        console.error("Error fetching payment options:", error);
        throw error;
    }
}
// services/http.ts

// services/http.ts
function makeAuthHeaders(includeAccept = true): Record<string, string> {
  const headers: Record<string, string> = {};
  if (includeAccept) headers.Accept = "application/json";
  const token = localStorage.getItem("token");
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export const UploadPaymentReceipt = async (paymentId: number, file: File) => {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${apiUrl}/payments/receipt/${paymentId}`, {
    method: "POST",
    // อย่าตั้ง Content-Type เองเมื่อใช้ FormData
    headers: makeAuthHeaders(/* includeAccept */ true),
    body: form,
  });

  if (res.status === 401) throw new Error("Unauthorized: missing or invalid token");
  if (!res.ok) throw new Error(`upload receipt failed: ${res.status} ${res.statusText}`);
  return res.json();
};

export const DeletePaymentReceipt = async (paymentId: number) => {
  const res = await fetch(`${apiUrl}/payments/receipt/${paymentId}`, {
    method: "DELETE",
    headers: makeAuthHeaders(true),
  });

  if (res.status === 401) throw new Error("Unauthorized: missing or invalid token");
  if (!res.ok) throw new Error(`delete receipt failed: ${res.status} ${res.statusText}`);
  return res.json();
};



// Get Collaboration Plans by Request Service Area ID
async function GetCollaborationPlansByRequestID(requestServiceAreaID: number) {
    try {
        const response = await axiosInstance.get(`/collaboration-plans?request_service_area_id=${requestServiceAreaID}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching collaboration plans:", error);
        throw error;
    }
}

// Patch (Update) Collaboration Plans
async function PatchCollaborationPlans(requestServiceAreaID: number, plans: any[]) {
    try {
        const response = await axiosInstance.patch("/collaboration-plans", {
            request_service_area_id: requestServiceAreaID,
            collaboration_plans: plans
        });
        return response.data;
    } catch (error) {
        console.error("Error updating collaboration plans:", error);
        throw error;
    }
}

// Get Service Area Document for Edit
async function GetServiceAreaDocumentForEdit(requestServiceAreaID: number) {
    try {
        const response = await axiosInstance.get(`/service-area-documents/${requestServiceAreaID}/edit`);
        return response.data;
    } catch (error) {
        console.error("Error fetching service area document for edit:", error);
        throw error;
    }
}

// Update Service Area Document for Edit
async function UpdateServiceAreaDocumentForEdit(requestServiceAreaID: number, formData: FormData) {
    try {
        const response = await axiosInstance.patch(`/service-area-documents/${requestServiceAreaID}/edit`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error("Error updating service area document for edit:", error);
        throw error;
    }
}

// Get Cancel Request Service Area for Edit
async function GetCancelRequestServiceAreaForEdit(requestServiceAreaID: number) {
    try {
        const response = await axiosInstance.get(`/cancel-request-service-area/${requestServiceAreaID}/edit`);
        return response.data;
    } catch (error) {
        handleSessionExpiration();
        throw error;
    }
}

// Update Cancel Request Service Area for Edit
async function UpdateCancelRequestServiceAreaForEdit(requestServiceAreaID: number, formData: FormData) {
    try {
        const response = await axiosInstance.patch(`/cancel-request-service-area/${requestServiceAreaID}/edit`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        handleSessionExpiration();
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
    GetRequestServiceAreasByUserID,
    GetRequestServiceAreaByID,

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

    // TitlePrefixes
    ListTitlePrefixes,

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
    GetNotificationByRoomBookingAndUser,
    CreateNotification,
    UpdateNotificationByID,
    UpdateNotificationsByRequestID,
    UpdateNotificationsByTaskID,
    UpdateNotificationsByServiceAreaRequestID,
    UpdateNotificationsByServiceAreaTaskID,
    UpdateNotificationsByBookingRoomID,

    // BookingRooms
    ListBookingRooms,
    ListBookingRoomByDateRange,
    GetBookingRoomSummaryThisMonth,
    GetMeetingRoomSummaryToday,
    ListBookingRoomsByUser,
    ListBookingRoomsForAdmin,
    ListBookingRoomsForUser,
    UpdateBookingRoomByID,

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
    UpdateServiceAreaDocumentForCancellation,
    DeleteServiceAreaDocument,

    // RequestServiceArea
    CreateRequestServiceAreaAndAboutCompany,
    GetRequestServiceAreaByUserID,
    UpdateRequestServiceArea,
    UpdateRequestServiceAreaStatus,
    RejectServiceAreaRequest,
    GetServiceAreaDetailsByID,
    CreateServiceAreaApproval,
    CreateCancellationTask,
    AssignCancellationTask,
    DownloadServiceRequestDocument,
    DownloadServiceContractDocument,
    DownloadAreaHandoverDocument,
    DownloadQuotationDocument,
    DownloadRefundGuaranteeDocument,
    DownloadCancellationDocument,
    DownloadBankAccountDocument,
    ListRequestServiceAreas,

    // AboutCompany
    GetAboutCompanyByUserID,
    UpdateAboutCompany,

    // Invoices
    ListInvoices,
    GetNextInvoiceNumber,
    GetPreviousMonthInvoiceSummary,
    GetInvoiceByID,
    GetInvoicePDF,
    ListInvoiceByDateRange,
    CreateInvoice,
    GetInvoiceByOption,
    DeleteInvoiceByID,
    UpdateInvoiceByID,
    UploadInvoicePDF,

    // InvoiceItems
    CreateInvoiceItems,
    UpdateInvoiceItemsByID,
    DeleteInvoiceItemByID,

    // PaymentStatuses
    ListPaymentStatus,

    // Cancel Request Service Area
    CancelRequestServiceArea,

    // RoomBookingInvoice
    CreateRoomBookingInvoice,
    GetRoomBookingInvoiceByID,
    GetNextRoomBookingInvoiceNumber,
    UploadRoomBookingInvoicePDF,

    // RoomBookingInvoiceItem
    CreateRoomBookingInvoiceItem,

    // PaymentTypes
    ListPaymentType,

    // PaymentOptions
    ListPaymentOptions,

    // Collaboration Plans
    GetCollaborationPlansByRequestID,
    PatchCollaborationPlans,

    // ServiceAreaDocument Edit
    GetServiceAreaDocumentForEdit,
    UpdateServiceAreaDocumentForEdit,

    // CancelRequestServiceArea Edit
    GetCancelRequestServiceAreaForEdit,
    UpdateCancelRequestServiceAreaForEdit,
};
