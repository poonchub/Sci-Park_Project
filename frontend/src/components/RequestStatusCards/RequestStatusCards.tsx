import React from "react";
import { Box, Card, CardContent, Grid2, Typography } from "@mui/material";
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
        // if (status === "Unsuccessful") {
        //     const failedStatuses = ["Rejected", "Failed", "Cancelled"];
        //     count = failedStatuses.reduce(
        //         (sum, key) => sum + (statusCounts?.[key] ?? 0),
        //         0
        //     );
        // } else {
            
        // }

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
            <Grid2 key={index}
                size={{
                    xs: size?.xs || 12,
                    sm: size?.sm,
                    md: size?.md || 4,
                    lg: size?.lg,
                    xl: size?.xl,
                }}
                className='status-section'
            >
                <Card className="status-card" sx={{ height: "100%", borderRadius: 2, px: 2.5, py: 2 }}>
                    <CardContent className="status-card-content">
                        <Grid2 size={{ xs: 10, md: 12 }}>
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16 }}>
                                {item.name}
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, fontSize: 20 }}>
                                {item.count} รายการ
                            </Typography>
                        </Grid2>
                        <Grid2
                            size={{ xs: 10, md: 8 }}
                            sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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
                                    color: item.color,
                                }}
                            >
                                <FontAwesomeIcon icon={item.icon} size="2xl" />
                            </Box>
                        </Grid2>
                    </CardContent>
                </Card>
            </Grid2>
        ))
    );
};

export default RequestStatusCards;
