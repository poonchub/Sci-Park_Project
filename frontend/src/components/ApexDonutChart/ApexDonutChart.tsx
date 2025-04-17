import { useEffect, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    Box,
    LinearProgress,
    useTheme,
    Avatar,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { maintenanceTypeConfig } from '../../constants/maintenanceTypeConfig';

interface Props {
    data: Record<string, { total: number; completed: number; completedPercentage: number }>
    height?: number;
    completed: number;
}

function ApexDonutChart({ data, height = 220, completed }: Props) {
    const theme = useTheme();

    console.log(completed)

    const [state, setState] = useState<{
        series: number[];
        options: ApexOptions;
    }>({
        series: [],
        options: {
            chart: {
                type: 'donut',
            },
            labels: [],
            legend: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%', // ปรับขนาดรูตรงกลาง
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '16px',
                                fontWeight: 400,
                                color: theme.palette.text.secondary,
                                offsetY: 20,
                            },
                            value: {
                                show: true,
                                fontSize: '24px',
                                fontFamily: 'Noto Sans Thai, sans-serif',
                                fontWeight: 700,
                                color: theme.palette.text.primary,
                                offsetY: -20,
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Completed',
                                fontSize: '16px',
                                fontFamily: 'Noto Sans Thai, sans-serif',
                                fontWeight: 500,
                                color: 'text.secondary',
                                formatter: (): string => {
                                    return `${completed}%`; // Use the completed prop as the default label
                                },
                            },
                        },
                    },
                },
            },
            tooltip: {
                custom: ({ seriesIndex, w }) => {
                    const label = w.config.labels[seriesIndex]; // Get the label name from seriesIndex
                    const completedPercentage = data[label]?.completedPercentage || 0;
                    return `
                        <div style="padding: 10px; font-size: 14px; color: white;">
                            <strong>${label}</strong><br/>
                            Completed: ${completedPercentage}%
                        </div>
                    `;
                },
            },
        },
    });

    useEffect(() => {
        const labels = Object.keys(data);
        const series = labels.map((label) => data[label].total);
        const colors = labels.map((label) => maintenanceTypeConfig[label].color);
    
        setState((prev) => ({
            ...prev,
            series,
            options: {
                ...prev.options,
                labels,
                colors,
                plotOptions: {
                    ...prev.options.plotOptions,
                    pie: {
                        ...prev.options.plotOptions?.pie,
                        donut: {
                            ...prev.options.plotOptions?.pie?.donut,
                            labels: {
                                ...prev.options.plotOptions?.pie?.donut?.labels,
                                total: {
                                    ...prev.options.plotOptions?.pie?.donut?.labels?.total,
                                    formatter: () => `${completed}%`,
                                },
                            },
                        },
                    },
                },
                tooltip: {
                    ...prev.options.tooltip,
                    custom: ({ seriesIndex, w }) => {
                        const label = w.config.labels?.[seriesIndex] ?? '';
                        const completedPercentage = data[label]?.completedPercentage ?? 0;
                        return `
                            <div style="padding: 10px; font-size: 14px; color: white;">
                                <strong>${label}</strong><br/>
                                Completed: ${completedPercentage}%
                            </div>
                        `;
                    },
                },
            },
        }));
    }, [data, completed]);        
    
    return (
        <Card sx={{ borderRadius: 2, height: '100%', px: 1 }}>
            <CardContent>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    การแจ้งซ่อมของเดือนนี้
                </Typography>

                <Box display="flex" justifyContent="center" alignItems="center" height={height}>
                    <ReactApexChart
                        options={state.options}
                        series={state.series}
                        type="donut"
                        height={height}
                    />
                </Box>

                <Stack spacing={1.5} mt={2}>
                    {Object.entries(data).map(([label, value]) => {
                        return (
                            <Box key={label}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                bgcolor: 'transparent',
                                                width: 24,
                                                height: 24,
                                                color: maintenanceTypeConfig[label].color,
                                            }}
                                        >
                                            <FontAwesomeIcon icon={maintenanceTypeConfig[label].icon} size="xs" />
                                        </Avatar>
                                        <Typography variant="body2">{label}</Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={500}>
                                        {value.total} รายการ
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={value.total}
                                    sx={{
                                        mt: 0.5,
                                        height: 6,
                                        borderRadius: 5,
                                        backgroundColor: '#eee',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: maintenanceTypeConfig[label].color,
                                        },
                                    }}
                                />
                            </Box>
                        );
                    })}
                </Stack>
            </CardContent>
        </Card>
    );
}

export default ApexDonutChart;