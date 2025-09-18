// utils/getBookingStep.ts
export const BOOKING_STEPS = ["Requested","Approved","Payment Review","Payment","Completed"] as const;

export function getBookingActiveStep(statusName?: string) {
  const s = (statusName || "").trim().toLowerCase();
  const cancelled = s.includes("cancel");
  if (cancelled) return { active: 0, cancelled: true };

  if (s.includes("complete")) return { active: 4, cancelled: false };           // Completed
  if (s.includes("payment review") || s.includes("review")) return { active: 2, cancelled: false };
  if (s.includes("payment") || s.includes("awaiting receipt")) return { active: 3, cancelled: false }; // Payment
  if (s.includes("approve") || s === "confirmed") return { active: 1, cancelled: false };

  return { active: 0, cancelled: false }; // Requested
}
