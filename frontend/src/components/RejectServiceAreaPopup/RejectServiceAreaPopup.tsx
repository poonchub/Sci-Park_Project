import React from "react";
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
} from "@mui/material";
import { X } from "lucide-react";

interface RejectServiceAreaPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (note: string) => void;
    companyName?: string;
    buttonActive?: boolean;
}

const RejectServiceAreaPopup: React.FC<RejectServiceAreaPopupProps> = ({
    open,
    onClose,
    onConfirm,
    companyName,
    buttonActive = false,
}) => {
    const [note, setNote] = React.useState("");

    const handleConfirm = () => {
        if (note.trim()) {
            onConfirm(note);
            setNote("");
        }
    };

    const handleClose = () => {
        setNote("");
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        minHeight: "300px",
                    },
                },
            }}
        >
            <DialogTitle
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    pb: 1,
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Reject Service Area Request
                </Typography>
                <Button
                    onClick={handleClose}
                    sx={{
                        minWidth: "auto",
                        p: 0.5,
                        color: "text.secondary",
                        "&:hover": {
                            backgroundColor: "action.hover",
                        },
                    }}
                >
                    <X size={20} />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ pb: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
                        Company: {companyName || "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Please provide a reason for rejecting this service area request.
                    </Typography>
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    label="Rejection Reason"
                    placeholder="Enter the reason for rejection..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    sx={{
                        "& .MuiOutlinedInput-root": {
                            borderRadius: 1,
                        },
                    }}
                />
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3 }}>
                <Button
                    onClick={handleClose}
                    variant="outlinedGray"
                    
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    variant="outlinedCancel"
                    disabled={!note.trim() || buttonActive}
                    
                >
                    {buttonActive ? "Rejecting..." : "Reject"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RejectServiceAreaPopup;
