import { Avatar, Card, Grid, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { statusConfig } from "../../constants/statusConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

function RequestStatusStack({ statusCounts, size }: Props) {

    const mergedStatusCounts = useMemo(() => {
        const result: Record<string, number> = {};

        // รวมหลายสถานะเป็น In Process
        const inProcessStatuses = ["Pending", "Approved", "In Progress", "Rework Requested"];
        const inProcessTotal = inProcessStatuses.reduce(
            (sum, status) => sum + (statusCounts[status] || 0), 0
        );

        if (inProcessTotal !== undefined) {
            result["In Process"] = inProcessTotal;
        }

        // แสดงสถานะอื่นที่เหลือ ยกเว้น Created
        const includeStatuses = ["Waiting For Review", "Completed", "Unsuccessful"];
        includeStatuses.forEach(status => {
            const count = statusCounts[status];
            if (count !== undefined) {
                result[status] = count;
            }
        });

        return result;
    }, [statusCounts]);

    return (
        <Grid container spacing={1.4} size={{ xs: 12, md: 12 }}>
            {Object.entries(mergedStatusCounts).map(([label, value]) => {
                return (
                    <Grid size={{
                        xs: size?.xs || 12,
                        sm: size?.sm,
                        md: size?.md || 6,
                        lg: size?.lg || 3,
                        xl: size?.xl,
                    }} key={label}>
                        <Card sx={{ px: 2, py: 1.8, height: '100%', borderRadius: 2, alignItems: 'center', display: 'grid' }}>
                            <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                                <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Avatar
                                        variant="rounded"
                                        sx={{
                                            bgcolor: 'transparent',
                                            width: 24,
                                            height: 24,
                                            color: statusConfig[label].color,
                                        }}
                                    >
                                        <FontAwesomeIcon icon={statusConfig[label].icon} size="xs" />
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>{label}</Typography>
                                </Stack>
                                <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'end'}}>
                                    {value} รายการ
                                </Typography>
                            </Stack>
                        </Card>
                    </Grid>
                );
            })}
        </Grid>
    )
}
export default RequestStatusStack;