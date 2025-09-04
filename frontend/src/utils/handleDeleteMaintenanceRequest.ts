import { DeleteMaintenanceRequestByID } from "../services/http";

interface AlertMessage {
    type: "error" | "warning" | "success";
    message: string;
}

interface HandleDeleteMaintenanceRequestProps {
    requestID: number;
    setAlerts: React.Dispatch<React.SetStateAction<AlertMessage[]>>;
    setOpenPopup: React.Dispatch<React.SetStateAction<boolean>>;
    setIsButtonActive: React.Dispatch<React.SetStateAction<boolean>>;
}

const handleDeleteMaintenanceRequest = async ({
    requestID,
    setAlerts,
    setOpenPopup,
    setIsButtonActive
}: HandleDeleteMaintenanceRequestProps) => {
    setIsButtonActive(true);
    if (requestID === 0) {
        setIsButtonActive(false);
        setAlerts((prev) => [...prev, { type: 'error', message: "Request ID is invalid." }]);
        return;
    }

    try {
        await DeleteMaintenanceRequestByID(requestID);

        setAlerts((prev) => [...prev, { type: 'success', message: 'Deleted successfully' }]);

        setTimeout(() => {
            setOpenPopup(false);
            setIsButtonActive(false);
        }, 500);

    } catch (error) {
        console.error("🚨 Unexpected error while deleting invoice:", error);
        setAlerts((prev) => [...prev, { type: 'error', message: "An unexpected error occurred while deleting the invoice" }]);
        setIsButtonActive(false);
    }
};
export default handleDeleteMaintenanceRequest;