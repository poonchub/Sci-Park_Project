import React, { useEffect, useState } from "react";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Tab,
    Tabs,
    Typography,
} from "@mui/material";
import { GetMaintenanceTypes, GetUserById, ListMaintenanceRequests } from "../../services/http";
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
import { CalendarMonth, CalendarToday, CheckCircle, Error, Notifications } from "@mui/icons-material";
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
import { useMediaQuery, useTheme } from "@mui/system";
import { useTranslation } from "react-i18next";

function Dashboard() {
    const [user, setUser] = useState<UserInterface>();
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>([]);
    const [filteredRequest, setFilteredRequest] = useState<MaintenanceRequestsInterface[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([]);
    const [groupedData, setGroupedData] = useState<Record<string, { total: number; completed: number; completedPercentage: number }>>({});

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>();
    const [completedPercentage, setCompletedPercentage] = useState<number>(0);

    const [alerts, setAlerts] = useState<{ type: string; message: string }[]>([]);

    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

    const [valueTab, setValueTab] = useState(0);

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
            const res = await ListMaintenanceRequests();
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
        setSelectedDate(null)
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
    }, []);

    useEffect(() => {
        getMaintenanceRequests();
    }, [selectedDate]);

    useEffect(() => {
        if (!maintenanceRequests?.length || !maintenanceTypes?.length) return;

        let dataToUse = maintenanceRequests;

        if (selectedDate && dayjs(selectedDate).isValid()) {
            dataToUse = maintenanceRequests.filter((req) => {
                const createdAt = dayjs(req.CreatedAt);
                return createdAt.month() === selectedDate.month() && createdAt.year() === selectedDate.year();
            });
        }

        setFilteredRequest(dataToUse);

        const countStatus = dataToUse.reduce<Record<string, number>>((acc, item) => {
            const status = item.RequestStatus?.Name || "Unknown";
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        setCountRequestStatus(countStatus);

        const total = dataToUse.length;
        const completedCount = dataToUse.filter((item) => item.RequestStatus?.Name === "Completed").length;

        const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
        setCompletedPercentage(percentage);

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
    }, [maintenanceRequests, selectedDate, maintenanceTypes]);

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

    return (
        <Box className="dashboard-page">
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header Section */}
                    <Grid className="title-box" size={{ xs: 12, md: 12 }}>
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
                                                    Monthly Requests
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
                                            <Grid
                                                container
                                                size={{ xs: 10, mobileS: 4, md: 6 }}
                                                sx={{
                                                    justifyContent: { xs: "flex-start", mobileS: "flex-end" },
                                                }}
                                            >
                                                <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                    <DatePicker
                                                        views={["year", "month"]}
                                                        value={selectedDate}
                                                        onChange={(value, _) => {
                                                            if (dayjs.isDayjs(value)) {
                                                                setSelectedDate(value);
                                                            } else {
                                                                setSelectedDate(null);
                                                            }
                                                        }}
                                                        slots={{
                                                            openPickerIcon: CalendarMonth,
                                                        }}
                                                        format="MM/YYYY"
                                                        sx={{
                                                            minWidth: "100px",
                                                            maxWidth: "200px",
                                                        }}
                                                    />
                                                </LocalizationProvider>
                                            </Grid>
                                            <Grid size={{ xs: 2, mobileS: 0.5, md: 1 }}>
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
                                                    <FontAwesomeIcon icon={faBroom} size="lg" style={{ color: "gray" }} />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                        <ApexLineChart data={filteredRequest} height={250} selectedDate={selectedDate} />
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
