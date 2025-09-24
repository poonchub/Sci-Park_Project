import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Typography
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { useState, useEffect, useRef, useMemo } from "react";
import { GetNextRoomBookingInvoiceNumber } from "../../services/http";
import { HelpCircle, UserRound, Wallet2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  bookingRoomData: any;
  setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  handleFunction: (invoiceNumber?: string, specialDiscountAmount?: number) => void; // ← ส่งเฉพาะ "ส่วนลดพิเศษ"
  title: string;
  buttonActive: boolean;
  showInvoiceNumberField?: boolean;
}

type FormErrors = {
  InvoiceNumber?: string;
  SpecialDiscountAmount?: string;
};

const ConfirmDialogRoomBookingInvoice: React.FC<ConfirmDialogProps> = ({
  open,
  bookingRoomData,
  setOpenConfirm,
  handleFunction,
  title,
  buttonActive,
  showInvoiceNumberField,
}) => {
  const [invocieNumber, setInvoiceNumber] = useState("");
  const [specialDiscountAmount, setSpecialDiscountAmount] = useState<number | string>(0);
  const [errors, setErrors] = useState<FormErrors>({});

  // focus management
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ===== คำนวณฐานราคา/ส่วนลดเดิมแบบปลอดภัย =====
  const pricing = useMemo(() => {
    const baseTotal =
      Number(
        bookingRoomData?.BaseTotal ??
        bookingRoomData?.Finance?.BaseTotal ??
        ((bookingRoomData?.Finance?.TotalAmount ?? 0) + (bookingRoomData?.Finance?.DiscountAmount ?? 0))
      ) || 0;

    const privilegeDiscount =
      Number(bookingRoomData?.DiscountAmount ?? bookingRoomData?.Finance?.DiscountAmount ?? 0) || 0;

    const maxSpecial = Math.max(0, baseTotal - privilegeDiscount);

    const special = Math.max(0, Math.min(Number(specialDiscountAmount || 0), maxSpecial));

    const totalAmount = Math.max(0, baseTotal - (privilegeDiscount + special));

    return { baseTotal, privilegeDiscount, maxSpecial, special, totalAmount };
  }, [bookingRoomData, specialDiscountAmount]);

  const getInvoiceNumber = async () => {
    try {
      const resInvoice = await GetNextRoomBookingInvoiceNumber();
      if (resInvoice) {
        setInvoiceNumber(resInvoice.next_invoice_number);
      }
    } catch (error) {
      console.error("Error fetching invoice number:", error);
    }
  };

  useEffect(() => {
    getInvoiceNumber();
  }, []);

  // focus management เพื่อกัน aria-hidden warning
  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    } else {
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        setTimeout(() => previousFocusRef.current?.focus(), 0);
      }
    }
  }, [open]);

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (showInvoiceNumberField && (!invocieNumber || !invocieNumber.trim())) {
      newErrors.InvoiceNumber = "Please enter invoice number.";
    }
    if (specialDiscountAmount === null || specialDiscountAmount === undefined || specialDiscountAmount === "") {
      newErrors.SpecialDiscountAmount = "Please enter special discount amount.";
    } else if (Number(specialDiscountAmount) < 0) {
      newErrors.SpecialDiscountAmount = "Special discount amount cannot be negative.";
    } else if (Number(specialDiscountAmount) > pricing.maxSpecial) {
      newErrors.SpecialDiscountAmount = `Special discount cannot exceed ฿${pricing.maxSpecial.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;
    // ✅ ส่ง "ส่วนลดพิเศษ" เท่านั้น — ฝั่ง approve จะรวมกับ privilege เอง
    handleFunction(invocieNumber, Number(specialDiscountAmount || 0));
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpenConfirm(false)}
      disableRestoreFocus
      keepMounted={false}
      disableEnforceFocus
      disableAutoFocus
    >
      <DialogTitle
        sx={{
          display: "flex",
          fontWeight: 700,
          color: "primary.main",
          justifyContent: "center",
          alignItems: "center",
          gap: 0.6,
        }}
      >
        <HelpCircle size={22} strokeWidth={2.5} style={{ minWidth: "22px", minHeight: "22px" }} />
        {title}
      </DialogTitle>

      <DialogContent sx={{ minWidth: 500 }}>
        <Grid container spacing={1.5}>
          <Grid
            container
            size={{ xs: 12 }}
            sx={{ border: "1px solid #C5C5C6", py: 1.6, px: 2, borderRadius: 2 }}
            spacing={2}
          >
            {showInvoiceNumberField && (
              <Grid size={{ xs: 12 }}>
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                    Invoice Number
                  </Typography>
                  <TextField
                    name="Invoice Number"
                    fullWidth
                    placeholder="Enter invoice number"
                    value={invocieNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    error={!!errors.InvoiceNumber}
                    helperText={errors.InvoiceNumber}
                  />
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                  Special Discount Amount (Optional)
                </Typography>
                <TextField
                  type="number"
                  fullWidth
                  variant="outlined"
                  name="Amount"
                  value={specialDiscountAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") {
                      setSpecialDiscountAmount("");
                      return;
                    }
                    let num = Number(v);
                    if (!Number.isFinite(num)) num = 0;
                    if (num < 0) num = 0;
                    if (num > pricing.maxSpecial) num = pricing.maxSpecial;
                    setSpecialDiscountAmount(num);
                  }}
                  placeholder="Enter special discount amount."
                  error={!!errors.SpecialDiscountAmount}
                  helperText={errors.SpecialDiscountAmount}
                  slotProps={{
                    htmlInput: {
                      step: "100",
                      min: 0,
                      max: pricing.maxSpecial,
                    } as any,
                  }}
                />
              </Box>
            </Grid>
          </Grid>

          <Grid
            container
            sx={{ border: "1px solid #C5C5C6", py: 1.6, px: 2, borderRadius: 2 }}
            spacing={1}
          >
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 1.2 }}>
                <UserRound size={16} style={{ minWidth: "16px", minHeight: "16px" }} />
                <Typography variant="body1" fontWeight={600}>
                  Requester
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {`${bookingRoomData?.User?.FirstName || ""} ${bookingRoomData?.User?.LastName || ""} - ${bookingRoomData?.User?.CompanyName || ""}`}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" color="text.secondary">
                  {`${bookingRoomData?.Purpose || ""}`}
                </Typography>
              </Box>
            </Grid>

            <Divider sx={{ width: "100%", my: 1.5 }} />

            <Box sx={{ display: "flex", gap: 1, alignItems: "center", mb: 0.8 }}>
              <Wallet2 size={16} style={{ minWidth: "16px", minHeight: "16px" }} />
              <Typography variant="body1" fontWeight={600}>
                Pricing Summary
              </Typography>
            </Box>

            {/* Full Price (BaseTotal) */}
            <Grid size={{ xs: 12 }} container sx={{ justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  Full Price
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {pricing.baseTotal.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>

            {/* Privilege Discount (ระบบคำนวณไว้แล้ว) */}
            <Grid size={{ xs: 12 }} container sx={{ justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  Privilege Discount
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {pricing.privilegeDiscount.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>

            {/* Special Discount (ที่ผู้อนุมัติใส่) */}
            <Grid size={{ xs: 12 }} container sx={{ justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  Special Discount
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {pricing.special.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>

            <Divider sx={{ width: "100%", my: 0.6 }} />

            {/* Total Amount = Base − (Privilege + Special) */}
            <Grid size={{ xs: 12 }} container sx={{ justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Typography variant="body1" fontWeight={600}>
                  Total Amount
                </Typography>
              </Box>
              <Box>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {pricing.totalAmount.toLocaleString("th-TH", {
                    style: "currency",
                    currency: "THB",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => setOpenConfirm(false)} variant="outlinedGray">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          disabled={buttonActive || (showInvoiceNumberField && !invocieNumber.trim())}
        >
          {buttonActive ? "Loading..." : "Confirm"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialogRoomBookingInvoice;
