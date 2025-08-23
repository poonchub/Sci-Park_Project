import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Snackbar
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Download as DownloadIcon,
    Visibility as ViewIcon
} from '@mui/icons-material';
import './DocumentManagement.css';

interface Document {
    id: number;
    title: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedBy: string;
    uploadedDate: string;
    filePath: string;
    description?: string;
}

const DocumentManagement: React.FC = () => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

    // Mock data for demonstration
    useEffect(() => {
        const mockDocuments: Document[] = [
            {
                id: 1,
                title: 'Service Contract - Area A',
                type: 'Contract',
                status: 'approved',
                uploadedBy: 'Manager 1',
                uploadedDate: '2024-01-15',
                filePath: '/files/contracts/contract1.pdf',
                description: 'Service contract for Area A maintenance services'
            },
            {
                id: 2,
                title: 'Equipment Maintenance Report',
                type: 'Report',
                status: 'pending',
                uploadedBy: 'Maintenance Operator 1',
                uploadedDate: '2024-01-20',
                filePath: '/files/reports/maintenance_report.pdf',
                description: 'Monthly equipment maintenance report'
            },
            {
                id: 3,
                title: 'Safety Inspection Document',
                type: 'Inspection',
                status: 'rejected',
                uploadedBy: 'Safety Officer',
                uploadedDate: '2024-01-18',
                filePath: '/files/inspections/safety_inspection.pdf',
                description: 'Safety inspection documentation for building compliance'
            }
        ];
        setDocuments(mockDocuments);
    }, []);

    const handleOpenDialog = (document?: Document) => {
        setSelectedDocument(document || null);
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setSelectedDocument(null);
    };

    const handleSaveDocument = () => {
        // Mock save functionality
        setSnackbar({
            open: true,
            message: selectedDocument ? 'Document updated successfully!' : 'Document added successfully!',
            severity: 'success'
        });
        handleCloseDialog();
    };

    const handleDeleteDocument = (id: number) => {
        setDocuments(docs => docs.filter(doc => doc.id !== id));
        setSnackbar({
            open: true,
            message: 'Document deleted successfully!',
            severity: 'success'
        });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'success';
            case 'pending': return 'warning';
            case 'rejected': return 'error';
            default: return 'default';
        }
    };

    return (
        <Box className="document-management-page">
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h5" component="h1">
                            จัดการเอกสาร
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            เพิ่มเอกสารใหม่
                        </Button>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        จัดการเอกสารต่างๆ ในระบบ รวมถึงสัญญา รายงาน และเอกสารตรวจสอบ
                    </Typography>
                </CardContent>
            </Card>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ชื่อเอกสาร</TableCell>
                            <TableCell>ประเภท</TableCell>
                            <TableCell>สถานะ</TableCell>
                            <TableCell>อัปโหลดโดย</TableCell>
                            <TableCell>วันที่อัปโหลด</TableCell>
                            <TableCell>การดำเนินการ</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.map((document) => (
                            <TableRow key={document.id}>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {document.title}
                                    </Typography>
                                    {document.description && (
                                        <Typography variant="caption" color="text.secondary">
                                            {document.description}
                                        </Typography>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Chip label={document.type} size="small" />
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={document.status}
                                        color={getStatusColor(document.status) as any}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>{document.uploadedBy}</TableCell>
                                <TableCell>{document.uploadedDate}</TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleOpenDialog(document)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton size="small">
                                        <ViewIcon />
                                    </IconButton>
                                    <IconButton size="small">
                                        <DownloadIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDeleteDocument(document.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Add/Edit Document Dialog */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                <DialogTitle>
                    {selectedDocument ? 'แก้ไขเอกสาร' : 'เพิ่มเอกสารใหม่'}
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid  size={{xs: 12, md: 6}}>
                            <TextField
                                fullWidth
                                label="ชื่อเอกสาร"
                                defaultValue={selectedDocument?.title}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 12}}>
                            <FormControl fullWidth>
                                <InputLabel>ประเภทเอกสาร</InputLabel>
                                <Select
                                    label="ประเภทเอกสาร"
                                    defaultValue={selectedDocument?.type || ''}
                                >
                                    <MenuItem value="Contract">สัญญา</MenuItem>
                                    <MenuItem value="Report">รายงาน</MenuItem>
                                    <MenuItem value="Inspection">ตรวจสอบ</MenuItem>
                                    <MenuItem value="Manual">คู่มือ</MenuItem>
                                    <MenuItem value="Other">อื่นๆ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, md: 12}}>
                            <FormControl fullWidth>
                                <InputLabel>สถานะ</InputLabel>
                                <Select
                                    label="สถานะ"
                                    defaultValue={selectedDocument?.status || 'pending'}
                                >
                                    <MenuItem value="pending">รอการอนุมัติ</MenuItem>
                                    <MenuItem value="approved">อนุมัติแล้ว</MenuItem>
                                    <MenuItem value="rejected">ปฏิเสธ</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{xs: 12, md: 12}}>
                            <TextField
                                fullWidth
                                multiline
                                rows={3}
                                label="คำอธิบาย"
                                defaultValue={selectedDocument?.description}
                            />
                        </Grid>
                        <Grid size={{xs: 12, md: 12}}>
                            <Button variant="outlined" component="label">
                                อัปโหลดไฟล์
                                <input type="file" hidden />
                            </Button>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>ยกเลิก</Button>
                    <Button onClick={handleSaveDocument} variant="contained">
                        บันทึก
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default DocumentManagement;
