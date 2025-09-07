import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Typography
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { useState, useEffect, useRef } from "react";
import { GetNextRoomBookingInvoiceNumber } from "../../services/http";

interface ConfirmDialogProps {
    open: boolean;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: (note?: string) => void;
    title: string;
    message: string;
    buttonActive: boolean;
    showInvoiceNumberField?: boolean;
}

// Reusable confirmation dialog component
const ConfirmDialogRoomBookingInvoice: React.FC<ConfirmDialogProps> = ({
    open,
    setOpenConfirm,
    handleFunction,
    title,
    message,
    buttonActive,
    showInvoiceNumberField,
}) => {

    const [invocieNumber, setInvoiceNumber] = useState("");
    
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

    useEffect(()=>{
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
        handleFunction(invocieNumber);
        setOpenConfirm(false);
        setInvoiceNumber("");
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
                    fontWeight: 700,
                    color: 'primary.main',
                    textAlign: 'center'
                }}
            >
                <FontAwesomeIcon icon={faCircleExclamation} size="lg" style={{ marginRight: '10px' }} />
                {title}
            </DialogTitle>

            {/* Message content (split into separate lines for readability) */}
            <DialogContent sx={{ minWidth: 500 }}>
                <DialogContentText sx={{ color: 'text.primary' }}>
                    {message}
                </DialogContentText>

                {showInvoiceNumberField && (
                    <Box sx={{ mt: 2 }}>
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
                    
                )}
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
                        setOpenConfirm(false);
                    }}
                    variant="contained"
                    disabled={buttonActive || (showInvoiceNumberField && !invocieNumber.trim())}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialogRoomBookingInvoice;