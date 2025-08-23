import { RouteObject, useRoutes } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import LoginRoutes from "./LoginRoutes";
import OutsiderRoutes from "./UserRoutes";
import MaintenanceOperatorRoutes from "./MaintenanceOperatorRoutes";
import DocumentOperatorRoutes from "./DocumentOperatorRoutes";
import ManagerRoutes from "./ManagerRoutes";

// Role checking functions - exported for use in other components
export const getRole = () => localStorage.getItem('role')
export const isAdmin = () => getRole() === 'Admin'
export const isManager = () => getRole() === 'Manager'
export const isMaintenanceOperator = () => getRole() === 'Maintenance Operator'
export const isDocumentOperator = () => getRole() === 'Document Operator'
export const isOperator = () => {
  const role = getRole()
  return role === 'Maintenance Operator' || role === 'Document Operator'
} // For backward compatibility

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
      case "Manager":
        routes = [ManagerRoutes()]; // เมื่อบทบาทเป็น Manager ให้ใช้เส้นทางของ Manager
        break;
      case "Maintenance Operator":
        routes = [MaintenanceOperatorRoutes()]; // เมื่อบทบาทเป็น Maintenance Operator ให้ใช้เส้นทางของ Maintenance Operator
        break;
      case "Document Operator":
        routes = [DocumentOperatorRoutes()]; // เมื่อบทบาทเป็น Document Operator ให้ใช้เส้นทางของ Document Operator
        break;
      case "User":
        routes = [OutsiderRoutes()]; // เมื่อบทบาทเป็น User ให้ใช้เส้นทางของ User
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
