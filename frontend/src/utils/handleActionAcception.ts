import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { UpdateMaintenanceRequestByID, UpdateMaintenanceTaskByID } from "../services/http";

interface Alert {
    type: "warning" | "error" | "success";
    message: string;
}

interface handleActionAcceptionProps {
    selectedTask?: MaintenanceTasksInterface;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    refreshPendingTaskData: () => void;
    refreshInProgressTaskData: () => void;
    setOpenConfirmAccepted: (v: boolean) => void;
    setOpenConfirmCancelled: (v: boolean) => void;
    note?: string;
}

const handleActionAcception = async (
    statusID: number,
    {
        selectedTask,
        setAlerts,
        refreshPendingTaskData,
        refreshInProgressTaskData,
        setOpenConfirmAccepted,
        setOpenConfirmCancelled,
        actionType,
        note
    }: handleActionAcceptionProps & { actionType: "accept" | "cancel" }
) => {
    if (!selectedTask) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    try {
        const task: MaintenanceTasksInterface = {
            RequestStatusID: statusID,
            Description: note || "",
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

        setTimeout(() => {
            setAlerts((prev) => [
                ...prev,
                { type: "success", message: actionType === "accept" ? "Acception successful" : "Cancellation successful" }
            ]);

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