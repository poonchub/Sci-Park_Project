import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import BookingRoom from "../pages/BookingRoom/BookingRoom";
import Home from "../pages/Home/Home";
import CreateMaintenanceRequestPage from "../pages/CreateMaintenanceRequest/CreateMaintenanceRequest";
import MyMaintenanceRequest from "../pages/MyMaintenanceRequest/MyMaintenanceRequest";
import CheckRequests from "../pages/CheckRequest/CheckRequest";
import AboutDeveloper from "../pages/AboutDeveloper/AboutDeveloper";
import MyAccount from "../pages/MyAccount/MyAccount";
import News from "../pages/News/News";
import RoomBookingForm from "../pages/RoomBookingForm/RoomBookingForm";
import CreateServiceAreaForm from "../pages/CreateRequestServiceArea/CreateServiceAreaForm";
import EditProfile from "../pages/EditProfile/EditProfile";
import RoomRentalSpace from "../pages/RoomRentalSpace/RoomRentalSpace";
import MyBookingRoom from "../pages/MyBookingRoom/MyBookingRoom";
import CancelRequestServiceArea from "../pages/CancelRequestServiceArea/CancelRequestServiceArea";
import ServiceAreaDetails from "../pages/ServiceAreaDetails/ServiceAreaDetails";

const UserRoutes = (): RouteObject => {
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
				path: "/room-booking-form",
				element: <RoomBookingForm/>
			},
            {
				path: "/my-booking-room",
				element: <MyBookingRoom/>
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
			{
				path: "/about-developer",
				element: <AboutDeveloper/>
			},
			{
				path: "/my-account",
				element: <MyAccount/>
			},
			{
				path: "/my-account/edit-profile",
				element: <EditProfile/>
			},
			{
				path: "/news",
				element: <News/>
			},
			{
				path: "/create-service-area-request",
				element: <CreateServiceAreaForm/>
			},
			{
				path: "/service-area/cancel-request",
				element: <CancelRequestServiceArea/>
			},
			{
				path: "/room/rental-space",
				element: <RoomRentalSpace/>
			},
			{
				path: "/service-area/service-area-details",
				element: <ServiceAreaDetails/>
			},
			{
				path: "",
				element: <Home/>
			},
			{
				path: "*",
				element: <Home/>
			},
		]
	}
}
export default UserRoutes;