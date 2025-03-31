import { Step, StepIconProps, StepLabel, Stepper, styled } from "@mui/material"

import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowsSpin, faCheck, faFile, faFlagCheckered, faHourglassHalf } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

function StepperComponent(props: { activeStep: number; steps: string[]; }) {
    const { activeStep, steps } = props

    const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
        [`&.${stepConnectorClasses.alternativeLabel}`]: {
            top: 22,
        },
        [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundImage:
                    'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
            },
        },
        [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundImage:
                    'linear-gradient( 95deg,rgb(242,113,33) 0%,rgb(233,64,87) 50%,rgb(138,35,135) 100%)',
            },
        },
        [`& .${stepConnectorClasses.line}`]: {
            height: 3,
            border: 0,
            backgroundColor: '#eaeaf0',
            borderRadius: 1,
            ...theme.applyStyles('dark', {
                backgroundColor: theme.palette.grey[800],
            }),
        },
    }));

    const ColorlibStepIconRoot = styled('div')<{
        ownerState: { completed?: boolean; active?: boolean };
    }>(({ theme }) => ({
        backgroundColor: '#ccc',
        zIndex: 1,
        color: '#fff',
        width: 50,
        height: 50,
        display: 'flex',
        borderRadius: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.applyStyles('dark', {
            backgroundColor: theme.palette.grey[700],
        }),
        variants: [
            {
                props: ({ ownerState }) => ownerState.active,
                style: {
                    backgroundImage:
                        'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
                },
            },
            {
                props: ({ ownerState }) => ownerState.completed,
                style: {
                    backgroundImage:
                        'linear-gradient( 136deg, rgb(242,113,33) 0%, rgb(233,64,87) 50%, rgb(138,35,135) 100%)',
                },
            },
        ],
    }));

    function ColorlibStepIcon(props: StepIconProps) {
        const { active, completed, className } = props;

        const icons: { [index: string]: IconDefinition } = {
            1: faFile,
            2: faHourglassHalf,
            3: faCheck,
            4: faArrowsSpin,
            5: faFlagCheckered,
        };

        return (
            <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
                <FontAwesomeIcon icon={icons[String(props.icon)]} size="lg"/>
            </ColorlibStepIconRoot>
        );
    }

    return (
        <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
            {steps.map((label) => (
                <Step key={label}>
                    <StepLabel 
                        slots={{ stepIcon: ColorlibStepIcon }}
                        sx={{ "& .MuiStepLabel-label": { color: "#6D6E70" } }} 
                    >{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
    )
}
export default StepperComponent