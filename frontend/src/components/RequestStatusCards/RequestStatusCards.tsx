import React from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { statusConfig } from "../../constants/statusConfig";

interface Props {
    statusCounts: Record<string, number>;
    size?: {
        xs?: number;
        sm?: number;
        md?: number;
        lg?: number;
        xl?: number;
    };
}

const RequestStatusCards: React.FC<Props> = ({ statusCounts, size }) => {
    const displayStatuses = [
        "Pending",
        "Approved",
        "In Progress",
        "Waiting For Review",
        "Completed",
        "Unsuccessful"
    ];

    const statusCards = displayStatuses.map((status) => {
        let count = statusCounts?.[status] ?? 0;
        if (status === "Approved") {
            const approveStatuses = ["Approved", "Rework Requested"];
            count = approveStatuses.reduce(
                (sum, key) => sum + (statusCounts?.[key] ?? 0),
                0
            );
        }

        const statusKey = status as keyof typeof statusConfig
        const { color, colorLite, icon } = statusConfig[statusKey] ?? {
            color: "#000",
            colorLite: "#000",
            icon: faQuestionCircle
        };

        return { name: status, count, color, colorLite, icon };
    });

    return (
        statusCards.map((item, index) => (
            <Grid key={index}
                size={{
                    xs: size?.xs || 12,
                    sm: size?.sm || 6,
                    md: size?.md || 4,
                    lg: size?.lg,
                    xl: size?.xl,
                }}
                className='status-section'
                sx={{
                    display: {
                        xs: 'none',
                        md: 'Grid',
                    }
                }}
            >
                <Card className="status-card" sx={{ height: "100%", borderRadius: 2, px: 2.5, py: 2, borderLeft: `4px solid ${item.color}` }}>
                    <CardContent className="status-card-content" sx={{ height: '100%' }}>
                        <Grid size={{ xs: 10, md: 12 }}
                            container
                            direction="column"
                            sx={{
                                height: '100%',
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: 'text.secondary' }}>
                                {item.name}
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="textPrimary">
                                {item.count} รายการ
                            </Typography>
                        </Grid>
                        <Grid
                            size={{ xs: 10, md: 4 }}
                            sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}
                        >
                            <Box
                                sx={{
                                    borderRadius: "50%",
                                    bgcolor: item.colorLite,
                                    border: 1,
                                    aspectRatio: "1/1",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: 55,
                                    height: 55,
                                    color: item.color,
                                }}
                            >
                                <FontAwesomeIcon icon={item.icon} size="2xl" />
                            </Box>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        ))
    );
};

export default RequestStatusCards;
