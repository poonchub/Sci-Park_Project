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

interface Props {
    data: Record<string, number>; // category: count
    height?: number;
}

const COLORS = ['#3B00B9', '#C800D1', '#F5005B', '#FFA500', '#A0A0A0'];

function ApexDonutChart({ data, height = 260 }: Props) {
    const theme = useTheme();
    const total = Object.values(data).reduce((a, b) => a + b, 0);

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
            colors: COLORS,
            legend: {
                show: false,
            },
            dataLabels: {
                enabled: false,
            },
            plotOptions: {
                pie: {
                  donut: {
                    size: '75%', // ปรับขนาดรูตรงกลาง
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
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        offsetY: -10,
                        formatter: () => '84%',
                      },
                      total: {
                        show: true,
                        label: 'success',
                        fontSize: '16px',
                        color: 'text.secondary',
                        formatter: (): string => {
                          const total = state.series.reduce((a, b) => a + b, 0);
                          const success = state.series[0] ?? 0; // สมมุติว่าชิ้นแรกคือ success
                          return `${Math.round((success / total) * 100)}%`;
                        },
                      },
                    },
                  },
                },
              }              
        },
    });

    useEffect(() => {
        const labels = Object.keys(data);
        const series = labels.map((label) => data[label]);

        setState((prev) => ({
            ...prev,
            series,
            options: {
                ...prev.options,
                labels,
            },
        }));
    }, [data]);

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
                    {Object.entries(data).map(([label, value], idx) => {
                        const percent = total ? (value / total) * 100 : 0;
                        return (
                            <Box key={label}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                bgcolor: COLORS[idx % COLORS.length],
                                                width: 14,
                                                height: 14,
                                            }}
                                        />
                                        <Typography variant="body2">{label}</Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={500}>
                                        {value} รายการ
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={percent}
                                    sx={{
                                        mt: 0.5,
                                        height: 6,
                                        borderRadius: 5,
                                        backgroundColor: '#eee',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: COLORS[idx % COLORS.length],
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