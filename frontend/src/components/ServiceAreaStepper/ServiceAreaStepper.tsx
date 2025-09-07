import { useMemo } from "react";
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

interface ServiceAreaStepperProps {
    requestStatuses: RequestStatusesInterface[];
    requestStatusID: number;
}

const ServiceAreaStepper: React.FC<ServiceAreaStepperProps> = ({ requestStatuses, requestStatusID }) => {

    const displayName = (statusName: string, isCreating: boolean): string => {
        if (isCreating && statusName === "Created") return "Creating";
        return statusName;
    };

    // กำหนด status flow สำหรับ Service Area
    const serviceAreaStatusFlow = useMemo(() => {
        return ["Created", "Pending", "Approved", "In Progress", "Completed"];
    }, []);

    // กำหนด status flow สำหรับการยกเลิก (Cancellation)
    const cancellationStatusFlow = useMemo(() => {
        return ["Created", "Pending", "Cancellation In Progress", "Cancellation Assigned", "Successfully Cancelled"];
    }, []);

    const unsuccessfulFlow = ["Unsuccessful"];

    const getStatusGroup = (statusName: string): "Normal" | "Unsuccessful" | "Cancellation" => {
        if (statusName === "Unsuccessful") return "Unsuccessful";
        if (statusName === "Cancellation In Progress" || statusName === "Cancellation Assigned" || statusName === "Successfully Cancelled") return "Cancellation";
        return "Normal";
    };

    // ปรับสถานะให้เหมาะกับ Service Area
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
    
        if (group === "Cancellation") {
            // สำหรับการยกเลิก ใช้ flow การยกเลิก
            const steps = requestStatuses
                .filter(s => cancellationStatusFlow.includes(s.Name || ""))
                .sort((a, b) => cancellationStatusFlow.indexOf(a.Name || "") - cancellationStatusFlow.indexOf(b.Name || ""))
                .map(s => ({
                    ...s,
                    Name: displayName(s.Name || "", isCreating)
                }));
            return steps;
        }
    
        // สำหรับ Service Area ปกติ ใช้ flow ปกติ
        const steps = requestStatuses
            .filter(s => serviceAreaStatusFlow.includes(s.Name || ""))
            .sort((a, b) => serviceAreaStatusFlow.indexOf(a.Name || "") - serviceAreaStatusFlow.indexOf(b.Name || ""))
            .map(s => ({
                ...s,
                Name: displayName(s.Name || "", isCreating)
            }));
        return steps;
    }, [requestStatuses, requestStatusID, serviceAreaStatusFlow, cancellationStatusFlow]);    

    // หา active step
    const activeStep = useMemo(() => {
        if (!requestStatusID) return 0;

        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus) return 0;

        return filteredSteps.findIndex(s => s.ID === requestStatusID);
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

export default ServiceAreaStepper;
