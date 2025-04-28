import React from 'react';
import { Card, CardContent, Typography, Button, Box, Grid2 } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faXmark } from '@fortawesome/free-solid-svg-icons';
import { isAdmin, isManager } from '../../routes';

// Define the types for the props passed to the InfoCard component
interface InfoCardProps {
    type: 'approved' | 'assigned'; // Determines if the card is for 'approved' or 'assigned'
    title: string; // Title of the card
    name: string | null; // Name of the person, can be null
    time: string | null; // Time related to the action (approval, assignment), can be null
    onApprove?: () => void; // Callback for approving (optional)
    onReject?: () => void; // Callback for rejecting (optional)
    onAssign?: () => void; // Callback for assigning (optional)
    status?: string
}

// InfoCard component definition
const InfoCard: React.FC<InfoCardProps> = ({
    type,
    title,
    name,
    time,
    onApprove,
    onReject,
    onAssign,
    status,
}) => {

    const isApprovedBtnOn = time == null && type === 'approved' && (isManager || isAdmin)

    return (
        // Card layout wrapped inside Grid2 for responsiveness
        <Grid2 size={{ xs: 10, md: 2 }}>
            <Card
                className="card"
                sx={{ width: '100%', borderRadius: 2, px: 2.5, py: 2, minHeight: '100%' }}
            >
                <CardContent className="card-content" sx={{ pt: 3 }}>

                    {/* Title of the card */}
                    <Grid2 size={{ xs: 10, md: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16 }}>
                            {title}
                        </Typography>

                        {/* Handle the case where name is null */}
                        {name == null && type === 'approved' ? (
                            <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                                ยังไม่ได้อนุมัติ
                            </Typography>
                        ) : name == null && type === 'assigned' ? (
                            <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                                ยังไม่ได้มอบหมาย
                            </Typography>
                        ) : (
                            <Typography variant="body1" sx={{ fontWeight: 700, fontSize: 16 }}>
                                {name}
                            </Typography>
                        )}

                        {/* Handle actions (approve, reject, assign) based on the 'time' value */}
                        { isApprovedBtnOn ? (
                            <>
                                {/* Approve button */}
                                <Button
                                    variant="containedBlue"
                                    onClick={onApprove}
                                    sx={{ backgroundColor: '#08aff1', mr: 0.5 }}
                                >
                                    อนุมัติ
                                </Button>
                                {/* Reject button */}
                                <Button
                                    variant="outlinedCancel"
                                    onClick={onReject}
                                    sx={{
                                        minWidth: '0px',
                                        px: '6px',
                                        color: '#FF3B30',
                                        borderColor: '#FF3B30'
                                    }}
                                >
                                    <FontAwesomeIcon icon={faXmark} size="xl" />
                                </Button>
                            </>
                        ) : (
                            // Display the time when the task has been either approved or assigned
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: '#6D6E70' }}>
                                {time}
                            </Typography>
                        )}
                    </Grid2>

                    {/* Icon displaying an avatar or role-related icon */}
                    <Grid2
                        size={{ xs: 10, md: 6 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Box
                            sx={{
                                borderRadius: '50%',
                                bgcolor: '#F26522',
                                border: 1,
                                aspectRatio: '1/1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 55,
                                color: '#fff'
                            }}
                        >
                            {/* Icon representing the role or user */}
                            <FontAwesomeIcon icon={faUserTie} size="2xl" />
                        </Box>
                    </Grid2>
                </CardContent>
            </Card>
        </Grid2>
    );
}

export default InfoCard;