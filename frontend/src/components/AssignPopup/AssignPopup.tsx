import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, MenuItem, InputAdornment,
    Grid2
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';
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

interface AssignPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    requestSelected: MaintenanceRequestsInterface;
    selectedOperator: number;
    setSelectedOperator: React.Dispatch<React.SetStateAction<number>>;
    operators: UserInterface[];
    maintenanceTypeConfig: MaintenanceTypeConfig;
}

const AssignPopup: React.FC<AssignPopupProps> = ({
    open,
    onClose,
    onConfirm,
    requestSelected,
    selectedOperator,
    setSelectedOperator,
    operators,
    maintenanceTypeConfig,
}) => {
    return (
        <Dialog open={open} onClose={onClose} sx={{ zIndex: 999 }}>
            <DialogTitle>มอบหมายงานซ่อม</DialogTitle>
            <DialogContent sx={{ minWidth: 500 }}>
                <Grid2 container spacing={1}>
                    <Grid2 size={{ xs: 10, md: 12 }}>
                        <Typography sx={{ fontWeight: 600 }}>
                            {requestSelected.Area?.Name === 'บริเวณอื่นๆ'
                                ? requestSelected.AreaDetail
                                : `${requestSelected.Area?.Name || "-"} ชั้น ${requestSelected.Room?.Floor?.Number || "-"} ห้อง ${requestSelected.Room?.RoomNumber || "-"}`}
                        </Typography>
                        <Typography>
                            {requestSelected.Description || "ไม่มีรายละเอียด"}
                        </Typography>
                    </Grid2>

                    {requestSelected.MaintenanceType?.TypeName && (() => {
                        const typeName = requestSelected.MaintenanceType?.TypeName;
                        const maintenanceKey = typeName as keyof typeof maintenanceTypeConfig;
                        const { color, colorLite, icon } = maintenanceTypeConfig[maintenanceKey] ?? {
                            color: "#000", colorLite: "#ddd", icon: faQuestionCircle
                        };

                        return (
                            <Grid2
                                sx={{
                                    bgcolor: colorLite,
                                    borderRadius: 10,
                                    px: 1.5,
                                    py: 0.5,
                                    display: 'flex',
                                    gap: 1,
                                    color,
                                    alignItems: 'center',
                                }}>
                                <FontAwesomeIcon icon={icon} />
                                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                    {typeName}
                                </Typography>
                            </Grid2>
                        );
                    })()}

                    <Grid2 size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1">ผู้รับผิดชอบงาน</Typography>
                        <Select
                            value={selectedOperator ?? 0}
                            onChange={(e) => setSelectedOperator(Number(e.target.value))}
                            displayEmpty
                            fullWidth
                            startAdornment={
                                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                    <FontAwesomeIcon icon={faUser} size="lg" />
                                </InputAdornment>
                            }
                        >
                            <MenuItem value={0}><em>{'-- เลือกผู้ดำเนินการ --'}</em></MenuItem>
                            {operators.map((item) => (
                                <MenuItem key={item.ID} value={item.ID}>
                                    {`${item.ID} ${item.FirstName} ${item.LastName}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid2>
                </Grid2>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>ยกเลิก</Button>
                <Button variant="contained" onClick={onConfirm}>ยืนยัน</Button>
            </DialogActions>
        </Dialog>
    );
};
export default AssignPopup;