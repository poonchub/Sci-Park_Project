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

interface ConfirmDialogProps {
    open: boolean;
    setOpenConfirm: React.Dispatch<React.SetStateAction<boolean>>;
    handleFunction: () => void;
    title: string;
    message: string;
}

// Reusable confirmation dialog component
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    open,
    setOpenConfirm,
    handleFunction,
    title,
    message
}) => {
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
            </DialogContent>

            {/* Action buttons */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenConfirm(false)}>ยกเลิก</Button>
                <Button
                    onClick={() => {
                        handleFunction();
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