import { useEffect, useMemo, useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import {
    Card,
    CardContent,
    Typography,
    Stack,
    Box,
    LinearProgress,
    Avatar,
    Grid,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { maintenanceTypeConfig } from '../../constants/maintenanceTypeConfig';
import { ChartPie } from 'lucide-react';

interface Props {
    data: Record<string, { total: number; completed: number; completedPercentage: number }>
    height?: number;
    completed: number;
}

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

function MaintenanceTypeDonutChart({ data, height = 220, completed }: Props) {
    const [mode, setMode] = useState<"light" | "dark">(getModeFromClass());

    const [series, setSeries] = useState<number[]>([]);

    // อัปเดต series จาก data
    useEffect(() => {
        const labels = Object.keys(data);
        const newSeries = labels.map(label => data[label].total);
        setSeries(newSeries);
    }, [data]);

    // สังเกต class เปลี่ยน dark/light
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const currentMode = getModeFromClass();
            setMode(currentMode);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // สร้าง options ใหม่เมื่อ mode, data, หรือ completed เปลี่ยน
    const options: ApexOptions = useMemo(() => {
        const labels = Object.keys(data);
        const colors = labels.map(label => maintenanceTypeConfig[label].color);

        return {
            chart: { type: 'donut' },
            labels,
            colors,
            legend: { show: false },
            dataLabels: { enabled: false },
            plotOptions: {
                pie: {
                    donut: {
                        size: '65%',
                        labels: {
                            show: true,
                            name: {
                                show: true,
                                fontSize: '16px',
                                fontWeight: 400,
                                offsetY: 20,
                                color: mode === 'dark' ? '#FFF' : '#000',
                            },
                            value: {
                                show: true,
                                fontSize: '24px',
                                fontFamily: 'Noto Sans Thai, sans-serif',
                                fontWeight: 700,
                                offsetY: -20,
                                color: mode === 'dark' ? '#FFF' : '#000',
                            },
                            total: {
                                show: true,
                                showAlways: true,
                                label: 'Completed',
                                fontSize: '16px',
                                fontFamily: 'Noto Sans Thai, sans-serif',
                                fontWeight: 500,
                                color: mode === 'dark' ? 'rgb(218, 218, 218)' : 'rgb(129, 129, 129)',
                                formatter: () => `${completed}%`,
                            },
                        },
                    },
                },
            },
            tooltip: {
                style: {
                    fontSize: "14px",
                    fontFamily: "Noto Sans Thai, sans-serif",
                    background: 'none'
                },
                theme: mode,
                custom: ({ seriesIndex, w }) => {
                    const label = w.config.labels?.[seriesIndex] ?? '';
                    const completedPercentage = data[label]?.completedPercentage ?? 0;

                    return `
                        <div style="
                            padding: 10px 16px; 
                            font-size: 14px; 
                            font-family: 'Noto Sans Thai', sans-serif;
                            color: ${mode === "dark" ? "#fff" : "#000"};
                            background-color: ${mode === "dark" ? "#333" : "#fff"};
                            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                        ">
                            <div><strong>${label}</strong></div>
                            <div>Completed: <b>${completedPercentage}</b></div>
                        </div>
                    `;
                },
            },
        };
    }, [mode, data, completed]);

    return (
        <Card sx={{ borderRadius: 2, height: '100%', px: 1 }}>
            <CardContent>
                <Grid
                    container
                    size={{ xs: 12, sm: 12, sm650: 4 }}
                    direction={'row'}
                    alignItems={'center'}
                    spacing={1}
                >
                    <ChartPie size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                    <Typography
                        variant="subtitle1"
                        color="text.main"
                        fontWeight={600}
                        fontSize={18}
                    >
                        Maintenance Types
                    </Typography>
                </Grid>

                <Box display="flex" justifyContent="center" alignItems="center" height={height}>
                    {
                        series.length > 0 ? (
                            <ReactApexChart
                                key={`${mode}-${completed}`}
                                options={options}
                                series={series}
                                type="donut"
                                height={height}
                            />
                        ) : (
                            <Typography color="text.secondary">Loading data...</Typography>
                        )}
                </Box>

                <Stack spacing={1.5} mt={2}>
                    {Object.entries(data).map(([label, value]) => {
                        const Icon = maintenanceTypeConfig[label].icon
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
                                            <Icon size={16} style={{ minWidth: '16px', minHeight: '16px', marginBottom: '2px' }} />
                                        </Avatar>
                                        <Typography variant="body2">{label}</Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={500}>
                                        {value.total} Items
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

export default MaintenanceTypeDonutChart;