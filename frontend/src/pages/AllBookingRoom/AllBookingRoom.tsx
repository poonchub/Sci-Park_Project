import { useNavigate } from "react-router-dom";
// import "./AllMaintenanceRequest.css"; // ใช้สไตล์เดิมเพื่อให้หน้าตาเหมือนกัน
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

import { ClipboardList, Eye, Check, X, Clock, HelpCircle, UserRound, Book } from "lucide-react";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { isAdmin, isManager } from "../../routes";
import { Base64 } from "js-base64";

// ====== ของ Booking ======
import { ListBookingRooms, RefundedBookingRoom } from "../../services/http"; // ถ้ามี ApproveBooking/RejectBooking แล้ว ค่อย import
// import { ApproveBooking, RejectBooking } from "../../services/http";
import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";
import { getDisplayStatus, getNextAction, ActionKey } from "../../utils/bookingFlow";
import FinishActionButton from "../../components/FinishActionButton/FinishActionButton";

import {
    GetBookingRooms,
    ApproveBookingRoom,
    RejectBookingRoom,
    CompleteBookingRoom,

    SubmitPaymentSlip,
    ApprovePayment,
    RejectPayment,
} from "../../services/http";


// เพิ่ม import
// import { USE_BOOKING_MOCK, BOOKING_MOCKS } from "../mocks/bookings";
import BookingStatusCards from "../../components/BookingStatusCards/BookingStatusCards";
// import PaymentReviewDialog from "../../components/PaymentReviewDialog/PaymentReviewDialog";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import RefundButton from "../../components/RefundButton/RefundButton";



// ====== Type (ย่อ) ======
interface BookingRoomsInterface {
    ID: number;
    CreatedAt?: string;
    Room?: { RoomNumber?: number | string; Floor?: { Number?: number } };
    BookingDates?: Array<{ Date: string }>;
    Merged_time_slots?: Array<{ start_time: string; end_time: string }>;
    StatusName?: string; // "pending" | "confirmed" | "cancelled" | ...
    Purpose?: string;
    User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
    DisplayStatus?: string;   // ✅ เพิ่มตรงนี้
    Payment?: {
        id?: number;
        status?: string;
        method?: string;
        ref?: string;
        date?: string;
        slipImages?: string[]; // ✅ เพิ่มตรงนี้
    };
}


function AllBookingRoom() {
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    // ===== state หลัก =====
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
    console.log("bookingRooms", bookingRooms);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // ===== ฟิลเตอร์ (เหมือน AllBookingRoom เดิม) =====
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");

    // ===== ตาราง =====
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);

    // ===== ปุ่มยืนยัน =====
    const [openConfirmApprove, setOpenConfirmApprove] = useState(false);
    const [openConfirmReject, setOpenConfirmReject] = useState(false);
    const [selectedRow, setSelectedRow] = useState<BookingRoomsInterface | null>(null);
    // ===== FORCE MOCK (ตั้งเป็น true เพื่อใช้ mock 100%) =====
    // const USE_MOCK = true;

    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);

    // ===== ดึงข้อมูล =====
    // const getBookingRooms = async () => {
    //     try {
    //         if (USE_MOCK) {
    //             // ⬇️ ใช้ MOCK_BOOKINGS โดยตรง (บล็อค MOCK ที่ผมให้ไว้ก่อนหน้านี้)
    //             const rows = BOOKING_MOCKS as BookingRoomsInterface[];
    //             setBookingRooms(rows);

    //             const counts = rows.reduce((acc: Record<string, number>, it) => {
    //                 const key = (it.StatusName || "unknown").toLowerCase();
    //                 acc[key] = (acc[key] || 0) + 1;
    //                 return acc;
    //             }, {});
    //             setStatusCounts(counts);

    //             return; // ออกเลย ไม่เรียก API จริง
    //         }

    //         // ⬇️ โค้ดเดิม (เรียก API จริง) — จะไม่ถูกเรียกถ้า USE_MOCK = true
    //         const res = await ListBookingRooms();
    //         const rows: BookingRoomsInterface[] = res || [];
    //         setBookingRooms(rows);

    //         const counts = rows.reduce((acc: Record<string, number>, it) => {
    //             const key = (it.StatusName || "unknown").toLowerCase();
    //             acc[key] = (acc[key] || 0) + 1;
    //             return acc;
    //         }, {});
    //         setStatusCounts(counts);
    //     } catch (e) {
    //         // ถ้า API พัง ให้ fallback เป็น mock
    //         const rows = BOOKING_MOCKS as BookingRoomsInterface[];
    //         setBookingRooms(rows);

    //         const counts = rows.reduce((acc: Record<string, number>, it) => {
    //             const key = (it.StatusName || "unknown").toLowerCase();
    //             acc[key] = (acc[key] || 0) + 1;
    //             return acc;
    //         }, {});
    //         setStatusCounts(counts);

    //         setAlerts(a => [...a, { type: "warning", message: "Using mock bookings (API unavailable)" }]);
    //     } finally {
    //         setIsLoadingData(false);
    //     }
    // };
    const getBookingRooms = async () => {
        try {
            const res = await GetBookingRooms();

            const rows: BookingRoomsInterface[] = res || [];
            console.log("d", res);
            setBookingRooms(rows);


            // MyBooking / AllBooking
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

    // ===== กรองข้อมูล (AllBookingRoom เดิม) =====
    const filtered = useMemo(() => {
        const normalize = (v?: string) => (v || "").trim().toLowerCase();

        return bookingRooms.filter((item) => {
            const matchSearch =
                searchText === "" ||
                (item.Purpose || "").toLowerCase().includes(searchText.toLowerCase()) ||
                String(item.Room?.RoomNumber ?? "").toLowerCase().includes(searchText.toLowerCase()) ||
                normalize(item.User?.FirstName).includes(normalize(searchText)) ||
                normalize(item.User?.LastName).includes(normalize(searchText)) ||
                normalize(item.User?.EmployeeID).includes(normalize(searchText));

            const matchDate =
                !selectedDate ||
                item.BookingDates?.some((d) => dayjs(d.Date).isSame(selectedDate, "month"));

            // ใช้ getDisplayStatus รวมสถานะ booking + payment
            const statusKey = getDisplayStatus(item);
            console.log(statusKey);
            const matchStatus =
                selectedStatus === "all" ||
                normalize(statusKey) === normalize(selectedStatus);

            const matchFloor =
                selectedFloor === "all" ||
                item.Room?.Floor?.Number === selectedFloor;

            return matchSearch && matchDate && matchStatus && matchFloor;
        });
    }, [bookingRooms, searchText, selectedDate, selectedStatus, selectedFloor]);

    // ===== columns (โครงเหมือน Maintenance แต่เป็นข้อมูล Booking) =====
    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            // การ์ด 1 คอลัมน์
            return [
                {
                    field: "All Booking Rooms",
                    headerName: "All Booking Rooms",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row as BookingRoomsInterface;
                        console.log("🔎 row in grid:", data);

                        const status = (data.StatusName || "pending").toLowerCase();
                        const colorMap: Record<string, { c: string; cl: string; icon: any; label: string }> = {
                            pending: { c: "#F1A007", cl: "#FFF3DB", icon: Clock, label: "Pending" },
                            confirmed: { c: "#2563EB", cl: "#DBEAFE", icon: Check, label: "Confirmed" }, // น้ำเงิน
                            completed: { c: "#16A34A", cl: "#DCFCE7", icon: Check, label: "Completed" }, // เขียว
                            cancelled: { c: "#D64545", cl: "#FBE9E9", icon: X, label: "Cancelled" },
                            unknown: { c: "#6B6F76", cl: "#EFF0F1", icon: HelpCircle, label: "Unknown" },
                        };
                        const s = colorMap[status] || colorMap.unknown;
                        const dateTime = `${dateFormat(data.CreatedAt || "")} ${timeFormat(data.CreatedAt || "")}`;

                        const room = `Room ${data.Room?.RoomNumber ?? "-"}`;
                        const floor = `Floor ${data.Room?.Floor?.Number ?? "-"}`;
                        const who = `${data.User?.FirstName || ""} ${data.User?.LastName || ""} (${data.User?.EmployeeID || "-"})`;
                        const showButtonApprove = status === "pending" && (isManager() || isAdmin());
                        console.log("🔎 refund check", data.Payment?.status, data.StatusName);

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} rowSpacing={1.5} className="card-item-container">
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {room} • {floor}
                                    </Typography>

                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 0.8 }}>
                                        <Clock size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{dateTime}</Typography>
                                    </Box>

                                    <Typography sx={{ fontSize: 14, color: "text.secondary", my: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {data.Purpose || "-"}
                                    </Typography>

                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 1 }}>
                                        <UserRound size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{who}</Typography>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, sm: 5 }} container direction="column">
                                    <Box sx={{ bgcolor: s.cl, borderRadius: 10, px: 1.5, py: 0.5, display: "flex", gap: 1, color: s.c, alignItems: "center", justifyContent: "center", width: "100%" }}>
                                        <s.icon size={18} />
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{s.label}</Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                                        {showButtonApprove ? (
                                            <Grid container spacing={0.8} size={{ xs: 12 }}>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title="Approve">
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => { setSelectedRow(data); setOpenConfirmApprove(true); }}
                                                            fullWidth
                                                        >
                                                            <Check size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Approve</Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title="Reject">
                                                        <Button
                                                            variant="outlinedCancel"
                                                            onClick={() => { setSelectedRow(data); setOpenConfirmReject(true); }}
                                                            fullWidth
                                                        >
                                                            <X size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Reject</Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                {data.Payment?.status === "paid" && data.StatusName === "confirmed" && (
                                                    <Tooltip title="Refund">
                                                        <Button
                                                            variant="outlined"
                                                            color="warning"
                                                            onClick={() => handlePrimaryAction("refund", data)}
                                                        >
                                                            Refund
                                                        </Button>
                                                    </Tooltip>
                                                )}
                                                <Grid size={{ xs: 2 }}>
                                                    <Tooltip title="Details">
                                                        <Button variant="outlinedGray" onClick={() => handleClickCheck(data)} sx={{ minWidth: 42 }} fullWidth>
                                                            <Eye size={18} />
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </Grid>
                                        ) : (
                                            <Tooltip title="Details">
                                                <Button className="btn-detail" variant="outlinedGray" onClick={() => handleClickCheck(data)} sx={{ width: "100%" }}>
                                                    <Eye size={18} />
                                                    <Typography variant="textButtonClassic" className="text-btn">Details</Typography>
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        }

        // Desktop columns (สไตล์เหมือน Maintenance)
        return [
            {
                field: "ID",
                headerName: "No.",
                flex: 0.5,
                align: "center",
                headerAlign: "center",
                sortable: false,
                // วิธี A (ปลอดภัยกว่า)
                renderCell: ({ id }) => <Typography>{id}</Typography>,
                // หรือ วิธี B (ยังใช้ valueGetter แต่ต้องกัน)
                // valueGetter: ({ row, id }) => row?.ID ?? id ?? "-",
            }
            ,
            {
                field: "Title",
                headerName: "Title",
                flex: 1.8,
                renderCell: (params) => {
                    const d = params.row as BookingRoomsInterface;
                    const room = `Room ${d.Room?.RoomNumber ?? "-"}`;
                    const floor = `Floor ${d.Room?.Floor?.Number ?? "-"}`;
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                            <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {room} • {floor}
                            </Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
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
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
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
                    const row = params.row as BookingRoomsInterface;
                    const name = row.DisplayStatus || "unknown";   // ✅ ใช้จาก backend
                    const cfg = getBookingStatusConfig(name);
                    return (
                        <Box sx={{ display: "flex", justifyContent: "center", width: "100%" }}>
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
                        </Box>
                    );
                },
            }
            ,
            {
                field: "Booker",
                headerName: "Booker",
                flex: 1.2,
                renderCell: (params) => {
                    const u = (params.row as BookingRoomsInterface).User || {};
                    const name = `${u.FirstName || "-"} ${u.LastName || ""}`;
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                            <Typography sx={{ fontSize: 14 }}>{name}</Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{u.EmployeeID || "-"}</Typography>
                        </Box>
                    );
                },
            },

            {
                field: "Actions",
                headerName: "Actions",
                flex: 1.8,
                renderCell: (params) => {
                    const row = params.row as any;

                    return (
                        <Box sx={{ display: "flex", gap: 0.8 }}>
                            {/* ✅ ปุ่ม Finish (Complete / Refund) */}
                            <FinishActionButton
                                row={row}
                                onComplete={async (row) => {
                                    await CompleteBookingRoom(row.ID);
                                    await getBookingRooms();
                                    setAlerts((a) => [...a, { type: "success", message: "Booking completed" }]);
                                }}
                                onRefund={async (row) => {
                                    console.log("f", row);
                                    await RefundedBookingRoom(row.ID);
                                    await getBookingRooms();
                                    setAlerts((a) => [...a, { type: "success", message: "Booking refunded" }]);
                                }}
                            />

                            {/* ปุ่ม Details เดิม */}
                            <Tooltip title="Details">
                                <Button variant="outlinedGray" onClick={() => handleClickCheck(row)}>
                                    <Eye size={18} />
                                    <Typography variant="textButtonClassic">Details</Typography>
                                </Button>
                            </Tooltip>
                        </Box>
                    );
                },
            }

            ,
        ];
    };

    const handlePrimaryAction = async (key: ActionKey, row: any) => {
        setSelectedRow(row);
        try {
            switch (key) {
                case "approve":
                    await ApproveBookingRoom(row.ID);
                    break;

                case "approvePayment":
                    // ❌ เดิม: await ApprovePayment(row.Payment.id);
                    // ✅ ใหม่: พาไปหน้า review
                    const encodedId = Base64.encode(String(row.ID));
                    navigate(`/booking/review?booking_id=${encodeURIComponent(encodedId)}`);
                    return;

                case "rejectPayment":
                    if (!row.Payment?.id) throw new Error("No payment id");
                    await RejectPayment(row.Payment.id);
                    break;

                case "complete":
                    await CompleteBookingRoom(row.ID);
                    break;
                case "refund": {
                    if (!row.Payment?.id) throw new Error("No payment id");
                    await RefundedBookingRoom(row.Payment.id); // ✅ เรียก API Refund
                    break;
                }


                default:
                    return;
            }

            // ✅ reload booking list หลัง action
            await getBookingRooms();
            setAlerts(p => [...p, { type: "success", message: `Action ${key} success` }]);
        } catch (e) {
            setAlerts(p => [...p, { type: "error", message: `Action ${key} failed` }]);
        }
    };



    // const doReject = async (note?: string) => {
    //     if (!selectedRow) return;
    //     setBookingRooms(prev => prev.map(b => b.ID === selectedRow.ID
    //         ? { ...b, StatusName: "cancelled" }
    //         : b
    //     ));
    //     setAlerts(a => [...a, { type: "success", message: `Rejected booking #${selectedRow.ID}` }]);
    //     setOpenConfirmReject(false);
    //     recountStatus();
    // };

    const recountStatus = () => {
        setStatusCounts(bookingRooms.reduce((acc: Record<string, number>, it) => {
            const key = getDisplayStatus(it);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {}));
    };


    // ===== กดดูรายละเอียด → ไปอีกหน้าเหมือน Maintenance =====
    // AllBookingRoom.tsx
    const handleClickCheck = (row: { ID?: number }) => {
        if (!row?.ID) return;
        const encodedId = Base64.encode(String(row.ID));
        // ใช้ path “/booking/review” (อย่ามี :param เพราะเราจะอ่านจาก query)
        navigate(`/booking/review?booking_id=${encodeURIComponent(encodedId)}`);
    };


    // ===== ยืนยันอนุมัติ/ปฏิเสธ (คุณจะ hook API จริงทีหลังได้) =====
    // const doApprove = async () => {
    //     if (!selectedRow) return;
    //     try {
    //         // await ApproveBooking(selectedRow.ID);
    //         setAlerts((a) => [...a, { type: "success", message: `Approved booking #${selectedRow.ID}` }]);
    //         // รีโหลดสั้น ๆ
    //         await getBookingRooms();
    //     } catch (e) {
    //         setAlerts((a) => [...a, { type: "error", message: "Approve failed" }]);
    //     } finally {
    //         setOpenConfirmApprove(false);
    //     }
    // };

    const doApprove = async () => {
        if (!selectedRow) return;
        try {
            await ApproveBookingRoom(selectedRow.ID);
            setAlerts((a) => [...a, { type: "success", message: `Approved booking #${selectedRow.ID}` }]);
            await getBookingRooms(); // reload
        } catch (e) {
            setAlerts((a) => [...a, { type: "error", message: "Approve failed" }]);
        } finally {
            setOpenConfirmApprove(false);
        }
    };
    const doReject = async (note?: string) => {
        if (!selectedRow) return;
        try {
            await RejectBookingRoom(selectedRow.ID, note);
            setAlerts((a) => [...a, { type: "success", message: `Rejected booking #${selectedRow.ID}` }]);
            await getBookingRooms();
        } catch (e) {
            setAlerts((a) => [...a, { type: "error", message: "Reject failed" }]);
        } finally {
            setOpenConfirmReject(false);
        }
    };



    const reloadBooking = async () => {
        await getBookingRooms();
    }


    // const doReject = async (note?: string) => {
    //     if (!selectedRow) return;
    //     try {
    //         // await RejectBooking(selectedRow.ID, note);
    //         setAlerts((a) => [...a, { type: "success", message: `Rejected booking #${selectedRow.ID}` }]);
    //         await getBookingRooms();
    //     } catch (e) {
    //         setAlerts((a) => [...a, { type: "error", message: "Reject failed" }]);
    //     } finally {
    //         setOpenConfirmReject(false);
    //     }
    // };

    // ===== ฟิลเตอร์ด้านบน (ย้ายมาไว้เหนือ DataGrid เหมือน Maintenance) =====
    const handleClearFilter = () => {
        setSearchText("");
        setSelectedDate(null);
        setSelectedStatus("all");
        setSelectedFloor("all");
    };

    // จำนวนทั้งหมดหลังกรอง (ใช้กับ DataGrid client-side)
    const totalFiltered = filtered.length;

    return (
        <Box className="all-maintenance-request-page">
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Confirm กล่องอนุมัติ/ปฏิเสธ */}
            <ConfirmDialog
                open={openConfirmApprove}
                setOpenConfirm={setOpenConfirmApprove}
                handleFunction={() => doApprove()}
                title="Confirm Booking Approval"
                message="Approve this booking?" buttonActive={false} />
            <ConfirmDialog
                open={openConfirmReject}
                setOpenConfirm={setOpenConfirmReject}
                handleFunction={(note) => doReject(note)}
                title="Confirm Booking Rejection"
                message="Reject this booking? This action cannot be undone."
                showNoteField buttonActive={false} />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    {/* Header */}
                    <Grid container className="title-box" direction="row" size={{ xs: 12 }} sx={{ gap: 1 }}>
                        <ClipboardList size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Booking Rooms List
                        </Typography>
                    </Grid>

                    {/* Status summary cards (เหมือน Maintenance) */}
                    {!isLoadingData ? (
                        <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                <BookingStatusCards statusCounts={statusCounts} />
                                {/* ฟิลเตอร์ของคุณต่อจากนี้ได้เลย */}
                            </Grid>

                            {/* ฟิลเตอร์ (สไตล์เรียบง่าย คล้ายของเดิมใน AllBookingRoom) */}
                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ mt: 2, p: 2 }}>
                                    <Grid container spacing={1} alignItems="center">
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField
                                                fullWidth
                                                placeholder="Search (purpose, room, employee)"
                                                value={searchText}
                                                onChange={(e) => setSearchText(e.target.value)}
                                                slotProps={{
                                                    input: {
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <Clock size={16} />
                                                            </InputAdornment>
                                                        ),
                                                    },
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
                    <Grid size={{ xs: 12 }} minHeight={"200px"}>
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
                                noDataText="Don't have any data"
                            />
                        ) : (
                            <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                        )}
                    </Grid>
                </Grid>
            </Container>

            {/* <PaymentReviewDialog
                open={openPaymentDialog}
                booking={selectedRow}
                onClose={() => setOpenPaymentDialog(false)}
                onApprove={async () => {
                    if (!selectedRow) return;
                    await ApprovePayment(selectedRow.Payment?.ID);
                    setAlerts(a => [...a, { type: "success", message: `Payment approved for #${selectedRow.ID}` }]);
                    setOpenPaymentDialog(false);
                    await getBookingRooms();
                }}
                onReject={async () => {
                    if (!selectedRow) return;
                    await RejectPayment(selectedRow.Payment?.ID);
                    setAlerts(a => [...a, { type: "warning", message: `Payment rejected for #${selectedRow.ID}` }]);
                    setOpenPaymentDialog(false);
                    await getBookingRooms();
                }}
            /> */}


        </Box>
    );
}

export default AllBookingRoom;
