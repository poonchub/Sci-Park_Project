import ErrorAlert from "../Alert/ErrorAlert";
import SuccessAlert from "../Alert/SuccessAlert";
import WarningAlert from "../Alert/WarningAlert";

// Component to group and display multiple alerts
function AlertGroup(props: { alerts: any; setAlerts: any; }) {
    const { alerts, setAlerts } = props;

    return (
        <>
            {/* Loop through each alert and render the corresponding alert type */}
            {alerts.map((alert: { message: string; type: string }, index: number) => {
                const alertProps = {
                    message: alert.message,
                    onClose: () => setAlerts(alerts.filter((_: any, i: number) => i !== index)),
                    index,
                    totalAlerts: alerts.length,
                };

                switch (alert.type) {
                    case "success":
                        return <SuccessAlert key={index} {...alertProps} />;
                    case "error":
                        return <ErrorAlert key={index} {...alertProps} />;
                    case "warning":
                        return <WarningAlert key={index} {...alertProps} />;
                    default:
                        return null;
                }
            })}
        </>
    );
}

export default AlertGroup;