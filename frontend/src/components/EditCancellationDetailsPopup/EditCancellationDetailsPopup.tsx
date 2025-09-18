import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Divider,
} from '@mui/material';
import { TextField } from '../TextField/TextField';
import { TextArea } from '../TextField/TextArea';
import { Edit3, FileText, X } from 'lucide-react';
import AlertGroup from '../AlertGroup/AlertGroup';

interface CancellationDetailsData {
    PurposeOfCancellation: string;
    ProjectActivities: string;
    AnnualIncome: number;
    CancellationDocument?: File | null;
    BankAccountDocument?: File | null;
    RefundGuaranteeDocument?: File | null;
    // Existing file paths
    CancellationDocumentPath?: string;
    BankAccountDocumentPath?: string;
    RefundGuaranteeDocumentPath?: string;
}

interface EditCancellationDetailsPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: CancellationDetailsData) => void;
    existingData?: CancellationDetailsData;
    buttonActive?: boolean;
    userRole?: string;
}

const EditCancellationDetailsPopup: React.FC<EditCancellationDetailsPopupProps> = ({
    open,
    onClose,
    onConfirm,
    existingData,
    buttonActive = false,
    userRole = '',
}) => {
    const [formData, setFormData] = useState<CancellationDetailsData>({
        PurposeOfCancellation: '',
        ProjectActivities: '',
        AnnualIncome: 0,
        CancellationDocument: null,
        BankAccountDocument: null,
        RefundGuaranteeDocument: null,
        CancellationDocumentPath: '',
        BankAccountDocumentPath: '',
        RefundGuaranteeDocumentPath: '',
    });

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // Reset form when popup closes
    useEffect(() => {
        if (!open) {
            setFormData({
                PurposeOfCancellation: '',
                ProjectActivities: '',
                AnnualIncome: 0,
                CancellationDocument: null,
                BankAccountDocument: null,
                RefundGuaranteeDocument: null,
                CancellationDocumentPath: '',
                BankAccountDocumentPath: '',
                RefundGuaranteeDocumentPath: '',
            });
            setHasSubmitted(false);
            setAlerts([]);
        }
    }, [open]);

    // Initialize form data when popup opens
    useEffect(() => {
        if (open && existingData) {
            setFormData({
                PurposeOfCancellation: existingData.PurposeOfCancellation || '',
                ProjectActivities: existingData.ProjectActivities || '',
                AnnualIncome: existingData.AnnualIncome || 0,
                CancellationDocument: null,
                BankAccountDocument: null,
                RefundGuaranteeDocument: null,
                CancellationDocumentPath: existingData.CancellationDocumentPath || '',
                BankAccountDocumentPath: existingData.BankAccountDocumentPath || '',
                RefundGuaranteeDocumentPath: existingData.RefundGuaranteeDocumentPath || '',
            });
            setHasSubmitted(false);
            setAlerts([]);
        }
    }, [open, existingData]);

    const handleInputChange = (field: keyof CancellationDetailsData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (field: keyof CancellationDetailsData, file: File | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: file
        }));
    };

    const validateForm = (): boolean => {
        setAlerts([]);
        let isValid = true;

        if (!formData.PurposeOfCancellation.trim()) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please enter purpose of cancellation' 
            }]);
            isValid = false;
        }

        if (formData.AnnualIncome < 0) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Annual income must be a positive number' 
            }]);
            isValid = false;
        }

        return isValid;
    };

    const handleClose = () => {
        setFormData({
            PurposeOfCancellation: '',
            ProjectActivities: '',
            AnnualIncome: 0,
            CancellationDocument: null,
            BankAccountDocument: null,
            RefundGuaranteeDocument: null,
            CancellationDocumentPath: '',
            BankAccountDocumentPath: '',
            RefundGuaranteeDocumentPath: '',
        });
        setHasSubmitted(false);
        setAlerts([]);
        onClose();
    };

    const handleConfirm = () => {
        setHasSubmitted(true);
        if (validateForm()) {
            onConfirm(formData);
        }
    };

    const renderFileUpload = (field: keyof CancellationDetailsData, label: string) => {
        const fileValue = formData[field] as File | null;
        const pathValue = formData[`${field}Path` as keyof CancellationDetailsData] as string;

        return (
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {label}
                </Typography>
                
                {/* File display area */}
                <Box sx={{ 
                    border: "2px dashed #0094DE",
                    borderRadius: 2,
                    px: 1.8,
                    py: 2,
                    textAlign: "center",
                    backgroundColor: "rgba(0, 162, 255, 0.1)",
                    minHeight: 80,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    {/* Existing file display */}
                    {pathValue && !fileValue && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            p: 1, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            mb: 1,
                            width: '100%',
                            maxWidth: '300px'
                        }}>
                            <FileText size={20} color="#0094DE" />
                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                {pathValue.split(/[/\\]/).pop()}
                            </Typography>
                        </Box>
                    )}

                    {/* New file display */}
                    {fileValue && (
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1, 
                            p: 1, 
                            border: '1px solid #e0e0e0', 
                            borderRadius: 1,
                            backgroundColor: '#fafafa',
                            mb: 1,
                            width: '100%',
                            maxWidth: '300px'
                        }}>
                            <FileText size={20} color="#0094DE" />
                            <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                                {fileValue.name}
                            </Typography>
                            <Button
                                size="small"
                                onClick={() => handleFileChange(field, null)}
                                sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                                <X size={16} />
                            </Button>
                        </Box>
                    )}

                    {/* Upload button */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleFileChange(field, e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                            id={`file-${field}`}
                        />
                        <label htmlFor={`file-${field}`}>
                            <Button
                                variant="contained"
                                component="span"
                                startIcon={<FileText size={20} />}
                                size="small"
                            >
                                {fileValue ? 'Change File' : pathValue ? 'Replace File' : 'Select File'}
                            </Button>
                        </label>
                    </Box>
                    
                    <Typography sx={{ fontSize: 13, color: 'gray', mt: 1 }}>
                        Supported file types: .pdf, .doc, .docx (Max size: 10MB)
                    </Typography>
                </Box>
            </Box>
        );
    };

    return (
        <>
            {/* Show Alerts */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth={false}
                disableRestoreFocus
                keepMounted={false}
                disableEnforceFocus
                disableAutoFocus
                sx={{
                    '& .MuiDialog-paper': {
                        minWidth: '600px',
                        maxWidth: '900px',
                        width: { xs: "95vw", sm: "80vw", md: "70vw" },
                        margin: 0,
                        borderRadius: 2,
                    },
                }}
            >
                {/* Dialog title */}
                <DialogTitle variant="titlePopup">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Edit3 size={20} color="#FF6B35" />
                        Edit Cancellation Details
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Grid container spacing={3} sx={{ px: { xs: 1, md: 3 }, py: { xs: 1, md: 2 } }}>
                        {/* Cancellation Information */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 2 }}>
                                Cancellation Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Purpose of Cancellation *
                            </Typography>
                            <TextArea
                                name="purposeOfCancellation"
                                value={formData.PurposeOfCancellation}
                                onChange={(e) => handleInputChange('PurposeOfCancellation', e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                error={hasSubmitted && !formData.PurposeOfCancellation.trim()}
                                helperText={hasSubmitted && !formData.PurposeOfCancellation.trim() ? 'Please enter purpose of cancellation' : ''}
                                disabled={buttonActive}
                                placeholder="Please describe the purpose of cancellation..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Project Activities
                            </Typography>
                            <TextArea
                                name="projectActivities"
                                value={formData.ProjectActivities}
                                onChange={(e) => handleInputChange('ProjectActivities', e.target.value)}
                                multiline
                                rows={3}
                                fullWidth
                                variant="outlined"
                                disabled={buttonActive}
                                placeholder="Please describe project activities..."
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Annual Income (฿)
                            </Typography>
                            <TextField
                                name="annualIncome"
                                type="number"
                                value={formData.AnnualIncome}
                                onChange={(e) => handleInputChange('AnnualIncome', parseFloat(e.target.value) || 0)}
                                error={hasSubmitted && formData.AnnualIncome < 0}
                                helperText={hasSubmitted && formData.AnnualIncome < 0 ? 'Annual income must be a positive number' : ''}
                                disabled={buttonActive}
                                placeholder="0"
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1.5 }} />
                        </Grid>

                        {/* Document Uploads */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                Cancellation Documents
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('CancellationDocument', 'Cancellation Document')}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('BankAccountDocument', 'Bank Account Document')}
                        </Grid>

                        {/* Refund Guarantee Document - ซ่อนจาก User role */}
                        {userRole !== 'User' && (
                            <Grid size={{ xs: 12, sm: 6 }}>
                                {renderFileUpload('RefundGuaranteeDocument', 'Refund Guarantee Document')}
                            </Grid>
                        )}
                    </Grid>
                </DialogContent>

                {/* Confirm/Cancel buttons */}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant='outlinedCancel'
                        onClick={handleClose}
                        disabled={buttonActive}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={buttonActive}
                    >
                        {buttonActive ? 'Updating...' : 'Update Cancellation Details'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EditCancellationDetailsPopup;
