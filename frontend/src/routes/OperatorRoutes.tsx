import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import AcceptWork from "../pages/AcceptWork/AcceptWork";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import CreateMaintenanceRequestPage from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import CheckRequests from "../pages/CheckRequest/CheckRequest";

const OperatorRoutes = (): RouteObject => {
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
                path: "/maintenance/accept-work",
                element: <AcceptWork/>
            },
            {
				path: "/maintenance/my-maintenance-request",
				element: <MyMaintenanceRequest/>
			},
            {
				path: "/maintenance/create-maintenance-request",
				element: <CreateMaintenanceRequestPage/>
			},
            {
				path: "/maintenance/check-requests",
				element: <CheckRequests/>
			},
        ]
    }
}
export default OperatorRoutes;