import { lazy } from "react";
import { RouteObject } from "react-router-dom";
import OutletLayout from "../layouts/OutletLayout";
import Loadable from "../components/Loadable/Loadable";
import ResetPassword from "../pages/Login/ResetPasswordPage";
import Register from "../pages/Login/Register";
const  Login = Loadable(lazy(() => import("../pages/Login/LoginPage")));

const LoginRoutes = (): RouteObject => {
  return {
    path: "/",
    element: <OutletLayout />,
    children: [
      {
        path: "/",
        element: <Login/>,
      },
      {
        path: "/login",
        element: <Login />,
      },
      {
        path: "/reset-password",
        element: <ResetPassword />,
      },
      {
        path: "/register",
        element: <Register />,
      },

    ],
  };
};

export default LoginRoutes;