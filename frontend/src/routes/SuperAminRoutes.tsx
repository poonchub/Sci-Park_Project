import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import Loadable from "../components/Loadable/Loadable";
import { lazy } from "react";
const  Home = Loadable(lazy(() => import("../pages/Home/Home")));
import AddUserForm from "../pages/AddUser/AddUserForm";

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

        ]
    }
}
export default SuperAdminRoutes;