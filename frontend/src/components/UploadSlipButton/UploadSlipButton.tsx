// components/UploadSlipButton.tsx
import { Button } from "@mui/material";
import { SubmitPaymentSlip } from "../../services/http";

interface UploadSlipButtonProps {
  bookingId: number;
  payerId: number;
  onSuccess?: (res: any) => void;
  onError?: (err: any) => void;
}

export default function UploadSlipButton({ bookingId, payerId, onSuccess, onError }: UploadSlipButtonProps) {
  const handleFileChange = async (file: File) => {
    try {
      const res = await SubmitPaymentSlip(bookingId, file, {
        Amount: 1000, // 👈 เอาไปทำให้กรอกทีหลังได้
        Status: "Paid",
        PayerID: payerId,
        Note: "โอนจาก SCB",
        PaymentDate: new Date().toISOString(),
      });
      onSuccess?.(res);
    } catch (err) {
      onError?.(err);
    }
  };

  return (
    <Button component="label" variant="contained" color="primary">
      Upload Slip
      <input
        type="file"
        hidden
        accept="image/*"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            handleFileChange(e.target.files[0]);
          }
        }}
      />
    </Button>
  );
}
