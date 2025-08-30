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
                    sx={{
                        color: 'customBlue',
                        "&:hover": {
                            background: 'none',
                            boxShadow: 'none'
                        }
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={() => {
                        handleConfirm();
                        setOpenConfirm(false);
                    }}
                    variant="contained"
                    disabled={buttonActive}
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConfirmDialog;