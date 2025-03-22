import { NavLink, useLocation } from "react-router-dom";
import "./SuperAdminNarbar.css"
import { useState } from "react";
function SuperAdminNavbar() {
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
                <NavLink to="/add-user" className={({ isActive }) => (isActive ? "link active" : "link")}>เพิ่มผู้ใช้งาน</NavLink>
                <NavLink to="/test-popup" className={({ isActive }) => (isActive ? "link active" : "link")}>Test demo</NavLink>
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
export default SuperAdminNavbar;