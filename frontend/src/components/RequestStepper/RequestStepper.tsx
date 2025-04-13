import { useMemo } from "react";
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

interface RequestStepperProps {
    requestStatuses: RequestStatusesInterface[];
    requestStatusID: number;
}

const RequestStepper: React.FC<RequestStepperProps> = ({ requestStatuses, requestStatusID }) => {

    const statusFlowMap: {
        [key: string]: string[];
    } = {
        Normal: ["Creating Request", "Pending", "Approved", "In Progress", "Completed"],
        Rejected: ["Creating Request", "Pending", "Rejected", "In Progress", "Completed"],
        Failed: ["Creating Request", "Pending", "Approved", "In Progress", "Failed"]
    };

    const getStatusGroup = (statusName: string): keyof typeof statusFlowMap => {
        if (statusName === "Rejected") return "Rejected";
        if (statusName === "Failed") return "Failed";
        return "Normal";
    };

    const filteredSteps = useMemo(() => {
        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus) return [];

        const group = getStatusGroup(currentStatus.Name || "");
        const flow = statusFlowMap[group];

        const steps = requestStatuses.filter(s => flow.includes(s.Name || ""));
        steps.sort((a, b) => flow.indexOf(a.Name || "") - flow.indexOf(b.Name || ""));

        return flow.includes("Creating Request")
            ? [{ ID: -1, Name: "Creating Request" }, ...steps]
            : steps;
    }, [requestStatuses, requestStatusID]);

    const activeStep = useMemo(() => {
        if (!requestStatusID) return 0;
        return filteredSteps.findIndex(s => s.ID === requestStatusID);
    }, [filteredSteps, requestStatusID]);

    return (
        <Card sx={{
            width: '100%',
            borderRadius: 2,
            height: '100%',
            alignItems: 'center',
            display: 'flex'
        }}>
            <CardContent sx={{ p: '16px 24px', width: '100%' }}>
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