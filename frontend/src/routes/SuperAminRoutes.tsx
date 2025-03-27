import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import Home from "../pages/Home/Home";
import AddUserForm from "../pages/AddUser/AddUserForm";
import DemoPopupLeft from "../pages/TestPopupSignup/DemoPopupLeft";
import ManageUsers from "../pages/ManageUsers/ManageUsers";

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
            {
                path: "/manage-user",
                element: <ManageUsers/>
            },

        ]
    }
}
export default SuperAdminRoutes;