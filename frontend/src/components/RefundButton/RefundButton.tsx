// src/components/RefundButton/RefundButton.tsx
import { Button } from "@mui/material";
import { useState } from "react";
import { RefundedBookingRoom } from "../../services/http";

interface RefundButtonProps {
  paymentId: number;
  onSuccess?: (res: any) => void;
  onError?: (err: any) => void;
}

export default function RefundButton({ paymentId, onSuccess, onError }: RefundButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    try {
      setLoading(true);
      const res = await RefundedBookingRoom({ paymentId }); // ✅ เรียก API Refund.ID }); // 🔗 เรียก API refund
      console.log("Refund result:", res);
      onSuccess?.(res);
    } catch (err) {
      console.error("Refund error:", err);
      onError?.(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="warning"
      size="small"
      disabled={loading}
      onClick={handleRefund}
    >
      {loading ? "Processing..." : "Refund"}
    </Button>
  );
}
