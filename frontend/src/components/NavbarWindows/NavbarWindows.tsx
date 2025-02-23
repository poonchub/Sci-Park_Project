import { NavLink } from "react-router-dom";
import "./NavbarWindows.css"
import { useState } from "react";
function NavbarWindows() {
	const [fname, setFname] = useState("พูลทรัพย์");
	const [lname, setLname] = useState("นานาวัน");

	return (
		<div className="navbar-windows-component">
			<div className="logo-box">

			</div>
			<div className="navigetion-box">
				<NavLink to="/" className={({ isActive }) => (isActive ? "link active" : "link")}>หน้าหลัก</NavLink>
				<NavLink to="/booking-room" className={({ isActive }) => (isActive ? "link active" : "link")}>จองห้องประชุม</NavLink>
				<NavLink to="/maintenance-request" className={({ isActive }) => (isActive ? "link active" : "link")}>แจ้งซ่อม</NavLink>
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
export default NavbarWindows;