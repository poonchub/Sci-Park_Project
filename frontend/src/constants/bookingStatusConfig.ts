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
  CheckCircle,    // Completed
  FileText,       // Awaiting Receipt
} from "lucide-react";

export interface BookingStatusConfig {
  color: string;
  colorLite: string;
  icon: LucideIcon;
  label?: string;
}

/** key เป็นตัวพิมพ์เล็กทั้งหมด */
export const bookingStatusConfig: Record<string, BookingStatusConfig> = {
  // ── สถานะการจอง ─────────────────────────────
  pending: {
    color: "#FFA500",
    colorLite: "rgba(255, 166, 0, 0.21)",
    icon: Clock,
    label: "Pending",
  },
  confirmed: {
    color: "#007BFF",
    colorLite: "rgba(0, 123, 255, 0.18)",
    icon: BadgeCheck,
    label: "Confirmed",
  },
  "payment review": {
    color: "#884af7",
    colorLite: "rgba(110, 66, 193, 0.18)",
    icon: Search,
    label: "Payment Review",
  },
  payment: {
    color: "#FFA500",
    colorLite: "rgba(255, 166, 0, 0.21)",
    icon: CircleDollarSign,
    label: "Payment",
  },

  /** ✅ ใหม่: รอออกใบเสร็จ หลังอนุมัติการชำระเงินแล้ว */
  "awaiting receipt": {
    color: "#F59E0B",
    colorLite: "rgba(245, 158, 11, 0.15)",
    icon: FileText,
    label: "Awaiting Receipt",
  },

  completed: {
    color: "#10a605",
    colorLite: "rgba(0, 255, 60, 0.18)",
    icon: CheckCircle,
    label: "Completed",
  },
  cancelled: {
    color: "#EF4444",
    colorLite: "#FEE2E2",
    icon: XCircle,
    label: "Cancelled",
  },

  // ── สถานะการชำระเงิน (มักใช้เป็นแท็กประกอบ) ──
  unpaid: {
    color: "#6B7280",
    colorLite: "#E5E7EB",
    icon: CreditCard,
    label: "Unpaid",
  },
  paid: {
    color: "#16A34A",
    colorLite: "#DCFCE7",
    icon: CreditCard,
    label: "Paid",
  },
  refunded: {
    color: "#F97316",
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

export function getBookingStatusConfig(key?: string): BookingStatusConfig {
  // normalize ให้รองรับ awaiting_receipt / awaiting-receipt
  const k = (key || "unknown").toLowerCase().replace(/[_-]+/g, " ");
  return bookingStatusConfig[k] ?? bookingStatusConfig.unknown;
}
