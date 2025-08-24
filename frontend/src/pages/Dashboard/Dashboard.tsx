import React, { useEffect, useRef, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardContent,
    Container,
    Dialog,
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
import {
    GetMaintenanceTypes,
    GetUserById,
    ListBookingRoomByDateRange,
    ListBookingRoomPaymentsByDateRange,
    ListInvoiceByDateRange,
    ListInvoicePaymentsByDateRange,
    ListMaintenanceRequestsByDateRange,
} from "../../services/http";
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
import {
    CalendarMonth,
    CalendarToday,
    CheckCircle,
    Close,
    Error,
    HelpOutline,
    Notifications,
} from "@mui/icons-material";
import { MaintenanceTypesInteface } from "../../interfaces/IMaintenanceTypes";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import RequestStatusStackForAdmin from "../../components/RequestStatusStackForAdmin/RequestStatusStackForAdmin";
import CustomTabPanel from "../../components/CustomTabPanel/CustomTabPanel";

import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useTranslation } from "react-i18next";

import { Select } from "../../components/Select/Select";
import {
    BrushCleaning,
    ChartColumnStacked,
    ChartLine,
    Check,
    Coins,
    CreditCard,
    DoorOpen,
    LayoutDashboard,
    LineChart,
    LucideIcon,
    UserRound,
} from "lucide-react";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { PaymentInterface } from "../../interfaces/IPayments";
import ApexRevenueBarChart from "../../components/ApexRevenueBarChart/ApexRevenueBarChart";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import { InvoiceInterface } from "../../interfaces/IInvoices";

function Dashboard() {
    const [user, setUser] = useState<UserInterface>();
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>(
        []
    );
    const [bookingRoomPayments, setBookingRoomPayments] = useState<PaymentInterface[]>([])
    const [invoicePayments, setInvoicePayments] = useState<PaymentInterface[]>([])
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([])
    const [invoices, setInvoices] = useState<InvoiceInterface[]>([])
    const [filteredRequest, setFilteredRequest] = useState<MaintenanceRequestsInterface[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([]);
    const [groupedData, setGroupedData] = useState<
        Record<string, { total: number; completed: number; completedPercentage: number }>
    >({});

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>();
    const [completedPercentage, setCompletedPercentage] = useState<number>(0);

    const [selectedDateOption, setSelectedDateOption] = useState<string>("daily");
    const [selectedDateOptionRoom, setSelectedDateOptionRoom] = useState<string>("daily");

    const [dateRange, setDateRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: null,
        end: null,
    });
    const [dateRangeRoom, setDateRangeRoom] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: null,
        end: null,
    });

    const [valueTab, setValueTab] = useState(0);
    const [open, setOpen] = useState(false);
    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);

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
                dateRange.start ? dateRange.start.format("YYYY-MM-DD") : "",
                dateRange.end ? dateRange.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setMaintenanceRequests(res);
            }
        } catch (error) {
            console.error("Error fetching maintenance requests:", error);
        }
    };

    const getBookingRoomPayments = async () => {
        try {
            const res = await ListBookingRoomPaymentsByDateRange(
                dateRangeRoom.start ? dateRangeRoom.start.format("YYYY-MM-DD") : "",
                dateRangeRoom.end ? dateRangeRoom.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setBookingRoomPayments(res);
            }
        } catch (error) {
            console.error("Error fetching payment:", error);
        }
    };

    const getInvoicePayments = async () => {
        try {
            const res = await ListInvoicePaymentsByDateRange(
                dateRangeRoom.start ? dateRangeRoom.start.format("YYYY-MM-DD") : "",
                dateRangeRoom.end ? dateRangeRoom.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setInvoicePayments(res);
            }
        } catch (error) {
            console.error("Error fetching payment:", error);
        }
    };

    const getInvoices = async () => {
        try {
            const res = await ListInvoiceByDateRange(
                dateRangeRoom.start ? dateRangeRoom.start.format("YYYY-MM-DD") : "",
                dateRangeRoom.end ? dateRangeRoom.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setInvoices(res);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const getBookingRooms = async () => {
        try {
            const res = await ListBookingRoomByDateRange(
                dateRangeRoom.start ? dateRangeRoom.start.format("YYYY-MM-DD") : "",
                dateRangeRoom.end ? dateRangeRoom.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setBookingRooms(res);
            }
        } catch (error) {
            console.error("Error fetching booking rooms:", error);
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
        if (selectedDateOption === "hourly") {
            const today = dayjs().startOf("day");
            setDateRange((prev) => ({
                ...prev,
                start: today,
                end: null,
            }));
        } else {
            setDateRange({
                start: null,
                end: null,
            });
        }
    };

    const handleClearFillterRoom = () => {
        setDateRangeRoom({
            start: null,
            end: null,
        });
    };

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

        getBookingRoomPayments();
        getInvoicePayments()
        getInvoices()
        getBookingRooms()
        // Remove analytics tracking from Dashboard
        // analyticsService.trackKeyPageVisit('DASHBOARD', 'Dashboard');
    }, []);

    useEffect(() => {
        if (
            (dateRange.start && selectedDateOption === "hourly") ||
            (dateRange.start && dateRange.end) ||
            (!dateRange.start && !dateRange.end)
        ) {
            getMaintenanceRequests();
        }
    }, [dateRange]);

    useEffect(() => {
        if (
            (dateRangeRoom.start && selectedDateOptionRoom === "hourly") ||
            (dateRangeRoom.start && dateRangeRoom.end) ||
            (!dateRangeRoom.start && !dateRangeRoom.end)
        ) {
            getBookingRoomPayments();
            getBookingRooms();
            getInvoicePayments();
            getInvoices();
        }
    }, [dateRangeRoom]);

    const prevDateOption = useRef<string>(selectedDateOption);
    useEffect(() => {
        if (selectedDateOption === "hourly") {
            const today = dayjs().startOf("day");
            setDateRange((prev) => ({
                ...prev,
                start: today,
                end: null,
            }));
        } else {
            if (prevDateOption.current === "hourly") {
                setDateRange((prev) => ({
                    ...prev,
                    start: null,
                    end: null,
                }));
            }
        }
        getMaintenanceRequests();
        prevDateOption.current = selectedDateOption;
    }, [selectedDateOption]);

    const prevDateOptionRoom = useRef<string>(selectedDateOptionRoom);
    useEffect(() => {
        if (selectedDateOptionRoom === "hourly") {
            const today = dayjs().startOf("day");
            setDateRange((prev) => ({
                ...prev,
                start: today,
                end: null,
            }));
        } else {
            if (prevDateOptionRoom.current === "hourly") {
                setDateRange((prev) => ({
                    ...prev,
                    start: null,
                    end: null,
                }));
            }
        }
        getBookingRoomPayments();
        getBookingRooms();
        getInvoicePayments();
        getInvoices();
        prevDateOptionRoom.current = selectedDateOptionRoom;
    }, [selectedDateOptionRoom]);

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
        const completedCount = dataToUse.filter(
            (item) => item.RequestStatus?.Name === "Completed"
        ).length;

        if (maintenanceRequests.length) {
            const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
            setCompletedPercentage(percentage);
        } else {
            setCompletedPercentage(0);
        }

        // ✅ สร้าง group เริ่มต้นจาก maintenanceTypes ทั้งหมด
        const grouped: Record<
            string,
            { total: number; completed: number; completedPercentage: number }
        > = {};

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

            grouped[typeName].completedPercentage =
                (grouped[typeName].completed / grouped[typeName].total) * 100;
        });

        setGroupedData(grouped);
    }, [maintenanceRequests, maintenanceTypes]);

    useEffect(() => {
        if (dateRange.start && !dateRange.end && selectedDateOption !== "hourly") {
            setTimeout(() => setOpenEndPicker(true), 100);
        }
    }, [dateRange.start]);

    useEffect(() => {
        if (dateRange.end && !dateRange.start && selectedDateOption !== "hourly") {
            setTimeout(() => setOpenStartPicker(true), 100);
        }
    }, [dateRange.end]);

    useEffect(() => {
        if (dateRangeRoom.start && !dateRangeRoom.end && selectedDateOptionRoom !== "hourly") {
            setTimeout(() => setOpenEndPicker(true), 100);
        }
    }, [dateRangeRoom.start]);

    useEffect(() => {
        if (dateRangeRoom.end && !dateRangeRoom.start && selectedDateOptionRoom !== "hourly") {
            setTimeout(() => setOpenStartPicker(true), 100);
        }
    }, [dateRangeRoom.end]);

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

    const SummaryCard: React.FC<{
        title: string;
        value: string | number;
        icon: LucideIcon;
        color: string;
        subtitle?: string;
    }> = ({ title, value, icon, color, subtitle }) => {
        const Icon = icon;
        return (
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
                            {(typeof value === "number" &&
                                title.toLowerCase().includes("revenue")) ||
                                title.toLowerCase().includes("fee")
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
                            <Icon size={28} style={{ minWidth: "28px", minHeight: "28px" }} />
                        </Box>
                    </Grid>
                </CardContent>
            </Card>
        );
    };

    const timeFrameOptions = [
        { label: "Hourly", value: "hourly" },
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
    ];

    const timeFrameOptionsRoom = [
        { label: "Daily", value: "daily" },
        { label: "Weekly", value: "weekly" },
        { label: "Monthly", value: "monthly" },
        { label: "Yearly", value: "yearly" },
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
                        direction={"row"}
                        size={{ xs: 12, md: 12 }}
                        sx={{ gap: 1 }}
                    >
                        <LayoutDashboard size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Dashboard
                        </Typography>
                    </Grid>

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Tabs
                            value={valueTab}
                            onChange={handleChange}
                            variant="scrollable"
                            allowScrollButtonsMobile
                        >
                            <Tab label={t("maintenance")} {...a11yProps(0)} />
                            <Tab label={t("bookingRoom")} {...a11yProps(1)} />
                        </Tabs>
                    </Grid>

                    <CustomTabPanel value={valueTab} index={0}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            <Grid container size={{ md: 12, lg: 12, xl: 8 }} spacing={3}>
                                {/* Status Section */}
                                <RequestStatusCards statusCounts={countRequestStatus || {}} />

                                <RequestStatusStackForAdmin
                                    statusCounts={countRequestStatus || {}}
                                />

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
                                            gap: 1,
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
                                                <Typography
                                                    variant="subtitle1"
                                                    color="text.main"
                                                    fontWeight={600}
                                                >
                                                    Requests
                                                </Typography>
                                                <Typography
                                                    variant="h4"
                                                    fontWeight={800}
                                                    color="primary"
                                                >
                                                    <Box component="span">
                                                        {`${filteredRequest.length}`}
                                                    </Box>{" "}
                                                    <Box
                                                        component="span"
                                                        sx={{ fontSize: 20, fontWeight: 700 }}
                                                    >
                                                        Items
                                                    </Box>
                                                </Typography>
                                            </Grid>
                                            <Grid
                                                container
                                                size={{ xs: 12, sm: 12, sm650: 8 }}
                                                spacing={1}
                                            >
                                                <Grid
                                                    size={{
                                                        xs: 12,
                                                        sm: 12,
                                                        sm650:
                                                            selectedDateOption === "hourly" ? 4 : 3,
                                                    }}
                                                >
                                                    <FormControl fullWidth>
                                                        <Select
                                                            startAdornment={
                                                                <InputAdornment
                                                                    position="start"
                                                                    sx={{ pl: 0.5 }}
                                                                >
                                                                    <LineChart
                                                                        size={20}
                                                                        strokeWidth={3}
                                                                    />
                                                                </InputAdornment>
                                                            }
                                                            value={selectedDateOption}
                                                            onChange={(value) => {
                                                                setSelectedDateOption(
                                                                    value.target.value as string
                                                                );
                                                            }}
                                                        >
                                                            {timeFrameOptions.map((item, index) => {
                                                                return (
                                                                    <MenuItem
                                                                        key={index}
                                                                        value={item.value}
                                                                    >
                                                                        {item.label}
                                                                    </MenuItem>
                                                                );
                                                            })}
                                                        </Select>
                                                    </FormControl>
                                                </Grid>

                                                {selectedDateOption === "hourly" ? (
                                                    <Grid size={{ xs: 6, sm: 5, sm650: 6 }}>
                                                        <LocalizationProvider
                                                            dateAdapter={AdapterDayjs}
                                                        >
                                                            <DatePicker
                                                                label="Date"
                                                                value={dateRange.start ?? null}
                                                                onChange={(newValue) =>
                                                                    setDateRange((prev) => ({
                                                                        ...prev,
                                                                        start: newValue ?? null,
                                                                    }))
                                                                }
                                                                maxDate={dateRange.end ?? undefined}
                                                                slots={{
                                                                    openPickerIcon: CalendarMonth,
                                                                }}
                                                                format="DD/MM/YYYY"
                                                                open={openStartPicker}
                                                                onOpen={() =>
                                                                    setOpenStartPicker(true)
                                                                }
                                                                onClose={() =>
                                                                    setOpenStartPicker(false)
                                                                }
                                                            />
                                                        </LocalizationProvider>
                                                    </Grid>
                                                ) : (
                                                    <>
                                                        <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                            <LocalizationProvider
                                                                dateAdapter={AdapterDayjs}
                                                            >
                                                                <DatePicker
                                                                    label="Start Date"
                                                                    value={dateRange.start ?? null}
                                                                    onChange={(newValue) =>
                                                                        setDateRange((prev) => ({
                                                                            ...prev,
                                                                            start: newValue ?? null,
                                                                        }))
                                                                    }
                                                                    maxDate={
                                                                        dateRange.end ?? undefined
                                                                    }
                                                                    slots={{
                                                                        openPickerIcon:
                                                                            CalendarMonth,
                                                                    }}
                                                                    format="DD/MM/YYYY"
                                                                    open={openStartPicker}
                                                                    onOpen={() =>
                                                                        setOpenStartPicker(true)
                                                                    }
                                                                    onClose={() =>
                                                                        setOpenStartPicker(false)
                                                                    }
                                                                />
                                                            </LocalizationProvider>
                                                        </Grid>
                                                        <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                            <LocalizationProvider
                                                                dateAdapter={AdapterDayjs}
                                                            >
                                                                <DatePicker
                                                                    label="End Date"
                                                                    value={dateRange.end ?? null}
                                                                    onChange={(newValue) =>
                                                                        setDateRange((prev) => ({
                                                                            ...prev,
                                                                            end: newValue ?? null,
                                                                        }))
                                                                    }
                                                                    minDate={
                                                                        dateRange.start ?? undefined
                                                                    }
                                                                    slots={{
                                                                        openPickerIcon:
                                                                            CalendarMonth,
                                                                    }}
                                                                    format="DD/MM/YYYY"
                                                                    open={openEndPicker}
                                                                    onOpen={() =>
                                                                        setOpenEndPicker(true)
                                                                    }
                                                                    onClose={() =>
                                                                        setOpenEndPicker(false)
                                                                    }
                                                                />
                                                            </LocalizationProvider>
                                                        </Grid>
                                                    </>
                                                )}

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
                                                        <BrushCleaning
                                                            size={22}
                                                            strokeWidth={2.2}
                                                            style={{ color: "gray" }}
                                                        />
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Grid>
                                        <ApexLineChart
                                            selectedDateOption={selectedDateOption}
                                            data={filteredRequest}
                                            height={250}
                                            dateRange={dateRange}
                                        />

                                        <Button
                                            startIcon={<HelpOutline />}
                                            variant="outlinedGray"
                                            onClick={() => setOpen(true)}
                                        >
                                            How to use this chart
                                        </Button>

                                        <Dialog
                                            open={open}
                                            onClose={() => setOpen(false)}
                                            maxWidth="lg"
                                            fullWidth
                                        >
                                            <DialogTitle
                                                sx={{
                                                    fontWeight: 700,
                                                    color: "primary.main",
                                                    textAlign: "center",
                                                }}
                                            >
                                                <FontAwesomeIcon
                                                    icon={faCircleQuestion}
                                                    size="lg"
                                                    style={{ marginRight: "10px" }}
                                                />
                                                Chart Usage Guide
                                                <IconButton
                                                    aria-label="close"
                                                    onClick={() => setOpen(false)}
                                                    sx={{
                                                        position: "absolute",
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
                                                        fontWeight: 600,
                                                    }}
                                                    gutterBottom
                                                >
                                                    {chartUsageNote.title}
                                                </Typography>
                                                {chartUsageNote.points.map((line, index) => {
                                                    const trimmed = line.trimStart();
                                                    const isBullet = trimmed.startsWith("•");

                                                    return (
                                                        <Typography
                                                            key={index}
                                                            component="div"
                                                            sx={{
                                                                pl: isBullet ? 3 : 0, // ใส่ padding-left ถ้าเป็นบูลเล็ท
                                                                whiteSpace: "normal",
                                                                mb: 0.5,
                                                                color: isBullet
                                                                    ? "text.secondary"
                                                                    : "text.primary",
                                                            }}
                                                        >
                                                            {line}
                                                        </Typography>
                                                    );
                                                })}
                                                <Box mt={2}>
                                                    {chartUsageNote.notes.map((note, idx) => (
                                                        <Typography
                                                            key={idx}
                                                            sx={{ whiteSpace: "normal", mb: 0.5 }}
                                                        >
                                                            {note}
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            </DialogContent>
                                        </Dialog>
                                    </Card>
                                </Grid>
                            </Grid>

                            {/* Chart Donut Section */}
                            <Grid size={{ xs: 12, sm: 12, lg: 12, xl: 4 }}>
                                <ApexDonutChart
                                    data={groupedData}
                                    completed={completedPercentage}
                                />
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    <CustomTabPanel value={valueTab} index={1}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            {/* Summary Cards */}
                            <Grid size={{ xs: 12 }} container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Bookings"
                                        value={summaryData.totalBookings}
                                        icon={Check}
                                        color="#1976d2"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Available Rooms"
                                        value={summaryData.availableRooms}
                                        icon={DoorOpen}
                                        color="#4caf50"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Revenue"
                                        value={summaryData.totalRevenue}
                                        icon={ChartLine}
                                        color="#ff9800"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Payment Fees"
                                        value={summaryData.paymentFees}
                                        icon={CreditCard}
                                        color="#f44336"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Net Revenue"
                                        value={summaryData.netRevenue}
                                        icon={Coins}
                                        color="#9c27b0"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 4 }}>
                                    <SummaryCard
                                        title="Total Users"
                                        value={summaryData.totalUsers}
                                        icon={UserRound}
                                        color="#00bcd4"
                                    />
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12 }}>
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
                                        gap: 1,
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
                                        <Grid 
                                            container
                                            size={{ xs: 12, sm: 12, sm650: 4 }}
                                            direction={'row'}
                                            alignItems={'center'}
                                        >
                                            <ChartColumnStacked size={24} style={{ minWidth: '24px', minHeight: '24px' }}/>
                                            <Typography
                                                variant="subtitle1"
                                                color="text.main"
                                                fontWeight={600}
                                                fontSize={22}
                                            >
                                                Revenue Comparison
                                            </Typography>
                                        </Grid>
                                        <Grid
                                            container
                                            size={{ xs: 12, sm: 12, sm650: 8 }}
                                            spacing={1}
                                        >
                                            <Grid
                                                size={{
                                                    xs: 12,
                                                    sm: 12,
                                                    sm650:
                                                        selectedDateOptionRoom === "hourly" ? 4 : 3,
                                                }}
                                            >
                                                <FormControl fullWidth>
                                                    <Select
                                                        startAdornment={
                                                            <InputAdornment
                                                                position="start"
                                                                sx={{ pl: 0.5 }}
                                                            >
                                                                <LineChart
                                                                    size={20}
                                                                    strokeWidth={3}
                                                                />
                                                            </InputAdornment>
                                                        }
                                                        value={selectedDateOptionRoom}
                                                        onChange={(value) => {
                                                            setSelectedDateOptionRoom(
                                                                value.target.value as string
                                                            );
                                                        }}
                                                    >
                                                        {timeFrameOptionsRoom.map((item, index) => {
                                                            return (
                                                                <MenuItem
                                                                    key={index}
                                                                    value={item.value}
                                                                >
                                                                    {item.label}
                                                                </MenuItem>
                                                            );
                                                        })}
                                                    </Select>
                                                </FormControl>
                                            </Grid>

                                            {selectedDateOption === "hourly" ? (
                                                <Grid size={{ xs: 6, sm: 5, sm650: 6 }}>
                                                    <LocalizationProvider
                                                        dateAdapter={AdapterDayjs}
                                                    >
                                                        <DatePicker
                                                            label="Date"
                                                            value={dateRangeRoom.start ?? null}
                                                            onChange={(newValue) =>
                                                                setDateRangeRoom((prev) => ({
                                                                    ...prev,
                                                                    start: newValue ?? null,
                                                                }))
                                                            }
                                                            maxDate={dateRangeRoom.end ?? undefined}
                                                            slots={{
                                                                openPickerIcon: CalendarMonth,
                                                            }}
                                                            format="DD/MM/YYYY"
                                                            open={openStartPicker}
                                                            onOpen={() =>
                                                                setOpenStartPicker(true)
                                                            }
                                                            onClose={() =>
                                                                setOpenStartPicker(false)
                                                            }
                                                        />
                                                    </LocalizationProvider>
                                                </Grid>
                                            ) : (
                                                <>
                                                    <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                        <LocalizationProvider
                                                            dateAdapter={AdapterDayjs}
                                                        >
                                                            <DatePicker
                                                                label="Start Date"
                                                                value={dateRangeRoom.start ?? null}
                                                                onChange={(newValue) =>
                                                                    setDateRangeRoom((prev) => ({
                                                                        ...prev,
                                                                        start: newValue ?? null,
                                                                    }))
                                                                }
                                                                maxDate={
                                                                    dateRangeRoom.end ?? undefined
                                                                }
                                                                slots={{
                                                                    openPickerIcon:
                                                                        CalendarMonth,
                                                                }}
                                                                format="DD/MM/YYYY"
                                                                open={openStartPicker}
                                                                onOpen={() =>
                                                                    setOpenStartPicker(true)
                                                                }
                                                                onClose={() =>
                                                                    setOpenStartPicker(false)
                                                                }
                                                            />
                                                        </LocalizationProvider>
                                                    </Grid>
                                                    <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                        <LocalizationProvider
                                                            dateAdapter={AdapterDayjs}
                                                        >
                                                            <DatePicker
                                                                label="End Date"
                                                                value={dateRangeRoom.end ?? null}
                                                                onChange={(newValue) =>
                                                                    setDateRangeRoom((prev) => ({
                                                                        ...prev,
                                                                        end: newValue ?? null,
                                                                    }))
                                                                }
                                                                minDate={
                                                                    dateRangeRoom.start ?? undefined
                                                                }
                                                                slots={{
                                                                    openPickerIcon:
                                                                        CalendarMonth,
                                                                }}
                                                                format="DD/MM/YYYY"
                                                                open={openEndPicker}
                                                                onOpen={() =>
                                                                    setOpenEndPicker(true)
                                                                }
                                                                onClose={() =>
                                                                    setOpenEndPicker(false)
                                                                }
                                                            />
                                                        </LocalizationProvider>
                                                    </Grid>
                                                </>
                                            )}

                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Button
                                                    onClick={handleClearFillterRoom}
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
                                                    <BrushCleaning
                                                        size={22}
                                                        strokeWidth={2.2}
                                                        style={{ color: "gray" }}
                                                    />
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                    <ApexRevenueBarChart
                                        bookingPaymentData={bookingRoomPayments}
                                        invoicePaymentData={invoicePayments}
                                        height={350}
                                        dateRange={dateRangeRoom}
                                        selectedDateOption={selectedDateOptionRoom}
                                    />
                                </Card>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>
                </Grid>
            </Container>
        </Box>
    );
}
export default Dashboard;
