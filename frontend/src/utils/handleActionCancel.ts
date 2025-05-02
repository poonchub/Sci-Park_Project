import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { ManagerApprovalsInterface } from "../interfaces/IManagerApprovals";
import { CreateMaintenanceTask, CreateManagerApproval, UpdateMaintenanceRequestByID } from "../services/http";

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface handleActionCancelProps {
    userID: number | undefined;
    selectedRequest: MaintenanceRequestsInterface | null;
    selectedOperator: number;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
    refreshRequestData: () => void;
    setOpenPopupApproved: (v: boolean) => void;
    setOpenConfirmRejected: (v: boolean) => void;
    note?: string;
}

const handleActionCancel = async (
    statusID: number,
    {
        userID,
        selectedRequest,
        selectedOperator,
        setAlerts,
        refreshRequestData,
        setOpenPopupApproved,
        setOpenConfirmRejected,
        actionType,
        note
    }: handleActionCancelProps & { actionType: "approve" | "reject" }
) => {
    if (!userID || !selectedRequest) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    if (actionType === "approve" && !selectedOperator) {
        setAlerts((prev) => [...prev, { type: "warning", message: "Please select an operator before approving." }]);
        return;
    }    

    try {
        const managerApp: ManagerApprovalsInterface = {
            UserID: userID,
            RequestID: selectedRequest.ID,
            RequestStatusID: statusID,
            Description: note || "",
        };

        const task: MaintenanceTasksInterface = {
            UserID: selectedOperator,
            RequestID: selectedRequest.ID,
            RequestStatusID: statusID,
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resApproval = await CreateManagerApproval(managerApp);
        if (!resApproval || resApproval.error)
            throw new Error(resApproval?.error || "Failed to create manager approval");

        if (actionType === "approve") {
            const resAssign = await CreateMaintenanceTask(task);
            if (!resAssign || resAssign.error)
                throw new Error(resAssign?.error || "Failed to assign work");
        }

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedRequest.ID);
        if (!resRequest || resRequest.error)
            throw new Error(resRequest?.error || "Failed to update request status");

        setTimeout(() => {
            setAlerts((prev) => [
                ...prev,
                { type: "success", message: actionType === "approve" ? "Approval successful" : "Rejection successful" }
            ]);

            refreshRequestData();
            setOpenPopupApproved(false);
            setOpenConfirmRejected(false);
        }, 500);
    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};

export default handleActionCancel;