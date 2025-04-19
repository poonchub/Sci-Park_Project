import React, { useState } from 'react';
import {
    Grid2, Dialog, DialogTitle, DialogContent, DialogActions,
    Button,
} from '@mui/material';
import { MaintenanceTasksInterface } from '../../interfaces/IMaintenanceTasks';
import ImageUploader from '../ImageUploader/ImageUploader';

interface SubmitPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedTask?: MaintenanceTasksInterface;
    setAlerts: React.Dispatch<React.SetStateAction<{ type: "warning" | "error" | "success"; message: string }[]>>;
    files: File[];
    onChange: (files: File[]) => void;
}

const SubmitPopup: React.FC<SubmitPopupProps> = ({
    open,
    onClose,
    onConfirm,
    selectedTask,
    setAlerts,
    files,
    onChange,
}) => {

    const request = selectedTask?.MaintenanceRequest

    return (
        <Dialog open={open} onClose={onClose} sx={{ zIndex: 999 }}>
            {/* Dialog title */}
            <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                ส่งงานซ่อม
            </DialogTitle>

            <DialogContent sx={{ minWidth: 500 }}>
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