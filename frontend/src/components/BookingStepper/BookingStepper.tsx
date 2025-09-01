// src/components/BookingStepper/BookingStepper.tsx
import { Card, CardContent } from "@mui/material";
import StepperComponent from "../Stepper/Stepper";
import {
  BOOKING_STEPS,          // ["Requested","Approved","Payment Review","Payment","Completed"]
  getBookingActiveStep,   // คืน { active, cancelled }
  PaymentStatus,          // "unpaid"|"submitted"|"paid"|"refunded"|undefined
} from "../../utils/getBookingStep";

type Props = {
  /** booking.StatusName: "pending" | "confirmed" | "completed" | "cancelled" | ... */
  statusName?: string;
  /** booking.Payment?.status: "unpaid" | "submitted" | "paid" | "refunded" */
  paymentStatus?: PaymentStatus;
};

export default function BookingStepper({ statusName, paymentStatus }: Props) {
  const { active, cancelled } = getBookingActiveStep(statusName, paymentStatus);

  // ถ้ายกเลิกให้โชว์สเต็ปเดียว "Cancelled" (หรือจะไม่โชว์ stepper ก็ได้)
  const steps = cancelled ? ["Cancelled"] : [...BOOKING_STEPS];

  // ถ้า cancelled เราไม่สน active (แสดงเป็นสเต็ปเดียว)
  const activeStep = cancelled ? 0 : Math.max(0, active);

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
          // ถ้า StepperComponent ของคุณรองรับ prop cancelled ให้ส่งต่อไปได้
          // cancelled={cancelled}
        />
      </CardContent>
    </Card>
  );
}
