// src/utils/paymentActions.ts

type UIPaymentStatus =
  | "unpaid"
  | "pending payment"
  | "pending verification"
  | "approved"
  | "rejected"
  | "refunded";

const normalizePaymentStatus = (s?: string): UIPaymentStatus | undefined => {
  const v = (s || "").trim().toLowerCase();
  if (!v) return undefined;
  if (v === "paid") return "approved";                 // compat
  if (v === "submitted") return "pending verification"; // compat
  if (["unpaid","pending payment","pending verification","approved","rejected","refunded"].includes(v)) {
    return v as UIPaymentStatus;
  }
  return undefined;
};

export const canUploadSlip = (status?: string) => {
  const s = normalizePaymentStatus(status);
  // ครั้งแรก/รอจ่าย/รอรีวิว/ถูกปัดตก → ให้อัปได้
  return s === "unpaid" || s === "pending payment" || s === "pending verification" || s === "rejected";
};

export const canUpdateSlip = (status?: string, hasSlip?: boolean) => {
  const s = normalizePaymentStatus(status);
  // มีสลิปแล้ว และอยู่ในช่วงรอรีวิว/ถูกปัดตก → แก้ไขได้
  return !!hasSlip && (s === "pending verification" || s === "rejected");
};
