// constants/bookingStatusConfig.ts
import type { LucideIcon } from "lucide-react";
import {
  Clock,
  BadgeCheck,
  XCircle,
  CreditCard,
  RotateCcw,
  HelpCircle,
  CircleDollarSign,
  Search,
  CheckCircle,
  FileText,
} from "lucide-react";

export interface BookingStatusConfig {
  color: string;
  colorLite: string;
  icon: LucideIcon;
  label?: string;
}

export const bookingStatusConfig: Record<string, BookingStatusConfig> = {
  // ── Booking flow (ตาม BF) ──
  "pending approvel": {  color: "#10a605",colorLite: "rgba(0, 255, 60, 0.18)", icon: Clock, label: "Pending Approvel" },
  "pending payment": { color: "#2563EB", colorLite: "rgba(0, 123, 255, 0.18)", icon: CircleDollarSign, label: "Pending Payment" },
  "partially paid": { color: "#A16207", colorLite: "rgba(235, 202, 12, 0.22)", icon: CreditCard, label: "Partially Paid" },
  "awaiting receipt": { color: "#0EA5E9", colorLite: "rgba(23, 163, 184, 0.18)", icon: FileText, label: "Awaiting Receipt" },
  "completed": { color: "#884af7",     colorLite: "rgba(110, 66, 193, 0.18)", icon: CheckCircle, label: "Completed"},
  "cancelled": { color: "#EF4444", colorLite:"rgba(220, 53, 70, 0.19)", icon: XCircle, label: "Cancelled" },

  // ── Payment tags ──
  "unpaid": { color: "#6B7280", colorLite: "#E5E7EB", icon: CreditCard, label: "Unpaid" },
  "pending verification": { color: "#7C3AED", colorLite: "rgba(0, 123, 255, 0.18)", icon: Search, label: "Pending Verification" },
  "approved": {  color: "#10a605",colorLite: "rgba(0, 255, 60, 0.18)", icon: BadgeCheck, label: "Approved" },
  "rejected": { color: "#DC2626", colorLite:  "rgba(255, 107, 53, 0.18)", icon: XCircle, label: "Rejected" },
  "refunded": { color: "#F97316", colorLite:"rgba(255, 166, 0, 0.21)", icon: RotateCcw, label: "Refunded" },

  // alias ของ paid → approved
  "paid": { color: "#16A34A", colorLite: "#DCFCE7", icon: BadgeCheck, label: "Paid" },

  // fallback
  "unknown": { color: "#6B7280", colorLite: "#F3F4F6", icon: HelpCircle, label: "Unknown" },
};

const ALIAS: Record<string, string> = {
  // booking (เก่า → ใหม่ ตาม BF)
  "pending": "pending approvel",
  "confirmed": "pending payment",
  "payment review": "pending payment",
  "payment": "pending payment",
  "completed": "completed",

  // ขีด/ขีดล่าง
  "awaiting_receipt": "awaiting receipt",
  "awaiting-receipt": "awaiting receipt",

  // payment status
  "awaiting payment": "unpaid",
  "overdue": "unpaid",
  "submitted": "pending verification",
  "verifying": "pending verification",
  "waiting for verify": "pending verification",
  "success": "approved",
  "deposit paid": "approved",
};

export function getBookingStatusConfig(key?: string): BookingStatusConfig {
  const raw = (key || "unknown").toLowerCase().replace(/[_-]+/g, " ").trim();
  const k = ALIAS[raw] || raw;
  return bookingStatusConfig[k] ?? bookingStatusConfig.unknown;
}
