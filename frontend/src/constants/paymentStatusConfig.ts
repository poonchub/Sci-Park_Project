import { LucideIcon } from "lucide-react";
import { Clock, Hourglass, FileText, CheckCircle, XCircle, RotateCcw } from "lucide-react";

export interface PaymentStatusConfig {
    color: string;
    colorLite: string;
    icon: LucideIcon;
}

export const paymentStatusConfig: Record<string, PaymentStatusConfig> = {
    "Pending Payment": {
        // ยังไม่ได้จ่าย
        color: "#FFC107",
        colorLite: "rgba(255, 193, 7, 0.2)", // light yellow
        icon: Clock,
    },
    "Pending Verification": {
        // จ่ายแล้วแต่รอเจ้าหน้าที่ตรวจสอบสลิป
        color: "#17A2B8",
        colorLite: "rgba(23, 162, 184, 0.2)", // light cyan
        icon: Hourglass,
    },
    "Awaiting Receipt": {
        // ตรวจสอบสลิปแล้ว รอออกใบเสร็จ
        color: "#6F42C1",
        colorLite: "rgba(111, 66, 193, 0.2)", // light purple
        icon: FileText, // 📄 ใช้ icon เอกสารแทนใบเสร็จ
    },
    "Paid": {
        // จ่ายแล้วและตรวจสอบเรียบร้อย
        color: "#10a605",
        colorLite: "rgba(0, 255, 60, 0.18)", // light green
        icon: CheckCircle,
    },
    "Rejected": {
        // สลิปไม่ถูกต้อง / ต้องอัพโหลดใหม่
        color: "#DC3545",
        colorLite: "rgba(220, 53, 69, 0.2)", // light red
        icon: XCircle,
    },
    "Refunded": {
        // คืนเงินแล้ว
        color: "#007BFF",
        colorLite: "rgba(0, 123, 255, 0.2)", // light blue
        icon: RotateCcw,
    },
};
