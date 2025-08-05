import React, { useEffect, useRef, useState } from "react";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    FormControl,
    Grid,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Tab,
    Tabs,
    Typography,
    useTheme,
} from "@mui/material";
import { GetMaintenanceTypes, GetUserById, ListMaintenanceRequests, ListMaintenanceRequestsByDateRange } from "../../services/http";
import { UserInterface } from "../../interfaces/IUser";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";

import "./DashBoard.css";
import ApexLineChart from "../../components/ApexLineChart/ApexLineChart";
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards";
import ApexDonutChart from "../../components/MaintenanceTypeDonutChart/MaintenanceTypeDonutChart";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import { CalendarMonth, CalendarToday, CheckCircle, Close, Error, HelpOutline, Notifications } from "@mui/icons-material";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import {
    faBroom,
    faCalendarCheck,
    faChartLine,
    faCoins,
    faCreditCard,
    faDoorOpen,
    faUsers,
    IconDefinition,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RequestStatusStackForAdmin from "../../components/RequestStatusStackForAdmin/RequestStatusStackForAdmin";
import CustomTabPanel from "../../components/CustomTabPanel/CustomTabPanel";

import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useTranslation } from "react-i18next";

import { Select } from "../../components/Select/Select";
import { Activity, BrushCleaning, Layout, LayoutDashboard, LineChart } from "lucide-react";
import { analyticsService } from "../../services/analyticsService";
import ExpandableText from "../../components/ExpandableText/ExpandableText";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";

function Dashboard() {
    const [user, setUser] = useState<UserInterface>();
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([]);
    const [filteredRequest, setFilteredRequest] = useState<MaintenanceRequestsInterface[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([]);
    const [groupedData, setGroupedData] = useState<Record<string, { total: number; completed: number; completedPercentage: number }>>({});

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>();
    const [completedPercentage, setCompletedPercentage] = useState<number>(0);

    const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([]);

    const [selectedDateOption, setSelectedDateOption] = useState<string>('daily')

    const [dateRange, setDateRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: null,
        end: null,
    });

    const [valueTab, setValueTab] = useState(0);
    const [open, setOpen] = useState(false);

    const { t } = useTranslation();

    const getUser = async () => {
        try {
            const res = await GetUserById(Number(localStorage.getItem("userId")));
            if (res) {
                setUser(res);
            }
        } catch (error) {
            console.error("Error fetching user:", error);
        }
    };

    const getMaintenanceRequests = async () => {
        try {
            const res = await ListMaintenanceRequestsByDateRange(
                dateRange.start ? dateRange.start.format("YYYY-MM-DD") : '',
                dateRange.end ? dateRange.end.format("YYYY-MM-DD") : ''
            )

            if (res) {
                setMaintenanceRequests(res);
            }
        } catch (error) {
            console.error("Error fetching request maintenance requests:", error);
        }
    };

    const getMaintenanceTypes = async () => {
        try {
            const res = await GetMaintenanceTypes();
            if (res) {
                setMaintenanceTypes(res);
            }
        } catch (error) {
            console.error("Error fetching maintenance types:", error);
        }
    };

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValueTab(newValue);
    };

    const handleClearFillter = () => {
        if (selectedDateOption === 'hourly') {
            const today = dayjs().startOf('day')
            setDateRange((prev) => ({
                ...prev,
                start: today,
                end: null,
            }));
        }
        else {
            setDateRange({
                start: null,
                end: null,
            })
        }
    }

    function a11yProps(index: number) {
        return {
            id: `simple-tab-${index}`,
            "aria-controls": `simple-tabpanel-${index}`,
        };
    }

    useEffect(() => {
        getMaintenanceRequests();
        getUser();
        getMaintenanceTypes();

        // Remove analytics tracking from Dashboard
        // analyticsService.trackKeyPageVisit('DASHBOARD', 'Dashboard');
    }, []);

    useEffect(() => {
        if ((dateRange.start && selectedDateOption === 'hourly') || (dateRange.start && dateRange.end) || (!dateRange.start && !dateRange.end)) {
            getMaintenanceRequests()
        }
    }, [dateRange])

    const prevDateOption = useRef<string>(selectedDateOption);
    useEffect(() => {
        if (selectedDateOption === 'hourly') {
            const today = dayjs().startOf('day')
            setDateRange((prev) => ({
                ...prev,
                start: today,
                end: null,
            }));
        }
        else {
            if (prevDateOption.current === "hourly") {
                setDateRange((prev) => ({
                    ...prev,
                    start: null,
                    end: null,
                }));
            };
        }
        getMaintenanceRequests()
        prevDateOption.current = selectedDateOption;
    }, [selectedDateOption])

    useEffect(() => {
        if (!maintenanceTypes?.length) return;

        let dataToUse = maintenanceRequests;

        setFilteredRequest(dataToUse);

        const countStatus = dataToUse.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus);

        const total = dataToUse.length;
        const completedCount = dataToUse.filter((item) => item.RequestStatus?.Name === "Completed").length;

        if (maintenanceRequests.length) {
            const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
            setCompletedPercentage(percentage);
        } else {
            setCompletedPercentage(0)
        }


        // ✅ สร้าง group เริ่มต้นจาก maintenanceTypes ทั้งหมด
        const grouped: Record<string, { total: number; completed: number; completedPercentage: number }> = {};

        maintenanceTypes.forEach((type) => {
            const typeName = type.TypeName;

            if (!typeName) return;

            grouped[typeName] = {
                total: 0,
                completed: 0,
                completedPercentage: 0,
            };
        });

        // ✅ update ค่าจาก dataToUse ที่ตรงกับประเภทนั้น ๆ
        dataToUse.forEach((req) => {
            const typeName = req.MaintenanceType?.TypeName || "";
            const isCompleted = req.RequestStatus?.Name === "Completed";

            if (!grouped[typeName]) {
                // fallback ถ้า type ไม่อยู่ใน maintenanceTypes
                grouped[typeName] = {
                    total: 0,
                    completed: 0,
                    completedPercentage: 0,
                };
            }

            grouped[typeName].total += 1;
            if (isCompleted) grouped[typeName].completed += 1;

            grouped[typeName].completedPercentage = (grouped[typeName].completed / grouped[typeName].total) * 100;
        });

        setGroupedData(grouped);
    }, [maintenanceRequests, maintenanceTypes]);

    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);

    useEffect(() => {
        if (dateRange.start && !dateRange.end && selectedDateOption !== 'hourly') {
            setTimeout(() => setOpenEndPicker(true), 100);
        }
    }, [dateRange.start]);

    useEffect(() => {
        if (dateRange.end && !dateRange.start && selectedDateOption !== 'hourly') {
            setTimeout(() => setOpenStartPicker(true), 100);
        }
    }, [dateRange.end]);

    const theme = useTheme();

    // Mock data for summary cards
    const summaryData = {
        totalBookings: 234,
        availableRooms: 12,
        totalRevenue: 15670.5,
        paymentFees: 785.25,
        netRevenue: 14885.25,
        totalUsers: 1847,
    };

    // Mock data for revenue chart
    const revenueChartOptions: ApexOptions = {
        chart: {
            type: "line",
            height: 350,
            toolbar: {
                show: false,
            },
        },
        colors: ["#1976d2", "#ff9800"],
        dataLabels: {
            enabled: false,
        },
        stroke: {
            curve: "smooth",
            width: 3,
        },
        xaxis: {
            categories: ["Week 1", "Week 2", "Week 3", "Week 4"],
            labels: {
                style: {
                    colors: theme.palette.text.secondary,
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: theme.palette.text.secondary,
                },
                formatter: (value) => `฿${value}`,
            },
        },
        legend: {
            position: "top",
            horizontalAlign: "left",
        },
        grid: {
            borderColor: theme.palette.divider,
        },
        tooltip: {
            y: {
                formatter: (value) => `฿${value}`,
            },
        },
    };

    const revenueChartSeries = [
        {
            name: "Revenue",
            data: [3200, 4100, 3800, 4370],
        },
        {
            name: "Bookings",
            data: [45, 62, 58, 69],
        },
    ];

    // Mock data for fee comparison pie chart
    const feeChartOptions: ApexOptions = {
        chart: {
            type: "pie",
            height: 350,
        },
        colors: ["#4caf50", "#f44336"],
        labels: ["Net Revenue", "Payment Fees"],
        legend: {
            position: "bottom",
        },
        dataLabels: {
            formatter: (_val, opts) => {
                const value = opts.w.config.series[opts.seriesIndex];
                return `฿${value.toLocaleString()}`;
            },
        },
        tooltip: {
            y: {
                formatter: (value) => `฿${value.toLocaleString()}`,
            },
        },
    };

    const feeChartSeries = [summaryData.netRevenue, summaryData.paymentFees];

    // Mock data for booking trends
    const bookingTrendsOptions: ApexOptions = {
        chart: {
            type: "bar",
            height: 300,
            toolbar: {
                show: false,
            },
        },
        colors: ["#2196f3"],
        plotOptions: {
            bar: {
                borderRadius: 4,
                horizontal: false,
            },
        },
        dataLabels: {
            enabled: false,
        },
        xaxis: {
            categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            labels: {
                style: {
                    colors: theme.palette.text.secondary,
                },
            },
        },
        yaxis: {
            labels: {
                style: {
                    colors: theme.palette.text.secondary,
                },
            },
        },
        grid: {
            borderColor: theme.palette.divider,
        },
    };

    const bookingTrendsSeries = [
        {
            name: "Bookings",
            data: [28, 35, 42, 38, 45, 22, 18],
        },
    ];

    // Mock activity data
    const activityData = [
        {
            id: 1,
            type: "success",
            message: "5 new bookings today",
            time: "2 hours ago",
        },
        {
            id: 2,
            type: "error",
            message: "1 failed payment - requires attention",
            time: "3 hours ago",
        },
        {
            id: 3,
            type: "success",
            message: "Room A1 fully booked for this week",
            time: "5 hours ago",
        },
        {
            id: 4,
            type: "info",
            message: "12 new user registrations",
            time: "1 day ago",
        },
        {
            id: 5,
            type: "success",
            message: "Monthly revenue target achieved",
            time: "2 days ago",
        },
    ];

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
                        {(typeof value === "number" && title.toLowerCase().includes("revenue")) || title.toLowerCase().includes("fee")
                            ? `฿${value.toLocaleString()}`
                            : value.toLocaleString()}
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

    const timeFrameOptions = [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Yearly', value: 'yearly' },
    ];

    const chartUsageNote = {
        title: "How to Use the Line Chart",
        points: [
            "Select Time Range:",
            "   • If you choose Hourly, you will see a single date picker to select the specific day (default is today).",
            "   • For other options like Daily, Weekly, Monthly, or Yearly, you will see two date pickers to select a Start Date and an End Date.",
            "Reading the Chart:",
            "   • The line shows the trend of maintenance requests over the selected time period.",
            "   • The X-axis (horizontal) represents the selected time intervals (hours, days, weeks, etc.).",
            "   • The Y-axis (vertical) shows the number of requests in each time interval.",
            "View Details of Each Point:",
            "• Hover over any point on the line to see details such as the exact time/date and the number of requests for that interval.",
            "Interpreting the Chart:",
            "   • Rising lines indicate an increase in requests.",
            "   • Falling lines indicate a decrease in requests.",
            "   • Peaks show times of highest request volume.",
            "   • Flat lines indicate periods with few or no requests.",
        ],
        notes: [
            "If there is no data for the selected period, the chart may show gaps or appear empty.",
            "Adjust the time range or filters to get a clearer view of the data.",
        ],
    };

    return (
        <Box className="dashboard-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid
                        container
                        className="title-box"
                        direction={'row'}
                        size={{ xs: 12, md: 12 }}
                        sx={{ gap: 1 }}
                    >
                        <LayoutDashboard size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Dashboard
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Tabs value={valueTab} onChange={handleChange} variant="scrollable" allowScrollButtonsMobile>
                            <Tab label={t("maintenance")} {...a11yProps(0)} />
                            <Tab label={t("bookingRoom")} {...a11yProps(1)} />
                        </Tabs>
                    </Grid>

                    <CustomTabPanel value={valueTab} index={0}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            <Grid container size={{ md: 12, lg: 12, xl: 8 }} spacing={3}>
                                {/* Status Section */}
                                <RequestStatusCards statusCounts={countRequestStatus || {}} />

                                <RequestStatusStackForAdmin statusCounts={countRequestStatus || {}} />

                                {/* Chart Line Section */}
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
                                            gap: 1
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
                                            <Grid size={{ xs: 12, sm: 12, sm650: 4 }}>
                                                <Typography variant="subtitle1" color="text.main" fontWeight={600}>
                                                    Requests
                                                </Typography>
                                                <Typography variant="h4" fontWeight={800} color="primary">
                                                    <Box component="span" >
                                                        {`${filteredRequest.length}`}
                                                    </Box>
                                                    {' '}
                                                    <Box component="span" sx={{ fontSize: 20, fontWeight: 700 }}>
                                                        Items
                                                    </Box>

                                                </Typography>
                                            </Grid>
                                            <Grid container size={{ xs: 12, sm: 12, sm650: 8 }} spacing={1}>
                                                <Grid size={{ xs: 12, sm: 12, sm650: selectedDateOption === 'hourly' ? 4 : 3 }}>
                                                    <FormControl fullWidth>
                                                        <Select
                                                            startAdornment={
                                                                <InputAdornment position="start" sx={{ pl: 0.5 }}>
                                                                    <LineChart size={20} strokeWidth={3} />
                                                                </InputAdornment>
                                                            }
                                                            value={selectedDateOption}
                                                            onChange={(value) => {
                                                                setSelectedDateOption(value.target.value as string)
                                                            }}
                                                        >
                                                            {
                                                                timeFrameOptions.map((item, index) => {
                                                                    return (
                                                                        <MenuItem key={index} value={item.value}>{item.label}</MenuItem>
                                                                    )
                                                                })
                                                            }
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {
                                                    selectedDateOption === 'hourly' ? (
                                                        <Grid size={{ xs: 6, sm: 5, sm650: 6 }}>
                                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                <DatePicker
                                                                    label="Date"
                                                                    value={dateRange.start ?? null}
                                                                    onChange={(newValue) =>
                                                                        setDateRange((prev) => ({ ...prev, start: newValue ?? null }))
                                                                    }
                                                                    maxDate={dateRange.end ?? undefined}
                                                                    slots={{
                                                                        openPickerIcon: CalendarMonth,
                                                                    }}
                                                                    format="DD/MM/YYYY"
                                                                    open={openStartPicker}
                                                                    onOpen={() => setOpenStartPicker(true)}
                                                                    onClose={() => setOpenStartPicker(false)}
                                                                />
                                                            </LocalizationProvider>
                                                        </Grid>
                                                    ) : (
                                                        <>
                                                            <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                    <DatePicker
                                                                        label="Start Date"
                                                                        value={dateRange.start ?? null}
                                                                        onChange={(newValue) =>
                                                                            setDateRange((prev) => ({ ...prev, start: newValue ?? null }))
                                                                        }
                                                                        maxDate={dateRange.end ?? undefined}
                                                                        slots={{
                                                                            openPickerIcon: CalendarMonth,
                                                                        }}
                                                                        format="DD/MM/YYYY"
                                                                        open={openStartPicker}
                                                                        onOpen={() => setOpenStartPicker(true)}
                                                                        onClose={() => setOpenStartPicker(false)}
                                                                    />
                                                                </LocalizationProvider>
                                                            </Grid>
                                                            <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                                    <DatePicker
                                                                        label="End Date"
                                                                        value={dateRange.end ?? null}
                                                                        onChange={(newValue) =>
                                                                            setDateRange((prev) => ({ ...prev, end: newValue ?? null }))
                                                                        }
                                                                        minDate={dateRange.start ?? undefined}
                                                                        slots={{
                                                                            openPickerIcon: CalendarMonth,
                                                                        }}
                                                                        format="DD/MM/YYYY"
                                                                        open={openEndPicker}
                                                                        onOpen={() => setOpenEndPicker(true)}
                                                                        onClose={() => setOpenEndPicker(false)}
                                                                    />
                                                                </LocalizationProvider>
                                                            </Grid>
                                                        </>
                                                    )
                                                }

                                                <Grid size={{ xs: 12, sm: 2 }}>
                                                    <Button
                                                        onClick={handleClearFillter}
                                                        sx={{
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
                                                        <BrushCleaning size={22} strokeWidth={2.2} style={{ color: "gray" }} />
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <ApexLineChart selectedDateOption={selectedDateOption} data={filteredRequest} height={250} dateRange={dateRange} />

                                        <Button
                                            startIcon={<HelpOutline />}
                                            variant="outlined"
                                            onClick={() => setOpen(true)}
                                        >
                                            How to use this chart
                                        </Button>

                                        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
                                            <DialogTitle
                                                sx={{
                                                    fontWeight: 700,
                                                    color: 'primary.main',
                                                    textAlign: 'center'
                                                }}
                                            >
                                                <FontAwesomeIcon icon={faCircleQuestion} size="lg" style={{ marginRight: '10px' }} />
                                                Chart Usage Guide
                                                <IconButton
                                                    aria-label="close"
                                                    onClick={() => setOpen(false)}
                                                    sx={{
                                                        position: 'absolute',
                                                        right: 8,
                                                        top: 8,
                                                    }}
                                                >
                                                    <Close />
                                                </IconButton>
                                            </DialogTitle>

                                            <DialogContent dividers sx={{ px: 5 }}>
                                                <Typography
                                                    sx={{
                                                        whiteSpace: "pre-line",
                                                        fontSize: 18,
                                                        fontWeight: 600
                                                    }}
                                                    gutterBottom
                                                >
                                                    {chartUsageNote.title}
                                                </Typography>
                                                {chartUsageNote.points.map((line, index) => {
                                                    const trimmed = line.trimStart();
                                                    const isBullet = trimmed.startsWith('•');

                                                    return (
                                                        <Typography
                                                            key={index}
                                                            component="div"
                                                            sx={{
                                                                pl: isBullet ? 3 : 0, // ใส่ padding-left ถ้าเป็นบูลเล็ท
                                                                whiteSpace: 'normal',
                                                                mb: 0.5,
                                                                color: isBullet ? 'text.secondary' : 'text.primary'
                                                            }}
                                                        >
                                                            {line}
                                                        </Typography>
                                                    );
                                                })}
                                                <Box mt={2}>
                                                    {chartUsageNote.notes.map((note, idx) => (
                                                        <Typography key={idx} sx={{ whiteSpace: 'normal', mb: 0.5 }}>
                                                            {note}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </DialogContent>

                                            <DialogActions>
                                                <Button onClick={() => setOpen(false)} variant="outlined">
                                                    Close
                                                </Button>
                                            </DialogActions>
                                        </Dialog>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Chart Donut Section */}
                            <Grid size={{ xs: 12, sm: 12, lg: 12, xl: 4 }}>
                                <ApexDonutChart data={groupedData} completed={completedPercentage} />
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    <CustomTabPanel value={valueTab} index={1}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            {/* Summary Cards */}
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Bookings"
                                        value={summaryData.totalBookings}
                                        icon={faCalendarCheck}
                                        color="#1976d2"
                                        subtitle="This month"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard title="Available Rooms" value={summaryData.availableRooms} icon={faDoorOpen} color="#4caf50" />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Revenue"
                                        value={summaryData.totalRevenue}
                                        icon={faChartLine}
                                        color="#ff9800"
                                        subtitle="Before fees"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Payment Fees"
                                        value={summaryData.paymentFees}
                                        icon={faCreditCard}
                                        color="#f44336"
                                        subtitle="Gateway charges"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Net Revenue"
                                        value={summaryData.netRevenue}
                                        icon={faCoins}
                                        color="#9c27b0"
                                        subtitle="After fees"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Users"
                                        value={summaryData.totalUsers}
                                        icon={faUsers}
                                        color="#00bcd4"
                                        subtitle="Registered"
                                    />
                                </Grid>
                            </Grid>

                            {/* Charts Row */}
                            <Grid container size={{ xs: 12 }} spacing={3}>
                                {/* Revenue and Booking Chart */}
                                <Grid size={{ xs: 12, lg: 8 }}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Revenue & Booking Trends
                                            </Typography>
                                            <Chart options={revenueChartOptions} series={revenueChartSeries} type="line" height={350} />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Fee Comparison Pie Chart */}
                                <Grid size={{ xs: 12, lg: 4 }}>
                                    <Card sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Revenue vs Fees
                                            </Typography>
                                            <Chart options={feeChartOptions} series={feeChartSeries} type="pie" height={350} />
                                        </CardContent>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Bottom Row */}
                            <Grid container size={{ xs: 12 }} spacing={3}>
                                {/* Weekly Booking Trends */}
                                <Grid size={{ xs: 12, lg: 8 }}>
                                    <Card sx={{ height: "100%" }}>
                                        <CardContent>
                                            <Typography variant="h6" gutterBottom>
                                                Weekly Booking Pattern
                                            </Typography>
                                            <Chart options={bookingTrendsOptions} series={bookingTrendsSeries} type="bar" height={300} />
                                        </CardContent>
                                    </Card>
                                </Grid>

                                {/* Activity Summary */}
                                <Grid size={{ xs: 12, lg: 4 }}>
                                    <Card>
                                        <CardContent>
                                            <Box display="flex" alignItems="center" mb={2}>
                                                <Notifications
                                                    sx={{
                                                        mr: 1,
                                                        color: "primary.main",
                                                    }}
                                                />
                                                <Typography variant="h6">Recent Activity</Typography>
                                            </Box>
                                            <List dense>
                                                {activityData.map((activity, index) => (
                                                    <React.Fragment key={activity.id}>
                                                        <ListItem sx={{ px: 0 }}>
                                                            <ListItemIcon
                                                                sx={{
                                                                    minWidth: 40,
                                                                }}
                                                            >
                                                                {activity.type === "success" && (
                                                                    <CheckCircle
                                                                        sx={{
                                                                            color: "success.main",
                                                                            fontSize: 20,
                                                                        }}
                                                                    />
                                                                )}
                                                                {activity.type === "error" && (
                                                                    <Error
                                                                        sx={{
                                                                            color: "error.main",
                                                                            fontSize: 20,
                                                                        }}
                                                                    />
                                                                )}
                                                                {activity.type === "info" && (
                                                                    <CalendarToday
                                                                        sx={{
                                                                            color: "info.main",
                                                                            fontSize: 20,
                                                                        }}
                                                                    />
                                                                )}
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={
                                                                    <Typography
                                                                        variant="body2"
                                                                        sx={{
                                                                            fontWeight: 500,
                                                                        }}
                                                                    >
                                                                        {activity.message}
                                                                    </Typography>
                                                                }
                                                                secondary={
                                                                    <Typography variant="caption" color="textSecondary">
                                                                        {activity.time}
                                                                    </Typography>
                                                                }
                                                            />
                                                        </ListItem>
                                                        {index < activityData.length - 1 && <Divider />}
                                                    </React.Fragment>
                                                ))}
                                            </List>
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
}
export default Dashboard;
