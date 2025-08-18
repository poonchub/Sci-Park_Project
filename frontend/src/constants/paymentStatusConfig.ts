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
        colorLite: "rgba(255, 193, 7, 0.2)", // light yellow
        icon: faClock,
    },
    "Pending Verification": {
        // จ่ายแล้วแต่รอเจ้าหน้าที่ตรวจสอบสลิป
        color: "#17A2B8",
        colorLite: "rgba(23, 162, 184, 0.2)", // light cyan
        icon: faHourglassHalf,
    },
    "Paid": {
        // จ่ายแล้วและตรวจสอบเรียบร้อย
        color: "#28A745",
        colorLite: "rgba(40, 167, 69, 0.2)", // light green
        icon: faCheckCircle,
    },
    "Rejected": {
        // สลิปไม่ถูกต้อง / ต้องอัพโหลดใหม่
        color: "#DC3545",
        colorLite: "rgba(220, 53, 69, 0.2)", // light red
        icon: faTimesCircle,
    },
    "Refunded": {
        // คืนเงินแล้ว
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.2)", // light blue
        icon: faUndoAlt,
    },
};
