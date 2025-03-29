import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import MaintenanceRequest from "../pages/MaintenanceRequest/MaintenanceRequest";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequest from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import AssignWork from "../pages/AssignWork/AssignWork";
import CheckRequests from "../pages/CheckRequest/CheckRequest";

const AdminRoutes = (): RouteObject => {
	return {
		path: "/",
		element: <WindowsLayout />,
		children: [
			{
				path: "/",
				element: <Home/>
			},
			{
				path: "/booking-room",
				element: <BookingRoom/>
			},
			{
				path: "/maintenance-request",
				element: <MaintenanceRequest/>
			},
			{
				path: "/create-maintenance-request",
				element: <CreateMaintenanceRequest/>
			},
			{
				path: "/assign-work",
				element: <AssignWork/>
			},
			{
				path: "/check-requests",
				element: <CheckRequests/>
			},
		]
	}
}
export default AdminRoutes;