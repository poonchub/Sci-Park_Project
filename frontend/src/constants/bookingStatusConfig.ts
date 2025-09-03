// bookingStatusConfig.ts
import type { LucideIcon } from "lucide-react";
import {
  Clock,          // Pending
  BadgeCheck,     // Confirmed
  XCircle,        // Cancelled
  CreditCard,     // Paid/Unpaid
  RotateCcw,      // Refunded
  HelpCircle,
  CircleDollarSign,
  Search,
  CheckCircle,     // Unknown
} from "lucide-react";

/** โครงสร้าง config ของแต่ละสถานะ */
export interface BookingStatusConfig {
  /** main color */
  color: string;
  /** background สีอ่อน */
  colorLite: string;
  /** ไอคอน lucide */
  icon: LucideIcon;
  /** ป้ายชื่อ (เผื่อใช้แสดง label ให้สวยงาม) */
  label?: string;
}

/**
 * Mapping: booking status (ตัวพิมพ์เล็ก) -> config
 * รวมสถานะหลัก + สถานะการชำระเงินให้ครบ
 */
export const bookingStatusConfig: Record<string, BookingStatusConfig> = {
  // ── สถานะการจอง ─────────────────────────────
  pending: {
    color: "#F59E0B",        // ส้มทอง
    colorLite: "#FEF3C7",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "#3B82F6",        // น้ำเงินสด
    colorLite: "#DBEAFE",
    icon: BadgeCheck,
    label: "Confirmed",
  },
  "payment review": {
    color: "#8B5CF6",        // ม่วงชัดเจน
    colorLite: "#EDE9FE",
    icon: Search,
    label: "Payment Review",
  },
payment: {
  color: "#F97316",        // ส้มเข้ม
  colorLite: "#FFEDD5",
  icon: CircleDollarSign,
  label: "Payment",
},
completed: {
  color: "#059669",        // เขียวเข้ม
  colorLite: "#D1FAE5",
  icon: CheckCircle,
  label: "Completed",
},


  cancelled: {
    color: "#EF4444",        // แดงสด
    colorLite: "#FEE2E2",
    icon: XCircle,
    label: "Cancelled",
  },

  // ── สถานะการชำระเงิน ────────────────────────
  unpaid: {
    color: "#6B7280",        // เทากลาง
    colorLite: "#E5E7EB",
    icon: CreditCard,
    label: "Unpaid",
  },
  paid: {
    color: "#16A34A",        // เขียวมาตรฐาน
    colorLite: "#DCFCE7",
    icon: CreditCard,
    label: "Paid",
  },
  refunded: {
    color: "#F97316",        // ส้มสด แยกจาก payment review
    colorLite: "#FFEDD5",
    icon: RotateCcw,
    label: "Refunded",
  },

  // ── fallback ─────────────────────────────────
  unknown: {
    color: "#6B7280",
    colorLite: "#F3F4F6",
    icon: HelpCircle,
    label: "Unknown",
  },
};


/** helper เผื่อเรียกแบบ safe */
export function getBookingStatusConfig(key?: string): BookingStatusConfig {
  const k = (key || "unknown").toLowerCase();
  return bookingStatusConfig[k] ?? bookingStatusConfig.unknown;
}
