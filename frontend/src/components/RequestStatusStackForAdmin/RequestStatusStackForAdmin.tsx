import React from "react";
import { Avatar, Card, Grid, Stack, Typography } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faQuestionCircle } from "@fortawesome/free-solid-svg-icons";
import { statusConfig } from "../../constants/statusConfig";
import { FileQuestion } from "lucide-react";

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

const RequestStatusStackForAdmin: React.FC<Props> = ({ statusCounts, size }) => {
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
            icon: FileQuestion
        };

        return { name: status, count, color, colorLite, icon };
    });

    return (
        <Grid
            container
            spacing={1.4}
            size={{ xs: 12, md: 12 }}
            sx={{
                display: {
                    md: 'none',
                }
            }}
        >
            {
                statusCards.map((item, index) => {
                    const Icon = statusConfig[item.name].icon
                    return (
                        <Grid
                            size={{
                                xs: size?.xs || 12,
                                sm: size?.sm || 12,
                                sm650: 6,
                                md: size?.md || 6,
                                lg: size?.lg,
                                xl: size?.xl,
                            }}
                            key={index}
                        >
                            <Card sx={{ px: 2, py: 1.8, height: '100%', borderRadius: 2,alignItems: 'center', display: 'grid', borderLeft: `4px solid ${statusConfig[item.name].color}` }} >
                                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                bgcolor: 'transparent',
                                                width: 24,
                                                height: 24,
                                                color: statusConfig[item.name].color,
                                            }}
                                        >
                                            <Icon size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                        </Avatar>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.name}</Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'end'}}>
                                        {item.count}
                                    </Typography>
                                </Stack>
                            </Card>
                        </Grid>
                    )
                })
            }
        </Grid>
    );
};

export default RequestStatusStackForAdmin;
