import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequest from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import CheckRequests from "../pages/CheckRequest/CheckRequest";
import Dashboard from "../pages/Dashboard/Dashboard";
import AllMaintenanceRequest from "../pages/AllMaintenanceRequest/AllMaintenanceRequest";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import AddUserForm from "../pages/AddUser/AddUserForm";
import ManageUsers from "../pages/ManageUsers/ManageUsers";
import AboutDeveloper from "../pages/AboutDeveloper/AboutDeveloper";
import AllBookingRoom from "../pages/AllBookingRoom/AllBookingRoom";
import MyAccount from "../pages/MyAccount/MyAccount";
import News from "../pages/News/News";
const ManagerRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <WindowsLayout />,
        children: [
            {
                path: "/",
                element: <Home />
            },
            {
                path: "/booking-room",
                element: <BookingRoom />
            },
            {
                path: "/maintenance/all-maintenance-request",
                element: <AllMaintenanceRequest />
            },
            {
                path: "/maintenance/my-maintenance-request",
                element: <MyMaintenanceRequest />
            },
            {
                path: "/maintenance/create-maintenance-request",
                element: <CreateMaintenanceRequest />
            },
            {
                path: "/maintenance/check-requests",
                element: <CheckRequests />
            },
            {
                path: "/dashboard",
                element: <Dashboard />
            },
            {
                path: "/add-user",
                element: <AddUserForm />
            },
            {
                path: "/manage-user",
                element: <ManageUsers />
            },
            {
				path: "/about-developer",
				element: <AboutDeveloper/>
			},
            {
				path: "/all-booking-room",
				element: <AllBookingRoom/>
			},
            {
			path: "my-account",
			element: <MyAccount/>
			},
            {
				path: "/news",
				element: <News/>
			},
            {
				path: "",
				element: <Home/>
			},
            {
                path: "*",
                element: <Home />
            },
        ]
    }
}
export default ManagerRoutes;