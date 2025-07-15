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
    Grid,
    Typography
} from "@mui/material";
import { TextField } from "../TextField/TextField";
import { useState } from "react";
import ImageUploader from "../ImageUploader/ImageUploader";

interface ReworkPopupProps {
    open: boolean;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: (note?: string) => void;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: "warning" | "error" | "success"; message: string }[]>>;
    title: string;
    message: string;
    showNoteField?: boolean;
    files: File[];
    onChangeFiles: (files: File[]) => void;
}

// Reusable confirmation dialog component
const ReworkPopup: React.FC<ReworkPopupProps> = ({
    open,
    setOpenConfirm,
    handleFunction,
    setAlerts,
    title,
    message,
    showNoteField,
    files,
    onChangeFiles,
}) => {

    const [note, setNote] = useState("");

    const handleConfirm = () => {
        handleFunction(note);
        setOpenConfirm(false);
        setNote("");
    };

    return (
        <Dialog open={open} onClose={() => setOpenConfirm(false)}>
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
                        fullWidth
                        placeholder="Enter reason"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        sx={{ mt: 2, mb: 2 }}
                    />
                )}

                <Box display={'flex'}>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>Attach image</Typography>
                    <Typography sx={{ fontWeight: 400, ml: 0.5, color: 'gray' }}>(maximum 3 files)</Typography>
                </Box>

                <Grid container spacing={1}>
                    <ImageUploader
                        value={files}
                        onChange={onChangeFiles}
                        setAlerts={setAlerts}
                        maxFiles={3}
                    />
                </Grid>
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
                >Cancel</Button>
                <Button
                    onClick={() => {
                        handleConfirm();
                        setOpenConfirm(false);
                    }}
                    variant="contained"
                    autoFocus
                >
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ReworkPopup;