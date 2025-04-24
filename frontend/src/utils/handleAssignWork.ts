import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { CreateMaintenanceTask, UpdateMaintenanceRequestByID } from "../services/http";

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface HandleAssignWorkProps {
    selectedOperator: number | null;
    requestSelected: MaintenanceRequestsInterface | null;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
    refreshRequestData: () => void;
    setOpenPopupAssign: React.Dispatch<React.SetStateAction<boolean>>;
}

const handleAssignWork = async ({
    selectedOperator,
    requestSelected,
    setAlerts,
    refreshRequestData,
    setOpenPopupAssign,
}: HandleAssignWorkProps) => {
    if (!selectedOperator || !requestSelected?.ID) {
        setAlerts((prev) => [...prev, { type: 'error', message: "Invalid data" }]);
        return;
    }

    try {
        const task: MaintenanceTasksInterface = {
            UserID: selectedOperator,
            RequestID: requestSelected.ID
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: 4
        };

        const resAssign = await CreateMaintenanceTask(task);
        if (!resAssign || resAssign.error) throw new Error(resAssign?.error || "Failed to assign work");

        const resRequest = await UpdateMaintenanceRequestByID(request, requestSelected.ID);
        if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request");

        setAlerts((prev) => [...prev, { type: 'success', message: 'Assignment completed' }]);

        setTimeout(() => {
            refreshRequestData();
            setOpenPopupAssign(false);
        }, 500);

    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: 'error', message: errMessage }]);
    }
};
export default handleAssignWork;