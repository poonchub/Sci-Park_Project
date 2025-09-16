// utils/bookingFlow.ts
import { Check,  Book, CheckCircle } from "lucide-react";

export type UIPaymentStatus =
  | "unpaid"
  | "pending payment"
  | "pending verification"
  | "approved"
  | "rejected"
  | "refunded";

export type BookingDisplayStatus =
  | "pending"
  | "confirmed"
  | "payment review"
  | "payment"
  | "completed"
  | "cancelled"
  | "unknown";

export type SlipPathType = string | string[] | { Path?: string }[];

export type BookingAny = {
  ID: number;
  StatusName?: string;
  DisplayStatus?: BookingDisplayStatus | string;
  Payment?: {
    Status?: string | undefined;
    status?: string | undefined;

    // 👇 แก้ตรงนี้
    SlipPath?: SlipPathType;

    slipImages?: string[] | undefined;
    SlipImages?: string[] | undefined;
    Amount?: number | undefined;

    // (ออปชัน) บางหน้าใช้ Receipt/PaymentDate/Note ก็เปิดไว้เลย จะช่วยลด cast
    ReceiptPath?: SlipPathType | null;
    PaymentDate?: string;
    Note?: string;
  };
  Finance?: {
    TotalAmount?: number | undefined;
    PaidApproved?: number | undefined;
    IsFullyPaid?: boolean | undefined;
  };
  PaymentOption?: { OptionName?: string } | undefined;
};

export const normalizePaymentStatus = (s?: string): UIPaymentStatus | undefined => {
  const v = (s || "").trim().toLowerCase();
  if (!v) return undefined;
  if (v === "paid") return "approved";
  if (v === "submitted") return "pending verification";
  if (v === "awaiting receipt") return "approved"; // 👈 เคสที่ทำให้ขึ้น Unknown
  if (["unpaid","pending payment","pending verification","approved","rejected","refunded"].includes(v)) {
    return v as UIPaymentStatus;
  }
  return undefined;
};

const hasSlip = (b?: Partial<BookingAny> | null) => {
  const sp = b?.Payment?.SlipPath ?? b?.Payment?.slipImages ?? b?.Payment?.SlipImages;
  if (Array.isArray(sp)) return sp.length > 0 && !!sp[0];
  return typeof sp === "string" ? sp.trim() !== "" : false;
};

const isFullyPaid = (b?: Partial<BookingAny> | null) => {
  const f = b?.Finance ?? {};
  const total = Number(f?.TotalAmount ?? 0);
  const paid  = Number(f?.PaidApproved ?? 0);
  if (typeof f?.IsFullyPaid === "boolean") return f.IsFullyPaid;
  return total > 0 && paid >= total;
};

export function getDisplayStatus(b?: Partial<BookingAny> | null): BookingDisplayStatus {
  if (!b) return "unknown";

  const baseDisp = String(b?.DisplayStatus ?? "").trim().toLowerCase();
  const statusName = String(b?.StatusName ?? "").trim().toLowerCase();
  const pay = normalizePaymentStatus(b?.Payment?.Status ?? b?.Payment?.status);

  // hard states (รองรับสะกดหลายแบบ)
  if (statusName.includes("cancel")) return "cancelled";
  if (statusName.includes("complete")) return "completed";

  // baseDisp จาก BE (เช่น 'awaiting receipt') -> ตีความเป็น 'payment'
  if (baseDisp === "awaiting receipt") return "payment";
  if (["pending","confirmed","payment review","payment","completed","cancelled","unknown"].includes(baseDisp)) {
    return baseDisp as BookingDisplayStatus;
  }

  // payment-driven overrides
  if (pay === "pending verification" || (!pay && hasSlip(b))) return "payment review";
  if (pay === "approved") return "payment";                   // 👈 ไม่บังคับ isFullyPaid
  if (pay === "rejected") return "confirmed";
  if (pay === "unpaid" || pay === "pending payment") return "confirmed";

  // fallback by StatusName
  if (statusName === "pending") return "pending";
  if (statusName === "confirmed" || statusName === "approved") return "confirmed";

  return "unknown";
}

export type ActionKey =
  | "approve"
  | "reject"
  | "refund"
  | "approvePayment"
  | "rejectPayment"
  | "complete";

export type NextAction = {
  key: ActionKey;
  label: string;
  icon: any;
  color?: "primary" | "inherit";
};

export function getNextAction(row?: Partial<BookingAny> | null): NextAction | null {
  if (!row) return null;

  const disp = getDisplayStatus(row);
  const pay = normalizePaymentStatus(row?.Payment?.Status ?? row?.Payment?.status);

  switch (disp) {
    case "pending":
      return { key: "approve", label: "Approve", icon: Check };
    case "payment review":
      return { key: "approvePayment", label: "Review Payment", icon: Book };
    case "payment":
      return { key: "complete", label: "Finish Booking", icon: CheckCircle };
    case "confirmed":
      if (pay === "pending verification" || pay === "rejected") {
        return { key: "approvePayment", label: "Review Payment", icon: Book };
      }
      if (pay === "approved" && isFullyPaid(row)) {
        return { key: "complete", label: "Finish Booking", icon: CheckCircle };
      }
      return null;
    case "completed":
    case "cancelled":
    case "unknown":
    default:
      return null;
  }
}
