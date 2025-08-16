import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { faClock, faHourglassHalf, faCheckCircle, faTimesCircle, faUndoAlt } from "@fortawesome/free-solid-svg-icons";

export interface PaymentStatusConfig {
    color: string;
    colorLite: string;
    icon: IconDefinition;
}

export const paymentStatusConfig: Record<string, PaymentStatusConfig> = {
    "Pending Payment": {
        // ยังไม่ได้จ่าย
        color: "#FFC107",
        colorLite: "rgb(255, 243, 205)",
        icon: faClock,
    },
    "Pending Verification": {
        // จ่ายแล้วแต่รอเจ้าหน้าที่ตรวจสอบสลิป
        color: "#17A2B8",
        colorLite: "rgb(209, 236, 241)",
        icon: faHourglassHalf,
    },
    "Paid": {
        // จ่ายแล้วและตรวจสอบเรียบร้อย
        color: "#28A745",
        colorLite: "rgb(212, 237, 218)",
        icon: faCheckCircle,
    },
    "Rejected": {
        // สลิปไม่ถูกต้อง / ต้องอัพโหลดใหม่
        color: "#DC3545",
        colorLite: "rgb(248, 215, 218)",
        icon: faTimesCircle,
    },
    "Refunded": {
        // คืนเงินแล้ว
        color: "#007BFF",
        colorLite: "rgb(210, 227, 252)",
        icon: faUndoAlt,
    },
};
