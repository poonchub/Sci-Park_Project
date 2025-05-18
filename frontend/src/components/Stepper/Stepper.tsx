import { Step, StepIconProps, StepLabel, Stepper, styled } from "@mui/material";
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faArrowsSpin, faCheck, faCircleXmark, faClipboardCheck, faFile, faFlagCheckered, faHourglassHalf, faRedo } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Stepper component rendering the steps with dynamic icons
function StepperComponent(props: { activeStep: number; steps: string[]; }) {
    const { activeStep, steps } = props

    // Step connector with custom gradient styling
    const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
        [`&.${stepConnectorClasses.alternativeLabel}`]: {
            top: 22,
        },
        [`&.${stepConnectorClasses.active}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                backgroundImage:
                    'linear-gradient( 95deg, rgb(255, 160, 101) 0%, rgb(242, 101, 34) 50%, rgb(230, 80, 9) 100%)',
            },
        },
        [`&.${stepConnectorClasses.completed}`]: {
            [`& .${stepConnectorClasses.line}`]: {
                background: 'rgb(255, 154, 91)',
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

    // Styled step icon with dynamic background
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
                        'linear-gradient( 136deg, rgb(255, 160, 101) 0%, rgb(242, 101, 34) 50%, rgb(230, 80, 9) 100%)',
                    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
                },
            },
            {
                props: ({ ownerState }) => ownerState.completed,
                style: {
                    background: 'rgb(255, 154, 91)',
                    ...theme.applyStyles('dark', {
                        backgroundColor: 'rgb(255, 154, 91)',
                    }),
                },
            },
        ],
    }));

    // Mapping step names to FontAwesome icons
    function ColorlibStepIcon(props: StepIconProps) {
        const { active, completed, className } = props;

        const stepIndex = props.icon as string;

        const icons: { [key: string]: IconDefinition } = {
            "Creating": faFile,
            "Created": faFile,
            "Pending": faHourglassHalf,
            "Approved": faCheck,
            "In Progress": faArrowsSpin,
            "Waiting for Review": faClipboardCheck,
            "Completed": faFlagCheckered,
            "Unsuccessful": faCircleXmark,
            "Rework Requested": faRedo,
        };

        const icon = icons[stepIndex] || faFile;

        return (
            <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
                <FontAwesomeIcon icon={icon} size="lg" />
            </ColorlibStepIconRoot>
        );
    }

    return (
        <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
            {steps.map((label, index) => (
                <Step key={label}>
                    <StepLabel
                        slots={{ stepIcon: () => <ColorlibStepIcon icon={label} active={index == activeStep} completed={index < activeStep} /> }}
                        sx={{ "& .MuiStepLabel-label": { color: "#6D6E70" } }}
                    >{label}</StepLabel>
                </Step>
            ))}
        </Stepper>
    )
}
export default StepperComponent