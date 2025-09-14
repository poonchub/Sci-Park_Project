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
    Divider
} from '@mui/material';
import { TextField } from '../TextField/TextField';
import { DatePicker } from '../DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { Edit3, FileText, X } from 'lucide-react';
import AlertGroup from '../AlertGroup/AlertGroup';

interface DocumentContractData {
    ContractNumber: string;
    FinalContractNumber: string;
    ContractStartAt: string;
    ContractEndAt: string;
    RoomID: number;
    ServiceUserTypeID: number;
    // Document files
    ServiceContractDocument?: File | null;
    AreaHandoverDocument?: File | null;
    QuotationDocument?: File | null;
    RefundGuaranteeDocument?: File | null;
    // Existing file paths
    ServiceContractDocumentPath?: string;
    AreaHandoverDocumentPath?: string;
    QuotationDocumentPath?: string;
    RefundGuaranteeDocumentPath?: string;
}

interface EditDocumentContractPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: DocumentContractData) => void;
    existingData?: DocumentContractData;
    requestServiceAreaID?: number;
    buttonActive?: boolean;
}

const EditDocumentContractPopup: React.FC<EditDocumentContractPopupProps> = ({
    open,
    onClose,
    onConfirm,
    existingData,
    buttonActive = false,
}) => {
    const [formData, setFormData] = useState<DocumentContractData>({
        ContractNumber: '',
        FinalContractNumber: '',
        ContractStartAt: '',
        ContractEndAt: '',
        RoomID: 0,
        ServiceUserTypeID: 0,
        ServiceContractDocument: null,
        AreaHandoverDocument: null,
        QuotationDocument: null,
        RefundGuaranteeDocument: null,
        ServiceContractDocumentPath: '',
        AreaHandoverDocumentPath: '',
        QuotationDocumentPath: '',
        RefundGuaranteeDocumentPath: '',
    });

    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize form data when popup opens
    useEffect(() => {
        if (open && existingData) {
            setFormData({
                ContractNumber: existingData.ContractNumber || '',
                FinalContractNumber: existingData.FinalContractNumber || '',
                ContractStartAt: existingData.ContractStartAt || '',
                ContractEndAt: existingData.ContractEndAt || '',
                RoomID: existingData.RoomID || 0,
                ServiceUserTypeID: existingData.ServiceUserTypeID || 0,
                ServiceContractDocument: null,
                AreaHandoverDocument: null,
                QuotationDocument: null,
                RefundGuaranteeDocument: null,
                ServiceContractDocumentPath: existingData.ServiceContractDocumentPath || '',
                AreaHandoverDocumentPath: existingData.AreaHandoverDocumentPath || '',
                QuotationDocumentPath: existingData.QuotationDocumentPath || '',
                RefundGuaranteeDocumentPath: existingData.RefundGuaranteeDocumentPath || '',
            });
            setHasSubmitted(false);
            setAlerts([]);
        }
    }, [open, existingData]);

    const handleInputChange = (field: keyof DocumentContractData, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleFileChange = (field: keyof DocumentContractData, file: File | null) => {
        setFormData(prev => ({
            ...prev,
            [field]: file
        }));
    };

    const validateForm = (): boolean => {
        setAlerts([]);
        let isValid = true;

        if (!formData.ContractNumber.trim()) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please enter contract number' 
            }]);
            isValid = false;
        }

        if (!formData.FinalContractNumber.trim()) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please enter final contract number' 
            }]);
            isValid = false;
        }

        if (!formData.ContractStartAt) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please select contract start date' 
            }]);
            isValid = false;
        }

        if (!formData.ContractEndAt) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please select contract end date' 
            }]);
            isValid = false;
        }

        if (formData.RoomID === 0) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please select room' 
            }]);
            isValid = false;
        }

        if (formData.ServiceUserTypeID === 0) {
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Please select service user type' 
            }]);
            isValid = false;
        }

        return isValid;
    };

    const handleConfirm = async () => {
        setHasSubmitted(true);
        
        if (!validateForm()) {
            return;
        }

        try {
            setIsLoading(true);
            
            // Call onConfirm with the updated data
            await onConfirm(formData);
            
            setAlerts(prev => [...prev, { 
                type: 'success', 
                message: 'Document and contract information updated successfully!' 
            }]);
            
            // Close popup after success
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error('Error updating document and contract information:', error);
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Failed to update document and contract information. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            ContractNumber: '',
            FinalContractNumber: '',
            ContractStartAt: '',
            ContractEndAt: '',
            RoomID: 0,
            ServiceUserTypeID: 0,
            ServiceContractDocument: null,
            AreaHandoverDocument: null,
            QuotationDocument: null,
            RefundGuaranteeDocument: null,
            ServiceContractDocumentPath: '',
            AreaHandoverDocumentPath: '',
            QuotationDocumentPath: '',
            RefundGuaranteeDocumentPath: '',
        });
        setHasSubmitted(false);
        setAlerts([]);
        onClose();
    };

    const renderFileUpload = (field: keyof DocumentContractData, label: string) => {
        const fileValue = formData[field] as File | null;
        const pathValue = formData[`${field}Path` as keyof DocumentContractData] as string;

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
                                {pathValue.split('/').pop()}
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
                        Edit Documents & Contract Information
                    </Box>
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Update contract details and upload new documents.
                    </Typography>

                    <Grid container spacing={2}>
                        {/* Contract Information */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                Contract Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Contract Number *
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={formData.ContractNumber}
                                onChange={(e) => handleInputChange('ContractNumber', e.target.value)}
                                placeholder="Enter contract number"
                                error={hasSubmitted && !formData.ContractNumber.trim()}
                                helperText={hasSubmitted && !formData.ContractNumber.trim() ? "Please enter contract number" : ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Final Contract Number *
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                value={formData.FinalContractNumber}
                                onChange={(e) => handleInputChange('FinalContractNumber', e.target.value)}
                                placeholder="Enter final contract number"
                                error={hasSubmitted && !formData.FinalContractNumber.trim()}
                                helperText={hasSubmitted && !formData.FinalContractNumber.trim() ? "Please enter final contract number" : ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Contract Start Date *
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={formData.ContractStartAt ? dayjs(formData.ContractStartAt) : null}
                                    onChange={(newValue: Dayjs | null) => handleInputChange('ContractStartAt', newValue?.format('YYYY-MM-DD') || '')}
                                    format="DD/MM/YYYY"
                                    sx={{
                                        width: "100%",
                                        '& .MuiInputBase-root': {
                                            height: '40px',
                                        },
                                        '& .MuiInputBase-input': {
                                            padding: '8px 14px',
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Contract End Date *
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={formData.ContractEndAt ? dayjs(formData.ContractEndAt) : null}
                                    onChange={(newValue: Dayjs | null) => handleInputChange('ContractEndAt', newValue?.format('YYYY-MM-DD') || '')}
                                    format="DD/MM/YYYY"
                                    sx={{
                                        width: "100%",
                                        '& .MuiInputBase-root': {
                                            height: '40px',
                                        },
                                        '& .MuiInputBase-input': {
                                            padding: '8px 14px',
                                        }
                                    }}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1.5 }} />
                        </Grid>

                        {/* Room and Service Information */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                Room & Service Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Room Number *
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                variant="outlined"
                                value={formData.RoomID || ''}
                                onChange={(e) => handleInputChange('RoomID', parseInt(e.target.value) || 0)}
                                placeholder="Enter room number"
                                error={hasSubmitted && formData.RoomID === 0}
                                helperText={hasSubmitted && formData.RoomID === 0 ? "Please enter room number" : ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Service User Type *
                            </Typography>
                            <TextField
                                fullWidth
                                type="number"
                                variant="outlined"
                                value={formData.ServiceUserTypeID || ''}
                                onChange={(e) => handleInputChange('ServiceUserTypeID', parseInt(e.target.value) || 0)}
                                placeholder="Enter service user type ID"
                                error={hasSubmitted && formData.ServiceUserTypeID === 0}
                                helperText={hasSubmitted && formData.ServiceUserTypeID === 0 ? "Please enter service user type" : ""}
                            />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Divider sx={{ my: 1.5 }} />
                        </Grid>

                        {/* Document Uploads */}
                        <Grid size={{ xs: 12 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                                Document Uploads
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('ServiceContractDocument', 'Service Contract Document')}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('AreaHandoverDocument', 'Area Handover Document')}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('QuotationDocument', 'Quotation Document')}
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            {renderFileUpload('RefundGuaranteeDocument', 'Refund Guarantee Document')}
                        </Grid>
                    </Grid>
                </DialogContent>

                {/* Confirm/Cancel buttons */}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant='outlinedCancel'
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={buttonActive || isLoading}
                    >
                        {isLoading ? 'Updating...' : buttonActive ? 'Updating...' : 'Update Information'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EditDocumentContractPopup;
