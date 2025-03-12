export const apiUrl = "http://localhost:8000";
import { UserInterface } from "../../interfaces/IUser";
import axios from 'axios';


// ฟังก์ชันดึง Authorization Header
function getAuthHeaders() {
    const token = localStorage.getItem("authToken");
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  }
  
  // ฟังก์ชันสำหรับการ Login
  async function UserLogin(data: UserInterface) {
    const requestOptions = {
        headers: {
          "Content-Type": "application/json",
        },
      };
    return await axios
      .post(`${apiUrl}/auth/login`,data, requestOptions)
      .then((res) => res)
      .catch((e) => e.response);
  }
  
  async function CreateUser(data: UserInterface) {
      const formData = new FormData();
  
      // Append regular fields
      formData.append("company_name", data.CompanyName || "");
      formData.append("business_detail", data.BusinessDetail || "");
      formData.append("first_name", data.FirstName || "");
      formData.append("last_name", data.LastName || "");
      formData.append("gender_id", data.GenderID?.toString() || "1");
      formData.append("email", data.Email || "");
      formData.append("phone", data.Phone || "");
      formData.append("role_id", data.RoleID?.toString() || "1");
      formData.append("profile_path", data.ProfilePath || "");
  
      // Append Profile Image if present
      if (data.Profile_Image) {
          formData.append("profile_image", data.Profile_Image);
      }
  
      // Handle the user package ID (can be optional or default value)
      formData.append("userpackage_id", data.UserPackageID?.toString() || "1");
  
      const requestOptions = { headers: getAuthHeaders() };
  
      return await axios
          .post(`${apiUrl}/create-user`, formData, { ...requestOptions, headers: { ...requestOptions.headers, 'Content-Type': 'multipart/form-data' } })
          .then((res) => res)
          .catch((e) => e.response);
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

export {
    // Request Statuses
    GetRequestStatuses,
    UserLogin,
    CreateUser,
}



