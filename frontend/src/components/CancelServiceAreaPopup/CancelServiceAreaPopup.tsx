import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
} from '@mui/material';
import { DatePicker } from '../DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { TextField } from '../TextField/TextField';
import DocumentUploader from '../DocumentUploader/DocumentUploader';
import AlertGroup from '../AlertGroup/AlertGroup';
import { GetServiceAreaDocumentByRequestID, UpdateServiceAreaDocumentForCancellation } from '../../services/http';

interface CancelServiceAreaPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: CancelServiceAreaData) => void;
    companyName?: string;
    buttonActive?: boolean;
    requestServiceAreaID: number;
}

interface CancelServiceAreaData {
    finalContractNumber: string;
    contractEndDate: Dayjs | null;
    securityDepositRefundDocument: File[];
    requestServiceAreaID?: number;
    success?: boolean;
}

const CancelServiceAreaPopup: React.FC<CancelServiceAreaPopupProps> = ({
    open,
    onClose,
    onConfirm,
    companyName,
    buttonActive = false,
    requestServiceAreaID,
}) => {
    const [formData, setFormData] = useState<CancelServiceAreaData>({
        finalContractNumber: '',
        contractEndDate: null,
        securityDepositRefundDocument: [],
    });

    // State สำหรับ Alerts
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    // State สำหรับตรวจสอบว่าเคยกด Submit แล้วหรือยัง
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    
    // Ref สำหรับเก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // ดึงข้อมูล ServiceAreaDocument เมื่อเปิด Pop Up
    useEffect(() => {
        if (open && requestServiceAreaID) {
            fetchServiceAreaDocument();
        }
    }, [open, requestServiceAreaID]);

    // ฟังก์ชันสำหรับดึงข้อมูล ServiceAreaDocument
    const fetchServiceAreaDocument = async () => {
        try {
            setIsLoadingData(true);
            const serviceAreaDoc = await GetServiceAreaDocumentByRequestID(requestServiceAreaID);
            
            // อัพเดท form data ด้วยข้อมูลที่มีอยู่ (เฉพาะ Final Contract Number)
            setFormData(prev => ({
                ...prev,
                finalContractNumber: serviceAreaDoc.FinalContractNumber || '',
                // contractEndDate ไม่ auto-fill ให้ผู้ใช้กรอกเอง
            }));
        } catch (error) {
            console.error('Error fetching service area document:', error);
            // ไม่แสดง error เพราะอาจจะยังไม่มี ServiceAreaDocument
        } finally {
            setIsLoadingData(false);
        }
    };

    // จัดการ focus management เพื่อป้องกัน aria-hidden warning
    useEffect(() => {
        if (open) {
            // เก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
            previousFocusRef.current = document.activeElement as HTMLElement;
        } else {
            // เมื่อ dialog ปิด ให้ return focus ไปยัง element เดิม
            if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
                setTimeout(() => {
                    previousFocusRef.current?.focus();
                }, 0);
            }
        }
    }, [open]);

    const handleConfirm = async () => {
        // Set hasSubmitted to true เพื่อให้แสดง validation errors
        setHasSubmitted(true);

        // Clear previous alerts
        setAlerts([]);

        // ตรวจสอบข้อมูลที่จำเป็น
        if (!formData.finalContractNumber.trim()) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please enter final contract number' }]);
            // เลื่อนไปยัง Final Contract Number field
            setTimeout(() => {
                const contractField = document.querySelector('input[name="finalContractNumber"]');
                contractField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (!formData.contractEndDate) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please select contract end date' }]);
            // เลื่อนไปยัง Contract End Date field
            setTimeout(() => {
                const contractEndField = document.querySelector('[data-field="contractEndDate"]');
                contractEndField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        // ตรวจสอบการอัพโหลดเอกสาร
        if (formData.securityDepositRefundDocument.length === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please upload security deposit refund document' }]);
            // เลื่อนไปยัง Security Deposit Refund Document field
            setTimeout(() => {
                const documentField = document.querySelector('[data-field="securityDepositRefundDocument"]');
                documentField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        // ถ้าทุกอย่างถูกต้อง ส่งข้อมูลไปยัง Backend
        try {
            setIsLoading(true);
            
            // สร้าง FormData สำหรับส่งไฟล์และข้อมูล
            const submitFormData = new FormData();
            submitFormData.append('final_contract_number', formData.finalContractNumber.trim());
            submitFormData.append('contract_end_date', formData.contractEndDate.format('YYYY-MM-DD'));
            
            // เพิ่มไฟล์เอกสาร
            if (formData.securityDepositRefundDocument.length > 0) {
                submitFormData.append('security_deposit_refund_document', formData.securityDepositRefundDocument[0]);
            }

            // เรียก API สำหรับอัพเดท ServiceAreaDocument สำหรับการยกเลิก
            await UpdateServiceAreaDocumentForCancellation(requestServiceAreaID, submitFormData);
            
            setAlerts(prev => [...prev, { type: 'success', message: 'Cancellation request submitted successfully!' }]);
            
            // เรียก onConfirm หลังจากแสดง success alert
            setTimeout(() => {
                onConfirm({
                    ...formData,
                    requestServiceAreaID: requestServiceAreaID,
                    success: true
                });
            }, 1500);
            
        } catch (error) {
            console.error('Error creating cancellation request:', error);
            setAlerts(prev => [...prev, { type: 'error', message: 'Network error occurred. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form data
        setFormData({
            finalContractNumber: '',
            contractEndDate: null,
            securityDepositRefundDocument: [],
        });
        // Reset hasSubmitted state
        setHasSubmitted(false);
        // Clear alerts
        setAlerts([]);
        onClose();
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
                        minWidth: '400px',
                        maxWidth: '600px',
                        width: { xs: "95vw", sm: "80vw", md: "60vw" },
                        margin: 0,
                        borderRadius: 2,
                    },
                }}
            >
                {/* Dialog title */}
                <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                    Cancel Service Area Request
                </DialogTitle>

                <DialogContent>
                    {/* Company Name Display */}
                    {companyName && (
                        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                Company: {companyName}
                            </Typography>
                        </Box>
                    )}

                    <Grid container spacing={3}>
                        {/* Final Contract Number */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Final Contract Number *
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                name="finalContractNumber"
                                value={formData.finalContractNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, finalContractNumber: e.target.value }))}
                                placeholder={isLoadingData ? "Loading..." : "Enter final contract number"}
                                disabled={isLoadingData}
                                error={hasSubmitted && !formData.finalContractNumber.trim()}
                                helperText={hasSubmitted && !formData.finalContractNumber.trim() ? "Please enter final contract number" : ""}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px',
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '8px 14px',
                                    }
                                }}
                            />
                        </Grid>

                        {/* Contract End Date */}
                        <Grid size={{ xs: 12, md: 6 }} data-field="contractEndDate">
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Contract End Date *
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    value={formData.contractEndDate}
                                    onChange={(newValue) => setFormData(prev => ({ ...prev, contractEndDate: newValue }))}
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

                        {/* Security Deposit Refund Document */}
                        <Grid size={{ xs: 12, md: 12 }} data-field="securityDepositRefundDocument">
                            <Box display={"flex"}>
                                <Typography
                                    variant="body1"
                                    className="title-field"
                                >
                                    Security Deposit Refund Document
                                </Typography>
                                <Typography
                                    variant="body1"
                                    sx={{
                                        ml: 0.5,
                                        color: "gray",
                                    }}
                                >
                                    (PDF only, max 1 file)
                                </Typography>
                            </Box>
                            <DocumentUploader
                                value={formData.securityDepositRefundDocument}
                                onChange={(files: File[]) => setFormData(prev => ({ ...prev, securityDepositRefundDocument: files }))}
                                setAlerts={setAlerts}
                                maxFiles={1}
                                buttonText="Click to select PDF file"
                                acceptedFileTypes={['.pdf']}
                                maxFileSize={10 * 1024 * 1024} // 10MB
                            />
                        </Grid>
                    </Grid>
                </DialogContent>

                {/* Confirm/Cancel buttons */}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        variant='outlinedCancel'
                        onClick={handleClose}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleConfirm}
                        disabled={buttonActive || isLoading}
                        
                    >
                        {isLoading ? 'Submitting...' : buttonActive ? 'Submitting...' : 'Submit Cancellation'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default CancelServiceAreaPopup;
