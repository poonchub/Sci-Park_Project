import { RouteObject, useRoutes } from "react-router-dom";
import CustomerRoutes from "./CustomerRoutes";

function ConfigRoutes(){
    // const isLoggedIn = localStorage.getItem("isLogin") === "true";
    // const isEmployeeLoggedIn = localStorage.getItem("isEmployeeLogin") === "true";
    // const role = localStorage.getItem("role") === "1";

    let routes: RouteObject[] = [];

    routes = [CustomerRoutes()];

    return useRoutes(routes)
}
export default ConfigRoutes;