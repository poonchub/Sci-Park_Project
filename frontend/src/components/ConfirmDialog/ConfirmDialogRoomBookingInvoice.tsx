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
import { useState, useEffect, useRef } from "react";
import { GetNextRoomBookingInvoiceNumber } from "../../services/http";
import { HelpCircle, UserRound, Wallet2 } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    bookingRoomData: any;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: (note?: string, discountAmount?: number) => void;
    title: string;
    buttonActive: boolean;
    showInvoiceNumberField?: boolean;
}

type FormErrors = {
    InvoiceNumber?: string;
    SpecialDiscountAmount?: string;
};

// Reusable confirmation dialog component
const ConfirmDialogRoomBookingInvoice: React.FC<ConfirmDialogProps> = ({
    open,
    bookingRoomData,
    setOpenConfirm,
    handleFunction,
    title,
    buttonActive,
    showInvoiceNumberField,
}) => {
    console.log("bookingRoomData: ", bookingRoomData)
    const [invocieNumber, setInvoiceNumber] = useState("");
    const [specialDiscountAmount, setSpecialDiscountAmount] = useState<number | string>(0);
    const [errors, setErrors] = useState<FormErrors>({});

    // Ref สำหรับเก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
    const previousFocusRef = useRef<HTMLElement | null>(null);

    const getInvoiceNumber = async () => {
        try {
            const resInvoice = await GetNextRoomBookingInvoiceNumber();
            if (resInvoice) {
                setInvoiceNumber(resInvoice.next_invoice_number)
            }
        } catch (error) {
            console.error("Error fetching invoice number:", error);
        }
    };

    useEffect(() => {
        getInvoiceNumber()
    }, [])

    // จัดการ focus management เพื่อป้องกัน aria-hidden warning
    useEffect(() => {
        if (open) {
            // เก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
            previousFocusRef.current = document.activeElement as HTMLElement;
        } else {
            // เมื่อ dialog ปิด ให้ return focus ไปยัง element เดิม
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                setTimeout(() => {
                    previousFocusRef.current?.focus();
                }, 0);
            }
        }
    }, [open]);

    const handleConfirm = () => {
        if (!validateForm()) {
            return;
        }
        const discountTotal = bookingRoomData.Finance.DiscountAmount + Number(specialDiscountAmount)
        handleFunction(invocieNumber, discountTotal);
    };

    const validateForm = () => {
        const newErrors: { [key: string]: any } = {};

        // Validate Invoice
        if (!invocieNumber || !invocieNumber.trim()) {
            newErrors.InvoiceNumber = "Please select the issue date.";
        }
        if (specialDiscountAmount === null || specialDiscountAmount === undefined || specialDiscountAmount === "") {
            newErrors.SpecialDiscountAmount = "Please enter special discountAmount.";
        } else if (Number(specialDiscountAmount) < 0) {
            newErrors.SpecialDiscountAmount = "Special discount amount cannot be negative.";
        }

        setErrors(newErrors);

        // Check if there are any errors
        const hasErrors =
            Object.keys(newErrors).length > 0
        return !hasErrors;
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
            {/* Dialog title with warning icon */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    fontWeight: 700,
                    color: 'primary.main',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 0.6
                }}
            >
                <HelpCircle size={22} strokeWidth={2.5} style={{ minWidth: '22px', minHeight: '22px'}}/>
                {title}
            </DialogTitle>

            {/* Message content (split into separate lines for readability) */}
            <DialogContent sx={{ minWidth: 500 }}>
                <Grid container spacing={1.5}>
                    <Grid container size={{ xs: 12 }} sx={{ border: '1px solid #C5C5C6', paddingY: 1.6, paddingX: 2, borderRadius: 2 }} spacing={2}>
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
                                        const value = e.target.value;
                                        const maxDiscount =
                                            (bookingRoomData?.Finance.TotalAmount || 0) -
                                            (bookingRoomData?.Finance.DiscountAmount || 0);

                                        // ถ้าว่างให้ set ""
                                        if (value === "") {
                                            setSpecialDiscountAmount("");
                                            return;
                                        }

                                        // แปลงเป็น number
                                        let numberValue = Number(value);

                                        // Clamp ค่าระหว่าง 0 ถึง maxDiscount
                                        if (numberValue < 0) numberValue = 0;
                                        if (numberValue > maxDiscount) numberValue = maxDiscount;

                                        setSpecialDiscountAmount(numberValue);
                                    }}
                                    placeholder="Enter special discount amount."
                                    error={!!errors.SpecialDiscountAmount}
                                    helperText={errors.SpecialDiscountAmount}
                                    slotProps={{
                                        htmlInput: {
                                            step: "500",
                                            min: 0,
                                            max: (bookingRoomData?.Finance.TotalAmount || 0) -
                                                (bookingRoomData?.Finance.DiscountAmount || 0),
                                        } as any,
                                    }}
                                />
                            </Box>
                        </Grid>
                    </Grid>

                    <Grid container sx={{ border: '1px solid #C5C5C6', paddingY: 1.6, paddingX: 2, borderRadius: 2 }} spacing={1}>
                        <Grid size={{ xs: 12 }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 1.2 }}>
                                <UserRound size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
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

                        <Divider sx={{ width: '100%', marginY: 1.5 }} />

                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', marginBottom: 0.8 }}>
                            <Wallet2 size={16} style={{ minWidth: '16px', minHeight: '16px' }} />
                            <Typography variant="body1" fontWeight={600}>
                                Pricing Summary
                            </Typography>
                        </Box>

                        <Grid size={{ xs: 12 }} container sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    Full Price
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {`${(bookingRoomData?.Finance.TotalAmount || 0).toLocaleString("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }} container sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    Privilege Discount
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {`${(bookingRoomData?.Finance.DiscountAmount || 0).toLocaleString("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`}
                                </Typography>
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }} container sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <Typography variant="body1" color="text.secondary">
                                    Special Discount
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {`${(specialDiscountAmount).toLocaleString("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`}
                                </Typography>
                            </Box>
                        </Grid>

                        <Divider sx={{ width: '100%', marginY: 0.6 }} />

                        <Grid size={{ xs: 12 }} container sx={{ justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {/* <UserRound size={16} style={{ minWidth: '16px', minHeight: '16px' }} /> */}
                                <Typography variant="body1" fontWeight={600}>
                                    Total Amount
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {`${((bookingRoomData?.Finance.TotalAmount || 0) - (bookingRoomData?.Finance.DiscountAmount || 0) - Number(specialDiscountAmount)).toLocaleString("th-TH", {
                                        style: "currency",
                                        currency: "THB",
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                    })}`}
                                </Typography>
                            </Box>
                        </Grid>

                    </Grid>
                </Grid>
            </DialogContent>

            {/* Action buttons */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={() => setOpenConfirm(false)}
                    variant="outlinedGray"

                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        handleConfirm();
                    }}
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