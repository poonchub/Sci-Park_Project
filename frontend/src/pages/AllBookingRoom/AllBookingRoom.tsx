import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Button,
    Card,
    Container,
    Divider,
    FormControl,
    Grid,
    InputAdornment,
    Menu as MuiMenu,
    MenuItem,
    Skeleton,
    Tooltip,
    Typography,
    useMediaQuery,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";

import theme from "../../styles/Theme";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import AlertGroup from "../../components/AlertGroup/AlertGroup";

import {
    ClipboardList,
    Eye,
    Check,
    X,
    Clock,
    HelpCircle,
    UserRound,
    Wallet,
    HandCoins,
    FileText,
    Calendar,
    Search,
    RotateCcw,
    Ellipsis,
    BrushCleaning,
} from "lucide-react";

import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { isAdmin, isManager } from "../../routes";
import { Base64 } from "js-base64";

import {
    apiUrl,
    CreateRoomBookingInvoice,
    CreateRoomBookingInvoiceItem,
    GetRoomBookingInvoiceByID,
    RefundedBookingRoom,
    GetBookingRooms,
    ApproveBookingRoom,
    RejectBookingRoom,
    CompleteBookingRoom,
    ApprovePayment,
    RejectPayment,

    UploadPaymentReceipt,
    socketUrl,
    GetBookingRoomById,

} from "../../services/http";

import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";
import { getDisplayStatus, type ActionKey } from "../../utils/bookingFlow";
import BookingStatusCards from "../../components/BookingStatusCards/BookingStatusCards";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import { RoomBookingInvoiceInterface } from "../../interfaces/IRoomBookingInvoice";
import { createRoot } from "react-dom/client";
import RoomBookingInvoicePDF, { thaiDateFull } from "../../components/InvoicePDF/RoomBookingInvoicePDF";
import { RoomBookingInvoiceItemInterface } from "../../interfaces/IRoomBookingInvoiceItem";
import ConfirmDialogRoomBookingInvoice from "../../components/ConfirmDialog/ConfirmDialogRoomBookingInvoice";
import { BookingDateInterface } from "../../interfaces/IBookingDate";
import { useUserStore } from "../../store/userStore";
import { UserInterface } from "../../interfaces/IUser";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";
import { formatToMonthYear } from "../../utils/formatToMonthYear";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import BookingPaymentPopup, { type InstallmentUI } from "../../components/BookingPaymentPopup/BookingPaymentPopup";
import { io } from "socket.io-client";
// ===== Helpers (status mapping) =====
type PopupStatus = InstallmentUI["status"];

const asSlipString = (sp?: string | string[]) =>
    Array.isArray(sp) ? (sp[0] ?? "") : (sp ?? "");

const normalizePath = (p?: string) =>
    (p || "").replace(/\\/g, "/");

const toPopupStatus = (s?: string): PopupStatus => {
    const v = (s || "").trim().toLowerCase();
    if (v === "pending payment" || v === "unpaid") return "pending_payment";
    if (v === "pending verification" || v === "submitted") return "pending_verification";
    if (v === "approved" || v === "paid") return "approved";
    if (v === "rejected") return "rejected";
    if (v === "refunded") return "refunded";
    if (v === "awaiting receipt") return "awaiting_receipt";
    return "unpaid";
};

// ===== NEW: ผูก popup จากข้อมูล row จริง (Deposit = 2 ใบเสมอ ซ้าย/ขวา) =====
function buildPopupDataAdmin(row?: any): {
    plan: "full" | "deposit";
    installments: InstallmentUI[];
    fullyPaid: boolean;
} {
    if (!row) return { plan: "full", installments: [], fullyPaid: false };

    const invoice = row.RoomBookingInvoice || {};
    const finance = row.Finance || {};
    const total: number | undefined = finance.TotalAmount ?? invoice.TotalAmount;

    // ใช้จาก API โดยตรง
    const option = (row?.PaymentOption?.OptionName || "").toLowerCase();
    const isDepositPlan = option === "deposit";

    // due date
    const depositDue =
        invoice.DepositDueDate || invoice.DepositeDueDate || invoice.IssueDate;
    const dueAll = invoice.DueDate;

    // จัดลำดับ payments เก่า -> ใหม่ (มัดจำซ้าย, คงเหลือขวา)
    const pays: any[] = Array.isArray(row.Payments) ? [...row.Payments] : [];
    pays.sort((a, b) => {
        const ad = new Date(a?.PaymentDate || 0).getTime();
        const bd = new Date(b?.PaymentDate || 0).getTime();
        if (ad && bd) return ad - bd;
        return (a?.ID || 0) - (b?.ID || 0);
    });

    // === FULL PLAN ===
    if (!isDepositPlan) {
        const p = row.Payment || pays[0] || {};
        const inst: InstallmentUI = {
            key: "full",
            label: "ชำระเต็มจำนวน",
            paymentId: p.ID ?? p.id,
            amount: typeof total === "number" ? total : p.Amount,
            status: toPopupStatus(p.Status ?? p.status),
            slipPath: normalizePath(asSlipString(p.SlipPath)),
            dueDate: dueAll,
        };
        return { plan: "full", installments: [inst], fullyPaid: inst.status === "approved" };
    }

    // === DEPOSIT PLAN ===
    // ซ้าย = มัดจำ (งวดแรก), ขวา = ยอดคงเหลือ (งวดสอง)
    const depPay = pays[0] || row.Payment || {};
    const balPay = pays[1] || {};

    const depositAmount =
        depPay.Amount ??
        finance.DepositAmount ??
        (typeof total === "number" ? Math.min(total, total / 2) : undefined);

    const depositInst: InstallmentUI = {
        key: "deposit",
        label: "ชำระมัดจำ",
        paymentId: depPay.ID ?? depPay.id,
        amount: depositAmount,
        status: toPopupStatus(depPay.Status ?? depPay.status),
        slipPath: normalizePath(asSlipString(depPay.SlipPath)),
        dueDate: depositDue,
    };

    const balAmount =
        typeof total === "number" && typeof depositInst.amount === "number"
            ? Math.max(total - depositInst.amount, 0)
            : balPay.Amount;

    const balanceInst: InstallmentUI = {
        key: "balance",
        label: "ชำระยอดคงเหลือ",
        paymentId: balPay.ID ?? balPay.id,        // อาจยังไม่มี (undefined)
        amount: balAmount,
        status: balPay.ID ? toPopupStatus(balPay.Status ?? balPay.status) : "unpaid",
        slipPath: normalizePath(asSlipString(balPay.SlipPath)),
        dueDate: dueAll,
        locked: toPopupStatus(depositInst.status) !== "approved", // ล็อกจนกว่ามัดจำจะผ่าน
    };

    const fullyPaid = depositInst.status === "approved" && balanceInst.status === "approved";
    return { plan: "deposit", installments: [depositInst, balanceInst], fullyPaid };
}

// แปลง raw payment status -> ข้อความสำหรับหัวป้าย
const toTitlePaymentStatus = (s?: string) => {
    const v = (s || "").trim().toLowerCase();
    if (v === "approved" || v === "paid") return "Paid";
    if (v === "awaiting receipt") return "Awaiting Receipt";
    if (v === "pending verification" || v === "submitted") return "Pending Verification";
    if (v === "pending payment" || v === "unpaid") return "Pending Payment";
    if (v === "rejected") return "Rejected";
    if (v === "refunded") return "Refunded";
    return "Unknown";
};


// ===== Types (ย่อ) =====
interface BookingRoomsInterface {
    ID: number;
    CreatedAt?: string;
    Room?: { RoomNumber?: number | string; Floor?: { Number?: number } };
    BookingDates?: Array<{ Date: string }>;
    Merged_time_slots?: Array<{ start_time: string; end_time: string }>;
    StatusName?: string;
    Purpose?: string;
    User?: UserInterface;
    DisplayStatus?: string;
    Payment?: {
        ID?: number;
        id?: number;
        status?: string;
        Status?: string;
        SlipPath?: string[];
        ReceiptPath?: string;
        Amount?: number;
        PaymentDate?: string;
    };
    RoomBookingInvoice?: {
        InvoiceNumber?: string;
        IssueDate?: string;
        DueDate?: string;
        InvoicePDFPath?: string;
        TotalAmount?: number;
        InvoiceType?: string;
    };
    Finance?: {
        TotalAmount?: number;
        IsFullyPaid?: boolean;
    };
    Notifications?: NotificationsInterface[];
}

function AllBookingRoom() {
    const navigate = useNavigate();
    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    // ===== state =====
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // filters
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");

    // table
    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);

    // dialogs
    const [openConfirmApprove, setOpenConfirmApprove] = useState(false);
    const [openConfirmReject, setOpenConfirmReject] = useState(false);
    const [selectedRow, setSelectedRow] = useState<BookingRoomsInterface | null>(null);

    // payment popup
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [loading, setLoading] = useState(false);

    // receipt menu (global anchor)
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const openButtonMenu = Boolean(anchorEl);
    const handleClickButtonMenu = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);

    const { user } = useUserStore();
    const isAdminLike = isAdmin() || isManager();

    // ===== data =====
    const getBookingRooms = async () => {
        try {
            const rows = await GetBookingRooms();
            console.log("rows", rows);
            setBookingRooms(rows);
          

            const counts = rows.reduce((acc: Record<string, number>, it: { DisplayStatus?: string }) => {
                let key = (it.DisplayStatus || "unknown").toLowerCase();
                if (["rejected", "unconfirmed"].includes(key)) key = "pending";
                if (["awaiting receipt", "refunded"].includes(key)) key = "payment";
                if (!["pending", "confirmed", "payment review", "payment", "completed", "cancelled"].includes(key)) key = "unknown";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            setStatusCounts(counts);
        } catch {
            setAlerts(a => [...a, { type: "error", message: "โหลด bookings ไม่สำเร็จ" }]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        getBookingRooms();
    }, []);

    // ===== derived =====
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

    // ===== UI helpers =====
    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prev) => [...prev, { type, message }]);
    };

    const bookingSummary = (row?: BookingRoomsInterface) => {
        if (!row) return "";
        const room = row.Room?.RoomNumber ?? "-";
        const dates = row.BookingDates?.map(d => dateFormat(d.Date)).join(", ") || "-";
        return `ห้อง ${room} • วันที่ ${dates} • สถานะ: ${row.StatusName ?? "-"}`;
    };

    // ===== actions =====
    const handlePrimaryAction = async (key: ActionKey, row: BookingRoomsInterface, invoiceNumber?: string) => {
        setSelectedRow(row);
        try {
            switch (key) {
                case "approve": {
                    if (!user?.SignaturePath) {
                        handleSetAlert("warning", "Please upload your signature before proceeding.");
                        return;
                    }
                    if (!row?.User?.SignaturePath) {
                        handleSetAlert("warning", "Customer signature not found. Please contact the customer to upload their signature.");
                        return;
                    }

                    const resApprove = await ApproveBookingRoom(row.ID);
                    const userId = Number(localStorage.getItem("userId"));
                    const today = new Date();
                    let invoiceData: RoomBookingInvoiceInterface = {};

                    if (resApprove.data.PaymentOption.OptionName === "Deposit") {
                        const BookingDates = resApprove.data.BookingDates;
                        const maxDate = new Date(Math.max(...BookingDates.map((d: BookingDateInterface) => new Date(d.Date ?? "").getTime())));
                        const depositDue = new Date(); depositDue.setDate(today.getDate() + 7); depositDue.setHours(23, 59, 59, 999);
                        const dueDate = new Date(maxDate); dueDate.setDate(maxDate.getDate() + 7); dueDate.setHours(23, 59, 59, 999);

                        invoiceData = {
                            InvoiceNumber: invoiceNumber,
                            IssueDate: today.toISOString(),
                            DepositeDueDate: depositDue.toISOString(),
                            DueDate: dueDate.toISOString(),
                            BookingRoomID: resApprove.data.ID,
                            ApproverID: userId,
                            CustomerID: resApprove.data.UserID,
                        };
                    } else { // Full
                        const dueDate = new Date(); dueDate.setDate(today.getDate() + 7); dueDate.setHours(23, 59, 59, 999);
                        invoiceData = {
                            InvoiceNumber: invoiceNumber,
                            IssueDate: today.toISOString(),
                            DueDate: dueDate.toISOString(),
                            BookingRoomID: resApprove.data.ID,
                            ApproverID: userId,
                            CustomerID: resApprove.data.UserID,
                        };
                    }

                    const resInvoice = await CreateRoomBookingInvoice(invoiceData);

                    const BookingDate: BookingDateInterface[] = resApprove.data.BookingDates || [];
                    const invoiceItemData: RoomBookingInvoiceItemInterface[] = [];
                    BookingDate.forEach((date) => {
                        invoiceItemData.push({
                            Description: `ค่าบริการอาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 วันที่ ${thaiDateFull(date.Date)} ห้อง ${resApprove.data.Room.RoomNumber}`,
                            Quantity: 1,
                            UnitPrice: resApprove.data.TotalAmount / BookingDate.length,
                            Amount: resApprove.data.TotalAmount / BookingDate.length,
                        });
                    });

                    const items = invoiceItemData.map((it) => ({ ...it, RoomBookingInvoiceID: resInvoice.data.ID }));
                    await Promise.all(items.map((it) => CreateRoomBookingInvoiceItem(it).catch(() => null)));

                    await handleUploadPDF(resInvoice.data.ID);
                    break;
                }

                case "approvePayment": {
                    const encodedId = Base64.encode(String(row.ID));
                    navigate(`/booking/review?booking_id=${encodeURIComponent(encodedId)}`);
                    return;
                }

                case "rejectPayment":
                    if (!row.Payment?.id && !row.Payment?.ID) throw new Error("No payment id");
                    await RejectPayment((row.Payment?.id ?? row.Payment?.ID)!);
                    break;

                case "complete":
                    await CompleteBookingRoom(row.ID);
                    break;

                case "refund":
                    if (!row.Payment?.id && !row.Payment?.ID) throw new Error("No payment id");
                    await RefundedBookingRoom((row.Payment?.id ?? row.Payment?.ID)!);
                    break;

                default:
                    return;
            }

            await getBookingRooms();
            handleSetAlert("success", `Action ${key} success`);
        } catch {
            handleSetAlert("error", `Action ${key} failed`);
        }
    };

    const handleUploadPDF = (invoiceId: number): Promise<void> =>
        new Promise(async (resolve, reject) => {
            try {
                const container = document.createElement("div");
                container.style.display = "none";
                document.body.appendChild(container);

                const root = createRoot(container);
                const handlePDFCompleted = () => {
                    root.unmount();
                    container.remove();
                    resolve();
                };

                const resInvoice = await GetRoomBookingInvoiceByID(invoiceId);
                root.render(<RoomBookingInvoicePDF invoice={resInvoice} onComplete={handlePDFCompleted} />);
            } catch (error) {
                reject(error);
            }
        });

    const doApprove = async () => {
        if (!selectedRow) return;
        try {
            await ApproveBookingRoom(selectedRow.ID);
            handleSetAlert("success", `Approved booking #${selectedRow.ID}`);
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Approve failed");
        } finally {
            setOpenConfirmApprove(false);
        }
    };

    const doReject = async (note?: string) => {
        if (!selectedRow) return;
        try {
            await RejectBookingRoom(selectedRow.ID, note);
            handleSetAlert("success", `Rejected booking #${selectedRow.ID}`);
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Reject failed");
        } finally {
            setOpenConfirmReject(false);
        }
    };

    const handleUploadReceiptForBooking = async (
        e: React.ChangeEvent<HTMLInputElement>,
        row: BookingRoomsInterface
    ) => {
        try {
            setAnchorEl(null);
            const file = e.target.files?.[0];
            if (!file || file.type !== "application/pdf") {
                handleSetAlert("warning", "Please select a valid PDF file");
                return;
            }

            // ✅ ดึงจาก row ที่คลิกเท่านั้น (อย่าดึงจาก state อื่น)
            console.log("Uploading receipt for booking", row.Payment);
            const paymentId = row.Payment?.ID;
            if (!paymentId) {
                handleSetAlert("error", "Missing payment id");
                return;
            }
            console.log("Approving payment", paymentId);
            await UploadPaymentReceipt(paymentId, file);

            // ถ้า payment ยังไม่ approved จะ approve ให้เลย (หรือเอาออกถ้าไม่ต้องการ)
            const statusRaw = (row as any)?.Payment?.Status ?? (row as any)?.Payment?.status;
            const isApproved = String(statusRaw).toLowerCase() === "approved" || String(statusRaw).toLowerCase() === "paid";
            if (!isApproved) {
                console.log("Approving payment", paymentId);
                await ApprovePayment(paymentId);
            }

            handleSetAlert("success", "Receipt uploaded successfully");
            await getBookingRooms();
        } catch (err) {
            handleSetAlert("error", "Upload receipt failed");
        } finally {
            e.target.value = "";
        }
    };


    const handleDeleteReceiptForBooking = async (row: BookingRoomsInterface) => {
        try {
            const paymentId = Number(row?.Payment?.ID ?? row?.Payment?.id);
            if (!paymentId) {
                handleSetAlert("error", "Missing payment id");
                return;
            }
            setAnchorEl(null);
            await DeleteBookingReceiptPDF(paymentId);
            handleSetAlert("success", "Receipt deleted");
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Delete receipt failed");
        }
    };

    const handleClickCheck = (row: { ID?: number }) => {
        if (!row?.ID) return;
        const encodedId = Base64.encode(String(row.ID));
        navigate(`/booking/review?booking_id=${encodeURIComponent(encodedId)}`);
    };

    const handleClearFilter = () => {
        setSearchText("");
        setSelectedDate(null);
        setSelectedStatus("all");
        setSelectedFloor("all");
    };

    const totalFiltered = filtered.length;

    // ===== columns =====
    const getColumns = (): GridColDef[] => {
        if (isSmallScreen) {
            return [
                {
                    field: "All Booking Rooms",
                    headerName: "All Booking Rooms",
                    flex: 1,
                    renderCell: (params) => {
                        const data = params.row as BookingRoomsInterface;
                        const status = (data.StatusName || "pending").toLowerCase();
                        const colorMap: Record<string, { c: string; cl: string; icon: any; label: string }> = {
                            pending: { c: "#F1A007", cl: "#FFF3DB", icon: Clock, label: "Pending" },
                            confirmed: { c: "#2563EB", cl: "#DBEAFE", icon: Check, label: "Confirmed" },
                            completed: { c: "#16A34A", cl: "#DCFCE7", icon: Check, label: "Completed" },
                            cancelled: { c: "#D64545", cl: "#FBE9E9", icon: X, label: "Cancelled" },
                            unknown: { c: "#6B6F76", cl: "#EFF0F1", icon: HelpCircle, label: "Unknown" },
                        };
                        const s = colorMap[status] || colorMap.unknown;
                        const dateTime = `${dateFormat(data.CreatedAt || "")} ${timeFormat(data.CreatedAt || "")}`;
                        const room = `Room ${data.Room?.RoomNumber ?? "-"}`;
                        const floor = `Floor ${data.Room?.Floor?.Number ?? "-"}`;
                        const who = `${data.User?.FirstName || ""} ${data.User?.LastName || ""} (${data.User?.EmployeeID || "-"})`;
                        const showButtonApprove = status === "pending" && (isManager() || isAdmin());

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
                                                        <Button variant="contained" onClick={() => { setSelectedRow(data); setOpenConfirmApprove(true); }} fullWidth>
                                                            <Check size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Approve</Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title="Reject">
                                                        <Button variant="outlinedCancel" onClick={() => { setSelectedRow(data); setOpenConfirmReject(true); }} fullWidth>
                                                            <X size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Reject</Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
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

        // Desktop
        return [
            {
                field: "ID",
                headerName: "No.",
                flex: 0.2,
                align: "center",
                headerAlign: "center",
                sortable: false,
                renderCell: ({ id }) => <Typography>{id}</Typography>,
            },
            {
                field: "Title",
                headerName: "Title",
                flex: 0.6,
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
                headerName: "Booking Date",
                flex: 0.4,
                renderCell: (params) => {
                    const d = params.row as BookingRoomsInterface;
                    const bookingDate = d.BookingDates?.[0]?.Date || d.CreatedAt;
                    const date = dateFormat(bookingDate || "");
                    const time = timeFormat(bookingDate || "");
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

                    let display = (row.DisplayStatus || "unknown").toLowerCase();
                    const sn = (row.StatusName || "").toLowerCase();

                    // Cancelled ชนะทุกกรณี
                    if (sn === "cancelled" || display === "cancelled") {
                        display = "cancelled";
                    } else if (sn === "completed") {
                        display = "completed";
                    } else {
                        // เคส Fully-paid แต่ยังไม่มีใบเสร็จครบ → awaiting receipt
                        const payments = (row as any).Payments as any[] | undefined;
                        const approved = (payments || []).filter(
                            (p) => String(p.Status || p.status).toLowerCase() === "approved" || String(p.Status || p.status).toLowerCase() === "paid"
                        );
                        const approvedMissingReceipt = approved.some((p) => !p.ReceiptPath);

                        if (row.Finance?.IsFullyPaid && approved.length > 0) {
                            display = approvedMissingReceipt ? "awaiting receipt" : "completed";
                        }
                    }

                    const cfg = getBookingStatusConfig(display);
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
                                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{cfg.label}</Typography>
                            </Box>
                        </Box>
                    );
                },
            },


            // {
            //     field: "Booker",
            //     headerName: "Booker",
            //     flex: 1.2,
            //     renderCell: (params) => {
            //         const u = (params.row as BookingRoomsInterface).User || {};
            //         const name = `${u.FirstName || "-"} ${u.LastName || ""}`;
            //         return (
            //             <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            //                 <Typography sx={{ fontSize: 14 }}>{name}</Typography>
            //                 <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{u.EmployeeID || "-"}</Typography>
            //             </Box>
            //         );
            //     },
            // },
            {
                field: "All Invoice",
                headerName: "All Invoice",
                flex: 1,
                renderCell: (item) => {
                    const data = item.row as BookingRoomsInterface;

                    // ===== 1) สถานะชำระเงิน (map → Title Case ให้ตรงกับ paymentStatusConfig) =====
                    const paymentStatusRaw = (data as any).Payment?.Status ?? data.Payment?.status ?? "";

                    const toConfigKey = (raw?: string): keyof typeof paymentStatusConfig => {
                        const v = (raw || "").trim().toLowerCase();
                        switch (v) {
                            case "unpaid":
                            case "pending payment":
                                return "Pending Payment";
                            case "submitted":
                            case "pending verification":
                                return "Pending Verification";
                            case "approved":
                            case "paid":
                                return "Paid"; // ⛔️ หน้า All ไม่แปลงเป็น Awaiting Receipt
                            case "rejected":
                                return "Rejected";
                            case "refunded":
                                return "Refunded";
                            default:
                                return "Pending Payment";
                        }
                    };

                    const statusKey = toConfigKey(paymentStatusRaw);

                    const cfgPay =
                        paymentStatusConfig[statusKey] || {
                            color: "#000",
                            colorLite: "rgba(0,0,0,0.08)",
                            icon: HelpCircle,
                            label: "Unknown",
                        };
                    const {
                        color: statusColor,
                        colorLite: statusColorLite,
                        icon: statusIcon,
                        label: uiStatus,
                    } = cfgPay;

                    const canPayNow = statusKey === "Pending Payment" || statusKey === "Rejected";

                    // ===== 2) Notification (ถ้ามี) =====
                    const user = useUserStore.getState().user as UserInterface | undefined;
                    const notifications: NotificationsInterface[] = (data as any).Notifications ?? [];
                    const hasNotificationForUser = !!user && notifications.some(n => n.UserID === user.ID && !n.IsRead);

                    // ===== 3) ข้อมูล Invoice / Amount =====
                    const invoice = (data as any).RoomBookingInvoice;
                    const invoiceNumber = invoice?.InvoiceNumber ?? (data as any).InvoiceNumber ?? "-";
                    const billingPeriod = invoice?.IssueDate
                        ? formatToMonthYear(invoice.IssueDate)
                        : data.BookingDates?.[0]?.Date
                            ? formatToMonthYear(data.BookingDates[0].Date)
                            : "-";
                    const dueDate = invoice?.DueDate ? dateFormat(invoice.DueDate) : "-";

                    const rb = (data as any).Finance;
                    const totalAmountNum =
                        rb?.TotalAmount ??
                        (data as any).TotalAmount ??
                        invoice?.TotalAmount ??
                        undefined;

                    const totalAmount =
                        typeof totalAmountNum === "number"
                            ? totalAmountNum.toLocaleString("th-TH", { style: "currency", currency: "THB" })
                            : "—";

                    // ===== 4) Receipt/PDF + เมนูอัปโหลดใบเสร็จ (admin) =====
                    const receiptPath = (data as any).Payment?.ReceiptPath ?? "";
                    const fileName = receiptPath ? receiptPath.split("/").pop() : "";
                    const invoicePDFPath = invoice?.InvoicePDFPath ?? (data as any).InvoicePDFPath ?? "";

                    const canManageReceipt = isAdminLike === true;
                    const showReceiptMenu = canManageReceipt && (statusKey === "Awaiting Receipt" || statusKey === "Paid");

                    return (
                        <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="card-item-container" rowSpacing={1}>
                            <Grid size={{ xs: 12, mobileS: 7 }}>
                                <Box sx={{ display: "inline-flex", alignItems: "center", gap: "5px", width: "100%" }}>
                                    {hasNotificationForUser && <AnimatedBell />}
                                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                        {invoiceNumber}
                                    </Typography>
                                </Box>

                                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                    <Calendar size={14} style={{ minHeight: 14, minWidth: 14 }} />
                                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {`Billing Period: ${billingPeriod}`}
                                    </Typography>
                                </Box>

                                <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.8 }}>
                                    <Clock size={14} style={{ minHeight: 14, minWidth: 14 }} />
                                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {`Due Date: ${dueDate}`}
                                    </Typography>
                                </Box>

                                <Box sx={{ mt: 1.4, mb: 1 }}>
                                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "text.secondary" }}>
                                        Total Amount
                                    </Typography>
                                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500, color: "text.main" }}>
                                        {totalAmount}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, mobileS: 5 }} container direction="column">
                                <Box
                                    sx={{
                                        bgcolor: statusColorLite,
                                        borderRadius: 10,
                                        px: 1.5,
                                        py: 0.5,
                                        display: "flex",
                                        gap: 1,
                                        color: statusColor,
                                        alignItems: "center",
                                        justifyContent: "center",
                                        width: "100%",
                                    }}
                                >
                                    {React.createElement(statusIcon, { size: 16 })}
                                    <Typography sx={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                                        {uiStatus}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* ===== Receipt (PDF) ===== */}
                            <Grid size={{ xs: 12 }}>
                                {showReceiptMenu && (
                                    <>
                                        <Button
                                            id={`receipt-menu-btn-${data.ID}`}
                                            aria-controls={openButtonMenu ? `receipt-menu-${data.ID}` : undefined}
                                            aria-haspopup="true"
                                            aria-expanded={openButtonMenu ? "true" : undefined}
                                            onClick={handleClickButtonMenu}
                                            variant="outlinedGray"
                                            sx={{ minWidth: 42, mr: 1 }}
                                        >
                                            <Ellipsis size={16} />
                                        </Button>

                                        <MuiMenu
                                            id={`receipt-menu-${data.ID}`}
                                            anchorEl={anchorEl}
                                            open={openButtonMenu}
                                            onClose={() => setAnchorEl(null)}
                                            MenuListProps={{ "aria-labelledby": `receipt-menu-btn-${data.ID}` }}
                                        >
                                            <MenuItem disableRipple>
                                                <input
                                                    accept="application/pdf"
                                                    style={{ display: "none" }}
                                                    id={`upload-receipt-input-${data.ID}`}
                                                    type="file"
                                                    onChange={(e) => handleUploadReceiptForBooking(e, data)}
                                                />
                                                <label htmlFor={`upload-receipt-input-${data.ID}`}>
                                                    <Typography component="span" sx={{ fontSize: 14 }}>
                                                        {fileName ? "Replace Receipt (PDF)" : "Upload Receipt (PDF)"}
                                                    </Typography>
                                                </label>
                                            </MenuItem>

                                            {fileName && (
                                                <MenuItem sx={{ fontSize: 14 }} onClick={() => handleDeleteReceiptForBooking(data)}>
                                                    Delete File
                                                </MenuItem>
                                            )}
                                        </MuiMenu>
                                    </>
                                )}

                                {fileName ? (
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            gap: 1,
                                            border: "1px solid rgba(109,110,112,0.4)",
                                            borderRadius: 1,
                                            px: 1,
                                            py: 0.5,
                                            bgcolor: "#FFF",
                                            cursor: "pointer",
                                            transition: "all .3s",
                                            alignItems: "center",
                                            width: { xs: "100%", mobileS: "auto" },
                                            "&:hover": { color: "primary.main", borderColor: "primary.main" },
                                        }}
                                        onClick={() => window.open(`${apiUrl}/${receiptPath}`, "_blank")}
                                    >
                                        <FileText size={16} />
                                        <Typography variant="body1" sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                            {fileName}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Box
                                        sx={{
                                            display: "inline-flex",
                                            gap: 1,
                                            border: "1px solid rgba(109,110,112,0.4)",
                                            borderRadius: 1,
                                            px: 1,
                                            py: 0.5,
                                            bgcolor: "#FFF",
                                            alignItems: "center",
                                            color: "text.secondary",
                                            width: { xs: "100%", mobileS: "auto" },
                                        }}
                                    >
                                        <FileText size={16} />
                                        <Typography variant="body1" sx={{ fontSize: 14 }}>
                                            No file uploaded
                                        </Typography>
                                    </Box>
                                )}
                            </Grid>

                            <Divider sx={{ width: "100%", my: 1 }} />

                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                                    <Grid container spacing={0.8} size={{ xs: 12 }}>
                                        <Grid size={{ xs: 6 }}>
                                            <Tooltip title={canPayNow ? "Pay Now" : "View Slip"}>
                                                <Button
                                                    variant="contained"
                                                    onClick={() => {
                                                        setSelectedRow(data);
                                                        setOpenPaymentDialog(true);
                                                    }}
                                                    sx={{ minWidth: 42, width: "100%", height: "100%" }}
                                                >
                                                    {canPayNow ? (
                                                        <>
                                                            <HandCoins size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Pay Now</Typography>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wallet size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">View Slip</Typography>
                                                        </>
                                                    )}
                                                </Button>
                                            </Tooltip>
                                        </Grid>

                                        <Grid size={{ xs: 6 }}>
                                            <Tooltip title="Download PDF">
                                                <Button
                                                    variant="outlinedGray"
                                                    onClick={() => invoicePDFPath && window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")}
                                                    disabled={!invoicePDFPath}
                                                    sx={{ minWidth: 42, width: "100%", height: "100%" }}
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                                    <Typography variant="textButtonClassic" className="text-btn">Download PDF</Typography>
                                                </Button>
                                            </Tooltip>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        </Grid>
                    );
                },
            }
            ,
            {
                field: "Actions",
                headerName: "Actions",
                flex: 0.6,
                renderCell: (params) => {
                    const row = params.row as BookingRoomsInterface;
                    const dStatus = (row.DisplayStatus || "unknown").toLowerCase();

                    return (
                        <Box sx={{ display: "flex", gap: 0.8 }}>
                            {isAdminLike && dStatus === "pending" && (
                                <>
                                    <Tooltip title="Approve">
                                        <Button variant="contained" color="primary" onClick={() => { setSelectedRow(row); setOpenConfirmApprove(true); }}>
                                            <Check size={18} />
                                            <Typography variant="textButtonClassic" className="text-btn">Approve</Typography>
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                        <Button variant="outlinedCancel" onClick={() => { setSelectedRow(row); setOpenConfirmReject(true); }}>
                                            <X size={18} />
                                            <Typography variant="textButtonClassic" className="text-btn">Reject</Typography>
                                        </Button>
                                    </Tooltip>
                                </>
                            )}

                            {isAdminLike && dStatus === "payment review" && (
                                <Tooltip title="Review Payment">
                                    <Button variant="contained" color="warning" onClick={() => handlePrimaryAction("approvePayment", row)}>
                                        <Search size={18} />
                                        <Typography variant="textButtonClassic" className="text-btn">Review Payment</Typography>
                                    </Button>
                                </Tooltip>
                            )}

                            {isAdminLike && dStatus === "payment" && (
                                <>
                                    {row.Payment?.id && (
                                        <Tooltip title="Complete Booking">
                                            <Button variant="contained" color="success" onClick={() => handlePrimaryAction("complete", row)}>
                                                <Check size={18} />
                                                <Typography variant="textButtonClassic" className="text-btn">Complete</Typography>
                                            </Button>
                                        </Tooltip>
                                    )}
                                    {row.Payment?.id && (
                                        <Tooltip title="Refund">
                                            <Button variant="outlined" color="warning" onClick={() => handlePrimaryAction("refund", row)}>
                                                <RotateCcw size={18} />
                                                <Typography variant="textButtonClassic" className="text-btn">Refund</Typography>
                                            </Button>
                                        </Tooltip>
                                    )}
                                </>
                            )}

                            <Tooltip title="Details">
                                <Button variant="outlinedGray" onClick={() => handleClickCheck(row)}>
                                    <Eye size={18} />
                                    <Typography variant="textButtonClassic">Details</Typography>
                                </Button>
                            </Tooltip>
                        </Box>
                    );
                },
            },
        ];
    };

    // ===== popup data to avoid re-compute thrice =====
    const popup = React.useMemo(
        () => buildPopupDataAdmin(selectedRow || undefined),
        [selectedRow]
    );


    const getNewBookingRoom = async (ID: number) => {
        try {
            const res = await GetBookingRoomById(ID);
            if (res) {
                setBookingRooms((prev) => [res, ...prev]);
                // setTotal((prev) => prev + 1);
            }
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    const getUpdateBookingRoom = async (ID: number) => {
        try {
            const res = await GetBookingRoomById(ID);
            if (res) {
                setBookingRooms((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
            }
        } catch (error) {
            console.error("Error fetching update maintenance:", error);
        }
    };

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("booking_room_created", (data: { ID: number; }) => {
            console.log("📦 New booking room request:", data);
            setTimeout(() => {
                getNewBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("maintenance_updated", (data: { ID: number; }) => {
            console.log("🔄 Maintenance request updated:", data);
            setTimeout(() => {
                getUpdateBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("maintenance_deleted", (data: { ID: number; }) => {
            console.log("🔄 Maintenance request deleted:", data);
            setTimeout(() => {
                setBookingRooms((prev) => prev.filter((item) => item.ID !== data.ID));
            }, 1500);
        });

        return () => {
            socket.off("maintenance_created");
            socket.off("maintenance_updated");
            socket.off("maintenance_deleted");
        };
    }, []);

    return (
        <Box className="all-maintenance-request-page">
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            <ConfirmDialogRoomBookingInvoice
                open={openConfirmApprove}
                setOpenConfirm={setOpenConfirmApprove}
                handleFunction={(invoiceNumber) => handlePrimaryAction("approve", selectedRow!, invoiceNumber)}
                title="Confirm Booking Approval"
                message="Approve this booking?"
                showInvoiceNumberField
                buttonActive={false}
            />

            <ConfirmDialog
                open={openConfirmReject}
                setOpenConfirm={setOpenConfirmReject}
                handleFunction={(note) => doReject(note)}
                title="Confirm Booking Rejection"
                message="Reject this booking? This action cannot be undone."
                showNoteField
                buttonActive={false}
            />

            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction="row" size={{ xs: 12 }} sx={{ gap: 1 }}>
                        <ClipboardList size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Booking Rooms List
                        </Typography>
                    </Grid>

                    {!isLoadingData ? (
                        <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                                <BookingStatusCards statusCounts={statusCounts} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <Card sx={{ mt: 2, p: 2 }}>
                                    <Grid container spacing={1} alignItems="center">
                                        <Grid size={{ xs: 12, sm: 4}}>
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
                                        <Grid size={{ xs: 6, sm: 2 }}>
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
                                                <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as string)}>
                                                    <MenuItem value="all">All Status</MenuItem>
                                                    {[...new Set(bookingRooms.map(b => getDisplayStatus(b)).filter(Boolean))].map(s => (
                                                        <MenuItem key={s} value={s}>
                                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 2 }}>
                                            <Button
                                                onClick={handleClearFilter}
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
                                </Card>
                            </Grid>
                        </Grid>
                    ) : (
                        <Skeleton variant="rectangular" width="100%" height={220} sx={{ borderRadius: 2 }} />
                    )}

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

            <BookingPaymentPopup
                open={openPaymentDialog}
                onClose={() => setOpenPaymentDialog(false)}
                plan={popup.plan}
                installments={popup.installments}
                fullyPaid={popup.fullyPaid}
                isOwner={false}
                isAdmin={isAdminLike}
                isLoading={loading}
                serviceConditions={{
                    title: "โปรดอ่านเงื่อนไขการชำระเงิน",
                    points: [
                        "ชำระตามยอดที่ระบุในใบแจ้งหนี้ภายในกำหนด",
                        "หากชำระมัดจำแล้ว ให้ชำระยอดคงเหลือก่อนวันใช้งาน",
                    ],
                }}
                bookingSummary={bookingSummary(selectedRow || undefined)}
                onApproveFor={async (_key, paymentId) => {
                    if (!paymentId) return;
                    try {
                        await ApprovePayment(paymentId);
                        handleSetAlert("success", `Payment approved${selectedRow ? ` for #${selectedRow.ID}` : ""}`);
                        setOpenPaymentDialog(false);
                        await getBookingRooms();
                    } catch {
                        handleSetAlert("error", "Approve payment failed");
                    }
                }}
                onRejectFor={async (_key, paymentId) => {
                    if (!paymentId) return;
                    try {
                        await RejectPayment(paymentId);
                        handleSetAlert("warning", `Payment rejected${selectedRow ? ` for #${selectedRow.ID}` : ""}`);
                        setOpenPaymentDialog(false);
                        await getBookingRooms();
                    } catch {
                        handleSetAlert("error", "Reject payment failed");
                    }
                }}
            />
        </Box>
    );
}

export default AllBookingRoom;

