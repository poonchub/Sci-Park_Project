import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom";
import MaintenanceRequest from "../pages/MaintenanceRequest";
import Home from "../pages/Home";

const CustomerRoutes = (): RouteObject => {
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
		]
	}
}
export default CustomerRoutes;