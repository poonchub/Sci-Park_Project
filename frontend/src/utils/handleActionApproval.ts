import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { MaintenanceTasksInterface } from "../interfaces/IMaintenanceTasks";
import { ManagerApprovalsInterface } from "../interfaces/IManagerApprovals";
import { CreateMaintenanceTask, CreateManagerApproval, SendMaintenanceStatusEmail, UpdateMaintenanceRequestByID } from "../services/http";

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface handleActionApprovalProps {
    userID: number | undefined;
    selectedRequest: MaintenanceRequestsInterface | null;
    selectedOperator: number;
    setSelectedOperator: React.Dispatch<React.SetStateAction<number>>;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
    setOpenPopupApproved: (v: boolean) => void;
    setOpenConfirmRejected: (v: boolean) => void;
    note?: string;
}

const handleActionApproval = async (
    statusID: number,
    {
        userID,
        selectedRequest,
        selectedOperator,
        setSelectedOperator,
        setAlerts,
        setOpenPopupApproved,
        setOpenConfirmRejected,
        actionType,
        note
    }: handleActionApprovalProps & { actionType: "approve" | "reject" }
) => {
    if (!userID || !selectedRequest) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    if (actionType === "approve" && !selectedOperator) {
        setAlerts((prev) => [...prev, { type: "warning", message: "Please select an operator before approving." }]);
        return;
    }

    if (actionType === "reject" && (!note || note.trim() === "")) {
        setAlerts((prev) => [...prev, { type: "warning", message: "Please enter a description before reject requested." }]);
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
            
            setSelectedOperator(0)
            setOpenPopupApproved(false);
            setOpenConfirmRejected(false);
        }, 500);

        if (actionType === "reject") {
            const resEmail = await SendMaintenanceStatusEmail(selectedRequest.ID || 0);
            if (!resEmail || resEmail.error) throw new Error(resEmail?.error || "Failed to send email");
        }

    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};

export default handleActionApproval;