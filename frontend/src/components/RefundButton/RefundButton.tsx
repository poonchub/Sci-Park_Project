// src/components/RefundButton/RefundButton.tsx
import { Button } from "@mui/material";
import { useState } from "react";
import { RefundedBookingRoom } from "../../services/http";

interface RefundButtonProps {
  paymentId: number;
  reason?: string;             // ✅ เพิ่ม
  cancelBooking?: boolean;     // ✅ ตัวเลือก
  onSuccess?: (res: any) => void;
  onError?: (err: any) => void;
}

export default function RefundButton({
  paymentId,
  reason = "",                // ✅ ดีฟอลต์ว่าง
  cancelBooking = true,       // ✅ ดีฟอลต์ true
  onSuccess,
  onError,
}: RefundButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRefund = async () => {
    try {
      setLoading(true);
      const res = await RefundedBookingRoom(paymentId, {
        reason,
        cancelBooking,
      });
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
