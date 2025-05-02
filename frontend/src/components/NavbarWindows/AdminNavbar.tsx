import { NavLink, useLocation } from "react-router-dom";
import "./AdminNavbar.css"
import { useState } from "react";
function AdminNavbar() {
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
				<NavLink to="/booking-room" className={({ isActive }) => (isActive ? "link active" : "link")}>จองห้องประชุม</NavLink>
				<NavLink to="/maintenance-request" className={({ isActive: navLinkIsActive }) => (navLinkIsActive || isActive ? "link active" : "link")}>แจ้งซ่อม</NavLink>
				<NavLink to="/manage-user" className={({ isActive: navLinkIsActive }) => (navLinkIsActive || isActive ? "link active" : "link")}>จัดการผู้ใช้</NavLink>
				<NavLink to="/manage-room" className={({ isActive: navLinkIsActive }) => (navLinkIsActive || isActive ? "link active" : "link")}>จัดการห้อง</NavLink>
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
export default AdminNavbar;