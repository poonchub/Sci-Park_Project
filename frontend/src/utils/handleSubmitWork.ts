import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { CreateHandoverImages, SendMaintenanceStatusEmail, UpdateMaintenanceRequestByID, UpdateMaintenanceTaskByID } from "../services/http";
import { handleUpdateNotification } from "./handleUpdateNotification";

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface HandleSubmitWorkProps {
    selectedTask?: MaintenanceTasksInterface;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
    setOpenPopupSubmit: React.Dispatch<React.SetStateAction<boolean>>;
    files: File[];
    setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

const handleSubmitWork = async (
    statusID: number,
    {
        selectedTask,
        setAlerts,
        setOpenPopupSubmit,
        files,
        setFiles
    }: HandleSubmitWorkProps
) => {
    if (!selectedTask?.ID || !statusID) {
        setAlerts((prev) => [...prev, { type: 'error', message: "Invalid data" }]);
        return;
    }

    if (files.length === 0) {
        setAlerts((prev) => [...prev, { type: 'warning', message: "No images uploaded" }]);
        return;
    }

    try {

        if (files.length > 0) {
            const formDataFile = new FormData();
            formDataFile.append("userID", String(selectedTask.UserID));
            formDataFile.append("taskID", String(selectedTask.ID));

            files.forEach(file => formDataFile.append("files", file));

            const resImage = await CreateHandoverImages(formDataFile);
            if (!resImage) {
                setAlerts((prev) => [...prev, { type: 'error', message: resImage?.Error || "Failed to upload images." }]);
                return;
            }
        }

        const task: MaintenanceTasksInterface = {
            RequestStatusID: statusID
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID
        };

        const resAssign = await UpdateMaintenanceTaskByID(task, selectedTask.ID);
        if (!resAssign || resAssign.error) throw new Error(resAssign?.error || "Failed to update task.");

        await handleUpdateNotification(selectedTask.MaintenanceRequest?.UserID ?? 0, false, selectedTask.RequestID, undefined, undefined);

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedTask.RequestID);
        if (!resRequest || resRequest.error) throw new Error(resRequest?.error || "Failed to update request.");

        setTimeout(() => {
            setAlerts((prev) => [...prev, { type: 'success', message: 'Work submitted successfully' }]);
            setFiles([])

            setOpenPopupSubmit(false);
        }, 500);

        const resEmail = await SendMaintenanceStatusEmail(selectedTask.RequestID || 0);
        if (!resEmail || resEmail.error) throw new Error(resEmail?.error || "Failed to send email.");

    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: 'error', message: errMessage }]);
    }
};
export default handleSubmitWork;