import { NavLink, useLocation } from "react-router-dom";
import "./OutsiderNavbar.css"
import { useState } from "react";
function OutsiderNavbar() {
    const [fname, setFname] = useState("พูลทรัพย์");
    const [lname, setLname] = useState("นานาวัน");

    const location = useLocation();
    const isActive = location.pathname === "/maintenance-request" || location.pathname === "/create-maintenance-request";

    return (
        <div className="navbar-windows-component">
            <div className="logo-box">
                Science-Park
            </div>
            <div className="navigetion-box">
                <NavLink to="/" className={({ isActive }) => (isActive ? "link active" : "link")}>หน้าหลัก</NavLink>
                <NavLink to="/outsider-maintenance-request" className={({ isActive }) => (isActive ? "link active" : "link")}>maintenance Req</NavLink>
            </div>
            <div className="login-box">
                <div className="name">{`${fname} ${lname}`}</div>
                <div className="profile">
                    <img src="./images/test-profile.jpg" alt="" />
                </div>
            </div>
        </div>
    )
}
export default OutsiderNavbar;