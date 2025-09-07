import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Typography, Button, MenuItem, InputAdornment,
    Grid,
} from '@mui/material';
import { Select } from '../Select/Select';
import { HelpCircle, UserRound } from 'lucide-react';
import { UserInterface } from '../../interfaces/IUser';

import { businessGroupConfig } from '../../constants/businessGroupConfig';

interface BusinessGroupLike {
    ID?: number | null;
    Name?: string | null;
}

interface RequestServiceAreaLike {
    BusinessGroupID?: number | null;
}

interface ApproveServiceAreaPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    requestSelected: RequestServiceAreaLike;
    companyName?: string;
    purposeOfUsingSpace?: string;
    selectedOperator: number;
    setSelectedOperator: React.Dispatch<React.SetStateAction<number>>;
    operators: UserInterface[];
    businessGroups: BusinessGroupLike[];
    buttonActive: boolean;
    isCancellation?: boolean;
}

const ApproveServiceAreaPopup: React.FC<ApproveServiceAreaPopupProps> = ({
    open,
    onClose,
    onConfirm,
    requestSelected,
    selectedOperator,
    setSelectedOperator,
    operators,
    businessGroups,
    buttonActive,
    companyName,
    purposeOfUsingSpace,
    isCancellation = false,
}) => {
    
    const businessGroupId = requestSelected?.BusinessGroupID ?? null;
    const businessGroup = businessGroups.find(bg => bg.ID === businessGroupId);
    const businessGroupName = businessGroup?.Name || 'Unknown';
    const groupConfig = businessGroupConfig[businessGroupName] || { color: '#000', colorLite: '#ddd', icon: HelpCircle };
    const GroupIcon = groupConfig.icon;

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle
                sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    textAlign: 'center'
                }}
            >
                {isCancellation ? 'Assign Cancellation Task' : 'Approve Service Area'}
            </DialogTitle>

            <DialogContent sx={{ minWidth: 500 }}>
                <Grid container spacing={1}>
                    {/* Company Name */}
                    {companyName && (
                        <Grid size={{ xs: 10, md: 12 }}>
                            <Typography sx={{ fontWeight: 600, mt: 1 }}>
                                Company: {companyName}
                            </Typography>
                            <Typography sx={{ color: 'text.secondary' }}>
                                {isCancellation ? 'Purpose of Cancellation:' : 'Purpose of Using Space:'} {purposeOfUsingSpace}
                            </Typography>
                        </Grid>
                    )}


                    {/* Business Group badge (moved to bottom, compact) */}
                    <Grid size={{ xs: 10, md: 12 }}>
                        <Grid
                            sx={{
                                bgcolor: groupConfig.colorLite,
                                borderRadius: 10,
                                px: 3,
                                py: 1,
                                display: 'inline-flex',
                                gap: 1,
                                color: groupConfig.color,
                                alignItems: 'center',
                                width: 'fit-content',
                                
                            }}
                        >
                            <GroupIcon size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                {businessGroupName}
                            </Typography>
                        </Grid>
                    </Grid>

                    {/* Document Operator select dropdown */}
                    <Grid size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mt: 2 }}>
                            Document Operator
                        </Typography>
                        <Select
                            value={selectedOperator ?? 0}
                            onChange={(e) => setSelectedOperator(Number(e.target.value))}
                            displayEmpty
                            fullWidth
                            startAdornment={
                                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                    <UserRound size={18} style={{ minWidth: '18px', minHeight: '18px' }} />
                                </InputAdornment>
                            }
                            sx={{ mt: 1 }}
                        >
                            <MenuItem value={0}><em>{'-- Select Document Operator --'}</em></MenuItem>
                            {operators.map((item) => (
                                <MenuItem key={item.ID} value={item.ID}>
                                    {`${item.EmployeeID} ${item.FirstName} ${item.LastName}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>


                </Grid>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button variant='text'
                    onClick={onClose}
                    sx={{
                        color: 'customBlue',
                        '&:hover': { background: 'none', boxShadow: 'none' }
                    }}
                >
                    Cancel
                </Button>
                <Button variant="contained" onClick={onConfirm} disabled={buttonActive}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ApproveServiceAreaPopup;

