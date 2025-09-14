import { Check, X, Book, CheckCircle } from "lucide-react";

/* ───────────────── types ───────────────── */
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

export type BookingAny = {
  ID: number;
  StatusName?: string;                       // pending | confirmed | completed | cancelled (raw)
  DisplayStatus?: BookingDisplayStatus;      // ถ้า BE สรุปมาแล้ว
  Payment?: {
    Status?: string;                         // raw (paid/submitted/…)
    status?: string;                         // legacy
    SlipPath?: string | string[];
    slipImages?: string[];
    SlipImages?: string[];
    Amount?: number;
  };
  Finance?: {
    TotalAmount?: number;
    PaidApproved?: number;
    IsFullyPaid?: boolean;
  };
  PaymentOption?: { OptionName?: string };   // Full | Deposit (ถ้ามี)
};

/* ─────────────── normalize helpers ─────────────── */
export const normalizePaymentStatus = (s?: string): UIPaymentStatus | undefined => {
  const v = (s || "").trim().toLowerCase();
  if (!v) return undefined;
  if (v === "paid") return "approved";                 // compat
  if (v === "submitted") return "pending verification";
  if (v === "awaiting receipt") return "approved";     // มักตามหลัง approved
  if (["unpaid","pending payment","pending verification","approved","rejected","refunded"].includes(v)) {
    return v as UIPaymentStatus;
  }
  return undefined;
};

const hasSlip = (b?: BookingAny) => {
  const sp = b?.Payment?.SlipPath ?? b?.Payment?.slipImages ?? b?.Payment?.SlipImages;
  if (Array.isArray(sp)) return sp.length > 0 && !!sp[0];
  return typeof sp === "string" ? sp.trim() !== "" : false;
};

const isFullyPaid = (b?: BookingAny) => {
  const f = b?.Finance ?? {};
  const total = Number(f.TotalAmount ?? 0);
  const paid  = Number(f.PaidApproved ?? 0);
  if (typeof f.IsFullyPaid === "boolean") return f.IsFullyPaid;
  return total > 0 && paid >= total;
};

/* ─────────────── Display status (source of truth) ───────────────
   กติกา:
   - ถ้ามีสลิปใหม่หรือกำลังตรวจ → "payment review"
   - approved + fully paid → "payment"
   - rejected → "confirmed" (ให้เจ้าของอัปโหลดใหม่)
   - cancelled/completed → ตามจริง
   - unpaid/pending payment → "confirmed" (อนุมัติแล้วแต่ยังไม่จ่าย)
   - ถ้าไม่เข้าเงื่อนไข → fallback backend/StatusName
*/
export function getDisplayStatus(b: BookingAny): BookingDisplayStatus {
  const baseDisp = ((b?.DisplayStatus ?? "") as string).trim().toLowerCase();
  const statusName = (b?.StatusName || "").trim().toLowerCase();
  const pay = normalizePaymentStatus(b?.Payment?.Status ?? b?.Payment?.status);

  // hard states
  if (statusName === "cancelled") return "cancelled";
  if (statusName === "completed") return "completed";

  // payment-driven overrides
  if (pay === "pending verification" || (!pay && hasSlip(b))) return "payment review";
  if (pay === "approved" && isFullyPaid(b)) return "payment";
  if (pay === "rejected") return "confirmed";
  if (pay === "unpaid" || pay === "pending payment") return "confirmed";

  // trusted backend value if known
  const known = new Set<BookingDisplayStatus>(["pending","confirmed","payment review","payment","completed","cancelled","unknown"]);
  if (baseDisp && known.has(baseDisp as BookingDisplayStatus)) {
    return baseDisp as BookingDisplayStatus;
  }

  // fallback by StatusName
  if (statusName === "pending") return "pending";
  if (statusName === "confirmed") return "confirmed";

  return "unknown";
}

/* ─────────────── NextAction (primary) ─────────────── */
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

export function getNextAction(row: BookingAny): NextAction | null {
  const disp = getDisplayStatus(row);
  const pay = normalizePaymentStatus(row?.Payment?.Status ?? row?.Payment?.status);

  switch (disp) {
    case "pending":
      return { key: "approve", label: "Approve", icon: Check };
    case "payment review":
      // แอดมินเข้าไปรีวิวสลิป (approve/reject อยู่ในหน้ารีวิว)
      return { key: "approvePayment", label: "Review Payment", icon: Book };
    case "payment":
      // จ่ายครบแล้ว → ปิดงาน
      return { key: "complete", label: "Finish Booking", icon: CheckCircle };
    case "confirmed":
      // เผื่อเข้ามาตอนยังไม่เปลี่ยน display status แต่ payment approved แล้ว
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
