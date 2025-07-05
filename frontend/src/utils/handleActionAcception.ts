import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { NotificationsInterface } from "../interfaces/INotifications";
import { SendMaintenanceStatusEmail, UpdateMaintenanceRequestByID, UpdateMaintenanceTaskByID, UpdateNotificationsByTaskID } from "../services/http";

interface Alert {
    type: "warning" | "error" | "success";
    message: string;
}

interface handleActionAcceptionProps {
    selectedTask?: MaintenanceTasksInterface;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    setOpenConfirmAccepted: (v: boolean) => void;
    setOpenConfirmCancelled: (v: boolean) => void;
    note?: string;
}

const handleActionAcception = async (
    statusID: number,
    {
        selectedTask,
        setAlerts,
        setOpenConfirmAccepted,
        setOpenConfirmCancelled,
        actionType,
        note,
    }: handleActionAcceptionProps & { actionType: "accept" | "cancel" }
) => {
    if (!selectedTask) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    if (actionType === "cancel" && (!note || note.trim() === "")) {
        setAlerts((prev) => [...prev, { type: "warning", message: "Please enter a description before cancel requested." }]);
        return;
    }

    try {
        const task: MaintenanceTasksInterface = {
            RequestStatusID: statusID,
            Note: note || "",
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resTask = await UpdateMaintenanceTaskByID(task, selectedTask.ID);
        if (!resTask || resTask.error) throw new Error(resTask?.error || "Failed to update maintenance task");

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedTask.RequestID);
        if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request status");

        const notificationDataUpdate: NotificationsInterface = {
            IsRead: true,
        };
        const resUpdateNotification = await UpdateNotificationsByTaskID(notificationDataUpdate, selectedTask.ID);
        if (!resUpdateNotification || resUpdateNotification.error) throw new Error(resUpdateNotification?.error || "Failed to update notification");

        setTimeout(() => {
            setAlerts((prev) => [
                ...prev,
                { type: "success", message: actionType === "accept" ? "Acception successful" : "Cancellation successful" },
            ]);

            setOpenConfirmAccepted(false);
            setOpenConfirmCancelled(false);
        }, 500);

        if (actionType === "cancel") {
            const resEmail = await SendMaintenanceStatusEmail(selectedTask.RequestID || 0);
            if (!resEmail || resEmail.error) throw new Error(resEmail?.error || "Failed to send email");
        }
    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};
export default handleActionAcception;
