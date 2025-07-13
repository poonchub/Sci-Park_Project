export const apiUrl = "http://localhost:8000";
export const socketUrl = "http://localhost:3001";
import { InspectionsInterface } from "../../interfaces/IInspections";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import { ManagerApprovalsInterface } from "../../interfaces/IManagerApprovals";
import { QuarryInterface } from "../../interfaces/IQuarry";
import { UserInterface } from "../../interfaces/IUser";
import { RoomsInterface } from "../../interfaces/IRooms";
import axios from 'axios';
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { handleSessionExpiration } from "../../utils/sessionManager";

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
            if (errorMessage && (
                errorMessage.includes("JWT is expired") || 
                errorMessage.includes("expired") ||
                errorMessage.includes("token") ||
                errorMessage.includes("unauthorized")
            )) {
                // ใช้ utility function สำหรับจัดการ session หมดอายุ
                handleSessionExpiration();
            }
        }
        return Promise.reject(error);
    }
);

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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };
    return await axios
        .patch(`${apiUrl}/change-password`, data, requestOptions)
        .then((res) => res)
        .catch((e) => e.response);
}


async function GetUserById(id:number) {
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
        params.append("page", String(data.page));  // แปลง page เป็น string
        params.append("limit", String(data.limit));  // แปลง limit เป็น string
        if (data.isemployee!== undefined) {
            params.append("isemployee", String(data.isemployee));  // เช็คว่า isEmployee มีค่าหรือไม่
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
                status: 'success',
                message: 'User created successfully',
                data: response.data,  // You can return response data
            };
        } else {
            return {
                status: 'error',
                message: 'Failed to create user',
                data: response.data,  // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred while creating the user';

            return {
                status: 'error',
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: 'error',
                message: 'An unexpected error occurred',
                data: null,
            };
        }
    }
    
}


async function UpdateUserbyID(data: any) {

    const formData = new FormData();
    formData.append("company_name", data.CompanyName || "");
    formData.append("business_detail", data.BusinessDetail || "");
    formData.append("first_name", data.FirstName || "");
    formData.append("last_name", data.LastName || "");
    formData.append("gender_id", data.GenderID.toString());
    formData.append("email", data.Email || "");
    formData.append("password", data.Password || "");
    formData.append("phone", data.Phone || "");
    formData.append("role_id", data.RoleID.toString());
    formData.append("employee_id", data.EmployeeID || "");
    formData.append("profile_check", data.ImageCheck || "");
    formData.append("request_type_id", data.RequestTypeID.toString() || "1");

    if (data.Profile_Image) {
        formData.append("profile_image", data.Profile_Image);
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
                status: 'success',
                message: 'User updated successfully',
                data: response.data,  // You can return response data
            };
        } else {
            return {
                status: 'error',
                message: 'Failed to updated user',
                data: response.data,  // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred while creating the user';

            return {
                status: 'error',
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: 'error',
                message: 'An unexpected error occurred',
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
        headers: {
            
        },
    };

    


        
    try {
        // Send FormData with requestOptions
        
        const response = await axios.post(`${apiUrl}/register`, formData, requestOptions);

        // Handle the response and return a custom object
        if (response.status === 201) {
            return {
                status: 'success',
                message: 'User created successfully',
                data: response.data,  // You can return response data
            };
        } else {
            return {
                status: 'error',
                message: 'Failed to create user',
                data: response.data,  // Include error data in response
            };
        }
    } catch (error) {
        // If the error is from axios, it will be caught here
        if (axios.isAxiosError(error)) {
            // Check if the error has a response and message
            const errorMessage = error.response?.data?.error || error.message || 'An error occurred while creating the user';

            return {
                status: 'error',
                message: errorMessage,
                data: null,
            };
        } else {
            // If the error is not from axios, handle it here
            return {
                status: 'error',
                message: 'An unexpected error occurred',
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

async function CreateRoom(roomData:RoomsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomData)
    };

    let res = await fetch(`${apiUrl}/create-room`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,

        },
        body: formData,
    };

    let res = await fetch(`${apiUrl}/update-profile/${localStorage.getItem("userId")}`, requestOptions)
        .then((res) => {
            if (res) {
                return res; // Success: Return the updated room data
            } else {
                return false; // Failure
            }
        });

    return res;
}


async function UpdateRoom(roomData:RoomsInterface) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomData)
    };

    let res = await fetch(`${apiUrl}/update-room/${roomData.ID}`, requestOptions)
        .then((res) => {
            if (res) {
                return res.json(); // Success: Return the updated room data
            } else {
                return false; // Failure
            }
        });

    return res;
}

async function GetRoomByID(id:number) {
    const requestOptions = {   
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };      

    let res = await fetch(`${apiUrl}/room/${id}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}




// RoomTypes
async function CreateRoomType(roomTypeData:RoomtypesInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomTypeData)
    };

    let res = await fetch(`${apiUrl}/create-room-type`, requestOptions)
        .then((res) => {
            if (res) {
                return res.json(); // Success: Return the created room type data
            } else {
                return false; // Failure
            }
        });

    return res;
}

async function UpdateRoomType(roomTypeData:RoomtypesInterface) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(roomTypeData)
    };

    let res = await fetch(`${apiUrl}/update-room-type/${roomTypeData.ID}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-types-for-booking`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/room-status`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/floors`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(floorData)
    };

    let res = await fetch(`${apiUrl}/create-floor`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(floorData)
    };

    let res = await fetch(`${apiUrl}/update-floor/${floorData.ID}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-types`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}
async function GetMaintenanceRequestsForUser(
    statusID: string, 
    page: number, 
    limit: number, 
    createdAt?: string | undefined, 
    userId?: number | undefined
) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests-option-for-user?status=${statusID}&page=${page}&limit=${limit}&createdAt=${createdAt}&userId=${userId}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-requests-option-for-admin?status=${statusID}&page=${page}&limit=${limit}&maintenanceType=${maintenanceType}&createdAt=${createdAt}&userId=${userId}&requestType=${requestType}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-request/${id}`, requestOptions).then(
        (res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        }
    );

    return res;
}
async function CreateMaintenanceRequest(data: MaintenanceRequestsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-request`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-request/${id}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-images`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-images`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/genders`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/roles`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/request-types`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/packages`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/manager-approval`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    const userID = localStorage.getItem('userId')

    let res = await fetch(`${apiUrl}/maintenance-tasks-option-id?page=${page}&status=${statusID}&limit=${limit}&maintenanceType=${maintenanceType}&createdAt=${createdAt || ''}&operator=${userID}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${id}`, requestOptions).then(
        (res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        }
    );

    return res;
}
async function CreateMaintenanceTask(data: ManagerApprovalsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-task`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${id}`, requestOptions)
        .then((res) => {
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/handover-images`, requestOptions).then((res) => {
        console.log(res)
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/inspection`, requestOptions).then((res) => {
        console.log(res)
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
    if (data.floor && data.floor > 0) params.append("floor", String(data.floor));  // กรองตาม floor
    if (data.roomType && data.roomType > 0) params.append("room_type", String(data.roomType));  // กรองตาม room_type
    if (data.roomStatus && data.roomStatus > 0) params.append("room_status", String(data.roomStatus));  // กรองตาม room_status
    params.append("page", String(data.page));  // แปลง page เป็น string
    params.append("limit", String(data.limit));  // แปลง limit เป็น string

    // ถ้า isEmployee มีค่า (true/false) ให้เพิ่มลงใน query string

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,  // การส่ง token เพื่อให้สิทธิการเข้าถึง
        },
    };

    // ใช้ fetch กับ URL ที่ประกอบไปด้วย query parameters
    let res = await fetch(`${apiUrl}/listset-room?${params.toString()}`, requestOptions)
        .then((res) => {
            if (res.status === 200) {
                return res.json();  // ถ้าสถานะเป็น 200 OK ให้ return ข้อมูล JSON
            } else {
                return false;  // ถ้ามีข้อผิดพลาดใน API
            }
        });

    return res;
}

// Email
async function SendMaintenanceStatusEmail(id: number) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/notifications`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}
async function GetUnreadNotificationCountsByUserID(id?: number) {
    try {
        const response = await axiosInstance.get(`/notifications/count/${id}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching notification counts:", error);
        return false;
    }
}
async function GetNotificationsByRequestAndUser(request_id?: number, user_id?: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/notification/by-request/${request_id}/${user_id}`, requestOptions).then(
        (res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        }
    );

    return res;
}
async function GetNotificationsByTaskAndUser(task_id?: number, user_id?: number) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/notification/by-task/${task_id}/${user_id}`, requestOptions).then(
        (res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        }
    );

    return res;
}
async function CreateNotification(data: NotificationsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/notification`, requestOptions).then((res) => {
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
async function UpdateNotificationByID(data: NotificationsInterface, id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/notification/${id}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

async function UpdateNotificationsByRequestID(data: NotificationsInterface, request_id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/notifications/request/${request_id}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}
async function UpdateNotificationsByTaskID(data: NotificationsInterface, task_id: Number | undefined) {
    const requestOptions = {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/notifications/task/${task_id}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

// BookingRooms
async function ListBookingRooms() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    }

    let res = await fetch(`${apiUrl}/booking-rooms`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

// Analytics API
export async function getSystemAnalytics() {
    try {
        const response = await axiosInstance.get('/analytics/system');
        return response.data;
    } catch (error) {
        console.error('Error fetching system analytics:', error);
        return false;
    }
}

export async function getDashboardAnalytics() {
    try {
        const response = await axiosInstance.get('/analytics/dashboard');
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard analytics:', error);
        return false;
    }
}

export async function trackPageVisit(data: any) {
    console.log('[ANALYTICS DEBUG] HTTP trackPageVisit called with data:', {
        user_id: data.user_id,
        page_path: data.page_path,
        page_name: data.page_name,
        duration: data.duration,
        is_bounce: data.is_bounce,
        timestamp: new Date().toISOString()
    });
    
    // แสดงสถานะ duration
    if (data.duration === 0) {
        console.log('[ANALYTICS DEBUG] Entry request (duration = 0) - will be skipped by backend');
    } else if (data.duration <= 2) {
        console.log('[ANALYTICS DEBUG] Short visit (duration <= 2s) - will be skipped by backend');
    } else {
        console.log('[ANALYTICS DEBUG] Valid visit (duration > 2s) - will be recorded by backend');
    }
    
    try {
        console.log('[ANALYTICS DEBUG] Making API call to /analytics/track');
        const response = await axiosInstance.post('/analytics/track', data);
        console.log('[ANALYTICS DEBUG] API response received:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[ANALYTICS DEBUG] Error tracking page visit:', error);
        if (error.response) {
            console.error('[ANALYTICS DEBUG] Response data:', error.response.data);
            console.error('[ANALYTICS DEBUG] Response status:', error.response.status);
        }
        return false;
    }
}

export async function getVisitsRange(start: string, end: string) {
    try {
        const response = await axiosInstance.get(`/analytics/visits-range?start=${start}&end=${end}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching visits range:', error);
        return false;
    }
}

export async function getPopularPagesByPeriod(period: string) {
    try {
        const response = await axiosInstance.get(`/analytics/popular-pages-by-period?period=${period}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching popular pages by period:', error);
        return false;
    }
}

export async function getPerformanceAnalytics(start: string, end: string) {
    try {
        console.log('HTTP: Calling performance analytics API with:', { start, end });
        const response = await axiosInstance.get(`/analytics/performance?start=${start}&end=${end}`);
        console.log('HTTP: Performance analytics API response:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching performance analytics:', error);
        return false;
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
    UpdateUserbyID,
    UpdateProfileImage,
    CreateUserExternalOnly,

    // Areas
    GetAreas,

    // Rooms
    GetRooms,
    CreateRoom,
    UpdateRoom,
    GetRoomByID,

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
    CreateNotification,
    UpdateNotificationByID,
    UpdateNotificationsByRequestID,
    UpdateNotificationsByTaskID,

    // BookingRooms
    ListBookingRooms
}



