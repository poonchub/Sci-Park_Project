import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import AcceptWork from "../pages/AcceptWork/AcceptWork";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import CreateMaintenanceRequestPage from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import CheckRequests from "../pages/CheckRequest/CheckRequest";
import AboutDeveloper from "../pages/AboutDeveloper/AboutDeveloper";
import MyAccount from "../pages/MyAccount/MyAccount";
import News from "../pages/News/News";
import EditProfile from "../pages/EditProfile/EditProfile";
import RoomRentalSpace from "../pages/RoomRentalSpace/RoomRentalSpace";
import DocumentManagement from "../pages/DocumentManagement/DocumentManagement";
const MaintenanceOperatorRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <WindowsLayout />,
        children: [
            {
                path: "/home",
                element: <Home />,
            },
            {
                path: "/booking-room",
                element: <BookingRoom />,
            },
            {
                path: "/maintenance/accept-work",
                element: <AcceptWork />,
            },
            {
                path: "/maintenance/my-maintenance-request",
                element: <MyMaintenanceRequest />,
            },
            {
                path: "/maintenance/create-maintenance-request",
                element: <CreateMaintenanceRequestPage />,
            },
            {
                path: "/maintenance/check-requests",
                element: <CheckRequests />,
            },
            {
                path: "/about-developer",
                element: <AboutDeveloper />,
            },
            {
                path: "/my-account",
                element: <MyAccount />,
            },
            {
                path: "/my-account/edit-profile",
                element: <EditProfile />,
            },
            {
                path: "/news",
                element: <News />,
            },
            {
                path: "/room/rental-space",
                element: <RoomRentalSpace />,
            },
            {
                path: "/document-management",
                element: <DocumentManagement />,
            },
            {
                path: "",
                element: <Home />,
            },
            {
                path: "*",
                element: <Home />,
            },
        ],
    };
};
export default MaintenanceOperatorRoutes;
