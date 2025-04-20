import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequestPage from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import CheckRequests from "../pages/CheckRequest/CheckRequest";

const OutsiderRoutes = (): RouteObject => {
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
				path: "/my-maintenance-request",
				element: <MyMaintenanceRequest/>
			},
			{
				path: "/create-maintenance-request",
				element: <CreateMaintenanceRequestPage/>
			},
			{
				path: "/check-requests",
				element: <CheckRequests/>
			},
		]
	}
}
export default OutsiderRoutes;