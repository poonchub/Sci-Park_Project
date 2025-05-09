import { Avatar, Box, Card, Grid2, LinearProgress, Stack, Typography } from "@mui/material";
import { useMemo } from "react";
import { statusConfig } from "../../constants/statusConfig";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Props {
    statusCounts: Record<string, number>
}

function RequestStatusStack({ statusCounts }: Props) {

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
        <Grid2 container spacing={1.4} size={{ xs: 12, md: 12 }}>
            {Object.entries(mergedStatusCounts).map(([label, value]) => {
                return (
                    <Grid2 size={{ xs: 12, md: 3 }} key={label}>
                        <Card sx={{ px: 2, py: 1.8 }}>
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
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
                                <Typography variant="body2" fontWeight={500}>
                                    {value} รายการ
                                </Typography>
                            </Stack>
                        </Card>
                    </Grid2>
                );
            })}
        </Grid2>
    )
}
export default RequestStatusStack;