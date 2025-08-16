import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
    faClock,
    faCheckCircle,
    faTimesCircle,
    faHourglassHalf,
    faBan,
    faUndoAlt,
} from "@fortawesome/free-solid-svg-icons";

export interface PaymentStatusConfig {
    color: string;
    colorLite: string;
    icon: IconDefinition;
}

export const paymentStatusConfig: Record<string, PaymentStatusConfig> = {
    "Pending Payment": {
        // รอการชำระเงิน
        color: "#FFC107",
        colorLite: "rgb(255, 243, 205)",
        icon: faClock,
    },
    "Paid": {
        // ชำระแล้ว (รอตรวจสอบ)
        color: "#17A2B8",
        colorLite: "rgb(209, 236, 241)",
        icon: faHourglassHalf,
    },
    "Approved": {
        // อนุมัติแล้ว
        color: "#28A745",
        colorLite: "rgb(212, 237, 218)",
        icon: faCheckCircle,
    },
    "Rejected": {
        // ปฏิเสธการชำระ
        color: "#DC3545",
        colorLite: "rgb(248, 215, 218)",
        icon: faTimesCircle,
    },
    "Cancelled": {
        // ยกเลิก
        color: "#6C757D",
        colorLite: "rgb(233, 236, 239)",
        icon: faBan,
    },
    "Refunded": {
        // คืนเงิน
        color: "#007BFF",
        colorLite: "rgb(210, 227, 252)",
        icon: faUndoAlt,
    },
};
