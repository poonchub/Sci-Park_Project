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
    IconButton,
    TextField,
    Divider
} from '@mui/material';
import { DatePicker } from '../DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { Dayjs } from 'dayjs';
import { Plus, Trash2 } from 'lucide-react';
import AlertGroup from '../AlertGroup/AlertGroup';

interface CollaborationPlan {
    ID?: number;
    CollaborationPlan: string;
    CollaborationBudget: number;
    ProjectStartDate: Dayjs | null;
}

interface EditCollaborationPlansPopupProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (plans: CollaborationPlan[]) => void;
    existingPlans: CollaborationPlan[];
    requestServiceAreaID?: number;
    buttonActive?: boolean;
}

const EditCollaborationPlansPopup: React.FC<EditCollaborationPlansPopupProps> = ({
    open,
    onClose,
    onConfirm,
    existingPlans,
    buttonActive = false,
}) => {
    const [plans, setPlans] = useState<CollaborationPlan[]>([]);
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize plans when popup opens
    useEffect(() => {
        if (open) {
            // Convert existing plans to the format we need
            const formattedPlans = existingPlans.map(plan => ({
                ID: plan.ID,
                CollaborationPlan: plan.CollaborationPlan || '',
                CollaborationBudget: plan.CollaborationBudget || 0,
                ProjectStartDate: plan.ProjectStartDate || null
            }));
            setPlans(formattedPlans);
            setHasSubmitted(false);
            setAlerts([]);
        }
    }, [open, existingPlans]);

    const addNewPlan = () => {
        const newPlan: CollaborationPlan = {
            CollaborationPlan: '',
            CollaborationBudget: 0,
            ProjectStartDate: null
        };
        setPlans([...plans, newPlan]);
    };

    const removePlan = (index: number) => {
        if (plans.length > 1) {
            const updatedPlans = plans.filter((_, i) => i !== index);
            setPlans(updatedPlans);
        }
    };

    const updatePlan = (index: number, field: keyof CollaborationPlan, value: any) => {
        const updatedPlans = [...plans];
        updatedPlans[index] = {
            ...updatedPlans[index],
            [field]: value
        };
        setPlans(updatedPlans);
    };

    const validatePlans = (): boolean => {
        setAlerts([]);
        let isValid = true;

        plans.forEach((plan, index) => {
            if (!plan.CollaborationPlan.trim()) {
                setAlerts(prev => [...prev, { 
                    type: 'error', 
                    message: `Plan ${index + 1}: Please enter collaboration plan description` 
                }]);
                isValid = false;
            }

            if (plan.CollaborationBudget <= 0) {
                setAlerts(prev => [...prev, { 
                    type: 'error', 
                    message: `Plan ${index + 1}: Please enter a valid budget amount` 
                }]);
                isValid = false;
            }

            if (!plan.ProjectStartDate) {
                setAlerts(prev => [...prev, { 
                    type: 'error', 
                    message: `Plan ${index + 1}: Please select project start date` 
                }]);
                isValid = false;
            }
        });

        return isValid;
    };

    const handleConfirm = async () => {
        setHasSubmitted(true);
        
        if (!validatePlans()) {
            return;
        }

        try {
            setIsLoading(true);
            
            // Call onConfirm with the updated plans
            await onConfirm(plans);
            
            setAlerts(prev => [...prev, { 
                type: 'success', 
                message: 'Collaboration plans updated successfully!' 
            }]);
            
            // Close popup after success
            setTimeout(() => {
                onClose();
            }, 1500);
            
        } catch (error) {
            console.error('Error updating collaboration plans:', error);
            setAlerts(prev => [...prev, { 
                type: 'error', 
                message: 'Failed to update collaboration plans. Please try again.' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setPlans([]);
        setHasSubmitted(false);
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
                        minWidth: '500px',
                        maxWidth: '800px',
                        width: { xs: "95vw", sm: "80vw", md: "70vw" },
                        margin: 0,
                        borderRadius: 2,
                    },
                }}
            >
                {/* Dialog title */}
                <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', textAlign: 'center' }}>
                    Edit Collaboration Plans
                </DialogTitle>

                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Manage collaboration plans for this service area request.
                    </Typography>

                    {plans.map((plan, index) => (
                        <Box key={index} sx={{ mb: 3 }}>
                            {/* Plan Header */}
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 2 
                            }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                    Plan {index + 1}
                                </Typography>
                                {plans.length > 1 && (
                                    <IconButton
                                        size="small"
                                        onClick={() => removePlan(index)}
                                        sx={{ color: 'error.main' }}
                                    >
                                        <Trash2 size={16} />
                                    </IconButton>
                                )}
                            </Box>

                            <Grid container spacing={2}>
                                {/* Collaboration Plan Description */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Collaboration Plan *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        multiline
                                        rows={3}
                                        variant="outlined"
                                        value={plan.CollaborationPlan}
                                        onChange={(e) => updatePlan(index, 'CollaborationPlan', e.target.value)}
                                        placeholder="Describe the collaboration plan..."
                                        error={hasSubmitted && !plan.CollaborationPlan.trim()}
                                        helperText={hasSubmitted && !plan.CollaborationPlan.trim() ? "Please enter collaboration plan description" : ""}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                fontSize: '0.875rem',
                                            }
                                        }}
                                    />
                                </Grid>

                                {/* Collaboration Budget */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Budget (฿) *
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        type="number"
                                        variant="outlined"
                                        value={plan.CollaborationBudget || ''}
                                        onChange={(e) => updatePlan(index, 'CollaborationBudget', parseFloat(e.target.value) || 0)}
                                        placeholder="Enter budget amount"
                                        error={hasSubmitted && plan.CollaborationBudget <= 0}
                                        helperText={hasSubmitted && plan.CollaborationBudget <= 0 ? "Please enter a valid budget amount" : ""}
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

                                {/* Project Start Date */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                        Project Start Date *
                                    </Typography>
                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <DatePicker
                                            value={plan.ProjectStartDate}
                                            onChange={(newValue) => updatePlan(index, 'ProjectStartDate', newValue)}
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
                            </Grid>

                            {/* Divider between plans */}
                            {index < plans.length - 1 && (
                                <Divider sx={{ mt: 2, mb: 1 }} />
                            )}
                        </Box>
                    ))}

                    {/* Add New Plan Button */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Button
                            variant="outlined"
                            startIcon={<Plus size={16} />}
                            onClick={addNewPlan}
                            sx={{
                                borderStyle: 'dashed',
                                borderWidth: '2px',
                                py: 1.5,
                                px: 3,
                                '&:hover': {
                                    borderStyle: 'solid',
                                    backgroundColor: 'primary.50'
                                }
                            }}
                        >
                            Add New Plan
                        </Button>
                    </Box>
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
                        {isLoading ? 'Updating...' : buttonActive ? 'Updating...' : 'Update Plans'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default EditCollaborationPlansPopup;
