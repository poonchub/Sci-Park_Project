// src/components/BookingStepper/BookingStepper.tsx
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import {
  BOOKING_STEPS,          // e.g. ["Requested","Approved","Payment Review","Payment","Completed"]
  getBookingActiveStep,   // (statusName) => { active, cancelled }
} from "../../utils/getBookingStep";

// สถานะการจ่ายที่สเต็ปเปอร์รองรับ
export type PaymentStatus =
  | "paid"
  | "submitted"
  | "refunded"
  | "pending verification"
  | "pending payment";

type Props = {
  statusName: string | undefined;
  paymentStatus?: PaymentStatus; // ทำให้ optional เพื่อความยืดหยุ่น
};

export default function BookingStepper({ statusName, paymentStatus }: Props) {
  // base active/cancelled จากสถานะ booking (requested/approved/cancelled/completed)
  const { active: baseActive, cancelled } = getBookingActiveStep(statusName);

  // ถ้ายกเลิก โชว์สเต็ปเดียว
  const steps = cancelled ? ["Cancelled"] : [...BOOKING_STEPS];

  // helper หา index ตามชื่อ (ไม่พึ่งตำแหน่งตายตัว 100%)
  const idxOf = (needle: string) =>
    steps.findIndex((s) => s.trim().toLowerCase() === needle.trim().toLowerCase());
  const idxIncludes = (needle: string) =>
    steps.findIndex((s) => s.trim().toLowerCase().includes(needle.trim().toLowerCase()));

  // index ที่น่าจะมีใน flow นี้
  const idxRequested = idxOf("requested");
  const idxApproved = idxOf("approved");
  const idxPaymentReview =
    idxOf("payment review") !== -1 ? idxOf("payment review") : idxIncludes("payment review");
  const idxPayment = idxOf("payment");
  const idxCompleted = idxOf("completed");

  let activeStep = cancelled ? 0 : Math.max(0, baseActive);

  // ถ้าไม่ cancelled ให้พิจารณาสถานะการจ่ายเงินมาช่วย “ขยับ” active step
  if (!cancelled && paymentStatus) {
    const ps = paymentStatus.toLowerCase() as PaymentStatus;

    // กรณี booking ยังไม่ completed ให้ปรับตาม payment
    const isCompletedStage = statusName?.toLowerCase() === "completed" || activeStep === idxCompleted;

    if (!isCompletedStage) {
      if ((ps === "submitted" || ps === "pending verification") && idxPaymentReview !== -1) {
        // ส่งสลิปแล้ว/รอตรวจ → ไปอยู่สเต็ป Payment Review
        activeStep = Math.max(activeStep, idxPaymentReview);
      } else if ((ps === "paid" || ps === "refunded") && idxPayment !== -1) {
        // จ่ายแล้ว/คืนเงินแล้ว → ไปอยู่สเต็ป Payment
        activeStep = Math.max(activeStep, idxPayment);
      } else if (ps === "pending payment" && idxApproved !== -1) {
        // อนุมัติแล้วแต่ยังไม่จ่าย → อย่างน้อยต้องไม่ต่ำกว่า Approved
        activeStep = Math.max(activeStep, idxApproved);
      }
    }
  }

  return (
    <Card
      sx={{
        width: "100%",
        borderRadius: 2,
        height: "100%",
        alignItems: "center",
        display: "flex",
      }}
    >
      <CardContent sx={{ p: "16px 24px", width: "100%", overflow: "auto" }}>
        <StepperComponent
          steps={steps}
          activeStep={activeStep}
          // ถ้า StepperComponent ของคุณรองรับ prop cancelled สามารถส่งต่อค่าได้ เช่น:
          // cancelled={cancelled}
        />
      </CardContent>
    </Card>
  );
}
