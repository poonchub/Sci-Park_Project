import { InspectionsInterface } from "../interfaces/IInspections";
import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { CreateInspection, DeleteHandoverImagesByTaskID, UpdateMaintenanceImages, UpdateMaintenanceRequestByID, UpdateMaintenanceTaskByID } from "../services/http";

interface Alert {
    type: "warning" | "error" | "success";
    message: string;
}

interface handleActionInspectionProps {
    userID: number | undefined;
    selectedRequest?: MaintenanceRequestsInterface;
    setAlerts: React.Dispatch<React.SetStateAction<Alert[]>>;
    setOpenConfirmInspection: (v: boolean) => void;
    setOpenConfirmRework: (v: boolean) => void;
    note?: string;
    files?: File[];
}

const handleActionInspection = async (
    statusID: number,
    {
        userID,
        selectedRequest,
        setAlerts,
        setOpenConfirmInspection,
        setOpenConfirmRework,
        actionType,
        note,
        files
    }: handleActionInspectionProps & { actionType: "confirm" | "rework" }
) => {
    if (!userID || !selectedRequest) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    if (actionType === "rework" && (!note || note.trim() === "")) {
        setAlerts((prev) => [...prev, { type: "warning", message: "Please enter a description before rework requested." }]);
        return;
    }

    if (actionType === "rework" && files?.length === 0) {
        setAlerts((prev) => [...prev, { type: 'warning', message: "No images uploaded" }]);
        return;
    }

    try {

        if (files && files.length > 0) {
            const formDataFile = new FormData();
            formDataFile.append("userID", String(userID));
            formDataFile.append("requestID", String(selectedRequest.ID));

            files.forEach(file => formDataFile.append("files", file));

            console.log("📤 FormData:", Array.from(formDataFile.entries()));

            const resImage = await UpdateMaintenanceImages(formDataFile);
            if (!resImage) {
                setAlerts((prev) => [...prev, { type: 'error', message: resImage?.Error || "Failed to upload images" }]);
                return;
            }
        }

        const inspection: InspectionsInterface = {
            UserID: userID,
            RequestID: selectedRequest.ID,
            RequestStatusID: statusID,
            Description: note || "",
        };

        const task: MaintenanceTasksInterface = {
            RequestStatusID: statusID,
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resInspection = await CreateInspection(inspection);
        if (!resInspection || resInspection.error)
            throw new Error(resInspection?.error || "Failed to create inspection");

        const resTask = await UpdateMaintenanceTaskByID(task, selectedRequest.MaintenanceTask?.ID);
        if (!resTask || resTask.error)
            throw new Error(resTask?.error || "Failed to update maintenance task");

        if (actionType === "rework") {
            const resImages = await DeleteHandoverImagesByTaskID(selectedRequest.MaintenanceTask?.ID)
            if (!resImages || resImages.error)
                throw new Error(resImages?.error || "Failed to delete handover images");
        }

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedRequest.ID);
        if (!resRequest || resRequest.error)
            throw new Error(resRequest?.error || "Failed to update request status");

        setTimeout(() => {
            setAlerts((prev) => [
                ...prev,
                { type: "success", message: actionType === "confirm" ? "Inspection successful" : "Rework Requested successful" }
            ]);

            setOpenConfirmInspection(false);
            setOpenConfirmRework(false);
        }, 500);
    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};
export default handleActionInspection;