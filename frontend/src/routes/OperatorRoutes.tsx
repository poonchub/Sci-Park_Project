import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import AcceptWork from "../pages/AcceptWork/AcceptWork";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";



const OperatorRoutes = (): RouteObject => {
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
                path: "/accept-work",
                element: <AcceptWork/>
            },
            {
				path: "/my-maintenance-request",
				element: <MyMaintenanceRequest/>
			},
        ]
    }
}
export default OperatorRoutes;