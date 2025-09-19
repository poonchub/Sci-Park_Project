// utils/bookingFlow.ts
import { Check, Book, CheckCircle } from "lucide-react";

/** สถานะชำระเงิน (ใช้ตัวพิมพ์เล็กเพื่อเข้ากับของเดิมในแอปนี้) */
export type UIPaymentStatus =
  | "unpaid"
  | "pending payment"
  | "pending verification"
  | "approved"
  | "rejected"
  | "refunded";

/** สถานะตาม Flow ใหม่ (canonical) */
export type BookingDisplayStatus =
  | "pending approved"   // รออนุมัติการจอง
  | "pending payment"    // อนุมัติแล้ว รอชำระ/รอส่งสลิป/รอตรวจสลิป
  | "partially paid"     // แผนมัดจำ: จ่ายบางงวดแล้ว แต่ยังไม่ครบ
  | "awaiting receipt"   // fully-paid แล้ว รอปิดงาน (ตาม BF)
  | "complete"           // ปิดงานแล้ว (BF เซ็ต)
  | "cancelled"
  | "unknown";

export type SlipPathType = string | string[] | { Path?: string }[];

export type BookingAny = {
  ID: number;
  StatusName?: string;                 // จาก BF: BookingStatus.StatusName
  DisplayStatus?: string;              // เผื่อค่าเก่า/compat
  Payment?: {
    Status?: string;
    status?: string;

    SlipPath?: SlipPathType;
    slipImages?: string[] | undefined; // compat
    SlipImages?: string[] | undefined; // compat

    ReceiptPath?: SlipPathType | null; // optional
    Amount?: number | undefined;
    PaymentDate?: string;
    Note?: string;
  };
  Payments?: Array<{
    ID?: number;
    Status?: { Name?: string; StatusName?: string } | string;
    SlipPath?: SlipPathType;
    ReceiptPath?: SlipPathType | null;
    Amount?: number | undefined;
    PaymentDate?: string;
  }>;
  Finance?: {
    TotalAmount?: number | undefined;
    PaidApproved?: number | undefined;
    IsFullyPaid?: boolean | undefined;
  };
  PaymentOption?: { OptionName?: string } | undefined; // "deposit" | "full"
};

/* -------------------------------
 * Normalizers
 * ------------------------------- */

const lower = (s?: string) => (s || "").trim().toLowerCase();

export const normalizePaymentStatus = (s?: string): UIPaymentStatus | undefined => {
  const v = lower(s);
  if (!v) return undefined;

  if (["paid", "approved", "success", "completed", "deposit paid"].includes(v)) return "approved";
  if (["submitted", "pending verification", "verifying", "waiting for verify"].includes(v)) return "pending verification";
  if (["unpaid", "pending payment", "awaiting payment", "overdue"].includes(v)) return "pending payment";
  if (v === "refunded") return "refunded";
  if (v === "rejected" || v === "failed") return "rejected";
  return undefined;
};

/** รองรับ path ได้หลายรูปแบบ → string เดียว (ถ้าไม่มีให้คืน "") */
export const asPathString = (v?: SlipPathType | null): string => {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) {
    const f = v[0] as any;
    if (!f) return "";
    if (typeof f === "string") return f;
    if (typeof f?.Path === "string") return f.Path;
  }
  return "";
};

export const statusNameOf = (p?: any) =>
  lower(
    typeof p?.Status === "string"
      ? p.Status
      : p?.Status?.Name ?? p?.Status?.StatusName ?? p?.status ?? p?.StatusName
  );

const isFullyPaid = (b?: Partial<BookingAny> | null) => {
  const f = b?.Finance ?? {};
  const total = Number(f?.TotalAmount ?? 0);
  const paid  = Number(f?.PaidApproved ?? 0);
  if (typeof f?.IsFullyPaid === "boolean") return f.IsFullyPaid;
  return total > 0 && paid >= total;
};

const isDepositPlan = (b?: Partial<BookingAny> | null) =>
  lower(b?.PaymentOption?.OptionName) === "deposit";

/** มีงวด “รอตรวจ” หรือ “มีสลิปแต่ยังไม่ approved/refunded” หรือไม่ */
const hasPendingVerificationOrSlip = (b?: Partial<BookingAny> | null) => {
  if (!b) return false;
  const pays = [
    ...(Array.isArray(b.Payments) ? b.Payments : []),
    ...(b.Payment ? [b.Payment] : []),
  ];

  return pays.some((p) => {
    const st = normalizePaymentStatus(
      typeof p?.Status === "string" ? p.Status : p?.Status?.Name ?? (p as any)?.StatusName
    );
    const hasSlip = !!asPathString((p as any)?.SlipPath);
    return st === "pending verification" || (hasSlip && st !== "approved" && st !== "refunded");
  });
};

/* ---------------------------------------
 * 1) ตัวใหม่: ใช้สถานะจาก BF เป็นหลัก
 * --------------------------------------- */
const ALIAS_TO_CANONICAL: Record<string, BookingDisplayStatus> = {
  // ชุดใหม่ตาม BF
  "pending approved": "pending approved",
  "pending payment": "pending payment",
  "partially paid": "partially paid",
  "awaiting receipt": "awaiting receipt",
  "complete": "complete",
  "cancelled": "cancelled",
  // ค่าเก่า/คำพ้อง
  "pending": "pending approved",
  "confirmed": "pending payment",
  "payment review": "pending payment",
  "payment": "pending payment",
  "completed": "complete",
  "awaiting_receipt": "awaiting receipt",
  "awaiting-receipt": "awaiting receipt",
};

export function flowFromBackend(b?: Partial<BookingAny> | null): BookingDisplayStatus {
  if (!b) return "unknown";

  // 1) พยายามอ่านจาก BF ก่อน (StatusName → DisplayStatus → คำขึ้นต้น)
  const raw =
    lower(b?.StatusName) ||
    lower(b?.DisplayStatus) ||
    "";

  const canon = ALIAS_TO_CANONICAL[raw];
  if (canon) return canon;

  // heuristic จากคำขึ้นต้น (กัน edge-case)
  if (raw.includes("cancel")) return "cancelled";
  if (raw.includes("complete")) return "complete";
  if (raw.includes("awaiting") && raw.includes("receipt")) return "awaiting receipt";
  if (raw.includes("partial")) return "partially paid";
  if (raw.includes("pending")) return "pending approved";
  if (raw.includes("payment")) return "pending payment";

  // 2) ถ้า BF ไม่ส่ง/ส่งค่าแปลก → อนุมานเบา ๆ (อย่า override BF)
  if (isFullyPaid(b)) {
    // ตามแผนใหม่: fully-paid แล้ว ฝั่ง BF จะเซ็ตเป็น Awaiting Receipt/Complete เอง
    return "awaiting receipt";
  }

  if (isDepositPlan(b)) {
    const pays = (b.Payments || []).concat((b.Payment ? [b.Payment] : []) as any);
    const hasApproved = pays.some((p: any) =>
      normalizePaymentStatus(typeof p?.Status === "string" ? p.Status : p?.Status?.Name) === "approved"
    );
    if (hasApproved) return "partially paid";
  }

  if (hasPendingVerificationOrSlip(b)) return "pending payment";

  return "pending payment";
}

/* ---------------------------------------
 * 2) ตัวเดิม (fallback ภายใน component เก่า)
 *    — ควรเลิกใช้ แล้วหันไปใช้ flowFromBackend
 * --------------------------------------- */
export function getDisplayStatus(b?: Partial<BookingAny> | null): BookingDisplayStatus {
  // เพื่อความเข้ากันได้เดิม: พยายามยึด BF ก่อน
  const fromBF = flowFromBackend(b);
  if (fromBF !== "unknown") return fromBF;
  return "pending payment";
}

/* -------------------------------
 * Next action (เฉพาะฝั่ง Admin)
 * ------------------------------- */
export type ActionKey =
  | "approve"         // อนุมัติ booking (Pending Approved -> Pending Payment)
  | "reject"
  | "refund"
  | "approvePayment"  // อนุมัติสลิป/การชำระ (งวดที่กำลังตรวจ)
  | "rejectPayment"
  | "complete";       // ปิดงาน (Awaiting Receipt -> Complete โดยผู้ดูแล)

export type NextAction = {
  key: ActionKey;
  label: string;
  icon: any;
  color?: "primary" | "inherit";
};

export function getNextAction(row?: Partial<BookingAny> | null): NextAction | null {
  if (!row) return null;
  const disp = flowFromBackend(row); // ✅ ยึด BF

  switch (disp) {
    case "pending approved":
      return { key: "approve", label: "Approve", icon: Check };

    case "pending payment":
      if (hasPendingVerificationOrSlip(row)) {
        return { key: "approvePayment", label: "Review Payment", icon: Book };
      }
      return null;

    case "partially paid":
      if (hasPendingVerificationOrSlip(row)) {
        return { key: "approvePayment", label: "Review Payment", icon: Book };
      }
      return null;

    case "awaiting receipt":
      return { key: "complete", label: "Finish Booking", icon: CheckCircle };

    case "complete":
    case "cancelled":
    case "unknown":
    default:
      return null;
  }
}
