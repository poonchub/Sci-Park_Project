// utils/getBookingStep.ts
export const BOOKING_STEPS = [
  "Pending Approved",
  "Pending Payment",
  "Partially Paid",
  "Awaiting Receipt",
  "Complete",
] as const;

export type BookingStep = typeof BOOKING_STEPS[number];

export function getBookingActiveStep(statusName?: string) {
  const s = (statusName || "").trim().toLowerCase();

  // ยกเลิก = สเตปพิเศษ
  if (s === "cancelled") {
    return { active: 0, cancelled: true };
  }

  // รองรับคำเก่า/ผิดสะกดเล็กน้อย
  const map: Record<string, number> = {
    "pending approved": 0,
    "pending payment": 1,
    "partially paid": 2,
    "awaiting receipt": 3,
    "complete": 4,
    "completed": 4, // backward-compat
  };

  return { active: map[s] ?? 0, cancelled: false };
}
