import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import OutsiderMaintenanceRequest from "../pages/OutsiderMaintenanceRequest/OutsiderMaintenanceRequest";

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
				path: "/outsider-maintenance-request",
				element: <OutsiderMaintenanceRequest/>
			},
		]
	}
}
export default OutsiderRoutes;