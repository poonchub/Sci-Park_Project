import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { ManagerApprovalsInterface } from "../interfaces/IManagerApprovals";
import { CreateManagerApproval, UpdateMaintenanceRequestByID } from "../services/http";

interface handleActionApprovalProps {
    userID: number | undefined;
    selectedRequest: number | undefined;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: string; message: string }[]>>;
    refreshRequestData: () => void;
    setOpenConfirmApproved: (v: boolean) => void;
    setOpenConfirmRejected: (v: boolean) => void;
}

const handleActionApproval = async (
    statusID: number,
    message: string,
    {
        userID,
        selectedRequest,
        setAlerts,
        refreshRequestData,
        setOpenConfirmApproved,
        setOpenConfirmRejected,
    }: handleActionApprovalProps
) => {
    if (!userID || !selectedRequest) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    try {
        const managerApp: ManagerApprovalsInterface
            = {
            UserID: userID,
            RequestID: selectedRequest,
            RequestStatusID: statusID,
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resApproval = await CreateManagerApproval(managerApp);
        if (!resApproval || resApproval.error)
            throw new Error(resApproval?.error || "Failed to create manager approval");

        const resRequest = await UpdateMaintenanceRequestByID(request, selectedRequest);
        if (!resRequest || resRequest.error)
            throw new Error(resRequest?.error || "Failed to update request status");

        setAlerts((prev) => [...prev, { type: "success", message }]);

        setTimeout(() => {
            refreshRequestData();
            setOpenConfirmApproved(false);
            setOpenConfirmRejected(false);
        }, 500);
    } catch (error) {
        console.error("API Error:", error);
        const errMessage = (error as Error).message || "Unknown error!";
        setAlerts((prev) => [...prev, { type: "error", message: errMessage }]);
    }
};
export default handleActionApproval;