import React from 'react';
import { Card, CardContent, Typography, Button, Box, Grid2 } from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserTie, faXmark } from '@fortawesome/free-solid-svg-icons';

interface InfoCardProps {
    type: 'approved' | 'assigned';
    title: string;
    name: string | null;
    time: string | null;
    onApprove?: () => void;
    onReject?: () => void;
    onAssign?: () => void;
}

const InfoCard: React.FC<InfoCardProps> = ({
    type,
    title,
    name,
    time,
    onApprove,
    onReject,
    onAssign
}) => (
    <Grid2 size={{ xs: 10, md: 2 }}>
        <Card
            className="card"
            sx={{ width: '100%', borderRadius: 2, px: 2.5, py: 2, minHeight: '100%' }}
        >
            <CardContent className="card-content" sx={{ pt: 3 }}>
                <Grid2 size={{ xs: 10, md: 12 }}>
                    <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16 }}>
                        {title}
                    </Typography>

                    {name == null && type === 'approved' ? (
                        <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                            ยังไม่ได้อนุมัติ
                        </Typography>
                    ) : name == null && type === 'assigned' ? (
                        <Typography variant="body1" sx={{ fontSize: 14, color: '#6D6E70', mb: '4px' }}>
                            ยังไม่ได้มอบหมาย
                        </Typography>
                    ) : (
                        <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 20 }}>
                            {name}
                        </Typography>
                    )}

                    {time == null && type === 'approved' ? (
                        <>
                            <Button
                                variant="contained"
                                onClick={onApprove}
                                sx={{ backgroundColor: '#08aff1', mr: 0.5 }}
                            >
                                อนุมัติ
                            </Button>
                            <Button
                                variant="outlined"
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
                    ) : time == null && type === 'assigned' ? (
                        <Button
                            onClick={onAssign}
                            sx={{
                                bgcolor: '#08aff1',
                                color: '#fff',
                                fontSize: '14px',
                                border: '1px solid #08aff1',
                                '&:hover': {
                                    borderColor: 'transparent'
                                }
                            }}
                        >
                            มอบหมายงาน
                        </Button>
                    ) : (
                        <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: '#6D6E70' }}>
                            {time}
                        </Typography>
                    )}
                </Grid2>

                <Grid2
                    size={{ xs: 10, md: 8 }}
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
                        <FontAwesomeIcon icon={faUserTie} size="2xl" />
                    </Box>
                </Grid2>
            </CardContent>
        </Card>
    </Grid2>
);

export default InfoCard;