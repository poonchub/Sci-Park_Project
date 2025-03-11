import { UserLoginInterface } from "../../interfaces/IUserLogin";

export const apiUrl = "http://localhost:8000";

async function UserLogin(data: UserLoginInterface) {
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(data),
    };

    let res = await fetch(`${apiUrl}/auth/login`, requestOptions).then((res) => {
        if (res.status == 200) {
            return res.json();
        } else {
            return false;
        }
    });

    return res;
}
export {
    UserLogin,
}