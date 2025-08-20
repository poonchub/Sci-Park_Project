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
    Chip,
    Alert,
    IconButton,
    Avatar,
} from '@mui/material';
import {

    CalendarDays ,

} from 'lucide-react';
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
    BarChart,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import {

    ChartPie,

} from "lucide-react";
import ApexLineChart from '../../components/ApexLineChart/ApexLineChart';
import PopularPagesDonutChart from '../../components/PopularPagesDonutChart/PopularPagesDonutChart';
import {
    Sparkles,
    TrendingUp,
    Users,
    Eye,
    Clock,
    HelpCircle,
    BookOpen,
} from 'lucide-react';
import CustomTabPanel from '../../components/CustomTabPanel/CustomTabPanel';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '../../components/DatePicker/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { 
    analyticsService, 
    AnalyticsData, 
    SystemAnalyticsData, 
    PageAnalyticsData,
    PerformanceAnalyticsData,
    KEY_PAGES 
} from '../../services/analyticsService';
import { pageConfig, normalizePageName } from '../../components/PopularPagesDonutChart/PopularPagesDonutChart';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useTheme } from '@mui/material/styles';


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

    const handleDownloadManual = () => {
        const manualContent = `===========================================
ANALYTICS DASHBOARD MANUAL
===========================================

This manual explains how to use the Analytics Dashboard to monitor system performance and user engagement.

===========================================
ACCESSING THE ANALYTICS DASHBOARD
===========================================

1. Navigate to the Analytics Dashboard
2. Accessible from the main navigation menu
3. Requires appropriate permissions (Admin/Manager)
4. Dashboard loads automatically with current data

===========================================
DASHBOARD OVERVIEW
===========================================

The Analytics Dashboard contains:

1. HEADER SECTION
   - Title: "System Analytics Dashboard"
   - Refresh button with reload icon
   - Real-time data updates

2. TAB NAVIGATION
   - Overview Tab: Summary statistics and charts
   - Performance Tab: Detailed performance metrics

3. DATA VISUALIZATION
   - Summary cards with key metrics
   - Interactive charts and graphs
   - Data tables with detailed information

4. FILTERING AND DATE RANGE
   - Date picker for custom date ranges
   - Clear filter functionality
   - Real-time data filtering

===========================================
OVERVIEW TAB FEATURES
===========================================

SUMMARY CARDS:

1. Today's Visits
   - Description: Total visits for the current day
   - Icon: Chart line icon
   - Color: Blue (#1976d2)
   - Updates: Real-time

2. This Week
   - Description: Total visits for the last 7 days
   - Icon: Users icon
   - Color: Green (#4caf50)
   - Period: Rolling 7-day window

3. This Month
   - Description: Total visits for the last 30 days
   - Icon: Eye icon
   - Color: Orange (#ff9800)
   - Period: Rolling 30-day window

4. Total Users
   - Description: Total registered users in the system
   - Icon: Clock icon
   - Color: Purple (#9c27b0)
   - Data: From user database

DAILY VISITS CHART:

- Chart Type: Line chart
- X-Axis: Date range (customizable)
- Y-Axis: Number of visits
- Features:
  * Interactive tooltips
  * Date range picker
  * Clear filter button
  * Responsive design

POPULAR PAGES DONUT CHART:

- Chart Type: Donut chart
- Data: 4 key pages only
- Pages Tracked:
  * Home Page (/)
  * Booking Room (/booking-room)
  * My Maintenance Request (/my-maintenance-request)
  * My Account (/my-account)
- Features:
  * Color-coded by page
  * Percentage distribution
  * Interactive legend

===========================================
PERFORMANCE TAB FEATURES
===========================================

DATE RANGE SELECTOR:

1. Start Date Picker
   - Format: DD/MM/YYYY
   - Default: 7 days ago
   - Validation: Cannot be after end date

2. End Date Picker
   - Format: DD/MM/YYYY
   - Default: Today
   - Validation: Cannot be before start date

3. Clear Filter Button
   - Icon: Broom icon
   - Action: Resets to default date range
   - Visual: Consistent with Overview tab

PERFORMANCE CARDS:

1. Peak Hour Card
   - Title: "Peak Hour"
   - Data: Hour with highest visits
   - Format: HH:00 (24-hour format)
   - Color: Primary blue
   - Updates: Based on selected date range

2. Peak Day Card
   - Title: "Peak Day"
   - Data: Day of week with highest visits
   - Format: Full day name (Monday, Tuesday, etc.)
   - Color: Success green
   - Updates: Based on selected date range

PAGE PERFORMANCE TABLE:

- Table Type: Detailed performance metrics
- Columns:
  * Page Name (with colored icons)
  * Total Visits (with colored chips)
  * Unique Visitors
  * Average Duration (formatted as mm ss)
  * Avg Engagement Score (0-100 scale)

- Engagement Score Colors:
  * Green (≥70): High engagement
  * Orange (50-69): Medium engagement
  * Red (<50): Low engagement

- Features:
  * Key pages only filter
  * Color-coded page icons
  * Responsive design
  * Loading states

TIME-BASED ANALYTICS:

1. Visits by Time Slot
   - Chart Type: Bar chart
   - Time Slots:
     * 09:00-11:00
     * 11:00-13:00
     * 13:00-15:00
     * 15:00-17:00
     * 17:00-19:00
     * 19:00-21:00
     * 21:00-23:00
     * Other (before 9:00 or after 23:00)
   - Features:
     * Bar chart visualization
     * Detailed table below
     * Percentage calculations
     * Color-coded bars

2. Session Duration Distribution
   - Chart Type: Donut chart
   - Duration Ranges:
     * 0-30 seconds
     * 30 seconds - 2 minutes
     * 2-5 minutes
     * 5-10 minutes
     * 10+ minutes
   - Features:
     * Donut chart visualization
     * Detailed table below
     * Percentage calculations
     * Color-coded segments

===========================================
ENGAGEMENT SCORE EXPLANATION
===========================================

ENGAGEMENT SCORE CALCULATION:

Formula: (duration_weight * avg_duration + interaction_weight * avg_interactions) / max_score * 100

Parameters:
- Duration Weight: 60%
- Interaction Weight: 40%
- Max Duration: 600 seconds (10 minutes)
- Max Interactions: 50 interactions

Score Ranges:
- 0-49: Low Engagement (Red)
- 50-69: Medium Engagement (Orange)
- 70-100: High Engagement (Green)

INTERACTION TRACKING:

Tracked Interactions:
1. Clicks on interactive elements:
   - Buttons
   - Links
   - Input fields
   - Select dropdowns
   - Elements with role="button"
   - Elements with data-interactive attribute

2. Scroll Events:
   - Debounced (1 second intervals)
   - Counted after 2 seconds of no scrolling
   - Passive event listeners for performance

3. Key Presses:
   - Enter key
   - Tab key
   - Escape key

===========================================
DATA REFRESH AND UPDATES
===========================================

AUTOMATIC UPDATES:
- Data refreshes when date range changes
- Real-time loading states
- Error handling with user feedback

MANUAL REFRESH:
- Refresh button in header
- Reloads all dashboard data
- Shows "Refreshing..." state during load

DATA SOURCES:
- Analytics table (page visits)
- User table (total users)
- Real-time calculations for metrics

===========================================
FILTERING AND SEARCH
===========================================

DATE RANGE FILTERING:
1. Select custom date range
2. All charts and tables update automatically
3. Peak hour/day calculations based on range
4. Time slot analysis filtered by range
5. Session duration analysis filtered by range

CLEAR FILTERS:
- Resets to default date range (7 days)
- Updates all visualizations
- Maintains current tab selection

===========================================
RESPONSIVE DESIGN
===========================================

MOBILE ADAPTATION:
- Cards stack vertically on small screens
- Charts resize automatically
- Tables become scrollable
- Touch-friendly interactions

DESKTOP OPTIMIZATION:
- Side-by-side card layout
- Full-width charts
- Detailed table views
- Hover effects and tooltips

===========================================
TROUBLESHOOTING
===========================================

NO DATA DISPLAYED:
1. Check date range selection
2. Verify user permissions
3. Check if analytics tracking is enabled
4. Refresh the page
5. Check browser console for errors

CHARTS NOT LOADING:
1. Check internet connection
2. Verify API endpoints are accessible
3. Clear browser cache
4. Try different date range
5. Check for JavaScript errors

SLOW PERFORMANCE:
1. Reduce date range size
2. Check browser performance
3. Close other browser tabs
4. Clear browser cache
5. Try refreshing the page

ENGAGEMENT SCORE ISSUES:
1. Verify interaction tracking is working
2. Check if users are generating interactions
3. Review interaction count in console logs
4. Ensure proper page tracking setup

===========================================
BEST PRACTICES
===========================================

DATA INTERPRETATION:
1. Compare trends over time
2. Look for patterns in peak hours
3. Monitor engagement score changes
4. Track popular page performance
5. Analyze session duration patterns

REGULAR MONITORING:
1. Check daily for system health
2. Monitor peak usage times
3. Track user engagement trends
4. Review page performance regularly
5. Analyze user behavior patterns

ACTIONABLE INSIGHTS:
1. Use peak hour data for maintenance scheduling
2. Improve low-engagement pages
3. Optimize high-traffic periods
4. Focus on popular page improvements
5. Address user experience issues

===========================================
TECHNICAL DETAILS
===========================================

ANALYTICS TRACKING:
- Tracks 4 key pages only
- Records visit duration and interactions
- Filters out visits under 2 seconds
- Stores data in SQLite database
- Real-time data processing

PERFORMANCE METRICS:
- Calculated from raw analytics data
- Cached for better performance
- Updates automatically with new data
- Supports custom date ranges

INTERACTION TRACKING:
- Client-side JavaScript tracking
- Debounced scroll events
- Filtered click events
- Secure data transmission
- Privacy-compliant implementation

===========================================
SUPPORT AND CONTACT
===========================================

For technical support:
1. Check browser console for error messages
2. Verify network connectivity
3. Test with different browsers
4. Contact system administrator
5. Review server logs if needed

For data interpretation:
1. Review this manual
2. Check system documentation
3. Consult with analytics team
4. Review historical data patterns
5. Contact data analysis team

===========================================`;

        const blob = new Blob([manualContent], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Analytics_Dashboard_Manual.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
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

    // New component for visits chart using ApexCharts
    const VisitsApexChart: React.FC<{
        data: Array<{date: string, total_visits: number}>;
        height: number;
    }> = ({ data, height }) => {
        const theme = useTheme();
        const chartData = data.map(item => ({
            date: item.date,
            visits: item.total_visits
        }));

        // Format date labels like Dashboard (D MMM format)
        const formatDateLabel = (dateStr: string) => {
            const date = dayjs(dateStr);
            if (!date.isValid()) return dateStr;
            return date.format("D MMM"); // เช่น 14 Jul
        };

        const options: ApexOptions = {
            chart: {
                type: "area" as const,
                height,
                toolbar: {
                    show: true,
                    tools: {
                        download: true,
                        selection: true,
                        zoom: false,
                        zoomin: true,
                        zoomout: true,
                        pan: true,
                        reset: true,
                    },
                },
            },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth" },
            xaxis: {
                type: "category",
                categories: chartData.map(item => formatDateLabel(item.date)),
                labels: {
                    style: {
                        fontSize: "14px",
                        fontFamily: "Noto Sans Thai, sans-serif",
                    },
                    rotate: -45,
                    rotateAlways: false,
                },
            },
            yaxis: {
                min: 0,
                forceNiceScale: true,
                decimalsInFloat: 0,
                labels: {
                    style: {
                        fontSize: "14px",
                        fontFamily: "Noto Sans Thai, sans-serif",
                    },
                },
            },
            tooltip: {
                theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
            },
            fill: {
                type: "gradient",
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.3,
                    opacityTo: 0.1,
                    stops: [0, 90, 100],
                },
            },
            colors: ["#8884d8"],
        };

        const series = [{ name: "Total Visits", data: chartData.map(item => item.visits) }];

        return (
            <div>
                <ReactApexChart
                    options={options}
                    series={series}
                    type="area"
                    height={height}
                />
            </div>
        );
    };


    // Summary Card Component matching Dashboard style
    const SummaryCard: React.FC<{
        title: string;
        value: string | number;
        icon: React.ComponentType<{ size?: string | number; className?: string }>;
        color: string;
        subtitle?: string;
    }> = ({ title, value, icon: Icon, color, subtitle }) => (
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
                        <Icon size={24} />
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



    return (
        <Box className="analytics-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid className="title-box" size={{ xs: 8, md: 10 }}>

                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ChartPie size={26} />
                            <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                                System Analytics Dashboard
                            </Typography>
                        </Box>
                    </Grid>
                    <Grid size={{ xs: 4, md: 2 }} sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleDownloadManual}
                            startIcon={<BookOpen size={20} />}
                            sx={{ minWidth: 'auto', px: 2 }}
                        >
                            Download Manual
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
                        </Tabs>
                    </Grid>

                    <CustomTabPanel value={valueTab} index={0}>
                        <Grid container spacing={2}>
                            {/* Summary Cards */}
                            <Grid container size={{ xs: 12 }} spacing={2}>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="Today's Visits"
                                        value={analyticsData?.today_visits || 0}
                                        icon={TrendingUp}
                                        color="#1976d2"
                                        subtitle="Current day"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="This Week"
                                        value={analyticsData?.week_visits || 0}
                                        icon={Clock}
                                        color="#4caf50"
                                        subtitle="7 days"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="This Month"
                                        value={analyticsData?.month_visits || 0}
                                        icon={Eye}
                                        color="#ff9800"
                                        subtitle="30 days"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                    <SummaryCard
                                        title="Total Users"
                                        value={systemAnalyticsData?.total_users || 0}
                                        icon={Users}
                                        color="#9c27b0"
                                        subtitle="Registered users"
                                    />
                                </Grid>
                            </Grid>

                            {/* Daily Visits Analytics - Left Side (Larger) */}
                            <Grid size={{ xs: 12, lg: 8 }}>
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
                                                        openPickerIcon: CalendarDays ,
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
                                                        openPickerIcon: CalendarDays ,
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
                                                <Sparkles size={20} style={{ color: "gray" }} />
                                            </Button>
                                        </Grid>
                                        
                                    </Grid>
                                    
                                    {/* Chart */}
                                    <Box sx={{ height: 280 }}>
                                        {visitsRangeData && visitsRangeData.length > 0 ? (
                                            <VisitsApexChart
                                                data={visitsRangeData}
                                                height={280}
                                            />
                                        ) : (
                                            <Box sx={{ 
                                                height: '100%', 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                flexDirection: 'column',
                                                color: 'text.secondary'
                                            }}>
                                                <Typography variant="h6" gutterBottom>
                                                    No Data Available
                                                </Typography>
                                                <Typography variant="body2">
                                                    No visit data found for the selected date range
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Card>
                            </Grid>

                            {/* Popular Pages Donut Chart Section - Right Side (Smaller) */}
                            <Grid size={{ xs: 12, lg: 4 }}>
                                <PopularPagesDonutChart 
                                    height={250}
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
                                                        openPickerIcon: CalendarDays ,
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
                                                        openPickerIcon: CalendarDays ,
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
                                                <Sparkles size={20} />
                                            </IconButton>
                                            <IconButton
                                                onClick={handleDownloadManual}
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
                                                <BookOpen size={20} />
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
                                                            Avg Engagement Score
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
                                                            const config = pageConfig[normalizePageName(page.page_name)] || { color: '#888', icon: HelpCircle };
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
                                                                                <HelpCircle size={16} />
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
                                                                            label={`${page.engagement_score.toFixed(1)}`} 
                                                                            sx={{ 
                                                                                bgcolor: page.engagement_score >= 70 ? '#4caf50' : 
                                                                                        page.engagement_score >= 50 ? '#ff9800' : '#f44336',
                                                                                color: '#fff', 
                                                                                fontWeight: 600 
                                                                            }} 
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
                                                    <Box sx={{ height: 400, mb: 2, width: '100%' }}>
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart 
                                                                data={performanceData.time_slots}
                                                                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" />
                                                                <XAxis 
                                                                    dataKey="slot" 
                                                                    angle={-45}
                                                                    textAnchor="end"
                                                                    height={80}
                                                                    fontSize={11}
                                                                    interval={0}
                                                                />
                                                                <YAxis 
                                                                    domain={[0, 'dataMax + 2']}
                                                                />
                                                                <Tooltip 
                                                                    formatter={(value) => [`${value} visits`, 'Visits']}
                                                                    labelFormatter={(label) => `Time: ${label}`}
                                                                />
                                                                <Bar 
                                                                    dataKey="visits" 
                                                                    fill="#8884d8" 
                                                                    radius={[4, 4, 0, 0]}
                                                                />
                                                            </BarChart>
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
                                                    <Box sx={{ height: 300, mb: 2, width: '100%' }}>
                                                        <ReactApexChart
                                                            options={{
                                                                chart: {
                                                                    type: 'donut',
                                                                    height: 280,
                                                                },
                                                                labels: performanceData.session_duration_distribution.map(item => item.range),
                                                                colors: ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'],
                                                                legend: {
                                                                    show: false,
                                                                },
                                                                dataLabels: {
                                                                    enabled: false,
                                                                },
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
                                                                                    color: '#333',
                                                                                },
                                                                                value: {
                                                                                    show: true,
                                                                                    fontSize: '24px',
                                                                                    fontFamily: 'Noto Sans Thai, sans-serif',
                                                                                    fontWeight: 700,
                                                                                    offsetY: -20,
                                                                                    color: '#333',
                                                                                },
                                                                                total: {
                                                                                    show: true,
                                                                                    showAlways: true,
                                                                                    label: 'Total Sessions',
                                                                                    fontSize: '16px',
                                                                                    fontFamily: 'Noto Sans Thai, sans-serif',
                                                                                    fontWeight: 500,
                                                                                    color: 'rgb(129, 129, 129)',
                                                                                    formatter: () => {
                                                                                        const total = performanceData.session_duration_distribution.reduce((sum, item) => sum + item.count, 0);
                                                                                        return total.toLocaleString();
                                                                                    },
                                                                                },
                                                                            },
                                                                        },
                                                                    },
                                                                },
                                                                tooltip: {
                                                                    enabled: true,
                                                                    theme: 'light',
                                                                    style: {
                                                                        fontSize: '14px',
                                                                        fontFamily: 'Noto Sans Thai, sans-serif',
                                                                    },
                                                                    y: {
                                                                        formatter: (value, { seriesIndex }) => {
                                                                            const data = performanceData.session_duration_distribution[seriesIndex];
                                                                            if (!data) return value.toString();
                                                                            return `${value} (${data.percentage.toFixed(1)}%)`;
                                                                        }
                                                                    }
                                                                },
                                                            }}
                                                            series={performanceData.session_duration_distribution.map(item => item.count)}
                                                            type="donut"
                                                            height={280}
                                                        />
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
                </Grid>
            </Container>
        </Box>
    );
};

export default Analytics; 