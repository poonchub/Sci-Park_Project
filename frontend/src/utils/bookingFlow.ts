import { Check, X, Book, CheckCircle } from "lucide-react";

export type PaymentStatus = "unpaid" | "submitted" | "pending verification" | "paid" | "refunded" | undefined;

export type BookingDisplayStatus =
  | "pending"
  | "confirmed"
  | "payment review"
  | "payment"
  | "completed"
  | "cancelled"
  | "unknown";

export function getDisplayStatus(b: any): BookingDisplayStatus {
  const s = (b?.StatusName || "").toLowerCase();
  const p = (b?.Payment?.status || "").toLowerCase() as PaymentStatus;

  if (s === "cancelled") return "cancelled";
  if (s === "completed") return "completed";

  if (s === "pending") return "pending";

  if (s === "confirmed") {
    // ✅ ตรงนี้สำคัญ — รวม payment status เข้ามา
    if (p === "submitted" || p === "pending verification") {
      return "payment review";
    }
    if (p === "paid" || p === "refunded") {
      return "payment";
    }
    return "confirmed"; // จองแล้วแต่ยังไม่ได้ส่งสลิป
  }

  return "unknown";
}


export type BookingAny = {
  ID: number;
  StatusName?: string;                 // pending | confirmed | completed | cancelled ...
  Payment?: { status?: PaymentStatus; slipImages?: string[] };
};

/** คีย์แอคชันมาตรฐานที่ปุ่มหลักจะสลับไปตาม flow */
export type ActionKey =
  | "approve"          // อนุมัติการจอง → Confirmed
  | "reject"           // ปฏิเสธการจอง → Cancelled(หรือ Rejected)
  | "refund"            // คืนเงิน
  | "approvePayment"   // อนุมัติเงิน → Payment(paid)
  | "rejectPayment"    // ไม่ผ่าน → กลับไป unpaid หรือ cancelled ตามนโยบาย
  | "complete";        // ปิดงาน → Completed

export type NextAction = {
  key: ActionKey;
  label: string;
  icon: any;
  color?: "primary" | "inherit";
};


// utils/bookingFlow.ts
// utils/bookingFlow.ts
export function getNextAction(row: any) {
  const status = (row.StatusName || "").toLowerCase();
  const pay = (row.Payment?.status || "").toLowerCase();

  if (status === "pending") {
    return { key: "approve", label: "Approve", icon: Check };
  }

  if (status === "confirmed") {
    if (pay === "submitted" || pay === "pending verification") {
      return { key: "approvePayment", label: "Review Payment", icon: Book };
    }
    if (pay === "paid") {
      return { key: "finish", label: "Finish Booking", icon: CheckCircle };
    }

    if (pay === "refunded") {
      return { key: "complete", label: "Complete Booking", icon: Check };
    }
    // ✅ ถ้าแค่ confirmed ธรรมดา → ยังไม่มีปุ่ม finish
    return null;
  }

  if (status === "completed" || status === "cancelled") {
    return null;
  }

  return null;
}



