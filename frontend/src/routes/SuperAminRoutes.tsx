import { RouteObject } from "react-router-dom";

import WindowsLayout from "../layouts/WindowsLayout";
import Home from "../pages/Home/Home";
import AddUserForm from "../pages/AddUser/AddUserForm";
import ManageUsers from "../pages/ManageUsers/ManageUsers";

const SuperAdminRoutes = (): RouteObject => {
    return {
        path: "/",
        element: <WindowsLayout />,
        children: [
            {
                path: "/",
                element: <Home />
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
export default SuperAdminRoutes;