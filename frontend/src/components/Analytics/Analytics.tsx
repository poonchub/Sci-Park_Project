import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Grid,
    Tab,
    Tabs,
    Typography,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Chip,
    Alert,
    IconButton,
    Avatar,
} from '@mui/material';
import {

    CalendarMonth,

} from '@mui/icons-material';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Bar,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import PopularPagesDonutChart from '../PopularPagesDonutChart/PopularPagesDonutChart';
import {
    faBroom,
    faChartLine,
    faUsers,
    faEye,
    faClock,
    faRotateRight,
    IconDefinition,
    faQuestion,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CustomTabPanel from '../CustomTabPanel/CustomTabPanel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '../DatePicker/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { 
    analyticsService, 
    AnalyticsData, 
    SystemAnalyticsData, 
    PageAnalyticsData,
    PerformanceAnalyticsData,
    KEY_PAGES 
} from '../../services/analyticsService';
import { pageConfig, normalizePageName } from '../PopularPagesDonutChart/PopularPagesDonutChart';


const Analytics: React.FC = () => {
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [systemAnalyticsData, setSystemAnalyticsData] = useState<SystemAnalyticsData | null>(null);
    const [pageData, setPageData] = useState<PageAnalyticsData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [valueTab, setValueTab] = useState(0);
    const [startDate, setStartDate] = useState<Dayjs | null>(dayjs().subtract(6, 'day'));
    const [endDate, setEndDate] = useState<Dayjs | null>(dayjs());
    const [visitsRangeData, setVisitsRangeData] = useState<Array<{date: string, total_visits: number}>>([]);
    const [performanceData, setPerformanceData] = useState<PerformanceAnalyticsData | null>(null);
    const [performanceLoading, setPerformanceLoading] = useState(false);

    useEffect(() => {
        loadAnalyticsData();
        // Remove analytics tracking from Analytics component
        // analyticsService.trackKeyPageVisit(KEY_PAGES.ANALYTICS, 'Analytics Dashboard');
    }, []);



    // ดึง visits-range และ performance data เมื่อช่วงวันที่เปลี่ยน
    useEffect(() => {
        const fetchData = async () => {
            if (!startDate || !endDate) return;
            setError(null);
            setPerformanceLoading(true);
            try {
                const start = startDate.format('YYYY-MM-DD');
                const end = endDate.format('YYYY-MM-DD');
                
                // Fetch visits range data
                const visitsData = await analyticsService.getVisitsRange(start, end);
                if (visitsData) {
                    setVisitsRangeData(visitsData);
                } else {
                    setVisitsRangeData([]);
                }

                // Fetch performance data
                const perfData = await analyticsService.getPerformanceAnalytics(start, end);
                console.log('Performance data received:', perfData);
                if (perfData) {
                    setPerformanceData(perfData);
                } else {
                    setPerformanceData(null);
                }
            } catch (err) {
                setError('Failed to load data.');
                setVisitsRangeData([]);
                setPerformanceData(null);
            } finally {
                setPerformanceLoading(false);
            }
        };
        fetchData();
    }, [startDate, endDate]);

    const loadAnalyticsData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Load dashboard analytics
            const dashboardData = await analyticsService.getDashboardAnalytics();
            console.log('Dashboard Analytics Data:', dashboardData);
            if (dashboardData) {
                setAnalyticsData(dashboardData);
            }

            // Load system analytics
            const systemData = await analyticsService.getSystemAnalytics();
            console.log('System Analytics Data:', systemData);
            if (systemData) {
                setSystemAnalyticsData(systemData);
            }

            // Transform popular pages data for the donut chart - ใช้ข้อมูลวันนี้จาก dashboard
            if (dashboardData && dashboardData.popular_pages_today) {
                const transformedPageData = dashboardData.popular_pages_today.map((page: any) => ({
                    page_path: page.page_path,
                    page_name: page.page_name,
                    total_visits: page.total_visits,
                    unique_visitors: page.unique_visitors,
                    average_duration: page.average_duration,
                    bounce_rate: page.bounce_rate,
                }));
                setPageData(transformedPageData);
            }

        } catch (err) {
            console.error('Error loading analytics:', err);
            setError('Failed to load analytics data. Please try again later.');
        } finally {
            setLoading(false);
        }
    };



    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValueTab(newValue);
    };

    const handleClearFilter = () => {
        setStartDate(dayjs().subtract(6, 'day'));
        setEndDate(dayjs());
    };

    function a11yProps(index: number) {
        return {
            id: `analytics-tab-${index}`,
            "aria-controls": `analytics-tabpanel-${index}`,
        };
    }

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = (seconds % 60).toFixed(2);
        return `${minutes}m ${remainingSeconds}s`;
    };

    // Filter key pages only (optional feature)
    const getKeyPagesData = () => {
        const keyPagePaths = Object.values(KEY_PAGES);
        return pageData.filter(page => keyPagePaths.includes(page.page_path as any));
    };

    // New statistics calculations
    const calculateTimeBasedStats = () => {
        if (!pageData.length) return null;
        
        // Calculate peak hours (mock data for now)
        const peakHours = [
            { hour: '09:00-11:00', visits: 45 },
            { hour: '11:00-13:00', visits: 38 },
            { hour: '13:00-15:00', visits: 52 },
            { hour: '15:00-17:00', visits: 41 },
            { hour: '17:00-19:00', visits: 29 }
        ];

        // Calculate session duration distribution
        const durationDistribution = [
            { range: '0-30s', count: 25, percentage: 15 },
            { range: '30s-2m', count: 45, percentage: 27 },
            { range: '2m-5m', count: 52, percentage: 31 },
            { range: '5m-10m', count: 28, percentage: 17 },
            { range: '10m+', count: 18, percentage: 10 }
        ];

        return { peakHours, durationDistribution };
    };

    const calculateUserEngagementStats = () => {
        if (!pageData.length) return null;

        // Calculate engagement metrics
        const totalVisits = pageData.reduce((sum, page) => sum + page.total_visits, 0);
        const totalUniqueVisitors = pageData.reduce((sum, page) => sum + page.unique_visitors, 0);
        const avgBounceRate = pageData.reduce((sum, page) => sum + page.bounce_rate, 0) / pageData.length;
        const avgDuration = pageData.reduce((sum, page) => sum + page.average_duration, 0) / pageData.length;

        // Engagement Score (0-100)
        const engagementScore = Math.round(
            ((100 - avgBounceRate) * 0.4) + 
            (Math.min(avgDuration / 60, 10) * 6) // Max 10 minutes = 60 points
        );

        return {
            totalVisits,
            totalUniqueVisitors,
            avgBounceRate: avgBounceRate.toFixed(1),
            avgDuration: avgDuration.toFixed(2),
            engagementScore,
            pagesPerSession: (totalVisits / totalUniqueVisitors).toFixed(2)
        };
    };

    const calculateBehavioralStats = () => {
        if (!pageData.length) return null;

        // Calculate behavioral insights
        const highEngagementPages = pageData
            .filter(page => page.average_duration > 120 && page.bounce_rate < 30)
            .sort((a, b) => b.average_duration - a.average_duration)
            .slice(0, 3);

        const lowEngagementPages = pageData
            .filter(page => page.average_duration < 30 || page.bounce_rate > 70)
            .sort((a, b) => a.average_duration - b.average_duration)
            .slice(0, 3);

        return {
            highEngagementPages,
            lowEngagementPages,
            totalPages: pageData.length,
            pagesWithGoodPerformance: pageData.filter(page => page.bounce_rate < 50).length
        };
    };

    // Summary Card Component matching Dashboard style
    const SummaryCard: React.FC<{
        title: string;
        value: string | number;
        icon: IconDefinition;
        color: string;
        subtitle?: string;
    }> = ({ title, value, icon, color, subtitle }) => (
        <Card
            sx={{
                height: "100%",
                borderLeft: `4px solid ${color}`,
                borderRadius: 2,
            }}
        >
            <CardContent
                sx={{
                    padding: "16px 20px !important",
                    display: "flex",
                    alignItems: "center",
                    height: "100%",
                }}
            >
                <Grid
                    size={{ xs: 10, md: 12 }}
                    container
                    direction="column"
                    sx={{
                        height: "100%",
                        alignItems: "flex-start",
                    }}
                >
                    <Typography
                        variant="h6"
                        sx={{
                            fontWeight: 500,
                            fontSize: 16,
                            color: "text.secondary",
                        }}
                        gutterBottom
                    >
                        {title}
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" color="textPrimary">
                        {value.toLocaleString()}
                    </Typography>
                    {subtitle && (
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                            {subtitle}
                        </Typography>
                    )}
                </Grid>
                <Grid
                    size={{ xs: 10, md: 4 }}
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-end",
                    }}
                >
                    <Box
                        sx={{
                            borderRadius: "50%",
                            border: 1,
                            aspectRatio: "1/1",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 55,
                            height: 55,
                            color: color,
                        }}
                    >
                        <FontAwesomeIcon icon={icon} size="2xl" />
                    </Box>
                </Grid>
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography>Loading analytics data...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 2 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    // Use key pages data if available, otherwise use all page data
    const displayPageData = getKeyPagesData().length > 0 ? getKeyPagesData() : pageData;

    return (
        <Box className="analytics-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid className="title-box" size={{ xs: 8, md: 10 }}>
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            System Analytics Dashboard
                        </Typography>
                    </Grid>
                    <Grid size={{ xs: 4, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={loadAnalyticsData}
                            disabled={loading}
                            startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </Button>
                    </Grid>

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Tabs
                            value={valueTab}
                            onChange={handleChange}
                            aria-label="analytics tabs"
                            sx={{
                                borderBottom: 1,
                                borderColor: "divider",
                                mb: 3,
                            }}
                        >
                            <Tab label="Overview" {...a11yProps(0)} />
                            <Tab label="Performance" {...a11yProps(1)} />
                            <Tab label="User Engagement" {...a11yProps(2)} />
                            <Tab label="Behavioral Insights" {...a11yProps(3)} />
                        </Tabs>
                    </Grid>

                    <CustomTabPanel value={valueTab} index={0}>
                        <Grid container spacing={3}>
                            {/* Summary Cards */}
                            <Grid container size={{ xs: 12 }} spacing={3}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="Today's Visits"
                                        value={analyticsData?.today_visits || 0}
                                        icon={faChartLine}
                                        color="#1976d2"
                                        subtitle="Current day"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="This Week"
                                        value={analyticsData?.week_visits || 0}
                                        icon={faUsers}
                                        color="#4caf50"
                                        subtitle="7 days"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="This Month"
                                        value={analyticsData?.month_visits || 0}
                                        icon={faEye}
                                        color="#ff9800"
                                        subtitle="30 days"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="Total Users"
                                        value={systemAnalyticsData?.total_users || 0}
                                        icon={faClock}
                                        color="#9c27b0"
                                        subtitle="Registered users"
                                    />
                                </Grid>
                            </Grid>

                            <Grid container size={{ md: 12, lg: 12, xl: 8 }} spacing={3}>
                                {/* Chart Section */}
                                <Grid size={{ xs: 12, md: 12 }}>
                                    <Card
                                        sx={{
                                            bgcolor: "secondary.main",
                                            borderRadius: 2,
                                            py: 2,
                                            px: 3,
                                            height: "100%",
                                            justifyContent: "space-between",
                                            display: "flex",
                                            flexDirection: "column",
                                        }}
                                    >
                                        <Grid
                                            container
                                            size={{ xs: 12, md: 12 }}
                                            sx={{
                                                alignItems: "center",
                                            }}
                                            spacing={1}
                                        >
                                            <Grid size={{ xs: 12, mobileS: 7.5, md: 5 }}>
                                                <Typography variant="subtitle1" color="text.main" fontWeight={600}>
                                                    Daily Visits Analytics
                                                </Typography>
                                                <Typography variant="h4" fontWeight={800} color="primary">
                                                    <Box component="span">
                                                        {visitsRangeData.length}
                                                    </Box>
                                                    {' '}
                                                    <Box component="span" sx={{ fontSize: 20, fontWeight: 700 }}>
                                                        Days
                                                    </Box>
                                                </Typography>
                                            </Grid>
                                            <Grid
                                                container
                                                size={{ xs: 10, mobileS: 4, md: 6 }}
                                                sx={{
                                                    justifyContent: { xs: "flex-start", mobileS: "flex-end" },
                                                    gap: 1,
                                                }}
                                            >
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        label="Start Date"
                                                        value={startDate}
                                                        onChange={(value, _) => {
                                                            if (dayjs.isDayjs(value)) {
                                                                setStartDate(value);
                                                            } else {
                                                                setStartDate(null);
                                                            }
                                                        }}
                                                        slots={{
                                                            openPickerIcon: CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        sx={{
                                                            minWidth: "120px",
                                                            maxWidth: "150px",
                                                        }}
                                                    />
                                                    <DatePicker
                                                        label="End Date"
                                                        value={endDate}
                                                        onChange={(value, _) => {
                                                            if (dayjs.isDayjs(value)) {
                                                                setEndDate(value);
                                                            } else {
                                                                setStartDate(null);
                                                            }
                                                        }}
                                                        slots={{
                                                            openPickerIcon: CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        sx={{
                                                            minWidth: "120px",
                                                            maxWidth: "150px",
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                            <Grid size={{ xs: 2, mobileS: 0.5, md: 1 }}>
                                                <Button
                                                    onClick={handleClearFilter}
                                                    
                                                    sx={{
                                                        color:"primary",
                                                        minWidth: "35px",
                                                        width: "100%",
                                                        height: "45px",
                                                        borderRadius: "10px",
                                                        border: "1px solid rgb(109, 110, 112, 0.4)",
                                                        "&:hover": {
                                                            boxShadow: "none",
                                                            borderColor: "primary.main",
                                                            backgroundColor: "transparent",
                                                        },
                                                    }}
                                                >
                                                    <FontAwesomeIcon icon={faBroom} size="lg" style={{ color: "gray" }} />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Chart */}
                                        <Box sx={{ height: 250 }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={visitsRangeData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line
                                                        type="monotone"
                                                        dataKey="total_visits"
                                                        stroke="#8884d8"
                                                        strokeWidth={2}
                                                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                                                        name="Total Visits"
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </Box>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Popular Pages Donut Chart Section */}
                            <Grid size={{ xs: 12, sm: 12, lg: 12, xl: 4 }}>
                                <PopularPagesDonutChart 
                                    height={300}
                                    title="Popular Pages"
                                    usePeriodSelector={true}
                                />
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    <CustomTabPanel value={valueTab} index={1}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            {/* Date Range Picker */}
                            <Grid size={{ xs: 12 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Performance Analytics
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    label="Start Date"
                                                    value={startDate}
                                                    onChange={(value, _) => {
                                                        if (dayjs.isDayjs(value)) {
                                                            setStartDate(value);
                                                        } else {
                                                            setStartDate(null);
                                                        }
                                                    }}
                                                    slots={{
                                                        openPickerIcon: CalendarMonth,
                                                    }}
                                                    format="DD/MM/YYYY"
                                                    sx={{ minWidth: "150px" }}
                                                />
                                                <DatePicker
                                                    label="End Date"
                                                    value={endDate}
                                                    onChange={(value, _) => {
                                                        if (dayjs.isDayjs(value)) {
                                                            setEndDate(value);
                                                        } else {
                                                            setStartDate(null);
                                                        }
                                                    }}
                                                    slots={{
                                                        openPickerIcon: CalendarMonth,
                                                    }}
                                                    format="DD/MM/YYYY"
                                                    sx={{ minWidth: "150px" }}
                                                />
                                            </LocalizationProvider>
                                            <IconButton
                                                onClick={handleClearFilter}
                                                color="primary"
                                                sx={{
                                                    minWidth: "35px",
                                                    width: "70px",
                                                    height: "45px",
                                                    borderRadius: "10px",
                                                    border: "1px solid rgb(109, 110, 112, 0.4)",
                                                    "&:hover": {
                                                        boxShadow: "none",
                                                        borderColor: "primary.main",
                                                        backgroundColor: "transparent",
                                                    },
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faBroom} />
                                            </IconButton>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Peak Hours and Peak Day Cards */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="primary">
                                            Peak Hour
                                        </Typography>
                                        {performanceLoading ? (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography color="text.secondary">Loading...</Typography>
                                            </Box>
                                        ) : performanceData?.peak_hour ? (
                                            <Box>
                                                <Typography variant="h4" fontWeight="bold" color="primary">
                                                    {performanceData.peak_hour.hour}:00
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    {performanceData.peak_hour.visits.toLocaleString()} visits
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No data available</Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="success.main">
                                            Peak Day
                                        </Typography>
                                        {performanceLoading ? (
                                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                                <Typography color="text.secondary">Loading...</Typography>
                                            </Box>
                                        ) : performanceData?.peak_day ? (
                                            <Box>
                                                <Typography variant="h4" fontWeight="bold" color="success.main">
                                                    {performanceData.peak_day.day}
                                                </Typography>
                                                <Typography variant="body1" color="text.secondary">
                                                    {performanceData.peak_day.visits.toLocaleString()} visits
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">No data available</Typography>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Page Performance Table */}
                            <Grid size={{ xs: 12 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Page Performance Details
                                            <Chip 
                                                label="Key Pages Only" 
                                                color="primary" 
                                                size="small" 
                                                sx={{ ml: 2 }}
                                            />
                                        </Typography>
                                        <Box sx={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                        <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>
                                                            Page Name
                                                        </th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                                                            Total Visits
                                                        </th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                                                            Unique Visitors
                                                        </th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                                                            Avg Duration
                                                        </th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>
                                                            Bounce Rate
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {performanceLoading ? (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: '12px', textAlign: 'center' }}>
                                                                <Typography color="text.secondary">Loading performance data...</Typography>
                                                            </td>
                                                        </tr>
                                                    ) : performanceData?.page_performance && performanceData.page_performance.length > 0 ? (
                                                        performanceData.page_performance.map((page, index) => {
                                                            const config = pageConfig[normalizePageName(page.page_name)] || { color: '#888', icon: faQuestion };
                                                            return (
                                                                <tr key={index}>
                                                                    <td style={{ padding: '12px', borderBottom: '1px solid #eee' }}>
                                                                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                            <Avatar
                                                                                variant="rounded"
                                                                                sx={{
                                                                                    bgcolor: config.color + '22',
                                                                                    color: config.color,
                                                                                    width: 24,
                                                                                    height: 24,
                                                                                    fontSize: 16,
                                                                                    mr: 1,
                                                                                }}
                                                                            >
                                                                                <FontAwesomeIcon icon={config.icon} />
                                                                            </Avatar>
                                                                            <Typography variant="body2" fontWeight="medium">
                                                                                {page.page_name}
                                                                            </Typography>
                                                                        </span>
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                        <Chip label={page.total_visits} sx={{ bgcolor: config.color, color: '#fff', fontWeight: 600 }} size="small" />
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                        <Typography variant="body2">
                                                                            {page.unique_visitors}
                                                                        </Typography>
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                        <Typography variant="body2">
                                                                            {formatDuration(page.average_duration)}
                                                                        </Typography>
                                                                    </td>
                                                                    <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                        <Chip 
                                                                            label={`${page.bounce_rate.toFixed(1)}%`} 
                                                                            sx={{ bgcolor: config.color + '22', color: config.color, fontWeight: 600 }} 
                                                                            size="small" 
                                                                        />
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan={5} style={{ padding: '12px', textAlign: 'center' }}>
                                                                <Typography color="text.secondary">No data available for selected date range</Typography>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid container spacing={3} sx={{ mt: 1, width: '100%' }}>
                                {/* Visits by Time Slot */}
                                <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                                    <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" gutterBottom color="primary" fontWeight="bold">
                                                Visits by Time Slot
                                            </Typography>
                                            {performanceData?.time_slots && performanceData.time_slots.length > 0 ? (
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    {/* Bar Chart */}
                                                    <Box sx={{ height: 250, mb: 2, width: '100%' }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={performanceData.time_slots}>
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis 
                                                                    dataKey="slot" 
                                                                    angle={-45}
                                                                    textAnchor="end"
                                                                    height={80}
                                                                    fontSize={12}
                                                                />
                                                                <YAxis />
                                                                <Tooltip 
                                                                    formatter={(value) => [`${value} visits`, 'Visits']}
                                                                    labelFormatter={(label) => `Time: ${label}`}
                                                                />
                                                                <Bar 
                                                                    dataKey="visits" 
                                                                    fill="#8884d8" 
                                                                    radius={[4, 4, 0, 0]}
                                                                />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                    
                                                    {/* Table */}
                                                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Time Slot
                                                                    </th>
                                                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Visits
                                                                    </th>
                                                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Percentage
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {performanceData.time_slots.map((slot, idx) => {
                                                                    const totalVisits = performanceData.time_slots.reduce((sum, s) => sum + s.visits, 0);
                                                                    const percentage = totalVisits > 0 ? ((slot.visits / totalVisits) * 100).toFixed(1) : '0.0';
                                                                    const color = slot.visits > 0 ? '#8884d8' : '#e0e0e0';
                                                                    return (
                                                                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                                                                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                                                                                <Typography variant="body2" fontWeight="medium">
                                                                                    {slot.slot}
                                                                                </Typography>
                                                                            </td>
                                                                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                                <Chip 
                                                                                    label={slot.visits} 
                                                                                    sx={{ 
                                                                                        bgcolor: color, 
                                                                                        color: '#fff', 
                                                                                        fontWeight: 600,
                                                                                        minWidth: '40px'
                                                                                    }} 
                                                                                    size="small" 
                                                                                />
                                                                            </td>
                                                                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {percentage}%
                                                                                </Typography>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                                    No time slot data available
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                                {/* Session Duration Distribution */}
                                <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex' }}>
                                    <Card sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'stretch' }}>
                                        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                            <Typography variant="h6" gutterBottom color="success.main" fontWeight="bold">
                                                Session Duration Distribution
                                            </Typography>
                                            {performanceData?.session_duration_distribution && performanceData.session_duration_distribution.length > 0 ? (
                                                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                    {/* Donut Chart */}
                                                    <Box sx={{ height: 250, mb: 2, width: '100%' }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={performanceData.session_duration_distribution}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={40}
                                                                    outerRadius={80}
                                                                    paddingAngle={2}
                                                                    dataKey="count"
                                                                >
                                                                    {performanceData.session_duration_distribution.map((entry, index) => (
                                                                        <Cell 
                                                                            key={`cell-${index}`} 
                                                                            fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'][index % 5]} 
                                                                        />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip 
                                                                    formatter={(value, name, props) => [
                                                                        `${value} (${props.payload.percentage.toFixed(1)}%)`, 
                                                                        props.payload.range
                                                                    ]}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </Box>
                                                    
                                                    {/* Table */}
                                                    <Box sx={{ overflowX: 'auto', width: '100%' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#f5f5f5' }}>
                                                                    <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Duration Range
                                                                    </th>
                                                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Count
                                                                    </th>
                                                                    <th style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #ddd', fontSize: '14px' }}>
                                                                        Percentage
                                                                    </th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {performanceData.session_duration_distribution.map((duration, idx) => {
                                                                    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];
                                                                    const color = colors[idx % colors.length];
                                                                    return (
                                                                        <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? '#fafafa' : '#ffffff' }}>
                                                                            <td style={{ padding: '8px', borderBottom: '1px solid #eee', fontSize: '13px' }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                    <Box 
                                                                                        sx={{ 
                                                                                            width: 12, 
                                                                                            height: 12, 
                                                                                            borderRadius: '50%', 
                                                                                            bgcolor: color 
                                                                                        }} 
                                                                                    />
                                                                                    <Typography variant="body2" fontWeight="medium">
                                                                                        {duration.range}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </td>
                                                                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                                <Chip 
                                                                                    label={duration.count} 
                                                                                    sx={{ 
                                                                                        bgcolor: color, 
                                                                                        color: '#fff', 
                                                                                        fontWeight: 600,
                                                                                        minWidth: '40px'
                                                                                    }} 
                                                                                    size="small" 
                                                                                />
                                                                            </td>
                                                                            <td style={{ padding: '8px', textAlign: 'center', borderBottom: '1px solid #eee' }}>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    {duration.percentage.toFixed(1)}%
                                                                                </Typography>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                                                    No duration data available
                                                </Typography>
                                            )}
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    {/* User Engagement Tab */}
                    <CustomTabPanel value={valueTab} index={2}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <SummaryCard
                                    title="Engagement Score"
                                    value={`${calculateUserEngagementStats()?.engagementScore}/100`}
                                    icon={faChartLine}
                                    color="#4caf50"
                                    subtitle="Overall user engagement"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <SummaryCard
                                    title="Pages per Session"
                                    value={calculateUserEngagementStats()?.pagesPerSession || "0"}
                                    icon={faEye}
                                    color="#ff9800"
                                    subtitle="Average pages viewed"
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <SummaryCard
                                    title="Avg Bounce Rate"
                                    value={`${calculateUserEngagementStats()?.avgBounceRate || "0"}%`}
                                    icon={faUsers}
                                    color="#9c27b0"
                                    subtitle="Lower is better"
                                />
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Engagement Metrics Summary
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Total Visits</Typography>
                                                <Typography variant="h6">{calculateUserEngagementStats()?.totalVisits.toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Unique Visitors</Typography>
                                                <Typography variant="h6">{calculateUserEngagementStats()?.totalUniqueVisitors.toLocaleString()}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Avg Duration</Typography>
                                                <Typography variant="h6">{formatDuration(Number(calculateUserEngagementStats()?.avgDuration) || 0)}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Engagement Score</Typography>
                                                <Typography variant="h6">{calculateUserEngagementStats()?.engagementScore}/100</Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    {/* Behavioral Insights Tab */}
                    <CustomTabPanel value={valueTab} index={3}>
                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="success.main">
                                            High Engagement Pages
                                        </Typography>
                                        {calculateBehavioralStats()?.highEngagementPages.map((page, index) => (
                                            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">{page.page_name}</Typography>
                                                <Typography variant="body2">Duration: {formatDuration(page.average_duration)}</Typography>
                                                <Typography variant="body2">Bounce Rate: {page.bounce_rate.toFixed(1)}%</Typography>
                                            </Box>
                                        ))}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom color="error.main">
                                            Low Engagement Pages
                                        </Typography>
                                        {calculateBehavioralStats()?.lowEngagementPages.map((page, index) => (
                                            <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                                                <Typography variant="subtitle1" fontWeight="bold">{page.page_name}</Typography>
                                                <Typography variant="body2">Duration: {formatDuration(page.average_duration)}</Typography>
                                                <Typography variant="body2">Bounce Rate: {page.bounce_rate.toFixed(1)}%</Typography>
                                            </Box>
                                        ))}
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6" gutterBottom>
                                            Performance Overview
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Total Pages</Typography>
                                                <Typography variant="h6">{calculateBehavioralStats()?.totalPages}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Good Performance</Typography>
                                                <Typography variant="h6">{calculateBehavioralStats()?.pagesWithGoodPerformance}</Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Performance Rate</Typography>
                                                <Typography variant="h6">
                                                    {(() => {
                                                        const stats = calculateBehavioralStats();
                                                        return stats ? Math.round((stats.pagesWithGoodPerformance / stats.totalPages) * 100) : 0;
                                                    })()}%
                                                </Typography>
                                            </Grid>
                                            <Grid size={{ xs: 6, md: 3 }}>
                                                <Typography variant="body2" color="text.secondary">Needs Improvement</Typography>
                                                <Typography variant="h6">
                                                    {(() => {
                                                        const stats = calculateBehavioralStats();
                                                        return stats ? stats.totalPages - stats.pagesWithGoodPerformance : 0;
                                                    })()}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>
                </Grid>
            </Container>
        </Box>
    );
};

export default Analytics; 