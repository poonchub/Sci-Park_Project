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
    ToggleButton,
    ToggleButtonGroup,
} from '@mui/material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFile, faUser, faHome, faCalendarCheck, faWrench, faUserCircle, faQuestion } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { analyticsService, PopularPagesByPeriodData } from '../../services/analyticsService';

export interface PageConfig {
    color: string;
    colorLite: string;
    icon: IconDefinition;
}

export const pageConfig: Record<string, PageConfig> = {
    "Home": {
        color: "#4caf50",
        colorLite: "rgba(76, 175, 80, 0.16)",
        icon: faHome
    },
    "Booking Room": {
        color: "#ff9800",
        colorLite: "rgba(255, 152, 0, 0.18)",
        icon: faCalendarCheck
    },
    "My Maintenance Request": {
        color: "#9c27b0",
        colorLite: "rgba(156, 39, 176, 0.18)",
        icon: faWrench
    },
    "My Account": {
        color: "#2196f3",
        colorLite: "rgba(33, 150, 243, 0.18)",
        icon: faUserCircle
    },
};

interface Props {
    data?: Array<{
        page_name: string;
        total_visits: number;
        unique_visitors: number;
        average_duration: number;
        bounce_rate: number;
    }>;
    height?: number;
    totalVisits?: number;
    title?: string;
    usePeriodSelector?: boolean;
}

const getModeFromClass = () => {
    return document.documentElement.classList.contains("dark") ? "dark" : "light";
};

// เพิ่มฟังก์ชัน normalizePageName
export const normalizePageName = (name: string) => {
    if (name === 'Home Page' || name === 'Home') return 'Home';
    if (name === 'Booking Room') return 'Booking Room';
    if (name === 'My Maintenance Request') return 'My Maintenance Request';
    if (name === 'My Account') return 'My Account';
    return name;
};

function PopularPagesDonutChart({ data, height = 220, totalVisits, title = "Popular Pages", usePeriodSelector = false }: Props) {
    const [mode, setMode] = useState<"light" | "dark">(getModeFromClass());
    const [period, setPeriod] = useState<string>("today");
    const [periodData, setPeriodData] = useState<PopularPagesByPeriodData | null>(null);
    const [loading, setLoading] = useState(false);

    const [series, setSeries] = useState<number[]>([]);

    // ดึงข้อมูล period เมื่อ period เปลี่ยน
    useEffect(() => {
        if (usePeriodSelector) {
            const fetchPeriodData = async () => {
                setLoading(true);
                try {
                    const result = await analyticsService.getPopularPagesByPeriod(period);
                    setPeriodData(result);
                } catch (error) {
                    console.error('Error fetching period data:', error);
                } finally {
                    setLoading(false);
                }
            };
            fetchPeriodData();
        }
    }, [period, usePeriodSelector]);

    // อัปเดต series จาก data หรือ periodData
    useEffect(() => {
        if (usePeriodSelector && periodData) {
            const newSeries = periodData.data.map(item => item.visits);
            setSeries(newSeries);
        } else if (data) {
            const newSeries = data.map(item => item.total_visits);
            setSeries(newSeries);
        }
    }, [data, periodData, usePeriodSelector]);

    // สังเกต class เปลี่ยน dark/light
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const currentMode = getModeFromClass();
            setMode(currentMode);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    // คำนวณ total visits สำหรับโดนัทกราฟ
    const donutTotal = (usePeriodSelector && periodData)
        ? periodData.data.reduce((sum, item) => sum + (typeof item.visits === 'number' ? item.visits : 0), 0)
        : totalVisits || 0;

    // สร้าง options ใหม่เมื่อ mode, data, หรือ totalVisits เปลี่ยน
    const options: ApexOptions = useMemo(() => {
        let labels: string[] = [];
        let colors: string[] = [];
        let donutTotal = 0;

        if (usePeriodSelector && periodData && Array.isArray(periodData.data)) {
            labels = periodData.data.map(item => item.name);
            colors = periodData.data.map(item => item.color);
            donutTotal = periodData.data.reduce((sum, item) => sum + (typeof item.visits === 'number' ? item.visits : 0), 0);
        } else if (data && Array.isArray(data)) {
            labels = data.map(item => item.page_name);
            colors = data.map(item => {
                const config = pageConfig[normalizePageName(item.page_name)];
                return config ? config.color : '#708090';
            });
            donutTotal = data.reduce((sum, item) => sum + (typeof item.total_visits === 'number' ? item.total_visits : 0), 0);
        } else {
            donutTotal = 0;
        }

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
                                label: 'Total Visits',
                                fontSize: '16px',
                                fontFamily: 'Noto Sans Thai, sans-serif',
                                fontWeight: 500,
                                color: mode === 'dark' ? 'rgb(218, 218, 218)' : 'rgb(129, 129, 129)',
                                formatter: () => `${donutTotal.toLocaleString()}`,
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
                    if (usePeriodSelector && periodData) {
                        const item = periodData.data[seriesIndex];
                        if (!item) return '';
                        return `
                            <div style="
                                padding: 10px 16px; 
                                font-size: 14px; 
                                font-family: 'Noto Sans Thai', sans-serif;
                                color: ${mode === "dark" ? "#fff" : "#000"};
                                background-color: ${mode === "dark" ? "#333" : "#fff"};
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                            ">
                                <div><strong>${item.name}</strong></div>
                                <div>Visits: <b>${item.visits.toLocaleString()}</b></div>
                            </div>
                        `;
                    } else if (data) {
                        const pageData = data[seriesIndex];
                        if (!pageData) return '';
                        return `
                            <div style="
                                padding: 10px 16px; 
                                font-size: 14px; 
                                font-family: 'Noto Sans Thai', sans-serif;
                                color: ${mode === "dark" ? "#fff" : "#000"};
                                background-color: ${mode === "dark" ? "#333" : "#fff"};
                                box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
                            ">
                                <div><strong>${pageData.page_name}</strong></div>
                                <div>Total Visits: <b>${pageData.total_visits.toLocaleString()}</b></div>
                                <div>Unique Visitors: <b>${pageData.unique_visitors}</b></div>
                                <div>Avg Duration: <b>${Math.floor(pageData.average_duration / 60)}m ${(pageData.average_duration % 60).toFixed(2)}s</b></div>
                                <div>Bounce Rate: <b>${pageData.bounce_rate.toFixed(1)}%</b></div>
                            </div>
                        `;
                    }
                    return '';
                },
            },
        };
    }, [mode, data, usePeriodSelector, periodData]);

    useEffect(() => {
        if (data) {
            console.log("PopularPagesDonutChart data:", data.map(d => d.page_name));
            console.log("PopularPagesDonutChart full data:", data);
            // ดูว่า page_name ที่ backend ส่งมาตรงกับ key ใน pageConfig หรือ normalizePageName หรือไม่
            data.forEach(item => {
                const key = normalizePageName(item.page_name);
                const config = pageConfig[key];
                console.log('key:', key, 'config:', config);
            });
        }
        if (periodData) {
            console.log("PopularPagesDonutChart periodData:", periodData);
        }
    }, [data, periodData]);

    return (
        <Card sx={{ borderRadius: 2, height: '100%', px: 1 }}>
            <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                        {title}
                    </Typography>
                    {usePeriodSelector && (
                        <ToggleButtonGroup
                            value={period}
                            exclusive
                            onChange={(_, newPeriod) => {
                                if (newPeriod !== null) {
                                    setPeriod(newPeriod);
                                }
                            }}
                            size="small"
                        >
                            <ToggleButton value="today">Today</ToggleButton>
                            <ToggleButton value="week">Week</ToggleButton>
                            <ToggleButton value="month">Month</ToggleButton>
                            <ToggleButton value="year">Year</ToggleButton>
                        </ToggleButtonGroup>
                    )}
                </Box>

                <Box display="flex" justifyContent="center" alignItems="center" height={height}>
                    {series.length > 0 ? (
                        <ReactApexChart
                            key={mode}
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
                    {(usePeriodSelector && periodData ? periodData.data : data || []).map((pageData: any) => {
                        const pageName = pageData.page_name || pageData.name;
                        const visits = pageData.total_visits || pageData.visits || 0;
                        
                        let config = pageConfig[normalizePageName(pageName)];
                        let color = config ? config.color : '#708090';
                        let icon = config ? config.icon : faQuestion;
                        
                        // กำหนด default icon และสีถ้าไม่มีใน config
                        if (!config) {
                            switch (pageName) {
                                case 'Home':
                                case 'Home Page':
                                    icon = faHome;
                                    color = '#4caf50';
                                    break;
                                case 'Booking Room':
                                    icon = faCalendarCheck;
                                    color = '#ff9800';
                                    break;
                                case 'My Maintenance Request':
                                case 'Maintenance':
                                    icon = faWrench;
                                    color = '#9c27b0';
                                    break;
                                case 'My Account':
                                    icon = faUserCircle;
                                    color = '#2196f3';
                                    break;
                                default:
                                    icon = faQuestion;
                                    color = '#708090';
                            }
                        }
                        return (
                            <Box key={pageName}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between">
                                    <Stack direction="row" spacing={1.5} alignItems="center">
                                        <Avatar
                                            variant="rounded"
                                            sx={{
                                                bgcolor: 'transparent',
                                                width: 24,
                                                height: 24,
                                                color: color,
                                            }}
                                        >
                                            {icon && <FontAwesomeIcon icon={icon} size="xs" />}
                                        </Avatar>
                                        <Typography variant="body2">{pageName}</Typography>
                                    </Stack>
                                    <Typography variant="body2" fontWeight={500}>
                                        {visits.toLocaleString()} Visits
                                    </Typography>
                                </Stack>
                                <LinearProgress
                                    variant="determinate"
                                    value={(visits / (usePeriodSelector && periodData ? periodData.total_visits : totalVisits || 1)) * 100}
                                    sx={{
                                        mt: 0.5,
                                        height: 6,
                                        borderRadius: 5,
                                        backgroundColor: '#eee',
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: color,
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

export default PopularPagesDonutChart; 