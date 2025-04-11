import ErrorAlert from "../Alert/ErrorAlert";
import SuccessAlert from "../Alert/SuccessAlert";
import WarningAlert from "../Alert/WarningAlert";

function AlertGroup( props: { alerts: any; setAlerts: any; } ) {
    const { alerts, setAlerts } = props
    return (
        <>
            {alerts.map((alert: { message: string; type: string; }, index: number) => {
                const props = {
                    message: alert.message,
                    onClose: () => setAlerts(alerts.filter((_: any, i: any) => i !== index)),
                    index,
                    totalAlerts: alerts.length,
                };
                switch (alert.type) {
                    case "success": return <SuccessAlert key={index} {...props} />;
                    case "error": return <ErrorAlert key={index} {...props} />;
                    case "warning": return <WarningAlert key={index} {...props} />;
                    default: return null;
                }
            })}
        </>
    )
}
export default AlertGroup;