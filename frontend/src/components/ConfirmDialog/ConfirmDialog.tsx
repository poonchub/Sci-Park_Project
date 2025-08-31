import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { useState, useEffect, useRef } from "react";

interface ConfirmDialogProps {
    open: boolean;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: (note?: string) => void;
    title: string;
    message: string;
    buttonActive: boolean;
    showNoteField?: boolean;
}

// Reusable confirmation dialog component
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    setOpenConfirm,
    handleFunction,
    title,
    message,
    buttonActive,
    showNoteField,
}) => {

    const [note, setNote] = useState("");
    
    // Ref สำหรับเก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
    const previousFocusRef = useRef<HTMLElement | null>(null);

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
        handleFunction(note);
        setOpenConfirm(false);
        setNote("");
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

                {showNoteField && (
                    <TextField
                        name="note"
                        fullWidth
                        placeholder="Enter reason"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ mt: 2 }}
                    />
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
                    disabled={buttonActive || (showNoteField && !note.trim())}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;