import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie } from '@fortawesome/free-solid-svg-icons';

// Define the types for the props passed to the InfoCard component
interface InfoCardProps {
    type: 'approved' | 'assigned' | 'unsuccessful'; // Determines if the card is for 'approved' or 'assigned'
    title: string; // Title of the card
    name: string | null; // Name of the person, can be null
    date: string | null; // Time related to the action (approval, assignment), can be null
    description?: string | null;
    onApprove?: () => void; // Callback for approving (optional)
    onReject?: () => void; // Callback for rejecting (optional)
    size?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
}

// InfoCard component definition
const InfoCard: React.FC<InfoCardProps> = ({
    type,
    title,
    name,
    date,
    size
}) => {
    return (
        // Card layout wrapped inside Grid2 for responsiveness
        <Grid size={{
            xs: size?.xs || 12,
            sm: size?.sm || 6,
            md: size?.md || 6,
            lg: size?.lg || 2,
            xl: size?.xl,
        }}>
            <Card
                className="card"
                sx={{ width: '100%', borderRadius: 2, px: 2.4, py: 1.6, minHeight: '100%' }}
            >
                <CardContent className='card-content'>

                    {/* Title of the card */}
                    <Grid size={{ xs: 10, md: 12 }}>
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
                            <>
                                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: 16 }}>
                                    {name}
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: '#6D6E70' }}>
                                    {date}
                                </Typography>
                            </>
                        )}
                    </Grid>

                    {/* Icon displaying an avatar or role-related icon */}
                    <Grid
                        size={{ xs: 10, md: 6 }}
                        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}
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
                    </Grid>

                </CardContent>
            </Card>
        </Grid>
    );
}

export default InfoCard;