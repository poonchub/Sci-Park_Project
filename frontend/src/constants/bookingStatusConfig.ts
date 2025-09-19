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
  "pending approved": { color: "#6B7280", colorLite: "#F3F4F6", icon: Clock, label: "Pending Approved" },
  "pending payment":  { color: "#2563EB", colorLite: "#EFF6FF", icon: CircleDollarSign, label: "Pending Payment" },
  "partially paid":   { color: "#A16207", colorLite: "#FEF3C7", icon: CreditCard, label: "Partially Paid" },
  "awaiting receipt": { color: "#0EA5E9", colorLite: "#E0F2FE", icon: FileText, label: "Awaiting Receipt" },
  "complete":         { color: "#10B981", colorLite: "#ECFDF5", icon: CheckCircle, label: "Complete" },
  "cancelled":        { color: "#EF4444", colorLite: "#FEE2E2", icon: XCircle, label: "Cancelled" },

  // ── Payment tags ──
  "unpaid":                { color: "#6B7280", colorLite: "#E5E7EB", icon: CreditCard, label: "Unpaid" },
  "pending verification":  { color: "#7C3AED", colorLite: "#F3E8FF", icon: Search, label: "Pending Verification" },
  "approved":              { color: "#16A34A", colorLite: "#DCFCE7", icon: BadgeCheck, label: "Approved" },
  "rejected":              { color: "#DC2626", colorLite: "#FEE2E2", icon: XCircle, label: "Rejected" },
  "refunded":              { color: "#F97316", colorLite: "#FFEDD5", icon: RotateCcw, label: "Refunded" },

  // alias ของ paid → approved
  "paid":                  { color: "#16A34A", colorLite: "#DCFCE7", icon: BadgeCheck, label: "Paid" },

  // fallback
  "unknown":               { color: "#6B7280", colorLite: "#F3F4F6", icon: HelpCircle, label: "Unknown" },
};

const ALIAS: Record<string, string> = {
  // booking (เก่า → ใหม่ ตาม BF)
  "pending": "pending approved",
  "confirmed": "pending payment",
  "payment review": "pending payment",
  "payment": "pending payment",
  "completed": "complete",

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
