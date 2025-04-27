import { useMemo } from "react";
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

interface RequestStepperProps {
    requestStatuses: RequestStatusesInterface[];
    requestStatusID: number;
}

// The RequestStepper component displays a stepper based on the status of the maintenance request
const RequestStepper: React.FC<RequestStepperProps> = ({ requestStatuses, requestStatusID }) => {
    // Define the status flow groups based on request outcome
    const statusFlowMap: {
        [key: string]: string[];
    } = {
        Normal: ["Creating", "Pending", "Approved", "In Progress", "Waiting for Review", "Completed"],
        Unsuccessful: ["Unsuccessful"],
    };

    // Determine the status group based on the request status name
    const getStatusGroup = (statusName: string): keyof typeof statusFlowMap => {
        if (statusName === "Unsuccessful") return "Unsuccessful";
        return "Normal";
    };

    // Filter the steps based on the current status and status flow group
    const filteredSteps = useMemo(() => {
        const currentStatus = requestStatuses.find(s => s.ID === requestStatusID);
        if (!currentStatus) return [];

        const group = getStatusGroup(currentStatus.Name || "");
        const flow = statusFlowMap[group];

        const steps = requestStatuses.filter(s => flow.includes(s.Name || ""));
        steps.sort((a, b) => flow.indexOf(a.Name || "") - flow.indexOf(b.Name || ""));

        // Add "Creating Request" at the beginning of the flow if it is part of the status flow
        return flow.includes("Creating Request")
            ? [{ ID: -1, Name: "Creating Request" }, ...steps]
            : steps;
    }, [requestStatuses, requestStatusID]);

    // Determine the active step based on the current request status ID
    const activeStep = useMemo(() => {
        if (!requestStatusID) return 0;
        return filteredSteps.findIndex(s => s.ID === requestStatusID);
    }, [filteredSteps, requestStatusID]);

    // Render the StepperComponent with the filtered steps
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