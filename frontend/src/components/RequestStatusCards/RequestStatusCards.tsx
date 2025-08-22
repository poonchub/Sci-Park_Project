import React from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { statusConfig } from "../../constants/statusConfig";
import { HelpCircle } from "lucide-react";

interface Props {
    statusCounts: Record<string, number>;
    size?: {
        xs?: number;
        sm?: number;
        md?: number;
        md1000?: number;
        lg?: number;
        xl?: number;
    };
    customDisplayStatuses?: string[];
}

const RequestStatusCards: React.FC<Props> = ({ statusCounts, size, customDisplayStatuses }) => {
    const displayStatuses = customDisplayStatuses || ["Pending", "Approved", "In Progress", "Waiting For Review", "Completed", "Unsuccessful"];

    const statusCards = displayStatuses.map((status) => {
        let count = statusCounts?.[status] ?? 0;
        if (status === "Approved") {
            const approveStatuses = ["Approved", "Rework Requested"];
            count = approveStatuses.reduce((sum, key) => sum + (statusCounts?.[key] ?? 0), 0);
        }

        const statusKey = status as keyof typeof statusConfig;
        const { color, colorLite, icon } = statusConfig[statusKey] ?? {
            color: "#000",
            colorLite: "#000",
            icon: HelpCircle,
        };

        return { name: status, count, color, colorLite, icon };
    });

    return statusCards.map((item, index) => {
        const Icon = item.icon
        return (
            <Grid
                key={index}
                size={{
                    xs: size?.xs || 12,
                    sm: size?.sm || 6,
                    md: size?.md || 6,
                    md1000: size?.md1000 || 4,
                    lg: size?.lg,
                    xl: size?.xl,
                }}
                className="status-section"
                sx={{
                    display: {
                        xs: "none",
                        md: "Grid",
                    },
                }}
            >
                <Card
                    className="status-card"
                    sx={{ height: "100%", borderRadius: 2, px: 2.5, py: 2, borderLeft: `4px solid ${item.color}` }}
                >
                    <CardContent className="status-card-content" sx={{ height: "100%" }}>
                        <Grid
                            size={{ xs: 10, md: 12 }}
                            container
                            direction="column"
                            sx={{
                                height: "100%",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                            }}
                        >
                            <Typography variant="body1" sx={{ fontWeight: 500, fontSize: 16, color: "text.secondary" }}>
                                {item.name}
                            </Typography>
                            <Typography variant="h5" fontWeight="bold" color="textPrimary">
                                <Box component="span">{item.count}</Box>{" "}
                                <Box component="span" sx={{ fontSize: 16, fontWeight: 600 }}>
                                    Items
                                </Box>
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
                                <Icon size={28} style={{ minWidth: "28px", minHeight: "28px" }} strokeWidth={2} />
                            </Box>
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        );
    });
};

export default RequestStatusCards;
