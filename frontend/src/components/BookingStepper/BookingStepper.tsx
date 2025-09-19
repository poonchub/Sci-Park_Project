import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import {
  BOOKING_STEPS,          // อัปเดตแล้วตามไฟล์ util ใหม่
  getBookingActiveStep,   // อัปเดตแล้ว
} from "../../utils/getBookingStep";

// สถานะชำระเงินที่ UI ใช้แบบ canonical (Title Case)
export type UIPaymentStatus =
  | "Awaiting payment"
  | "Pending verification"
  | "Paid"
  | "Rejected"
  | "Refunded";

type Props = {
  statusName?: string;                 // สถานะ booking
  paymentStatus?: string;              // สถานะจ่ายล่าสุด (optional)
  plan?: "deposit" | "full";           // แผนการจ่าย (optional; ถ้า "full" จะข้าม Partially Paid)
};

// normalize payment status จากค่าที่มาหลากหลาย -> Title Case เดียว
const normalizePaymentStatus = (raw?: string): UIPaymentStatus | undefined => {
  const v = (raw || "").trim().toLowerCase();
  if (!v) return undefined;
  if (["awaiting payment", "pending payment", "unpaid", "overdue"].includes(v)) return "Awaiting payment";
  if (["pending verification", "submitted", "verifying", "waiting for verify"].includes(v)) return "Pending verification";
  if (["paid", "approved", "success", "completed", "deposit paid"].includes(v)) return "Paid";
  if (["rejected", "failed"].includes(v)) return "Rejected";
  if (v === "refunded") return "Refunded";
  return undefined;
};

export default function BookingStepper({ statusName, paymentStatus, plan }: Props) {
  const { active: baseActive, cancelled } = getBookingActiveStep(statusName);

  // steps: ยกเลิก = แสดง “Cancelled” อย่างเดียว, ปกติ = ใช้ BOOKING_STEPS
  const stepsAll = cancelled
    ? ["Cancelled"]
    : [...BOOKING_STEPS];

  // ถ้าเป็น full → ข้าม "Partially Paid"
  const steps =
    !cancelled && plan === "full"
      ? stepsAll.filter((s) => s !== "Partially Paid")
      : stepsAll;

  // map active เดิมให้เข้ากับ steps ที่ถูกกรอง (กรณี full)
  const indexOfStep = (label: string) =>
    steps.findIndex((s) => s.trim().toLowerCase() === label.trim().toLowerCase());

  let activeStep = cancelled ? 0 : Math.max(0, indexOfStep(BOOKING_STEPS[Math.min(baseActive, BOOKING_STEPS.length - 1)]));

  // ใช้ paymentStatus เป็นตัว "ดัน" ขั้นตอนขึ้นเล็กน้อย (ขณะ backend ยังไม่อัปเดตสถานะ Booking)
  if (!cancelled) {
    const ps = normalizePaymentStatus(paymentStatus);
    // ถ้าเพิ่งอัปสลิป → ยังถือว่าอยู่ "Pending Payment" (ไม่มี Payment Review แล้ว)
    if (ps === "Pending verification") {
      const idx = indexOfStep("Pending Payment");
      activeStep = Math.max(activeStep, idx === -1 ? activeStep : idx);
    }
    // ถ้าอนุมัติจ่ายแล้ว
    if (ps === "Paid") {
      // deposit: อาจไป "Partially Paid" หรือ "Awaiting Receipt" → ให้ดันไปจนถึงสถานะ booking ปัจจุบันอยู่แล้ว
      // full: ไม่มี "Partially Paid" → ดันได้อย่างน้อยถึง "Awaiting Receipt"
      const target = plan === "full" ? "Awaiting Receipt" : (statusName || "");
      const idx = indexOfStep(target) >= 0 ? indexOfStep(target) : indexOfStep("Awaiting Receipt");
      activeStep = Math.max(activeStep, idx === -1 ? activeStep : idx);
    }
  }

  return (
    <Card sx={{ width: "100%", borderRadius: 2, height: "100%", alignItems: "center", display: "flex" }}>
      <CardContent sx={{ p: "16px 24px", width: "100%", overflow: "auto" }}>
        <StepperComponent steps={steps} activeStep={activeStep} />
      </CardContent>
    </Card>
  );
}
