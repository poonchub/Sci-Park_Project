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
    GetBookingRoomSummaryThisMonth,
    GetMaintenanceTypes,
    GetMeetingRoomSummaryToday,
    GetPreviousMonthInvoiceSummary,
    GetRentalSpaceRoomSummary,
    GetUserById,
    ListBookingRoomByDateRange,
    // ListBookingRoomByDateRange,
    ListBookingRoomPaymentsByDateRange,
    ListInvoiceByDateRange,
    ListInvoicePaymentsByDateRange,
    ListMaintenanceRequestsByDateRange,
} from "../../services/http";
import { UserInterface } from "../../interfaces/IUser";
import { MaintenanceRequestsInterface } from "../../interfaces/IMaintenanceRequests";

import "./DashBoard.css";
import RequestStatusCards from "../../components/RequestStatusCards/RequestStatusCards";
import ApexDonutChart from "../../components/MaintenanceTypeDonutChart/MaintenanceTypeDonutChart";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import dayjs, { Dayjs } from "dayjs";
import {
    CalendarMonth,
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
    ChartArea,
    ChartColumnStacked,
    ChartLine,
    Check,
    CheckCircle,
    CircleDollarSign,
    Clock,
    Coins,
    CreditCard,
    DoorClosed,
    DoorOpen,
    FileText,
    HelpCircle,
    LayoutDashboard,
    LineChart,
    LucideIcon,
    TrendingUp,
    UserRound,
    Wrench,
    X,
} from "lucide-react";
import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { PaymentInterface } from "../../interfaces/IPayments";
import ApexRevenueBarChart from "../../components/ApexRevenueBarChart/ApexRevenueBarChart";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import { InvoiceInterface } from "../../interfaces/IInvoices";
import ApexMaintenanceLineChart from "../../components/ApexMaintenanceLineChart/ApexMaintenanceLineChart";
import ApexBookingRoomRevenueBarChart from "../../components/ApexBookingRoomRevenueBarChart/ApexBookingRoomRevenueBarChart";
import ApexInvoiceRevenueBarChart from "../../components/ApexInvoiceRevenueBarChart/ApexInvoiceRevenueBarChart";
import { roomStatusConfig } from "../../constants/roomStatusConfig";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import { bookingStatusConfig } from "../../constants/bookingStatusConfig";
import ApexBookingLineChart from "../../components/ApexBookingLineChart/ApexBookingLineChart";

function Dashboard() {
    const [user, setUser] = useState<UserInterface>();
    const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequestsInterface[]>(
        []
    );
    const [bookingRoomPayments, setBookingRoomPayments] = useState<PaymentInterface[]>([])
    const [invoicePayments, setInvoicePayments] = useState<PaymentInterface[]>([])
    const [invoices, setInvoices] = useState<InvoiceInterface[]>([])
    const [filteredRequest, setFilteredRequest] = useState<MaintenanceRequestsInterface[]>([]);
    const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceTypesInteface[]>([]);
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([])

    const [previousMonthInvoiceSummary, setPreviousMonthInvoiceSummary] = useState<{
        billing_period: string;
        overdue_invoices: number;
        paid_invoices: number;
        total_invoices: number;
        total_revenue: number;
    }>()
    const [rentalSpaceRoomSummary, setRentalSpaceRoomSummary] = useState<{
        total_rooms: number;
        available_rooms: number;
        rooms_under_maintenance: number;
    }>()
    const [meetingRoomSummaryToday, setMeetingRoomSummaryToday] = useState<{
        available_today: number;
        total_rooms: number;
    }>()
    const [bookingRoomSummaryThisMonth, setBookingRoomSummaryThisMonth] = useState<{
        status_summary: {
            StatusName: string;
            Count: number;
        }[];
        total_bookings: number;
    }>()

    const [groupedData, setGroupedData] = useState<
        Record<string, { total: number; completed: number; completedPercentage: number }>
    >({});

    const [countRequestStatus, setCountRequestStatus] = useState<Record<string, number>>();
    const [completedPercentage, setCompletedPercentage] = useState<number>(0);

    const [selectedDateOption, setSelectedDateOption] = useState<string>("daily");
    const [selectedDateOptionBookingRoom, setSelectedDateOptionBookingRoom] = useState<string>("daily");
    const [selectedDateOptionBookingRoomRevenue, setSelectedDateOptionBookingRoomRevenue] = useState<string>("daily");
    const [selectedDateOptionRentalRoomRevenue, setSelectedDateOptionRentalRoomRevenue] = useState<string>("daily");


    const today = dayjs();
    const fifteenDaysAgo = today.subtract(14, "day");
    const sevenDaysAgo = today.subtract(6, "day");

    // Maintenance Requests
    const [dateRange, setDateRange] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: fifteenDaysAgo,
        end: today,
    });

    // Booking Rooms
    const [dateRangeBookingRoom, setDateRangeBookingRoom] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: fifteenDaysAgo,
        end: today,
    });

    // Booking Room Revenue
    const [dateRangeBookingRoomRevenue, setDateRangeBookingRoomRevenue] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: sevenDaysAgo,
        end: today,
    });

    // Rental Room Revenue
    const [dateRangeRentalRoom, setDateRangeRentalRoom] = useState<{ start: Dayjs | null; end: Dayjs | null }>({
        start: sevenDaysAgo,
        end: today,
    });

    const [valueTab, setValueTab] = useState(0);
    const [open, setOpen] = useState(false);
    const [openEndPicker, setOpenEndPicker] = useState(false);
    const [openStartPicker, setOpenStartPicker] = useState(false);

    const [openEndPickerRevenue, setOpenEndPickerRevenue] = useState(false);
    const [openStartPickerRevenue, setOpenStartPickerRevenue] = useState(false);

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
                dateRangeBookingRoom.start ? dateRangeBookingRoom.start.format("YYYY-MM-DD") : "",
                dateRangeBookingRoom.end ? dateRangeBookingRoom.end.format("YYYY-MM-DD") : ""
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
                dateRangeBookingRoom.start ? dateRangeBookingRoom.start.format("YYYY-MM-DD") : "",
                dateRangeBookingRoom.end ? dateRangeBookingRoom.end.format("YYYY-MM-DD") : ""
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
                dateRangeBookingRoom.start ? dateRangeBookingRoom.start.format("YYYY-MM-DD") : "",
                dateRangeBookingRoom.end ? dateRangeBookingRoom.end.format("YYYY-MM-DD") : ""
            );

            if (res) {
                setInvoices(res);
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        }
    };

    const getPreviousMonthInvoiceSummary = async () => {
        try {
            const resInvoice = await GetPreviousMonthInvoiceSummary();
            if (resInvoice) {
                setPreviousMonthInvoiceSummary(resInvoice)
            }
        } catch (error) {
            console.error("Error fetching invoice summary:", error);
        }
    };

    const getRentalSpaceRoomSummary = async () => {
        try {
            const resRoom = await GetRentalSpaceRoomSummary();
            if (resRoom) {
                setRentalSpaceRoomSummary(resRoom)
            }
        } catch (error) {
            console.error("Error fetching room summary:", error);
        }
    };

    const getBookingRooms = async () => {
        try {
            const res = await ListBookingRoomByDateRange(
                dateRangeBookingRoom.start ? dateRangeBookingRoom.start.format("YYYY-MM-DD") : "",
                dateRangeBookingRoom.end ? dateRangeBookingRoom.end.format("YYYY-MM-DD") : "",
                1
            );
            if (res) {
                setBookingRooms(res.bookings);
            }
        } catch (error) {
            console.error("Error fetching booking rooms:", error);
        }
    };

    const getBookingRoomSummaryThisMonth = async () => {
        try {
            const res = await GetBookingRoomSummaryThisMonth()
            if (res) {
                setBookingRoomSummaryThisMonth(res);
            }
        } catch (error) {
            console.error("Error fetching booking rooms summary this month:", error);
        }
    };

    const getMeetingRoomSummaryToday = async () => {
        try {
            const res = await GetMeetingRoomSummaryToday()
            if (res) {
                setMeetingRoomSummaryToday(res);
            }
        } catch (error) {
            console.error("Error fetching booking rooms summary today:", error);
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

    // Maintenance Requests
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

    // Booking Rooms
    const handleClearFillterBookingRoom = () => {
        setDateRangeBookingRoom({
            start: null,
            end: null,
        });
    };

    // Booking Room Revenue
    const handleClearFillterBookingRoomRevenue = () => {
        setDateRangeBookingRoomRevenue({
            start: null,
            end: null,
        });
    };

    // Rental Room Revenue
    const handleClearFillterRentalRoom = () => {
        setDateRangeRentalRoom({
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
        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    getMaintenanceRequests(),
                    getUser(),
                    getMaintenanceTypes(),
                ]);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (valueTab === 0) {
            getMaintenanceRequests()
        } else if (valueTab === 1) {
            getBookingRooms()
            getBookingRoomSummaryThisMonth()
            getMeetingRoomSummaryToday()
            getBookingRoomPayments()
        } else if (valueTab === 2) {
            getInvoicePayments()
            getPreviousMonthInvoiceSummary()
            getRentalSpaceRoomSummary()
        }
    }, [valueTab])

    // Maintenance Requests
    useEffect(() => {
        if (valueTab === 0) {
            if (
                (dateRange.start && selectedDateOption === "hourly") ||
                (dateRange.start && dateRange.end) ||
                (!dateRange.start && !dateRange.end)
            ) {
                getMaintenanceRequests();
            }
        }
    }, [dateRange]);

    // Booking Rooms
    useEffect(() => {
        if (valueTab === 1) {
            if (
                (dateRangeBookingRoom.start && selectedDateOptionBookingRoom === "hourly") ||
                (dateRangeBookingRoom.start && dateRangeBookingRoom.end) ||
                (!dateRangeBookingRoom.start && !dateRangeBookingRoom.end)
            ) {
                getBookingRooms();
            }
        }
    }, [dateRangeBookingRoom]);

    // Booking Room Revenue
    useEffect(() => {
        if (valueTab === 1) {
            if (
                (dateRangeBookingRoomRevenue.start && dateRangeBookingRoomRevenue.end) ||
                (!dateRangeBookingRoomRevenue.start && !dateRangeBookingRoomRevenue.end)
            ) {
                getBookingRoomPayments()
            }
        }
    }, [dateRangeBookingRoomRevenue]);

    // Rental Room Revenue
    useEffect(() => {
        if (valueTab === 2) {
            if (
                (dateRangeRentalRoom.start && selectedDateOptionRentalRoomRevenue === "hourly") ||
                (dateRangeRentalRoom.start && dateRangeRentalRoom.end) ||
                (!dateRangeRentalRoom.start && !dateRangeRentalRoom.end)
            ) {
                getInvoicePayments();
                getInvoices();
                getPreviousMonthInvoiceSummary()
                getRentalSpaceRoomSummary()
            }
        }
    }, [dateRangeRentalRoom]);

    // Maintenance Request
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

    // Booking Room
    const prevDateOptionRoom = useRef<string>(selectedDateOptionBookingRoom);
    useEffect(() => {
        if (valueTab !== 1) {
            if (selectedDateOptionBookingRoom === "hourly") {
                const today = dayjs().startOf("day");
                setDateRangeBookingRoom((prev) => ({
                    ...prev,
                    start: today,
                    end: null,
                }));
            } else {
                if (prevDateOptionRoom.current === "hourly") {
                    setDateRangeBookingRoom((prev) => ({
                        ...prev,
                        start: null,
                        end: null,
                    }));
                }
            }
            getBookingRooms();
            prevDateOptionRoom.current = selectedDateOptionBookingRoom;
        }
    }, [selectedDateOptionBookingRoom]);

    useEffect(() => {
        if (valueTab === 1) {
            getBookingRoomPayments()
        }

    }, [selectedDateOptionBookingRoomRevenue])

    useEffect(() => {
        if (valueTab === 2) {
            getInvoicePayments()
        }
    }, [selectedDateOptionRentalRoomRevenue])

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

    // Maintenance Requests
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

    // Booking Rooms
    useEffect(() => {
        if (dateRangeBookingRoom.start && !dateRangeBookingRoom.end) {
            setTimeout(() => setOpenEndPicker(true), 100);
        }
    }, [dateRangeBookingRoom.start]);
    useEffect(() => {
        if (dateRangeBookingRoom.end && !dateRangeBookingRoom.start) {
            setTimeout(() => setOpenStartPicker(true), 100);
        }
    }, [dateRangeBookingRoom.end]);

    // Booking Room Revenue
    useEffect(() => {
        if (dateRangeBookingRoomRevenue.start && !dateRangeBookingRoomRevenue.end) {
            setTimeout(() => setOpenEndPickerRevenue(true), 100);
        }
    }, [dateRangeBookingRoomRevenue.start]);
    useEffect(() => {
        if (dateRangeBookingRoomRevenue.end && !dateRangeBookingRoomRevenue.start) {
            setTimeout(() => setOpenStartPickerRevenue(true), 100);
        }
    }, [dateRangeBookingRoomRevenue.end]);

    // Rental Room Revenue
    useEffect(() => {
        if (dateRangeRentalRoom.start && !dateRangeRentalRoom.end) {
            setTimeout(() => setOpenEndPickerRevenue(true), 100);
        }
    }, [dateRangeRentalRoom.start]);
    useEffect(() => {
        if (dateRangeRentalRoom.end && !dateRangeRentalRoom.start) {
            setTimeout(() => setOpenStartPickerRevenue(true), 100);
        }
    }, [dateRangeRentalRoom.end]);

    const SummaryCard: React.FC<{
        title: string;
        value: string | number;
        icon: LucideIcon;
        color: string;
        colorLite: string;
        subtitle?: string;
    }> = ({ title, value, icon, color, colorLite, subtitle }) => {
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
                                ? `฿${value.toLocaleString("th-TH", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                })}`
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
                                backgroundColor: colorLite
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

    console.log("bookingRoomPayments", bookingRoomPayments)

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
                            <Tab label={"Room Booking"} {...a11yProps(1)} />
                            <Tab label={"Rental Room"} {...a11yProps(2)} />
                        </Tabs>
                    </Grid>

                    {/* Maintenance Dashboard */}
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
                                            <Grid
                                                size={{ xs: 12, sm: 12, sm650: 4 }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 1
                                                    }}
                                                >
                                                    <ChartArea size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                                    <Typography
                                                        variant="subtitle1"
                                                        color="text.main"
                                                        fontWeight={600}
                                                        fontSize={18}
                                                    >
                                                        {`${selectedDateOption.charAt(0).toUpperCase() + selectedDateOption.slice(1).toLowerCase()} Requests`}
                                                    </Typography>
                                                </Box>
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
                                        <ApexMaintenanceLineChart
                                            selectedDateOption={selectedDateOption}
                                            data={filteredRequest}
                                            height={250}
                                            dateRange={dateRange}
                                        />

                                        <Button
                                            startIcon={<HelpCircle size={18} style={{ minWidth: '18px', minHeight: '18px', marginBottom: '2px' }} />}
                                            variant="outlinedGray"
                                            sx={{
                                                backgroundColor: 'transparent'
                                            }}
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
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: 1
                                                }}
                                            >
                                                <HelpCircle size={22} style={{ minWidth: '22px', minHeight: '22px', marginBottom: '2px' }} />
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
                                                    <X size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
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

                    {/* Booking Room Dashboard */}
                    <CustomTabPanel value={valueTab} index={1}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            {/* Summary Cards */}
                            <Grid size={{ xs: 12 }} container columnSpacing={3} rowSpacing={2} >
                                <Grid size={{ xs: 12 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>Today's Room Summary</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Total Rooms"
                                        value={meetingRoomSummaryToday?.total_rooms ?? 0}
                                        icon={DoorClosed}
                                        color="#007BFF"
                                        colorLite="rgba(0, 123, 255, 0.18)"
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Available Rooms"
                                        value={meetingRoomSummaryToday?.available_today ?? 0}
                                        icon={Check}
                                        color={roomStatusConfig["Available"].color}
                                        colorLite={roomStatusConfig["Available"].colorLite}
                                    />
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12 }} container columnSpacing={3} rowSpacing={2} >
                                <Grid size={{ xs: 12 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>Billing & Revenue This Month</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Total Booking"
                                        value={bookingRoomSummaryThisMonth?.total_bookings ?? 0}
                                        icon={FileText}
                                        color="#007BFF"
                                        colorLite="rgba(0, 123, 255, 0.18)"
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Pending Approvals"
                                        value={bookingRoomSummaryThisMonth?.status_summary?.find((item) => item.StatusName === "Pending")?.Count ?? 0}
                                        icon={bookingStatusConfig["pending"].icon}
                                        color={bookingStatusConfig["pending"].color}
                                        colorLite={bookingStatusConfig["pending"].colorLite}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Completed Bookings"
                                        value={bookingRoomSummaryThisMonth?.status_summary?.find((item) => item.StatusName === "Completed")?.Count ?? 0}
                                        icon={bookingStatusConfig["completed"].icon}
                                        color={bookingStatusConfig["completed"].color}
                                        colorLite={bookingStatusConfig["completed"].colorLite}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Total Revenue"
                                        value={0}
                                        icon={TrendingUp}
                                        color="#FFA500"
                                        colorLite="rgba(255, 166, 0, 0.21)"
                                    />
                                </Grid>
                            </Grid>

                            {/* Booking Room Request */}
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
                                        <Grid
                                            container
                                            size={{ xs: 12, sm: 12, sm650: 4 }}
                                            direction={'row'}
                                            alignItems={'center'}
                                        >
                                            <ChartArea size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                            <Typography
                                                variant="subtitle1"
                                                color="text.main"
                                                fontWeight={600}
                                                fontSize={18}
                                            >
                                                {`${selectedDateOptionBookingRoom.charAt(0).toUpperCase() + selectedDateOptionBookingRoom.slice(1).toLowerCase()} Room Bookings`}
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
                                                        selectedDateOptionBookingRoom === "hourly" ? 4 : 3,
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
                                                        value={selectedDateOptionBookingRoom}
                                                        onChange={(value) => {
                                                            setSelectedDateOptionBookingRoom(
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

                                            {selectedDateOptionBookingRoom === "hourly" ? (
                                                <Grid size={{ xs: 6, sm: 5, sm650: 6 }}>
                                                    <LocalizationProvider
                                                        dateAdapter={AdapterDayjs}
                                                    >
                                                        <DatePicker
                                                            label="Date"
                                                            value={dateRangeBookingRoom.start ?? null}
                                                            onChange={(newValue) =>
                                                                setDateRangeBookingRoom((prev) => ({
                                                                    ...prev,
                                                                    start: newValue ?? null,
                                                                }))
                                                            }
                                                            maxDate={dateRangeBookingRoom.end ?? undefined}
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
                                                                value={dateRangeBookingRoom.start ?? null}
                                                                onChange={(newValue) =>
                                                                    setDateRangeBookingRoom((prev) => ({
                                                                        ...prev,
                                                                        start: newValue ?? null,
                                                                    }))
                                                                }
                                                                maxDate={
                                                                    dateRangeBookingRoom.end ?? undefined
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
                                                                value={dateRangeBookingRoom.end ?? null}
                                                                onChange={(newValue) =>
                                                                    setDateRangeBookingRoom((prev) => ({
                                                                        ...prev,
                                                                        end: newValue ?? null,
                                                                    }))
                                                                }
                                                                minDate={
                                                                    dateRangeBookingRoom.start ?? undefined
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
                                                    onClick={handleClearFillterBookingRoom}
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
                                    <ApexBookingLineChart
                                        selectedDateOption={selectedDateOptionBookingRoom}
                                        data={bookingRooms ?? []}
                                        height={250}
                                        dateRange={dateRangeBookingRoom}
                                    />

                                    <Button
                                        startIcon={<HelpCircle size={18} style={{ minWidth: '18px', minHeight: '18px', marginBottom: '2px' }} />}
                                        variant="outlinedGray"
                                        sx={{
                                            backgroundColor: 'transparent'
                                        }}
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
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 1
                                            }}
                                        >
                                            <HelpCircle size={22} style={{ minWidth: '22px', minHeight: '22px', marginBottom: '2px' }} />
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
                                                <X size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
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

                            {/* Booking Room Revenue */}
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
                                            <ChartColumnStacked size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                            <Typography
                                                variant="subtitle1"
                                                color="text.main"
                                                fontWeight={600}
                                                fontSize={18}
                                            >
                                                {`${selectedDateOptionBookingRoomRevenue.charAt(0).toUpperCase() + selectedDateOptionBookingRoomRevenue.slice(1).toLowerCase()} Revenue`}
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
                                                        selectedDateOptionBookingRoomRevenue === "hourly" ? 4 : 3,
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
                                                        value={selectedDateOptionBookingRoomRevenue}
                                                        onChange={(value) => {
                                                            setSelectedDateOptionBookingRoomRevenue(
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

                                            <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                >
                                                    <DatePicker
                                                        label="Start Date"
                                                        value={dateRangeBookingRoomRevenue.start ?? null}
                                                        onChange={(newValue) =>
                                                            setDateRangeBookingRoomRevenue((prev) => ({
                                                                ...prev,
                                                                start: newValue ?? null,
                                                            }))
                                                        }
                                                        maxDate={
                                                            dateRangeBookingRoomRevenue.end ?? undefined
                                                        }
                                                        slots={{
                                                            openPickerIcon:
                                                                CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        open={openStartPickerRevenue}
                                                        onOpen={() =>
                                                            setOpenStartPickerRevenue(true)
                                                        }
                                                        onClose={() =>
                                                            setOpenStartPickerRevenue(false)
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
                                                        value={dateRangeBookingRoomRevenue.end ?? null}
                                                        onChange={(newValue) =>
                                                            setDateRangeBookingRoomRevenue((prev) => ({
                                                                ...prev,
                                                                end: newValue ?? null,
                                                            }))
                                                        }
                                                        minDate={
                                                            dateRangeBookingRoomRevenue.start ?? undefined
                                                        }
                                                        slots={{
                                                            openPickerIcon:
                                                                CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        open={openEndPickerRevenue}
                                                        onOpen={() =>
                                                            setOpenEndPickerRevenue(true)
                                                        }
                                                        onClose={() =>
                                                            setOpenEndPickerRevenue(false)
                                                        }
                                                    />
                                                </LocalizationProvider>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Button
                                                    onClick={handleClearFillterBookingRoomRevenue}
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
                                    <ApexBookingRoomRevenueBarChart
                                        bookingPaymentData={bookingRoomPayments}
                                        height={350}
                                        dateRange={dateRangeBookingRoomRevenue}
                                        selectedDateOption={selectedDateOptionBookingRoomRevenue}
                                    />
                                </Card>
                            </Grid>
                        </Grid>
                    </CustomTabPanel>

                    {/* Rental Room Dashboard */}
                    <CustomTabPanel value={valueTab} index={2}>
                        <Grid container size={{ xs: 12 }} spacing={3}>
                            {/* Summary Cards */}
                            <Grid size={{ xs: 12 }} container columnSpacing={3} rowSpacing={2} >
                                <Grid size={{ xs: 12 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>Room Summary</Typography>
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <SummaryCard
                                        title="Total Rooms"
                                        value={rentalSpaceRoomSummary?.total_rooms ?? 0}
                                        icon={DoorClosed}
                                        color="#007BFF"
                                        colorLite="rgba(0, 123, 255, 0.18)"
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <SummaryCard
                                        title="Available Rooms"
                                        value={rentalSpaceRoomSummary?.available_rooms ?? 0}
                                        icon={Check}
                                        color={roomStatusConfig["Available"].color}
                                        colorLite={roomStatusConfig["Available"].colorLite}
                                    />
                                </Grid>
                                <Grid size={{ xs: 4 }}>
                                    <SummaryCard
                                        title="Rooms Under Maintenance"
                                        value={rentalSpaceRoomSummary?.rooms_under_maintenance ?? 0}
                                        icon={Wrench}
                                        color={roomStatusConfig["Under Maintenance"].color}
                                        colorLite={roomStatusConfig["Under Maintenance"].colorLite}
                                    />
                                </Grid>
                            </Grid>

                            <Grid size={{ xs: 12 }} container columnSpacing={3} rowSpacing={2} >
                                <Grid size={{ xs: 12 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: 16 }}>Billing & Revenue This Month</Typography>
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Total Invoices"
                                        value={previousMonthInvoiceSummary?.total_invoices ?? 0}
                                        icon={FileText}
                                        color="#007BFF"
                                        colorLite="rgba(0, 123, 255, 0.18)"
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Paid Invoices"
                                        value={previousMonthInvoiceSummary?.paid_invoices ?? 0}
                                        icon={CheckCircle}
                                        color={paymentStatusConfig["Paid"].color}
                                        colorLite={paymentStatusConfig["Paid"].colorLite}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Overdue Invoices"
                                        value={previousMonthInvoiceSummary?.overdue_invoices ?? 0}
                                        icon={Clock}
                                        color={paymentStatusConfig["Rejected"].color}
                                        colorLite={paymentStatusConfig["Rejected"].colorLite}
                                    />
                                </Grid>
                                <Grid size={{ xs: 6 }}>
                                    <SummaryCard
                                        title="Total Revenue"
                                        value={previousMonthInvoiceSummary?.total_revenue ?? 0}
                                        icon={TrendingUp}
                                        color="#FFA500"
                                        colorLite="rgba(255, 166, 0, 0.21)"
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
                                            <ChartColumnStacked size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
                                            <Typography
                                                variant="subtitle1"
                                                color="text.main"
                                                fontWeight={600}
                                                fontSize={18}
                                            >
                                                {`${selectedDateOptionRentalRoomRevenue.charAt(0).toUpperCase() + selectedDateOptionRentalRoomRevenue.slice(1).toLowerCase()} Revenue`}
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
                                                        selectedDateOptionRentalRoomRevenue === "hourly" ? 4 : 3,
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
                                                        value={selectedDateOptionRentalRoomRevenue}
                                                        onChange={(value) => {
                                                            setSelectedDateOptionRentalRoomRevenue(
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

                                            <Grid size={{ xs: 6, sm: 5, sm650: 3.5 }}>
                                                <LocalizationProvider
                                                    dateAdapter={AdapterDayjs}
                                                >
                                                    <DatePicker
                                                        label="Start Date"
                                                        value={dateRangeRentalRoom.start ?? null}
                                                        onChange={(newValue) =>
                                                            setDateRangeRentalRoom((prev) => ({
                                                                ...prev,
                                                                start: newValue ?? null,
                                                            }))
                                                        }
                                                        maxDate={
                                                            dateRangeRentalRoom.end ?? undefined
                                                        }
                                                        slots={{
                                                            openPickerIcon:
                                                                CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        open={openStartPickerRevenue}
                                                        onOpen={() =>
                                                            setOpenStartPickerRevenue(true)
                                                        }
                                                        onClose={() =>
                                                            setOpenStartPickerRevenue(false)
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
                                                        value={dateRangeRentalRoom.end ?? null}
                                                        onChange={(newValue) =>
                                                            setDateRangeRentalRoom((prev) => ({
                                                                ...prev,
                                                                end: newValue ?? null,
                                                            }))
                                                        }
                                                        minDate={
                                                            dateRangeRentalRoom.start ?? undefined
                                                        }
                                                        slots={{
                                                            openPickerIcon:
                                                                CalendarMonth,
                                                        }}
                                                        format="DD/MM/YYYY"
                                                        open={openEndPickerRevenue}
                                                        onOpen={() =>
                                                            setOpenEndPickerRevenue(true)
                                                        }
                                                        onClose={() =>
                                                            setOpenEndPickerRevenue(false)
                                                        }
                                                    />
                                                </LocalizationProvider>
                                            </Grid>

                                            <Grid size={{ xs: 12, sm: 2 }}>
                                                <Button
                                                    onClick={handleClearFillterRentalRoom}
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
                                    <ApexInvoiceRevenueBarChart
                                        invoicePaymentData={invoicePayments}
                                        height={350}
                                        dateRange={dateRangeRentalRoom}
                                        selectedDateOption={selectedDateOptionRentalRoomRevenue}
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
