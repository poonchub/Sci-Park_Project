import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faClock, faCheckCircle, faTimesCircle } from "@fortawesome/free-solid-svg-icons";

export interface PaymentStatusConfig {
    color: string;
    colorLite: string;
    icon: IconDefinition;
}

export const paymentStatusConfig: Record<string, PaymentStatusConfig> = {
    "Pending": {
        color: "#FFC107",
        colorLite: "rgb(255, 243, 205)",
        icon: faClock
    },
    "Completed": {
        color: "#28A745",
        colorLite: "rgb(212, 237, 218)",
        icon: faCheckCircle
    },
    "Failed": {
        color: "#DC3545",
        colorLite: "rgb(248, 215, 218)",
        icon: faTimesCircle
    }
};