import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import OutsiderMaintenanceRequest from "../pages/OutsiderMaintenanceRequest/OutsiderMaintenanceRequest";

import Loadable from "../components/Loadable/Loadable";
import { lazy } from "react";
const  Home = Loadable(lazy(() => import("../pages/Home/Home")));


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