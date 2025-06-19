import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, MenuItem, InputAdornment,
    Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faUserTie } from '@fortawesome/free-solid-svg-icons';

import { MaintenanceRequestsInterface } from '../../interfaces/IMaintenanceRequests';
import { UserInterface } from "../../interfaces/IUser";
import { Select } from '../Select/Select';

interface MaintenanceTypeConfig {
    [key: string]: {
        color: string;
        colorLite: string;
        icon: any;
    };
}

interface ApprovePopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    requestSelected: MaintenanceRequestsInterface;
    selectedOperator: number;
    setSelectedOperator: React.Dispatch<React.SetStateAction<number>>;
    operators: UserInterface[];
    maintenanceTypeConfig: MaintenanceTypeConfig;
    buttonActive: boolean;
}

const ApprovePopup: React.FC<ApprovePopupProps> = ({
    open,
    onClose,
    onConfirm,
    requestSelected,
    selectedOperator,
    setSelectedOperator,
    operators,
    maintenanceTypeConfig,
    buttonActive,
}) => {
    return (
        <Dialog open={open} onClose={onClose} sx={{ zIndex: 999 }}>
            {/* Dialog title */}
            <DialogTitle 
                sx={{ 
                    fontWeight: 700, 
                    color: 'primary.main', 
                    textAlign: 'center' 
                }}
            >
                มอบหมายงานซ่อม
            </DialogTitle>

            <DialogContent sx={{ minWidth: 500 }}>
                <Grid container spacing={1}>
                    {/* Display location and request details */}
                    <Grid size={{ xs: 10, md: 12 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                            {requestSelected.Area?.Name === 'บริเวณอื่นๆ'
                                ? requestSelected.AreaDetail
                                : `${requestSelected.Area?.Name || "-"} ชั้น ${requestSelected.Room?.Floor?.Number || "-"} ห้อง ${requestSelected.Room?.RoomNumber || "-"}`}
                        </Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            {requestSelected.Description || "ไม่มีรายละเอียด"}
                        </Typography>
                    </Grid>

                    {/* Show maintenance type with icon and color */}
                    {requestSelected.MaintenanceType?.TypeName && (() => {
                        const typeName = requestSelected.MaintenanceType.TypeName;
                        const maintenanceKey = typeName as keyof typeof maintenanceTypeConfig;
                        const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000", colorLite: "#ddd", icon: faQuestionCircle,
                        };

                        return (
                            <Grid
                                sx={{
                                    bgcolor: colorLite,
                                    borderRadius: 10,
                                    px: 3,
                                    py: 1,
                                    display: 'flex',
                                    gap: 1,
                                    color,
                                    alignItems: 'center',
                                }}
                            >
                                <FontAwesomeIcon icon={icon} />
                                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                    {typeName}
                                </Typography>
                            </Grid>
                        );
                    })()}

                    {/* Operator select dropdown */}
                    <Grid size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mt: 2 }}>
                            ผู้รับผิดชอบงาน
                        </Typography>
                        <Select
                            value={selectedOperator ?? 0}
                            onChange={(e) => setSelectedOperator(Number(e.target.value))}
                            displayEmpty
                            fullWidth
                            startAdornment={
                                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                    <FontAwesomeIcon icon={faUserTie} size="lg" />
                                </InputAdornment>
                            }
                            sx={{ mt: 1 }}
                        >
                            <MenuItem value={0}><em>{'-- เลือกผู้ดำเนินการ --'}</em></MenuItem>
                            {operators.map((item) => (
                                <MenuItem key={item.ID} value={item.ID}>
                                    {`${item.EmployeeID} ${item.FirstName} ${item.LastName}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
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
                    ยกเลิก
                </Button>
                <Button variant="contained" onClick={onConfirm} disabled={buttonActive}>ยืนยัน</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApprovePopup;