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
    FormControl,
    MenuItem,
    FormHelperText,
} from '@mui/material';
import { DatePicker } from '../DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { Select } from '../Select/Select';
import { TextField } from '../TextField/TextField';
import DocumentUploader from '../DocumentUploader/DocumentUploader';
import AlertGroup from '../AlertGroup/AlertGroup';
import { GetAllRooms, GetAllServiceUserTypes, CreateServiceAreaDocument } from '../../services/http';

interface SubmitServiceAreaPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (data: SubmitServiceAreaData) => void;
    companyName?: string;
    buttonActive?: boolean;
    requestServiceAreaID: number; // เพิ่ม prop สำหรับ RequestServiceArea ID
}

interface SubmitServiceAreaData {
    serviceContractDocument: File[];
    areaHandoverDocument: File[];
    quotationDocument: File[];
    roomID: number;
    serviceUserTypeID: number;
    contractNumber: string;
    contractStartAt: Dayjs | null;
    requestServiceAreaID?: number;
    success?: boolean;
}

const SubmitServiceAreaPopup: React.FC<SubmitServiceAreaPopupProps> = ({
    open,
    onClose,
    onConfirm,
    companyName,
    buttonActive = false,
    requestServiceAreaID,
}) => {
    const [formData, setFormData] = useState<SubmitServiceAreaData>({
        serviceContractDocument: [],
        areaHandoverDocument: [],
        quotationDocument: [],
        roomID: 0,
        serviceUserTypeID: 0,
        contractNumber: '',
        contractStartAt: null,
    });

    // State สำหรับ Alerts
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);

    // State สำหรับตรวจสอบว่าเคยกด Submit แล้วหรือยัง
    const [hasSubmitted, setHasSubmitted] = useState(false);

    // State สำหรับข้อมูลจริงจาก API
    const [rooms, setRooms] = useState<Array<{
        roomID: number;
        roomNumber: string;
    }>>([]);

    const [serviceUserTypes, setServiceUserTypes] = useState<Array<{
        id: number;
        name: string;
        description: string;
    }>>([]);

    const [isLoading, setIsLoading] = useState(false);
    
    // Ref สำหรับเก็บ reference ของ element ที่มี focus ก่อนเปิด dialog
    const previousFocusRef = useRef<HTMLElement | null>(null);

    // Function สำหรับดึงข้อมูล Rooms จาก API
    const fetchRooms = async () => {
        try {
            setIsLoading(true);
            const data = await GetAllRooms();
            if (data.status === 'success') {
                setRooms(data.data);
            }
        } catch (error) {
            console.error('Error fetching rooms:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function สำหรับดึงข้อมูล ServiceUserTypes จาก API
    const fetchServiceUserTypes = async () => {
        try {
            setIsLoading(true);
            const data = await GetAllServiceUserTypes();
            if (data.status === 'success') {
                setServiceUserTypes(data.data);
            }
        } catch (error) {
            console.error('Error fetching service user types:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // ดึงข้อมูลเมื่อ component mount
    useEffect(() => {
        if (open) {
            fetchRooms();
            fetchServiceUserTypes();
        }
    }, [open]);

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
        if (!formData.contractNumber.trim()) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please enter contract number' }]);
            // เลื่อนไปยัง Contract Number field
            setTimeout(() => {
                const contractField = document.querySelector('input[name="contractNumber"]');
                contractField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (!formData.contractStartAt) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please select contract start date' }]);
            // เลื่อนไปยัง Contract Start Date field
            setTimeout(() => {
                const contractStartField = document.querySelector('[data-field="contractStartAt"]');
                contractStartField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (formData.roomID === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please select a room' }]);
            // เลื่อนไปยัง Room field
            setTimeout(() => {
                const roomField = document.querySelector('select[name="roomID"]');
                roomField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (formData.serviceUserTypeID === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please select service user type' }]);
            // เลื่อนไปยัง Service User Type field
            setTimeout(() => {
                const userTypeField = document.querySelector('select[name="serviceUserTypeID"]');
                userTypeField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        // ตรวจสอบการอัพโหลดเอกสาร
        if (formData.serviceContractDocument.length === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please upload service contract document' }]);
            // เลื่อนไปยัง Service Contract Document field
            setTimeout(() => {
                const serviceContractField = document.querySelector('[data-field="serviceContractDocument"]');
                serviceContractField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (formData.areaHandoverDocument.length === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please upload area handover document' }]);
            // เลื่อนไปยัง Area Handover Document field
            setTimeout(() => {
                const areaHandoverField = document.querySelector('[data-field="areaHandoverDocument"]');
                areaHandoverField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        if (formData.quotationDocument.length === 0) {
            setAlerts(prev => [...prev, { type: 'error', message: 'Please upload quotation document' }]);
            // เลื่อนไปยัง Quotation Document field
            setTimeout(() => {
                const quotationField = document.querySelector('[data-field="quotationDocument"]');
                quotationField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        // ถ้าทุกอย่างถูกต้อง ส่งข้อมูลไปยัง Backend
        try {
            setIsLoading(true);
            
            // สร้าง FormData สำหรับส่งไฟล์และข้อมูล
            const submitFormData = new FormData();
            submitFormData.append('room_id', formData.roomID.toString());
            submitFormData.append('service_user_type_id', formData.serviceUserTypeID.toString());
            submitFormData.append('contract_number', formData.contractNumber.trim());
            submitFormData.append('contract_start_at', formData.contractStartAt.format('YYYY-MM-DD'));
            
            // เพิ่มไฟล์เอกสาร
            if (formData.serviceContractDocument.length > 0) {
                submitFormData.append('service_contract_document', formData.serviceContractDocument[0]);
            }
            if (formData.areaHandoverDocument.length > 0) {
                submitFormData.append('area_handover_document', formData.areaHandoverDocument[0]);
            }
            if (formData.quotationDocument.length > 0) {
                submitFormData.append('quotation_document', formData.quotationDocument[0]);
            }

            // ส่งข้อมูลไปยัง Backend
            const result = await CreateServiceAreaDocument(requestServiceAreaID, submitFormData);
            
            if (result) {
                setAlerts(prev => [...prev, { type: 'success', message: 'Service area document created successfully!' }]);
                
                // เรียก onConfirm หลังจากแสดง success alert พร้อมส่งข้อมูลที่จำเป็น
                setTimeout(() => {
                    onConfirm({
                        ...formData,
                        requestServiceAreaID: requestServiceAreaID,
                        success: true
                    });
                }, 1500);
            } else {
                throw new Error('Failed to create service area document');
            }
        } catch (error) {
            console.error('Error creating service area document:', error);
            setAlerts(prev => [...prev, { type: 'error', message: 'Network error occurred. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        // Reset form data
        setFormData({
            serviceContractDocument: [],
            areaHandoverDocument: [],
            quotationDocument: [],
            roomID: 0,
            serviceUserTypeID: 0,
            contractNumber: '',
            contractStartAt: null,
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
                        maxWidth: '800px',
                        width: { xs: "95vw", sm: "80vw", md: "70vw" },
                        margin: 0,
                        borderRadius: 2,
                    },
                }}
            >
                {/* Dialog title */}
                <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                    Submit Service Area Task
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
                        {/* Contract Number */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Contract Number *
                            </Typography>
                            <TextField
                                fullWidth
                                variant="outlined"
                                name="contractNumber"
                                value={formData.contractNumber}
                                onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                                placeholder="Enter contract number"
                                error={hasSubmitted && !formData.contractNumber.trim()}
                                helperText={hasSubmitted && !formData.contractNumber.trim() ? "Please enter contract number" : ""}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        height: '40px', // ความสูงปกติ
                                    },
                                    '& .MuiInputBase-input': {
                                        padding: '8px 14px', // padding ปกติ
                                    }
                                }}
                            />
                        </Grid>

                        {/* Contract Start Date */}
                        <Grid size={{ xs: 12, md: 6 }} data-field="contractStartAt">
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Contract Start Date *
                            </Typography>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    
                                    value={formData.contractStartAt}
                                    onChange={(newValue) => setFormData(prev => ({ ...prev, contractStartAt: newValue }))}
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

                        {/* Room Selection */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Room *
                            </Typography>
                            <FormControl
                                fullWidth
                                error={hasSubmitted && formData.roomID === 0}
                            >
                                                                 <Select
                                     name="roomID"
                                     displayEmpty
                                     defaultValue={0}
                                     value={formData.roomID}
                                     onChange={(e) => setFormData(prev => ({ ...prev, roomID: Number(e.target.value) }))}
                                     disabled={isLoading}
                                     MenuProps={{
                                         PaperProps: {
                                             style: {
                                                 maxHeight: 300, // ความสูงสูงสุดของ dropdown
                                             },
                                         },
                                     }}
                                 >
                                    <MenuItem value={0}>
                                        <em>{isLoading ? 'Loading rooms...' : '-- Select Room --'}</em>
                                    </MenuItem>
                                                                      {rooms.map((room) => (
                                      <MenuItem key={room.roomID} value={room.roomID}>
                                          {room.roomNumber}
                                      </MenuItem>
                                  ))}
                                </Select>
                                {hasSubmitted && formData.roomID === 0 && (
                                    <FormHelperText>Please select a room</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Service User Type */}
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Typography
                                variant="body1"
                                className="title-field"
                            >
                                Service User Type *
                            </Typography>
                            <FormControl
                                fullWidth
                                error={hasSubmitted && formData.serviceUserTypeID === 0}
                            >
                                                                 <Select
                                     name="serviceUserTypeID"
                                     displayEmpty
                                     defaultValue={0}
                                     value={formData.serviceUserTypeID}
                                     onChange={(e) => setFormData(prev => ({ ...prev, serviceUserTypeID: Number(e.target.value) }))}
                                     disabled={isLoading}
                                     MenuProps={{
                                         PaperProps: {
                                             style: {
                                                 maxHeight: 300, // ความสูงสูงสุดของ dropdown
                                             },
                                         },
                                     }}
                                 >
                                    <MenuItem value={0}>
                                        <em>{isLoading ? 'Loading types...' : '-- Select Type --'}</em>
                                    </MenuItem>
                                    {serviceUserTypes.map((type) => (
                                        <MenuItem key={type.id} value={type.id}>
                                            {type.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {hasSubmitted && formData.serviceUserTypeID === 0 && (
                                    <FormHelperText>Please select service user type</FormHelperText>
                                )}
                            </FormControl>
                        </Grid>

                        {/* Service Contract Document */}
                        <Grid size={{ xs: 12, md: 12 }} data-field="serviceContractDocument">
                            <Box display={"flex"}>
                                <Typography
                                    variant="body1"
                                    className="title-field"
                                >
                                    Service Contract Document
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
                                value={formData.serviceContractDocument}
                                onChange={(files: File[]) => setFormData(prev => ({ ...prev, serviceContractDocument: files }))}
                                setAlerts={setAlerts}
                                maxFiles={1}
                                buttonText="Click to select PDF file"
                                acceptedFileTypes={['.pdf']}
                                maxFileSize={10 * 1024 * 1024} // 10MB
                            />
                        </Grid>

                        {/* Area Handover Document */}
                        <Grid size={{ xs: 12, md: 12 }} data-field="areaHandoverDocument">
                            <Box display={"flex"}>
                                <Typography
                                    variant="body1"
                                    className="title-field"
                                >
                                    Area Handover Document
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
                                value={formData.areaHandoverDocument}
                                onChange={(files: File[]) => setFormData(prev => ({ ...prev, areaHandoverDocument: files }))}
                                setAlerts={setAlerts}
                                maxFiles={1}
                                buttonText="Click to select PDF file"
                                acceptedFileTypes={['.pdf']}
                                maxFileSize={10 * 1024 * 1024} // 10MB
                            />
                        </Grid>

                        {/* Quotation Document */}
                        <Grid size={{ xs: 12, md: 12 }} data-field="quotationDocument">
                            <Box display={"flex"}>
                                <Typography
                                    variant="body1"
                                    className="title-field"
                                >
                                    Quotation Document (Guarantee)
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
                                value={formData.quotationDocument}
                                onChange={(files: File[]) => setFormData(prev => ({ ...prev, quotationDocument: files }))}
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
                        {isLoading ? 'Creating...' : buttonActive ? 'Submitting...' : 'Submit'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SubmitServiceAreaPopup;
