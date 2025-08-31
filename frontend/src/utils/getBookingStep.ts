// src/utils/getBookingStep.ts
export type PaymentStatus =
  | "pending payment"
  | "pending verification"
  | "awaiting receipt"
  | "paid"
  | "refunded"
  | "rejected"
  | ""
  | undefined;

export const BOOKING_STEPS = [
  "Requested",
  "Approved",
  "Payment Review",
  "Payment",
  "Completed",
] as const;

export function getBookingActiveStep(statusName?: string, paymentStatus?: PaymentStatus) {
  const s = (statusName || "").toLowerCase().trim();
  const pay = (paymentStatus || "").toLowerCase().trim();

  // ❌ จองถูกยกเลิกหรือสลิปถูกปฏิเสธ
  if (s === "cancelled" || pay === "rejected") {
    return { active: 0, cancelled: true };
  }

  // ⏳ จองรออนุมัติ
  if (s === "pending") return { active: 0, cancelled: false }; // Requested

  if (s === "confirmed") {
    if (pay === "pending payment") {
      return { active: 1, cancelled: false }; // Approved (ยังไม่ได้อัพสลิป)
    }
    if (pay === "pending verification") {
      return { active: 2, cancelled: false }; // Payment Review
    }
    if (pay === "awaiting receipt" || pay === "paid" || pay === "refunded") {
      return { active: 3, cancelled: false }; // Payment
    }
    return { active: 1, cancelled: false }; // fallback = Approved
  }

  if (s === "completed") return { active: 4, cancelled: false }; // Completed

  return { active: 0, cancelled: false }; // fallback
}
