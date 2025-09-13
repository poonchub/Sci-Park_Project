import type { LucideIcon } from "lucide-react";
import { HandCoins, Wallet } from "lucide-react";
import { toLogicStatus } from "./paymentStatusAdapter";

// type แถวที่ใช้จริงพอประมาณ (ไม่ต้องครบทุก field)
export type BookingRowLite = {
  StatusName?: string; // pending / confirmed / completed / cancelled
  User?: { ID?: number };
  Payment?: {
    Status?: string;     // "Approved" | "Pending Payment" | ...
    status?: string;     // บางหน้าส่งเป็นตัวเล็ก
    slipImages?: string[]; // ถ้ามีสลิปที่ front เก็บไว้แบบ array
    SlipPath?: string | string[]; // กรณีอื่น ๆ
  };
};

export type PrimaryButton = {
  show: boolean;
  label?: string;
  icon?: LucideIcon;
  tooltip?: string;
};

/**
 * กำหนดปุ่มหลักใน cell ตามกติกา:
 * - Owner เท่านั้นถึงเห็นปุ่ม action
 * - cancelled/completed -> ไม่โชว์
 * - unpaid/pending_payment/rejected -> "Pay Now" (เปิด popup อัปสลิป)
 * - pending_verification -> ถ้ามีสลิปแล้ว "View Slip" (ดู) ถ้ายังไม่มี "Upload Slip"
 * - approved/awaiting_receipt/refunded -> "View Slip"
 */
export function getPaymentPrimaryButton(
  row: BookingRowLite,
  isOwner: boolean
): PrimaryButton {
  const booking = (row.StatusName || "").trim().toLowerCase();
  if (booking === "cancelled" || booking === "completed") {
    return { show: false };
  }
  if (!isOwner) {
    // ไม่ใช่เจ้าของ: ให้ดูสลิปได้ถ้ามีสลิปหรือจ่ายผ่านแล้ว
    const logic = toLogicStatus(row.Payment?.Status ?? row.Payment?.status);
    const hasSlip = getHasSlip(row);
    if (hasSlip || ["approved", "awaiting_receipt", "refunded", "pending_verification"].includes(logic)) {
      return { show: true, label: "View Slip", icon: Wallet, tooltip: "View uploaded slip" };
    }
    return { show: false };
  }

  // เจ้าของ
  const logic = toLogicStatus(row.Payment?.Status ?? row.Payment?.status);
  const hasSlip = getHasSlip(row);

  if (["unpaid", "pending_payment", "rejected"].includes(logic)) {
    return { show: true, label: "Pay Now", icon: HandCoins, tooltip: "แนบสลิป/ชำระเงิน" };
  }
  if (logic === "pending_verification") {
    return hasSlip
      ? { show: true, label: "View Slip", icon: Wallet, tooltip: "รอตรวจสอบสลิป" }
      : { show: true, label: "Upload Slip", icon: HandCoins, tooltip: "แนบสลิปเพื่อส่งตรวจ" };
  }
  if (["approved", "awaiting_receipt", "refunded"].includes(logic)) {
    return { show: true, label: "View Slip", icon: Wallet, tooltip: "ดูสลิปที่แนบ" };
  }
  return { show: false };
}

function getHasSlip(row: BookingRowLite) {
  const p = row.Payment;
  if (!p) return false;
  if (Array.isArray(p.slipImages)) return p.slipImages.length > 0;
  if (Array.isArray(p.SlipPath)) return p.SlipPath.length > 0;
  if (typeof p.SlipPath === "string") return p.SlipPath.trim() !== "";
  return false;
}
