export const apiUrl = "http://localhost:8000";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../../interfaces/IMaintenanceTasks";
import { ManagerApprovalsInterface } from "../../interfaces/IManagerApprovals";
import { QuarryInterface } from "../../interfaces/IQuarry";
import { UserInterface } from "../../interfaces/IUser";
import axios from 'axios';


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
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/user/${id}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}


async function ListUsers(data: QuarryInterface) {
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

    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    // ใช้ fetch กับ URL ที่ประกอบไปด้วย query parameters
    let res = await fetch(`${apiUrl}/users?${params.toString()}`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
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


    if (data.Profile_Image) {
        formData.append("profile_image", data.Profile_Image);
    }

    formData.append("package_id", data.UserPackageID?.toString() || "1");

    const token = localStorage.getItem("token");  
    const requestOptions = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    


        
    try {
        // Send FormData with requestOptions
        
        const response = await axios.post(`${apiUrl}/create-user`, formData, requestOptions);

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

async function GetOperators() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/operators`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

// Request Statuses
async function GetRequestStatuses() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/request-statuses`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

// Areas
async function GetAreas() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/areas`, requestOptions)
        .then((res) => {
            if (res.status == 200) {
                return res.json();
            } else {
                return false;
            }
        });

    return res;
}

// Rooms
async function GetRooms() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/rooms`, requestOptions)
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
    statusID: number, 
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
    statusID: number, 
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
async function GetMaintenanceTask(statusID: number, page: number, limit: number, maintenanceType: number, createdAt: string | undefined) {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    const userID = localStorage.getItem('userId')

    let res = await fetch(`${apiUrl}/maintenance-tasks-option-id?page=${page}&status=${statusID}&limit=${limit}&maintenanceType=${maintenanceType}&createdAt=${createdAt}&operator=${userID}`, requestOptions)
        .then((res) => {
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
async function DeleteMaintenanceTaskByID(bookingID: number | undefined) {
    const requestOptions = {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/maintenance-task/${bookingID}`, requestOptions).then((res) => {
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
        console.log(res)
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
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

    // Areas
    GetAreas,

    // Rooms
    GetRooms,

    // RoomTypes
    GetRoomTypes,

    // Floors
    GetFloors,

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
    CreateMaintenanceTask,
    UpdateMaintenanceTaskByID,
    DeleteMaintenanceTaskByID,

    // HandoverImages
    CreateHandoverImages,
}



