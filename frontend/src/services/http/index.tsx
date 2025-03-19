export const apiUrl = "http://localhost:8000";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";
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

async function GetUser() {
    const requestOptions = {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
    };

    let res = await fetch(`${apiUrl}/user`, requestOptions)
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
    formData.append("role_id", data.RoleID.toString());
    formData.append("profile_path", data.ProfilePath || "");

    if (data.Profile_Image) {
        console.log(">>>>>",data.formData)
        formData.append("profile_image", data.Profile_Image);
    }
    formData.forEach((value, key) => {
        console.log(`${key}: ${value}`);
    });

    formData.append("package_id", data.UserPackageID?.toString() || "5");

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
async function GetMaintenanceRequests() {
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
async function CreateMaintenanceRequest(data: MaintenanceRequestsInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/create-maintenance-request`, requestOptions).then((res) => {
        if (res.status == 201) {
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

    let res = await fetch(`${apiUrl}/create-maintenance-images`, requestOptions).then((res) => {
        console.log(res)
        if (res.status == 201) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}

// Gender
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

// Role
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

// Package
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

export {
    // RequestStatuses
    GetRequestStatuses,

    // Users
    GetUser,
    UserLogin,
    CreateUser,

    // Areas
    GetAreas,

    // Rooms
    GetRooms,

    // RoomTypes
    GetRoomTypes,

    // Floor
    GetFloors,

    // MaintenanceTypes
    GetMaintenanceTypes,

    // MaintenanceRequests
    GetMaintenanceRequests,
    CreateMaintenanceRequest,

    // MaintenanceImages
    CreateMaintenanceImages,

    // Gender
    ListGenders,

    // Package
    ListPackages,

    // Role
    ListRoles,
    

}



