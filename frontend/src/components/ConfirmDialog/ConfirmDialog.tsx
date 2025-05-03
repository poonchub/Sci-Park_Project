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
import { useState } from "react";

interface ConfirmDialogProps {
    open: boolean;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: (note?: string) => void;
    title: string;
    message: string;
    showNoteField?: boolean;
}

// Reusable confirmation dialog component
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    setOpenConfirm,
    handleFunction,
    title,
    message,
    showNoteField
}) => {

    const [note, setNote] = useState("");

    const handleConfirm = () => {
        handleFunction(note);
        setOpenConfirm(false);
        setNote("");
    };

    return (
        <Dialog open={open} onClose={() => setOpenConfirm(false)} sx={{ zIndex: 999 }}>
            {/* Dialog title with warning icon */}
            <DialogTitle
                sx={{
                    display: 'flex',
                    gap: 1,
                    alignItems: 'center',
                    color: '#f26522'
                }}
            >
                <FontAwesomeIcon icon={faCircleExclamation} size="lg" />
                {title}
            </DialogTitle>

            {/* Message content (split into separate lines for readability) */}
            <DialogContent sx={{ minWidth: 500 }}>
                {message.split(' ').map((m, index) => (
                    <DialogContentText key={index} sx={{ color: '#000' }}>
                        {m}
                    </DialogContentText>
                ))}

                {showNoteField && (
                    <TextField
                        fullWidth
                        placeholder="ป้อนเหตุผล"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                )}
            </DialogContent>

            {/* Action buttons */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenConfirm(false)}>ยกเลิก</Button>
                <Button
                    onClick={() => {
                        handleConfirm();
                        setOpenConfirm(false);
                    }}
                    variant="contained"
                    autoFocus
                >
                    ตกลง
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;