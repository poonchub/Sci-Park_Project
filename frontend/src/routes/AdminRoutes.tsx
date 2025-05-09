import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequest from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import AssignWork from "../pages/AssignWork/AssignWork";
import CheckRequests from "../pages/CheckRequest/CheckRequest";
import Dashboard from "../pages/Dashboard/Dashboard";
import AcceptWork from "../pages/AcceptWork/AcceptWork";
import AllMaintenanceRequest from "../pages/AllMaintenanceRequest/AllMaintenanceRequest";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import AddUserForm from "../pages/AddUser/AddUserForm";
import ManageUsers from "../pages/ManageUsers/ManageUsers";
import ManageRooms from "../pages/ManageRooms/ManageRooms";
import AddRoomForm from "../pages/AddRoom/AddNewRoom";

const AdminRoutes = (): RouteObject => {
	return {
		path: "/",
		element: <WindowsLayout />,
		children: [
			{
				path: "/home",
				element: <Home/>
			},
			{
				path: "/booking-room",
				element: <BookingRoom/>
			},
			{
				path: "/maintenance/all-maintenance-request",
				element: <AllMaintenanceRequest/>
			},
			{
				path: "/maintenance/my-maintenance-request",
				element: <MyMaintenanceRequest/>
			},
			{
				path: "/maintenance/create-maintenance-request",
				element: <CreateMaintenanceRequest/>
			},
			{
				path: "/maintenance/check-requests",
				element: <CheckRequests/>
			},
			{
				path: "/maintenance/dashboard",
				element: <Dashboard/>
			},
			{
				path: "/maintenance/accept-work",
				element: <AcceptWork/>
			},
			{
                path: "/add-user",
                element: <AddUserForm/>
            },
            {
                path: "/manage-user",
                element: <ManageUsers/>
            },
			{
                path: "/manage-room",
                element: <ManageRooms/>
            },
			{
				path: "/add-room",
				element: <AddRoomForm/>
			},


		]
	}
}
export default AdminRoutes;