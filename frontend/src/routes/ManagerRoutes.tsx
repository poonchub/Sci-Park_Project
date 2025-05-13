import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequest from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import AssignWork from "../pages/AssignWork/AssignWork";
import CheckRequests from "../pages/CheckRequest/CheckRequest";
import Dashboard from "../pages/Dashboard/Dashboard";
import AllMaintenanceRequest from "../pages/AllMaintenanceRequest/AllMaintenanceRequest";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import AddUserForm from "../pages/AddUser/AddUserForm";
import ManageUsers from "../pages/ManageUsers/ManageUsers";

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
                path: "/all-maintenance-request",
                element: <AllMaintenanceRequest />
            },
            {
                path: "/my-maintenance-request",
                element: <MyMaintenanceRequest />
            },
            {
                path: "/create-maintenance-request",
                element: <CreateMaintenanceRequest />
            },
            {
                path: "/assign-work",
                element: <AssignWork />
            },
            {
                path: "/check-requests",
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