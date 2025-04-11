import { MaintenanceRequestsInterface } from "../interfaces/IMaintenanceRequests";
import { ManagerApprovalsInterface } from "../interfaces/IManagerApprovals";
import { CreateManagerApproval, UpdateMaintenanceRequestByID } from "../services/http";

interface handleActionProps {
    userID: number | undefined;
    requestSelected: number | undefined;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: string; message: string }[]>>;
    refreshRequestData: () => void;
    setOpenConfirmApproved: (v: boolean) => void;
    setOpenConfirmRejected: (v: boolean) => void;
}

const handleAction = async (
    statusID: number,
    message: string,
    {
        userID,
        requestSelected,
        setAlerts,
        refreshRequestData,
        setOpenConfirmApproved,
        setOpenConfirmRejected,
    }: handleActionProps
) => {
    if (!userID || !requestSelected) {
        setAlerts((prev) => [...prev, { type: "error", message: "Invalid data" }]);
        return;
    }

    try {
        const managerApp: ManagerApprovalsInterface
            = {
            UserID: userID,
            RequestID: requestSelected,
            RequestStatusID: statusID,
        };

        const request: MaintenanceRequestsInterface = {
            RequestStatusID: statusID,
        };

        const resApproval = await CreateManagerApproval(managerApp);
        if (!resApproval || resApproval.error)
            throw new Error(resApproval?.error || "Failed to create manager approval");

        const resRequest = await UpdateMaintenanceRequestByID(request, requestSelected);
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
export default handleAction