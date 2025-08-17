import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button,
    Typography,
    Box,
    Grid,
} from '@mui/material';
import ImageUploader from '../ImageUploader/ImageUploader';

interface SubmitPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: "warning" | "error" | "success"; message: string }[]>>;
    files: File[];
    onChange: (files: File[]) => void;
}

const SubmitPopup: React.FC<SubmitPopupProps> = ({
    open,
    onClose,
    onConfirm,
    setAlerts,
    files,
    onChange,
}) => {

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth={false}
            sx={{
                '& .MuiDialog-paper': {
                    minWidth: '350px',
                    maxWidth: '1000px',
                    width: {xs: "90vw",sm: "70vw",md: "60vw", lg: '50vw'},
                    margin: 0,
                    borderRadius: 0,
                },
            }}
        >
            {/* Dialog title */}
            <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                Submit Maintenance Work
            </DialogTitle>

            <DialogContent >
                <Box display={'flex'}>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>Attach image</Typography>
                    <Typography sx={{ fontWeight: 400, ml: 0.5, color: 'text.secondary' }}>(maximum 3 files)</Typography>
                </Box>

                <Grid container spacing={1}>
                    <ImageUploader
                        value={files}
                        onChange={onChange}
                        setAlerts={setAlerts}
                        maxFiles={3}
                        buttonText='Click to select image files'
                    />
                </Grid>
            </DialogContent>

            {/* Confirm/Cancel buttons */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant='text'
                    onClick={onClose}
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
                <Button variant="contained" onClick={onConfirm}>Confirm</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmitPopup;