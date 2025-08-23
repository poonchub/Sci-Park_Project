import { useMemo } from "react";
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { isAdmin, isManager, isMaintenanceOperator, isDocumentOperator } from "../../routes";

interface RequestStepperProps {
    requestStatuses: RequestStatusesInterface[];
    requestStatusID: number;
}

const RequestStepper: React.FC<RequestStepperProps> = ({ requestStatuses, requestStatusID }) => {

    const displayName = (statusName: string, isCreating: boolean): string => {
        if (isCreating && statusName === "Created") return "Creating";
        return statusName;
    };

    // 1. กำหนด status flow ตาม role
    const statusFlow = useMemo(() => {
        const baseFlowAdmin = ["Created", "Pending", "Approved"];
        const baseFlowUser = ["Created"];

        const includeRework = requestStatuses.find(
            s => s.ID === requestStatusID && s.Name === "Rework Requested"
        ) !== undefined;

        if (isAdmin() || isManager() || isMaintenanceOperator() || isDocumentOperator()) {
            return [
                ...baseFlowAdmin,
                ...(includeRework ? ["Rework Requested"] : []),
                "In Progress",
                "Waiting For Review",
                "Completed"
            ];
        } else {
            return [
                ...baseFlowUser,
                ...(includeRework ? ["Rework Requested"] : []),
                "In Process",
                "Waiting For Review",
                "Completed"
            ];
        }
    }, [requestStatuses, requestStatusID]);

    const unsuccessfulFlow = ["Unsuccessful"];

    const getStatusGroup = (statusName: string): "Normal" | "Unsuccessful" => {
        if (statusName === "Unsuccessful") return "Unsuccessful";
        return "Normal";
    };

    // 2. ปรับสถานะให้เหมาะกับ role
    const filteredSteps = useMemo(() => {
        const isCreating = requestStatusID === 0;
    
        // ถ้าไม่เจอ status ปกติ แต่เป็น Creating ก็ยังไปต่อได้
        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus && !isCreating) return [];
    
        const group = getStatusGroup(currentStatus?.Name || "");
    
        if (group === "Unsuccessful") {
            return requestStatuses
                .filter(s => unsuccessfulFlow.includes(s.Name || ""))
                .map(s => ({
                    ...s,
                    Name: displayName(s.Name || "", isCreating)
                }));
        }
    
        if (isAdmin() || isManager() || isMaintenanceOperator() || isDocumentOperator()) {
            const steps = requestStatuses
                .filter(s => statusFlow.includes(s.Name || ""))
                .sort((a, b) => statusFlow.indexOf(a.Name || "") - statusFlow.indexOf(b.Name || ""))
                .map(s => ({
                    ...s,
                    Name: displayName(s.Name || "", isCreating)
                }));
            return steps;
        } else {
            const steps: { ID: number; Name: string }[] = [];
    
            for (const status of statusFlow) {
                if (status === "In Process") {
                    const inProcessStatuses = requestStatuses.filter(s =>
                        ["Pending", "Approved", "In Progress"].includes(s.Name || "")
                    );
                    if (inProcessStatuses.length > 0) {
                        steps.push({ ID: -1, Name: "In Process" });
                    }
                } else {
                    const match = requestStatuses.find(s => s.Name === status);
                    if (match) {
                        steps.push({
                            ID: match.ID || 0,
                            Name: displayName(match.Name || "", isCreating)
                        });
                    }
                }
            }
    
            return steps;
        }
    }, [requestStatuses, requestStatusID, statusFlow]);    

    // 3. หา active step
    const activeStep = useMemo(() => {
        if (!requestStatusID) return 0;

        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus) return 0;

        if (isAdmin() || isManager() || isMaintenanceOperator() || isDocumentOperator()) {
            return filteredSteps.findIndex(s => s.ID === requestStatusID);
        } else {
            // ถ้าเป็น user role อื่นๆ, ถ้าอยู่ใน Pending/Approved/In Progress ให้นับเป็น In Process
            if (["Pending", "Approved", "In Progress"].includes(currentStatus.Name || "")) {
                return filteredSteps.findIndex(s => s.Name === "In Process");
            } else {
                return filteredSteps.findIndex(s => s.ID === requestStatusID);
            }
        }
    }, [filteredSteps, requestStatuses, requestStatusID]);

    return (
        <Card sx={{
            width: '100%',
            borderRadius: 2,
            height: '100%',
            alignItems: 'center',
            display: 'flex'
        }}>
            <CardContent sx={{ p: '16px 24px', width: '100%', overflow: 'scroll' }}>
                <StepperComponent
                    activeStep={activeStep}
                    steps={filteredSteps
                        .map((s) => s.Name)
                        .filter((name): name is string => typeof name === "string")}
                />
            </CardContent>
        </Card>
    );
};

export default RequestStepper;
