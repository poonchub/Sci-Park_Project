import { useState } from "react";
import { Button, Menu, MenuItem } from "@mui/material";
import { Check, X } from "lucide-react";

interface FinishActionButtonProps {
  row: any;
  onComplete: (row: any) => void;
  onRefund: (row: any) => void;
}

export default function FinishActionButton({ row, onComplete, onRefund }: FinishActionButtonProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => setAnchorEl(null);

  const bookingStatus = (row.StatusName || "").toLowerCase().trim();
  const paymentStatus = (row.Payment?.status || "").toLowerCase().trim();

  // ❌ แสดงปุ่มเฉพาะ Booking ที่ confirmed + paid เท่านั้น
  if (!(bookingStatus === "confirmed" && paymentStatus === "paid")) return null;

  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClick}>
        Finish Booking
      </Button>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        <MenuItem
          onClick={() => {
            handleClose();
            onComplete(row);
          }}
        >
          <Check size={16} style={{ marginRight: 8 }} /> Complete Booking
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            onRefund(row);
          }}
        >
          <X size={16} style={{ marginRight: 8, color: "red" }} /> Refund
        </MenuItem>
      </Menu>
    </>
  );
}
