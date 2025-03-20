import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import Loadable from "../components/Loadable/Loadable";
import { lazy } from "react";
const  Home = Loadable(lazy(() => import("../pages/Home/Home")));
import AddUserForm from "../pages/AddUser/AddUserForm";
import DemoPopupLeft from "../pages/TestPopupSignup/DemoPopupLeft";

const SuperAdminRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <WindowsLayout />,
        children: [
            {
                path: "/",
                element: <Home/>
            },
            {
                path: "/add-user",
                element: <AddUserForm/>
            },
            {
                path: "/test-popup",
                element: <DemoPopupLeft/>
            },

        ]
    }
}
export default SuperAdminRoutes;