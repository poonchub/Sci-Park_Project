import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import {
  BOOKING_STEPS,          // ["Requested","Approved","Payment Review","Payment","Completed"]
  getBookingActiveStep,   // (statusName) => { active, cancelled }
} from "../../utils/getBookingStep";

// สถานะชำระเงินที่ UI ใช้งาน (ตรงกับ backend normalize แล้ว)
export type UIPaymentStatus =
  | "unpaid"
  | "pending payment"
  | "pending verification"
  | "approved"
  | "rejected"
  | "refunded";

type Props = {
  statusName: string | undefined;  // สถานะ booking (Requested/Approved/Completed/Cancelled...)
  paymentStatus?: string;          // รับเป็น string แล้วค่อย normalize ภายใน
};

// helper: normalize payment status ให้เข้าชุดเดียวกัน
const normalizePaymentStatus = (s?: string): UIPaymentStatus | undefined => {
  const v = (s || "").trim().toLowerCase();
  if (!v) return undefined;
  if (v === "paid") return "approved";           // backward-compat
  if (v === "submitted") return "pending verification"; // backward-compat
  if (["unpaid","pending payment","pending verification","approved","rejected","refunded"].includes(v)) {
    return v as UIPaymentStatus;
  }
  return undefined;
};

export default function BookingStepper({ statusName, paymentStatus }: Props) {
  const { active: baseActive, cancelled } = getBookingActiveStep(statusName);
  const steps = cancelled ? ["Cancelled"] : [...BOOKING_STEPS];

  const idxOf = (needle: string) =>
    steps.findIndex((s) => s.trim().toLowerCase() === needle.trim().toLowerCase());
  const idxIncludes = (needle: string) =>
    steps.findIndex((s) => s.trim().toLowerCase().includes(needle.trim().toLowerCase()));

  const idxApproved       = idxOf("approved");
  const idxPaymentReview  = idxOf("payment review") !== -1 ? idxOf("payment review") : idxIncludes("payment review");
  const idxPayment        = idxOf("payment");
  const idxCompleted      = idxOf("completed");

  let activeStep = cancelled ? 0 : Math.max(0, baseActive);

  if (!cancelled) {
    const ps = normalizePaymentStatus(paymentStatus);
    const isCompletedStage = statusName?.toLowerCase() === "completed" || activeStep === idxCompleted;

    if (!isCompletedStage && ps) {
      if ((ps === "pending verification" || ps === "rejected") && idxPaymentReview !== -1) {
        // ส่งสลิป/แก้สลิปรอรีวิว
        activeStep = Math.max(activeStep, idxPaymentReview);
      } else if ((ps === "approved" || ps === "refunded") && idxPayment !== -1) {
        // อนุมัติเงินแล้ว/คืนเงินแล้ว
        activeStep = Math.max(activeStep, idxPayment);
      } else if ((ps === "unpaid" || ps === "pending payment") && idxApproved !== -1) {
        // อนุมัติจองแล้วแต่ยังไม่จ่าย
        activeStep = Math.max(activeStep, idxApproved);
      }
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
