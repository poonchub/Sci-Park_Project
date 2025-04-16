import { RouteObject, useRoutes } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import LoginRoutes from "./LoginRoutes";
import OutsiderRoutes from "./OutsiderRoutes";
import SuperAdminRoutes from "./SuperAminRoutes";
import OperatorRoutes from "./OperatorRoutes";
function ConfigRoutes() {
  const isLoggedIn = localStorage.getItem("isLogin") === "true"; // ตรวจสอบสถานะการเข้าสู่ระบบ
  const role = localStorage.getItem("role"); // รับค่าบทบาทจาก localStorage

  let routes: RouteObject[] = []; // กำหนดค่าเริ่มต้นให้กับ routes

  // ตรวจสอบว่าเข้าสู่ระบบหรือยัง
  if (isLoggedIn) {
    switch (role) {
      case "Admin":
        routes = [AdminRoutes()]; // เมื่อบทบาทเป็น Admin ให้ใช้เส้นทางของ Admin
        break;
      case "Outsider":
        routes = [OutsiderRoutes()]; // เมื่อบทบาทเป็น Outsider ให้ใช้เส้นทางของ Outsider
        break;
      case "SuperAdmin":
        routes = [SuperAdminRoutes()]; // เมื่อบทบาทเป็น SuperAdmin ให้ใช้เส้นทางของ Outsider
        break;
      case "Operator":
        routes = [OperatorRoutes()]; // เมื่อบทบาทเป็น Operator ให้ใช้เส้นทางของ Operator
        break;
      default:
        routes = [LoginRoutes()]; // กรณีอื่นๆ ใช้เส้นทางของ Login
    }
  } else {
    routes = [LoginRoutes()]; // ถ้าไม่ได้เข้าสู่ระบบให้ใช้เส้นทางของ Login
  }

  return useRoutes(routes); // ใช้ useRoutes กับ routes ที่ได้จากเงื่อนไขข้างต้น
}

export default ConfigRoutes;
