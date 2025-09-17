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
    Ellipsis,
    BrushCleaning,
    Search,
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
    ApproveBookingRoom,
    RejectBookingRoom,
    CompleteBookingRoom,
    ApprovePayment,
    RejectPayment,
    UploadPaymentReceipt,
    DeletePaymentReceipt,
    socketUrl,
    GetBookingRoomById,
    UpdateNotificationsByBookingRoomID,
    ListBookingRoomsForAdmin,
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
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";

/* =========================
 * Helpers
 * ========================= */
type PopupStatus = InstallmentUI["status"];

const lower = (s?: string) => (s || "").trim().toLowerCase();
const normalizePath = (p?: string) => (p || "").replace(/\\/g, "/");

const asSlipString = (sp?: any): string => {
    // รองรับ string | string[] | {Path}[] | undefined
    if (!sp) return "";
    if (typeof sp === "string") return sp;
    if (Array.isArray(sp)) {
        const f = sp[0];
        if (!f) return "";
        if (typeof f === "string") return f;
        if (typeof f?.Path === "string") return f.Path;
    }
    return "";
};

const statusNameOf = (p?: any): string =>
    typeof p?.Status === "string"
        ? p.Status
        : p?.Status?.StatusName || p?.status || p?.StatusName || "";

const isValidDue = (d?: string | null) => !!d && new Date(d).getFullYear() > 1970;

const toPopupStatus = (s?: string): PopupStatus => {
    const v = lower(s);
    if (v === "pending payment" || v === "unpaid") return "pending_payment";
    if (v === "pending verification" || v === "submitted") return "pending_verification";
    if (v === "approved" || v === "paid") return "approved";
    if (v === "rejected") return "rejected";
    if (v === "refunded") return "refunded";
    if (v === "awaiting receipt") return "awaiting_receipt";
    return "unpaid";
};

// ✅ เลือก payment ที่เหมาะกับ “ใบเสร็จ” ของแถวนี้
function pickReceiptPayment(row: any) {
    const pays: any[] = Array.isArray(row?.Payments) ? [...row.Payments] : [];
    if (row?.Payment && !pays.find((p) => (p.ID ?? p.id) === (row.Payment.ID ?? row.Payment.id))) {
        pays.push(row.Payment);
    }

    // ใหม่สุดอยู่หน้าสุด (โดย PaymentDate ก่อน ตกมาใช้ ID)
    pays.sort((a, b) => {
        const ad = new Date(a?.PaymentDate || 0).getTime();
        const bd = new Date(b?.PaymentDate || 0).getTime();
        if (ad && bd && ad !== bd) return bd - ad;
        return (b?.ID ?? b?.id ?? 0) - (a?.ID ?? a?.id ?? 0);
    });

    const nameOf = (p: any) =>
        (typeof p?.Status === "string" ? p.Status : p?.Status?.StatusName || p?.status || p?.StatusName || "").toLowerCase();
    const isApproved = (p: any) => nameOf(p) === "approved" || nameOf(p) === "paid";
    const hasNoReceipt = (p: any) => {
        const rp = asSlipString(p?.ReceiptPath);
        return !rp || rp.trim() === "";
    };

    // 1) อนุมัติแล้วแต่ยังไม่มีใบเสร็จ → เลือกตัวนี้ก่อน
    const awaiting = pays.find((p) => isApproved(p) && hasNoReceipt(p));
    if (awaiting) return awaiting;

    // 2) อนุมัติแล้ว (มี/ไม่มีใบเสร็จ) → ล่าสุด
    const approved = pays.find((p) => isApproved(p));
    if (approved) return approved;

    // 3) ไม่เจอเลย → ล่าสุด
    return pays[0];
}

/* =========================
 * Payment popup builder
 * ========================= */
function buildInstallmentsFromBooking(row?: BookingRoomsInterface): {
    plan: "full" | "deposit";
    installments: InstallmentUI[];
    fullyPaid: boolean;
} {
    if (!row) return { plan: "full", installments: [], fullyPaid: false };

    const option = lower((row as any)?.PaymentOption?.OptionName);
    const isDepositPlan = option === "deposit";

    const invoice = (row as any).RoomBookingInvoice || {};
    const finance = (row as any).Finance || {};
    const total: number | undefined =
        typeof finance.TotalAmount === "number" ? finance.TotalAmount : invoice.TotalAmount;

    const depositDue = invoice.DepositDueDate || invoice.DepositeDueDate || invoice.IssueDate;
    const dueAll = invoice.DueDate;

    // ===== รวม payments แล้วเรียงเก่า->ใหม่ โดย "วันที่ว่าง" ไปท้ายเสมอ =====
    const pays: any[] = Array.isArray((row as any).Payments) ? [...(row as any).Payments] : [];
    if ((row as any).Payment && !pays.find((p) => (p.ID ?? p.id) === ((row as any).Payment.ID ?? (row as any).Payment.id))) {
        pays.push((row as any).Payment);
    }
    pays.sort((a, b) => {
        const ad = Date.parse(a?.PaymentDate ?? "");
        const bd = Date.parse(b?.PaymentDate ?? "");
        const aEmpty = Number.isNaN(ad);
        const bEmpty = Number.isNaN(bd);

        // ไม่มีวันที่ -> ไปอยู่หลัง
        if (aEmpty && !bEmpty) return 1;
        if (!aEmpty && bEmpty) return -1;

        // มีวันที่ทั้งคู่ -> เก่าไปใหม่
        if (!aEmpty && !bEmpty && ad !== bd) return ad - bd;

        // สุดท้ายผูกด้วย ID (น้อยก่อน)
        return (a?.ID ?? a?.id ?? 0) - (b?.ID ?? b?.id ?? 0);
    });

    // ===== ชำระเต็มจำนวน =====
    if (!isDepositPlan) {
        const p = (row as any).Payment || pays[0] || {};
        const inst: InstallmentUI = {
            key: "full",
            label: "ชำระเต็มจำนวน",
            paymentId: p?.ID ?? p?.id,
            amount: typeof total === "number" ? total : p?.Amount,
            status: toPopupStatus(statusNameOf(p)),
            slipPath: normalizePath(asSlipString(p?.SlipPath)),
            dueDate: isValidDue(dueAll) ? dueAll : undefined,
        };
        return { plan: "full", installments: [inst], fullyPaid: inst.status === "approved" };
    }

    // ===== แผนมัดจำ (ซ้าย=มัดจำ, ขวา=ยอดคงเหลือ) =====
    let depPay = pays[0] || {};
    let balPay = pays[1] || {};

    // กันกรณีพิเศษ: ถ้าพบว่ายอดคงเหลือ approved แต่มัดจำยังไม่ -> สลับให้อัตโนมัติ
    const depStatus = toPopupStatus(statusNameOf(depPay));
    const balStatus = toPopupStatus(statusNameOf(balPay));
    if ((depStatus === "unpaid" || depStatus === "pending_payment" || depStatus === "pending_verification" || depStatus === "submitted")
        && balStatus === "approved") {
        const tmp = depPay;
        depPay = balPay;
        balPay = tmp;
    }

    const depositAmount =
        depPay?.Amount ??
        finance.DepositAmount ??
        (typeof total === "number" ? Math.min(total, total / 2) : undefined);

    const depositInst: InstallmentUI = {
        key: "deposit",
        label: "ชำระมัดจำ",
        paymentId: depPay?.ID ?? depPay?.id,
        amount: depositAmount,
        status: toPopupStatus(statusNameOf(depPay)),
        slipPath: normalizePath(asSlipString(depPay?.SlipPath)),
        dueDate: isValidDue(depositDue) ? depositDue : undefined,
    };

    const balAmount =
        typeof total === "number" && typeof depositInst.amount === "number"
            ? Math.max(total - depositInst.amount, 0)
            : balPay?.Amount;

    const balanceInst: InstallmentUI = {
        key: "balance",
        label: "ชำระยอดคงเหลือ",
        paymentId: balPay?.ID ?? balPay?.id,
        amount: balAmount,
        status: balPay?.ID ? toPopupStatus(statusNameOf(balPay)) : "unpaid",
        slipPath: normalizePath(asSlipString(balPay?.SlipPath)),
        dueDate: isValidDue(dueAll) ? dueAll : undefined,
        locked: toPopupStatus(statusNameOf(depPay)) !== "approved",
    };

    const fullyPaid = depositInst.status === "approved" && balanceInst.status === "approved";
    return { plan: "deposit", installments: [depositInst, balanceInst], fullyPaid };
}


/* =========================
 * Misc
 * ========================= */

/* =========================
 * Types (สั้น)
 * ========================= */
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
        SlipPath?: string[] | string;
        ReceiptPath?: string | null;
        Amount?: number;
        PaymentDate?: string;
        Note?: string;
    };
    Payments?: any[];
    RoomBookingInvoice?: {
        InvoiceNumber?: string;
        IssueDate?: string;
        DueDate?: string;
        InvoicePDFPath?: string;
        TotalAmount?: number;
        InvoiceType?: string;
        DepositDueDate?: string;
        DepositeDueDate?: string;
    };
    Finance?: {
        TotalAmount?: number;
        IsFullyPaid?: boolean;
        DepositAmount?: number;
    };
    Notifications?: NotificationsInterface[];
    PaymentOption?: { OptionName?: string };
}

type ReceiptMenuState = {
    anchorEl: HTMLElement | null;
    paymentId?: number;
    isApprovedNow?: boolean;
    fileName?: string;
};

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
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);

    // dialogs
    const [openConfirmApprove, setOpenConfirmApprove] = useState(false);
    const [openConfirmReject, setOpenConfirmReject] = useState(false);
    const [selectedRow, setSelectedRow] = useState<BookingRoomsInterface | null>(null);

    // payment popup
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [loading, _setLoading] = useState(false);

    // receipt menu (single global)
    const [receiptMenu, setReceiptMenu] = useState<ReceiptMenuState | null>(null);
    const openReceiptMenu = Boolean(receiptMenu?.anchorEl);

    const { user } = useUserStore();
    const isAdminLike = isAdmin() || isManager();

    // ===== data =====
    const getBookingRooms = async (
        pageNum: number = 1,
        setTotalFlag = false
    ) => {
        try {
            const res = await ListBookingRoomsForAdmin(
                "",
                pageNum,
                limit,
                selectedDate ? selectedDate.format("YYYY-MM") : "",
            );

            if (res) {
                setBookingRooms(res.data);
                if (setTotalFlag) setTotal(res.total);

                // const formatted = res.statusCounts.reduce((acc: any, item: any) => {
                //     acc[item.status_name] = item.count;
                //     return acc;
                // }, {});
                // setStatusCounts(formatted);
            }

            const counts = res.data.reduce((acc: Record<string, number>, it: { DisplayStatus?: string }) => {
                let key = (it.DisplayStatus || "unknown").toLowerCase();
                if (["rejected", "unconfirmed"].includes(key)) key = "pending";
                if (["awaiting receipt", "refunded"].includes(key)) key = "payment";
                if (!["pending", "confirmed", "payment review", "payment", "completed", "cancelled"].includes(key)) key = "unknown";
                acc[key] = (acc[key] || 0) + 1;
                return acc;
            }, {});
            setStatusCounts(counts);
        } catch {
            setAlerts((a) => [...a, { type: "error", message: "โหลด bookings ไม่สำเร็จ" }]);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        getBookingRooms();
    }, []);

    useEffect(() => {
        getBookingRooms(page);

    }, [page, limit]);

    useEffect(() => {
        if (user) {
            getBookingRooms(1, true);
        }
    }, [user, selectedDate]);

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

            const matchDate = !selectedDate || item.BookingDates?.some((d) => dayjs(d.Date).isSame(selectedDate, "month"));

            const statusKey = getDisplayStatus(item as any);
            const matchStatus = selectedStatus === "all" || normalize(statusKey) === normalize(selectedStatus);

            const matchFloor = selectedFloor === "all" || item.Room?.Floor?.Number === selectedFloor;

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
        const dates = row.BookingDates?.map((d) => dateFormat(d.Date)).join(", ") || "-";
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

                    if ((resApprove.data.PaymentOption?.OptionName || "").toLowerCase() === "deposit") {
                        const BookingDates = resApprove.data.BookingDates;
                        const maxDate = new Date(
                            Math.max(...BookingDates.map((d: BookingDateInterface) => new Date(d.Date ?? "").getTime()))
                        );
                        const depositDue = new Date();
                        depositDue.setDate(today.getDate() + 7);
                        depositDue.setHours(23, 59, 59, 999);
                        const dueDate = new Date(maxDate);
                        dueDate.setDate(maxDate.getDate() + 7);
                        dueDate.setHours(23, 59, 59, 999);

                        invoiceData = {
                            InvoiceNumber: invoiceNumber,
                            IssueDate: today.toISOString(),
                            DepositeDueDate: depositDue.toISOString(),
                            DueDate: dueDate.toISOString(),
                            BookingRoomID: resApprove.data.ID,
                            ApproverID: userId,
                            CustomerID: resApprove.data.UserID,
                        };
                    } else {
                        const dueDate = new Date();
                        dueDate.setDate(today.getDate() + 7);
                        dueDate.setHours(23, 59, 59, 999);
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
                    const invoiceItemData: RoomBookingInvoiceItemInterface[] = BookingDate.map((date) => ({
                        Description: `ค่าบริการอาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 วันที่ ${thaiDateFull(
                            date.Date ?? ''
                        )} ห้อง ${resApprove.data.Room.RoomNumber}`,
                        Quantity: 1,
                        UnitPrice: resApprove.data.TotalAmount / BookingDate.length,
                        Amount: resApprove.data.TotalAmount / BookingDate.length,
                    }));

                    const items = invoiceItemData.map((it) => ({ ...it, RoomBookingInvoiceID: resInvoice.data.ID }));
                    await Promise.all(items.map((it) => CreateRoomBookingInvoiceItem(it).catch(() => null)));

                    const notificationDataUpdate: NotificationsInterface = {
                        IsRead: true,
                    };
                    const resUpdateNotification = await UpdateNotificationsByBookingRoomID(
                        notificationDataUpdate,
                        resApprove.data.ID
                    );
                    if (!resUpdateNotification || resUpdateNotification.error)
                        throw new Error(resUpdateNotification?.error || "Failed to update notification.");

                    await handleUpdateNotification(resApprove.data.UserID ?? 0, false, undefined, undefined, undefined, undefined, undefined, resApprove.data.ID);

                    await handleUploadPDF(resInvoice.data.ID);

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


    const doReject = async (note?: string) => {
        if (!selectedRow) return;

        const n = (note ?? "").trim();
        if (!n) {
            handleSetAlert("warning", "กรุณาระบุเหตุผลการปฏิเสธ");
            return; // ⬅️ บังคับต้องใส่
        }

        try {
           
            await RejectBookingRoom(selectedRow.ID, n);
            handleSetAlert("success", `Rejected booking #${selectedRow.ID}`);
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Reject failed");
        } finally {
            
            setOpenConfirmReject(false);
        }
    };


    // ✅ เจาะที่ payment เฉพาะงวด + ปิดเมนู global เสมอ
    const handleUploadReceiptForPayment = async (
        e: React.ChangeEvent<HTMLInputElement>,
        paymentId: number,
        isApprovedNow: boolean
    ) => {
        try {
            const file = e.target.files?.[0];
            if (!file || file.type !== "application/pdf") {
                handleSetAlert("warning", "Please select a valid PDF file");
                return;
            }

            await UploadPaymentReceipt(paymentId, file);

            // อนุมัติงวดให้ด้วยถ้ายัง
            if (!isApprovedNow) {
                await ApprovePayment(paymentId);
            }

            handleSetAlert("success", "Receipt uploaded successfully");
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Upload receipt failed");
        } finally {
            e.target.value = "";
            setReceiptMenu(null);
        }
    };

    const handleDeleteReceiptForPayment = async (paymentId: number) => {
        try {
            await DeletePaymentReceipt(paymentId);
            handleSetAlert("success", "Receipt deleted");
            await getBookingRooms();
        } catch {
            handleSetAlert("error", "Delete receipt failed");
        } finally {
            setReceiptMenu(null);
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



    /* =========================
     * Columns
     * ========================= */
    const getColumns = (): GridColDef[] => {
        // === Small / Mobile cards ===
        if (isSmallScreen) {
            return [
                {
                    field: "All Booking Rooms",
                    headerName: "All Booking Rooms",
                    flex: 1,
                    sortable: false,
                    filterable: false,
                    renderCell: (params) => {
                        const data = params.row as BookingRoomsInterface;

                        // ===== Booking basic / status chip (เดิม) =====
                        const status = (data.StatusName || "pending").toLowerCase();
                        const colorMap: Record<
                            string,
                            { c: string; cl: string; icon: any; label: string }
                        > = {
                            pending: { c: "#F1A007", cl: "#FFF3DB", icon: Clock, label: "Pending" },
                            confirmed: { c: "#2563EB", cl: "#DBEAFE", icon: Check, label: "Confirmed" },
                            completed: { c: "#16A34A", cl: "#DCFCE7", icon: Check, label: "Completed" },
                            cancelled: { c: "#D64545", cl: "#FBE9E9", icon: X, label: "Cancelled" },
                            unknown: { c: "#6B6F76", cl: "#EFF0F1", icon: HelpCircle, label: "Unknown" },
                        };
                        const s = colorMap[status] || colorMap.unknown;
                        const dateTime = `${dateFormat(data.CreatedAt || "")} ${timeFormat(
                            data.CreatedAt || ""
                        )}`;
                        const room = `Room ${data.Room?.RoomNumber ?? "-"}`;
                        const floor = `Floor ${data.Room?.Floor?.Number ?? "-"}`;
                        const who = `${data.User?.FirstName || ""} ${data.User?.LastName || ""} (${data.User?.EmployeeID || "-"
                            })`;
                        const showButtonApprove = status === "pending" && (isManager() || isAdmin());

                        // ====== Invoice / Payment summary (ใหม่) ======
                        // เลือก Payment งวดที่ใช้แสดงใบเสร็จ/ใบกำกับ
                        const selectedPay: any = pickReceiptPayment(data);
                        const statusRaw = statusNameOf(selectedPay);
                        const isApprovedNow = ["approved", "paid"].includes(lower(statusRaw));

                        // map key ของ paymentStatusConfig → label UI
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
                                    return "Paid";
                                case "rejected":
                                    return "Rejected";
                                case "refunded":
                                    return "Refunded";
                                default:
                                    return "Pending Payment";
                            }
                        };
                        const statusKey = toConfigKey(statusRaw);
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

                        // ===== Invoice data =====
                        const invoice = (data as any).RoomBookingInvoice;
                        const invoiceNumber =
                            invoice?.InvoiceNumber ?? (data as any).InvoiceNumber ?? "-";
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
                                ? totalAmountNum.toLocaleString("th-TH", {
                                    style: "currency",
                                    currency: "THB",
                                })
                                : "—";

                        // ===== Receipt / PDF =====
                        const receiptPath = asSlipString(selectedPay?.ReceiptPath);
                        const fileName = receiptPath ? receiptPath.split("/").pop() : "";
                        const invoicePDFPath =
                            invoice?.InvoicePDFPath ?? (data as any).InvoicePDFPath ?? "";

                        const canManageReceipt = isAdminLike === true;
                        const showReceiptMenu = canManageReceipt && isApprovedNow;

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} rowSpacing={1.5} className="card-item-container">

                                {/* Header: ห้อง/เวลา/ผู้จอง */}
                                <Grid size={{ xs: 12, sm: 7 }}>
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {room} • {floor}
                                    </Typography>

                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            my: 0.8,
                                        }}
                                    >
                                        <Clock size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{dateTime}</Typography>
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            color: "text.secondary",
                                            my: 0.8,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {data.Purpose || "-"}
                                    </Typography>

                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                            my: 1,
                                        }}
                                    >
                                        <UserRound size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{who}</Typography>
                                    </Box>
                                </Grid>

                                {/* Booking status chip */}
                                <Grid size={{ xs: 12, sm: 5 }} container direction="column">
                                    <Box
                                        sx={{
                                            bgcolor: s.cl,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "flex",
                                            gap: 1,
                                            color: s.c,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            width: "100%",
                                        }}
                                    >
                                        <s.icon size={18} />
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                {/* ===== New: Invoice & Payment section ===== */}
                                <Grid size={{ xs: 12 }}>
                                    {/* Invoice number */}
                                    <Typography
                                        sx={{
                                            fontSize: 16,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {invoiceNumber}
                                    </Typography>

                                    {/* Billing Period */}
                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.6,
                                            my: 0.6,
                                        }}
                                    >
                                        <Calendar size={14} style={{ minHeight: 14, minWidth: 14 }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {`Billing Period: ${billingPeriod}`}
                                        </Typography>
                                    </Box>

                                    {/* Due date */}
                                    <Box
                                        sx={{
                                            color: "text.secondary",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.6,
                                            my: 0.6,
                                        }}
                                    >
                                        <Clock size={14} style={{ minHeight: 14, minWidth: 14 }} />
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                            }}
                                        >
                                            {`Due Date: ${dueDate}`}
                                        </Typography>
                                    </Box>

                                    {/* Amount */}
                                    <Box sx={{ mt: 1.2 }}>
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                color: "text.secondary",
                                            }}
                                        >
                                            Total Amount
                                        </Typography>
                                        <Typography
                                            sx={{
                                                fontSize: 16,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                fontWeight: 500,
                                                color: "text.main",
                                            }}
                                        >
                                            {totalAmount}
                                        </Typography>
                                    </Box>

                                    {/* Payment status chip */}
                                    <Box
                                        sx={{
                                            mt: 1.2,
                                            bgcolor: statusColorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "inline-flex",
                                            gap: 1,
                                            color: statusColor,
                                            alignItems: "center",
                                        }}
                                    >
                                        {React.createElement(statusIcon, { size: 16 })}
                                        <Typography
                                            sx={{
                                                fontSize: 14,
                                                fontWeight: 600,
                                                whiteSpace: "nowrap",
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                maxWidth: "100%",
                                            }}
                                        >
                                            {uiStatus}
                                        </Typography>
                                    </Box>

                                    {/* Receipt (file) & menu */}
                                    <Box sx={{ mt: 1.2, display: "flex", alignItems: "center", gap: 0.6, flexWrap: "wrap" }}>
                                        {showReceiptMenu && (
                                            <Button
                                                id={`receipt-menu-btn-${data.ID}`}
                                                variant="outlinedGray"
                                                sx={{ minWidth: 42 }}
                                                onClick={(e) =>
                                                    setReceiptMenu({
                                                        anchorEl: e.currentTarget,
                                                        paymentId: selectedPay?.ID,
                                                        isApprovedNow,
                                                        fileName,
                                                    })
                                                }
                                            >
                                                <Ellipsis size={16} />
                                            </Button>
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
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontSize: 14,
                                                        whiteSpace: "nowrap",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    }}
                                                >
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
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                {/* ปุ่มการทำงาน (ชำระ/ดาวน์โหลด/อนุมัติ/ปฏิเสธ/รายละเอียด) */}
                                <Grid size={{ xs: 12 }}>
                                    <Grid container spacing={0.8}>
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
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Pay Now
                                                            </Typography>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Wallet size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                View Slip
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Button>
                                            </Tooltip>
                                        </Grid>

                                        <Grid size={{ xs: 6 }}>
                                            <Tooltip title="Download PDF">
                                                <Button
                                                    variant="outlinedGray"
                                                    onClick={() =>
                                                        invoicePDFPath && window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")
                                                    }
                                                    disabled={!invoicePDFPath}
                                                    sx={{ minWidth: 42, width: "100%", height: "100%" }}
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                                                    <Typography variant="textButtonClassic" className="text-btn">
                                                        Download PDF
                                                    </Typography>
                                                </Button>
                                            </Tooltip>
                                        </Grid>

                                        {showButtonApprove ? (
                                            <>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title="Approve">
                                                        <Button
                                                            variant="contained"
                                                            onClick={() => {
                                                                setSelectedRow(data);
                                                                setOpenConfirmApprove(true);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <Check size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Approve
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 5 }}>
                                                    <Tooltip title="Reject">
                                                        <Button
                                                            variant="outlinedCancel"
                                                            onClick={() => {
                                                                setSelectedRow(data);
                                                                setOpenConfirmReject(true);
                                                            }}
                                                            fullWidth
                                                        >
                                                            <X size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">
                                                                Reject
                                                            </Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                                <Grid size={{ xs: 2 }}>
                                                    <Tooltip title="Details">
                                                        <Button
                                                            variant="outlinedGray"
                                                            onClick={() => handleClickCheck(data)}
                                                            sx={{ minWidth: 42 }}
                                                            fullWidth
                                                        >
                                                            <Eye size={18} />
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </>
                                        ) : (
                                            <Grid size={{ xs: 12 }}>
                                                <Tooltip title="Details">
                                                    <Button
                                                        className="btn-detail"
                                                        variant="outlinedGray"
                                                        onClick={() => handleClickCheck(data)}
                                                        sx={{ width: "100%" }}
                                                    >
                                                        <Eye size={18} />
                                                        <Typography variant="textButtonClassic" className="text-btn">
                                                            Details
                                                        </Typography>
                                                    </Button>
                                                </Tooltip>
                                            </Grid>
                                        )}
                                    </Grid>
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
                renderCell: (params) => {
                    const requestID = params.row.ID;
                    const notification = params.row.Notifications ?? [];
                    const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
                    return (
                        <Box sx={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "100%", gap: "5px" }}>
                            {hasNotificationForUser && <AnimatedBell />}
                            <Typography>{requestID}</Typography>
                        </Box>
                    );
                },
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
                flex: 0.4,
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
                            (p) => ["approved", "paid"].includes(String(p.Status || p.status).toLowerCase())
                        );
                        const approvedMissingReceipt = approved.some((p) => !p.ReceiptPath);

                        if (row.Finance?.IsFullyPaid && approved.length > 0) {
                            display = approvedMissingReceipt ? "awaiting receipt" : "completed";
                        }
                    }

                    const cfg = getBookingStatusConfig(display);
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
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
            {
                field: "invoice",                // ← เดิม "All Invoice"
                headerName: "All Invoice",
                flex: 1.2,
                minWidth: 320,                   // ให้มีพื้นที่ขั้นต่ำ
                sortable: false,
                filterable: false,
                renderCell: (item) => {
                    const data = item.row as BookingRoomsInterface;

                    // ✅ ใช้ payment ที่ถูกต้องสำหรับใบเสร็จ
                    const selectedPay: any = pickReceiptPayment(data);
                    const statusRaw = statusNameOf(selectedPay);
                    const isApprovedNow = ["approved", "paid"].includes(lower(statusRaw));

                    // map → key ของ paymentStatusConfig (หน้า All ไม่เปลี่ยนเป็น Awaiting Receipt)
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
                                return "Paid";
                            case "rejected":
                                return "Rejected";
                            case "refunded":
                                return "Refunded";
                            default:
                                return "Pending Payment";
                        }
                    };
                    const statusKey = toConfigKey(statusRaw);

                    const cfgPay =
                        paymentStatusConfig[statusKey] || {
                            color: "#000",
                            colorLite: "rgba(0,0,0,0.08)",
                            icon: HelpCircle,
                            label: "Unknown",
                        };
                    const { color: statusColor, colorLite: statusColorLite, icon: statusIcon, label: uiStatus } = cfgPay;

                    const canPayNow = statusKey === "Pending Payment" || statusKey === "Rejected";

                    // ===== Invoice / Amount =====
                    const invoice = (data as any).RoomBookingInvoice;
                    const invoiceNumber = invoice?.InvoiceNumber ?? (data as any).InvoiceNumber ?? "-";
                    const billingPeriod = invoice?.IssueDate
                        ? formatToMonthYear(invoice.IssueDate)
                        : data.BookingDates?.[0]?.Date
                            ? formatToMonthYear(data.BookingDates[0].Date)
                            : "-";
                    const dueDate = invoice?.DueDate ? dateFormat(invoice.DueDate) : "-";

                    const rb = (data as any).Finance;
                    const totalAmountNum = rb?.TotalAmount ?? (data as any).TotalAmount ?? invoice?.TotalAmount ?? undefined;

                    const totalAmount =
                        typeof totalAmountNum === "number"
                            ? totalAmountNum.toLocaleString("th-TH", { style: "currency", currency: "THB" })
                            : "—";

                    // ===== Receipt/PDF + เมนูอัปโหลดใบเสร็จ (admin) =====
                    const receiptPath = asSlipString(selectedPay?.ReceiptPath);
                    const fileName = receiptPath ? receiptPath.split("/").pop() : "";
                    const invoicePDFPath = invoice?.InvoicePDFPath ?? (data as any).InvoicePDFPath ?? "";

                    const currentUser = useUserStore.getState().user as UserInterface | undefined;
                    const notifications: NotificationsInterface[] = (data as any).Notifications ?? [];
                    const hasNotificationForUser = !!currentUser && notifications.some((n) => n.UserID === currentUser.ID && !n.IsRead);

                    const canManageReceipt = isAdminLike === true;
                    const showReceiptMenu = canManageReceipt && isApprovedNow; // อนุญาตเฉพาะงวดที่อนุมัติแล้ว

                    return (
                        <Grid container size={{ xs: 12 }} sx={{ px: 1 }} className="container-btn" rowSpacing={1}>
                            <Grid size={{ xs: 12, sm: 7 }}>
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

                                <Box sx={{ mt: 1.4, sm: 5 }}>
                                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "text.secondary" }}>
                                        Total Amount
                                    </Typography>
                                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500, color: "text.main" }}>
                                        {totalAmount}
                                    </Typography>
                                </Box>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 5 }} container direction="column">
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
                                    <Button
                                        id={`receipt-menu-btn-${data.ID}`}
                                        variant="outlinedGray"
                                        sx={{ minWidth: 42, mr: 1 }}
                                        onClick={(e) =>
                                            setReceiptMenu({
                                                anchorEl: e.currentTarget,
                                                paymentId: selectedPay?.ID,
                                                isApprovedNow,
                                                fileName,
                                            })
                                        }
                                    >
                                        <Ellipsis size={16} />
                                    </Button>
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
            },
            {
                field: "Actions",
                headerName: "Actions",
                flex: 0.5,
                renderCell: (params) => {
                    const row = params.row as BookingRoomsInterface;
                    const dStatus = (row.DisplayStatus || "unknown").toLowerCase();

                    return (
                        <Box className="container-btn"
                            sx={{
                                display: "flex",
                                gap: 0.8,
                                flexWrap: "wrap",
                                alignItems: "center",
                                height: '100%'
                            }}>
                            {isAdminLike && dStatus === "pending" && (
                                <>
                                    <Tooltip title="Approve">
                                        <Button className="btn-approve"
                                            variant="contained"
                                            onClick={() => { setSelectedRow(row); setOpenConfirmApprove(true); }}
                                            sx={{
                                                minWidth: "42px",
                                            }}>
                                            <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                            <Typography variant="textButtonClassic" className="text-btn">Approve

                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                        <Button
                                            className="btn-reject"
                                            variant="outlinedCancel"
                                            onClick={() => {
                                                setSelectedRow(row); setOpenConfirmReject(true);

                                            }}
                                            sx={{
                                                minWidth: "42px",
                                            }}
                                        >
                                            <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                            <Typography variant="textButtonClassic" className="text-btn">
                                                Reject
                                            </Typography>
                                        </Button>
                                    </Tooltip>
                                </>
                            )}

                            {/* {isAdminLike && dStatus === "payment review" && (
                                <Tooltip title="Review Payment">
                                    <Button variant="contained" color="warning" onClick={() => handlePrimaryAction("approvePayment", row)}>
                                        <Search size={18} />
                                        <Typography variant="textButtonClassic" className="text-btn">Review Payment</Typography>
                                    </Button>
                                </Tooltip>
                            )} */}

                            {/* {isAdminLike && dStatus === "payment" && (
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
                            )} */}

                            <Tooltip title="Details">
                                <Button
                                    className="btn-detail"
                                    variant="outlinedGray"
                                    onClick={() => handleClickCheck(row)}
                                    sx={{
                                        minWidth: "42px",
                                    }}
                                >
                                    <Eye size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                    <Typography variant="textButtonClassic" className="text-btn" >
                                        Details
                                    </Typography>
                                </Button>
                            </Tooltip>
                        </Box>
                    );
                },
            },
        ];
    };

    const popup = React.useMemo(() => buildInstallmentsFromBooking(selectedRow || undefined), [selectedRow]);

    const getNewBookingRoom = async (ID: number) => {
        try {
            const res = await GetBookingRoomById(ID);
            console.log("res new: ", res)
            if (res) {
                setBookingRooms((prev) => [res, ...prev]);
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

        socket.on("booking_room_created", (data: { ID: number }) => {
            console.log("📦 New room booking:", data);
            setTimeout(() => {
                getNewBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("booking_room_updated", (data: { ID: number }) => {
            console.log("🔄 Room booking updated:", data);
            setTimeout(() => {
                getUpdateBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("booking_room_deleted", (data: { ID: number }) => {
            console.log("🔄 Room booking deleted:", data);
            setTimeout(() => {
                setBookingRooms((prev) => prev.filter((item) => item.ID !== data.ID));
            }, 1500);
        });

        return () => {
            socket.off("booking_room_created");
            socket.off("booking_room_updated");
            socket.off("booking_room_deleted");
            socket.close();
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
                                                                <Search size={20} />
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
                                                    {[...new Set(bookingRooms.map((b) => b.Room?.Floor?.Number).filter(Boolean))].map((f) => (
                                                        <MenuItem key={String(f)} value={f as number}>
                                                            Floor {String(f)}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid size={{ xs: 6, sm: 2 }}>
                                            <FormControl fullWidth>
                                                <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as string)}>
                                                    <MenuItem value="all">All Status</MenuItem>
                                                    {[...new Set(bookingRooms.map((b) => getDisplayStatus(b as any)).filter(Boolean))].map((s) => (
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
                                                <BrushCleaning size={22} strokeWidth={2.2} style={{ color: "gray" }} />
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
                                rowCount={total}
                                page={page}
                                limit={limit}
                                onPageChange={setPage}
                                onLimitChange={setLimit}
                                noDataText="Don't have any data"
                                getRowId={(row) => {
                                    // ใช้ ID ถ้ามีค่า
                                    if (row.ID && row.ID > 0) {
                                        return String(row.ID);
                                    }
                                    // ถ้าไม่มี ID เลย ให้ใช้ unique key
                                    return `room_booking_${Date.now()}_${Math.random()}`;
                                }}
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
                    points: ["ชำระตามยอดที่ระบุในใบแจ้งหนี้ภายในกำหนด", "หากชำระมัดจำแล้ว ให้ชำระยอดคงเหลือก่อนวันใช้งาน"],
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

            {/* ===== Global one-and-only Receipt menu ===== */}
            <MuiMenu
                id="receipt-menu"
                anchorEl={receiptMenu?.anchorEl ?? null}
                open={openReceiptMenu}
                onClose={() => setReceiptMenu(null)}
                MenuListProps={{ "aria-labelledby": "receipt-menu-btn" }}
            >
                <MenuItem disableRipple>
                    <input
                        accept="application/pdf"
                        style={{ display: "none" }}
                        id="upload-receipt-input"
                        type="file"
                        onChange={(e) => {
                            if (!receiptMenu?.paymentId) return;
                            handleUploadReceiptForPayment(e, receiptMenu.paymentId, Boolean(receiptMenu.isApprovedNow));
                        }}
                    />
                    <label htmlFor="upload-receipt-input">
                        <Typography component="span" sx={{ fontSize: 14 }}>
                            {receiptMenu?.fileName ? "Replace Receipt (PDF)" : "Upload Receipt (PDF)"}
                        </Typography>
                    </label>
                </MenuItem>

                {receiptMenu?.paymentId && receiptMenu?.fileName && (
                    <MenuItem sx={{ fontSize: 14 }} onClick={() => handleDeleteReceiptForPayment(receiptMenu.paymentId!)}>
                        Delete File
                    </MenuItem>
                )}
            </MuiMenu>
        </Box>
    );
}

export default AllBookingRoom;
