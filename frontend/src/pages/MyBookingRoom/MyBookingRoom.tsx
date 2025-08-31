import { useNavigate } from "react-router-dom";
import {
    Box, Button, Container, Divider, Grid, Skeleton, Tooltip, Typography, useMediaQuery,
    Card, InputAdornment, FormControl, MenuItem
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";

import theme from "../../styles/Theme";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import AlertGroup from "../../components/AlertGroup/AlertGroup";

import { ClipboardList, Eye, X, Clock, HelpCircle, UserRound } from "lucide-react";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { Base64 } from "js-base64";
import UploadSlipButton from "../../components/UploadSlipButton/UploadSlipButton";


// ====== API ======
import {
    ListBookingRoomsByUser,
    CancelBookingRoom,
    SubmitPaymentSlip
} from "../../services/http";

import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";

import BookingStatusCards from "../../components/BookingStatusCards/BookingStatusCards";
import { getDisplayStatus } from "../../utils/bookingFlow";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";


// ====== Type ======
interface BookingRoomsInterface {
    ID: number;
    CreatedAt?: string;
    Room?: { RoomNumber?: number | string; Floor?: { Number?: number } };
    BookingDates?: Array<{ Date: string }>;
    Merged_time_slots?: Array<{ start_time: string; end_time: string }>;
    StatusName?: string;
    Purpose?: string;
    User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
    DisplayStatus?: string;
    Payment?: {
        status?: string;
        slipImages?: string[];
    };
}


function MyBookingRoom() {
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const userId = Number(localStorage.getItem("userId"));

    // ===== state =====
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);

    const [openConfirmCancel, setOpenConfirmCancel] = useState(false);
    const [targetBooking, setTargetBooking] = useState<BookingRoomsInterface | null>(null);

    // ===== ดึงข้อมูลของ user =====
    const getBookingRooms = async () => {
        try {
            const res = await ListBookingRoomsByUser(userId);
            const rows: BookingRoomsInterface[] = res || [];
            console.log("d", res);
            setBookingRooms(rows);


       const counts = rows.reduce((acc: Record<string, number>, it) => {
    let key = (it.DisplayStatus || "unknown").toLowerCase();

    // ✅ รวมกลุ่มสถานะย่อยเข้าไปในหลักๆ
    if (["rejected", "unconfirmed"].includes(key)) key = "pending";
    if (["awaiting receipt", "refunded"].includes(key)) key = "payment"; // 👈 รวม refunded ด้วย
    if (!["pending", "confirmed", "payment review", "payment", "completed", "cancelled"].includes(key)) {
        key = "unknown"; // กันพลาด
    }

    acc[key] = (acc[key] || 0) + 1;
    return acc;
}, {});
setStatusCounts(counts);

        } catch (e) {
            setAlerts(a => [...a, { type: "error", message: "โหลด bookings ไม่สำเร็จ" }]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        getBookingRooms();
    }, []);

    // ===== filter =====
    const filtered = useMemo(() => {
        const normalize = (v?: string) => (v || "").trim().toLowerCase();

        return bookingRooms.filter((item) => {
            const matchSearch =
                searchText === "" ||
                (item.Purpose || "").toLowerCase().includes(searchText.toLowerCase()) ||
                String(item.Room?.RoomNumber ?? "").toLowerCase().includes(searchText.toLowerCase());

            const matchDate =
                !selectedDate ||
                item.BookingDates?.some((d) => dayjs(d.Date).isSame(selectedDate, "month"));

            const statusKey = getDisplayStatus(item);
            const matchStatus =
                selectedStatus === "all" ||
                normalize(statusKey) === normalize(selectedStatus);

            const matchFloor =
                selectedFloor === "all" ||
                item.Room?.Floor?.Number === selectedFloor;

            return matchSearch && matchDate && matchStatus && matchFloor;
        });
    }, [bookingRooms, searchText, selectedDate, selectedStatus, selectedFloor]);

    const totalFiltered = filtered.length;

    // ===== Actions =====
    const handleCancelBooking = async (id: number) => {
        try {
            await CancelBookingRoom(id);
            setAlerts(a => [...a, { type: "success", message: "Booking cancelled" }]);
            await getBookingRooms();
        } catch (e) {
            setAlerts(a => [...a, { type: "error", message: "Cancel failed" }]);
        }
    };




    const handleClickCheck = (row: BookingRoomsInterface) => {
        if (!row?.ID) return;
        const encodedId = Base64.encode(String(row.ID));
        navigate(`/booking/review?booking_id=${encodeURIComponent(encodedId)}&source=my`);
    };

    const handleClearFilter = () => {
        setSearchText("");
        setSelectedDate(null);
        setSelectedStatus("all");
        setSelectedFloor("all");
    };


    // ===== Columns =====
    const getColumns = (): GridColDef[] => {
        return [
            { field: "ID", headerName: "No.", flex: 0.5, align: "center", headerAlign: "center" },
            {
                field: "Title",
                headerName: "Title",
                flex: 1.8,
                renderCell: (params) => {
                    const d = params.row as BookingRoomsInterface;
                    const room = `Room ${d.Room?.RoomNumber ?? "-"}`;
                    const floor = `Floor ${d.Room?.Floor?.Number ?? "-"}`;
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography sx={{ fontSize: 14 }}>{room} • {floor}</Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                                {d.Purpose || "-"}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                field: "Date",
                headerName: "Date Submitted",
                flex: 1,
                renderCell: (params) => {
                    const d = params.row as BookingRoomsInterface;
                    const date = dateFormat(d.CreatedAt || "");
                    const time = timeFormat(d.CreatedAt || "");
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column" }}>
                            <Typography sx={{ fontSize: 14 }}>{date}</Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{time}</Typography>
                        </Box>
                    );
                },
            },
            {
                field: "Status",
                headerName: "Status",
                flex: 1,
                renderCell: (params) => {
                    const name = getDisplayStatus(params.row);
                    const cfg = getBookingStatusConfig(name);

                    return (
                        <Box
                            sx={{
                                bgcolor: cfg.colorLite,
                                borderRadius: 10,
                                px: 1.5,
                                py: 0.5,
                                display: "flex",
                                gap: 1,
                                color: cfg.color,
                                alignItems: "center",
                            }}
                        >
                            <cfg.icon size={18} />
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                {cfg.label}
                            </Typography>
                        </Box>
                    );
                },
            },
            {
                field: "Actions",
                headerName: "Actions",
                flex: 2,
                renderCell: (params) => {
                    const row = params.row as BookingRoomsInterface;
                    return (
                        <Box sx={{ display: "flex", gap: 1 }}>
                            <Tooltip title="Details">
                                <Button variant="outlinedGray" onClick={() => handleClickCheck(row)}>
                                    <Eye size={18} />
                                    <Typography variant="textButtonClassic">Details</Typography>
                                </Button>
                            </Tooltip>

                            {getDisplayStatus(row) === "confirmed" && !row.Payment?.slipImages?.length && (
                                <UploadSlipButton
                                    bookingId={row.ID}
                                    payerId={Number(localStorage.getItem("userId"))}
                                    onSuccess={() => {
                                        setAlerts((prev) => [
                                            ...prev,
                                            { type: "success", message: "อัปโหลดสลิปสำเร็จ" },
                                        ]);
                                        getBookingRooms(); // refresh table
                                    }}
                                    onError={() => {
                                        setAlerts((prev) => [
                                            ...prev,
                                            { type: "error", message: "อัปโหลดสลิปล้มเหลว" },
                                        ]);
                                    }}
                                />
                            )}


                            {row.StatusName !== "cancelled" && (
                                <Button
                                    variant="contained"
                                    color="error"
                                    size="small"
                                    onClick={() => {
                                        setTargetBooking(row);
                                        setOpenConfirmCancel(true);
                                    }}
                                >
                                    <X size={18} /> Cancel
                                </Button>
                            )}
                        </Box>
                    );

                },
            }
        ];
    };

    return (
        <Box className="all-maintenance-request-page">
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <ConfirmDialog
                open={openConfirmCancel}
                setOpenConfirm={setOpenConfirmCancel}
                handleFunction={() => {
                    if (targetBooking) handleCancelBooking(targetBooking.ID);
                }}
                title="Confirm Cancel Booking"
                message="คุณแน่ใจหรือไม่ที่จะยกเลิกการจองนี้?"
                buttonActive={false}
            />

            <Container maxWidth="xl">
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction="row" size={{ xs: 12 }} sx={{ gap: 1 }}>
                        <ClipboardList size={26} />
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            My Booking Rooms
                        </Typography>
                    </Grid>

                    {!isLoadingData ? (
                        <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                <BookingStatusCards statusCounts={statusCounts} />
                                {/* ฟิลเตอร์ของคุณต่อจากนี้ได้เลย */}
                            </Grid>


                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ mt: 2, p: 2 }}>
                                    <Grid container spacing={1} alignItems="center">
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Search"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                slotProps={{
                                                    input: { startAdornment: <InputAdornment position="start">🔍</InputAdornment> }
                                                }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 3 }}>
                                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                <DatePicker
                                                    views={["month", "year"]}
                                                    format="MM/YYYY"
                                                    value={selectedDate}
                                                    onChange={setSelectedDate}
                                                    slots={{ openPickerIcon: CalendarMonth }}
                                                    sx={{ width: "100%" }}
                                                />
                                            </LocalizationProvider>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 2 }}>
                                            <FormControl fullWidth>
                                                <Select value={selectedFloor} onChange={(e) => setSelectedFloor(e.target.value as any)}>
                                                    <MenuItem value="all">All Floors</MenuItem>
                                                    {[...new Set(bookingRooms.map(b => b.Room?.Floor?.Number).filter(Boolean))].map(f => (
                                                        <MenuItem key={String(f)} value={f as number}>Floor {String(f)}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 2 }}>
                                            <FormControl fullWidth>
                                                <Select
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value as string)}
                                                >
                                                    <MenuItem value="all">All Status</MenuItem>
                                                    {[...new Set(bookingRooms.map(b => getDisplayStatus(b)).filter(Boolean))].map(s => (
                                                        <MenuItem key={s} value={s}>
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 1 }}>
                                            <Button onClick={handleClearFilter} sx={{ height: 45 }}>Clear</Button>
                                        </Grid>
                                    </Grid>
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                    )}

                    {/* Data Table */}
                    <Grid size={{ xs: 12 }} minHeight="200px">
                        {!isLoadingData ? (
                            <CustomDataGrid
                                rows={filtered}
                                columns={getColumns()}
                                getRowId={(row) => row.ID}
                                rowCount={totalFiltered}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noDataText="No booking data"
                            />
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}

export default MyBookingRoom;
