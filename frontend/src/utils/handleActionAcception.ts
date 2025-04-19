import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { UpdateMaintenanceRequestByID, UpdateMaintenanceTaskByID } from "../services/http";

interface handleActionAcceptionProps {
    selectedTask?: MaintenanceTasksInterface;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: string; message: string }[]>>;
    refreshPendingTaskData: () => void;
    refreshInProgressTaskData: () => void;
    setOpenConfirmAccepted: (v: boolean) => void;
    setOpenConfirmCancelled: (v: boolean) => void;
}

const handleActionAcception = async (
    statusID: number,
    message: string,
    {
        selectedTask,
        setAlerts,
        refreshPendingTaskData,
        refreshInProgressTaskData,
        setOpenConfirmAccepted,
        setOpenConfirmCancelled,
    }: handleActionAcceptionProps
) => {
    if (!selectedTask) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    try {
        const task: MaintenanceTasksInterface = {
            RequestStatusID: statusID
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resTask = await UpdateMaintenanceTaskByID(task, selectedTask.ID);
        if (!resTask || resTask.error)
            throw new Error(resTask?.error || "Failed to update maintenance task");

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedTask.MaintenanceRequest?.ID);
        if (!resRequest || resRequest.error)
            throw new Error(resRequest?.error || "Failed to update request status");

        setAlerts((prev) => [...prev, { type: "success", message }]);

        setTimeout(() => {
            refreshPendingTaskData();
            refreshInProgressTaskData();
            setOpenConfirmAccepted(false);
            setOpenConfirmCancelled(false);
        }, 500);
    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};
export default handleActionAcception;