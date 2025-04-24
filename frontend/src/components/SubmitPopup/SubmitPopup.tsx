import React from 'react';
import {
    Grid2, Dialog, DialogTitle, DialogContent, DialogActions,
    Button,
    Typography,
    Box,
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
        <Dialog open={open} onClose={onClose} sx={{ zIndex: 999 }}>
            {/* Dialog title */}
            <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                ส่งงานซ่อม
            </DialogTitle>

            <DialogContent sx={{ minWidth: 500 }}>
                <Box display={'flex'}>
                    <Typography sx={{ fontWeight: 500, mb: 1 }}>แนบภาพประกอบ</Typography>
                    <Typography sx={{ fontWeight: 400, ml: 0.5, color: 'gray' }}>(สูงสุด 3 ไฟล์)</Typography>
                </Box>
                
                <Grid2 container spacing={1}>
                    <ImageUploader
                        value={files}
                        onChange={onChange}
                        setAlerts={setAlerts}
                        maxFiles={3}
                    />
                </Grid2>
            </DialogContent>

            {/* Confirm/Cancel buttons */}
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant='text' onClick={onClose}>ยกเลิก</Button>
                <Button variant="contained" onClick={onConfirm}>ยืนยัน</Button>
            </DialogActions>
        </Dialog>
    );
};

export default SubmitPopup;