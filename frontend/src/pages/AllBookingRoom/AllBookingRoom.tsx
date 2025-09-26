// pages/AllBookingRoom/AllBookingRoom.tsx
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

    UserRound,
    Wallet,
    HandCoins,


    BrushCleaning,
    Search,
} from "lucide-react";

import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { isAdmin, isManager } from "../../routes";
import { Base64 } from "js-base64";

import {

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
    UpdateBookingRoomByID,
} from "../../services/http";

import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";
import { flowFromBackend, type ActionKey } from "../../utils/bookingFlow";

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

import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";

import { NotificationsInterface } from "../../interfaces/INotifications";

import BookingPaymentPopup, { type InstallmentUI } from "../../components/BookingPaymentPopup/BookingPaymentPopup";
import { io } from "socket.io-client";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";


/* =========================
 * Helpers (reusable)
 * ========================= */

const lower = (s?: string) => (s || "").trim().toLowerCase();

// รองรับ string | string[] | {Path}[] | undefined
const asSlipString = (sp?: any): string => {
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
    typeof p?.Status === "string" ? p.Status : p?.Status?.StatusName || p?.status || p?.StatusName || "";

// เลือก payment ที่เหมาะกับ “ใบเสร็จ” ของแถวนี้
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

    const nameOf = (p: any) => lower(typeof p?.Status === "string" ? p.Status : p?.Status?.StatusName || p?.status || p?.StatusName);
    const isApproved = (p: any) => nameOf(p) === "approved" || nameOf(p) === "paid";
    const hasNoReceipt = (p: any) => !asSlipString(p?.ReceiptPath);

    // 1) อนุมัติแล้วแต่ยังไม่มีใบเสร็จ → เลือกตัวนี้ก่อน
    const awaiting = pays.find((p) => isApproved(p) && hasNoReceipt(p));
    if (awaiting) return awaiting;

    // 2) อนุมัติแล้ว (มี/ไม่มีใบเสร็จ) → ล่าสุด
    const approved = pays.find((p) => isApproved(p));
    if (approved) return approved;

    // 3) ไม่เจอเลย → ล่าสุด
    return pays[0];
}
function buildInstallmentsFromBooking(row?: any): {
    plan: "full" | "deposit";
    installments: InstallmentUI[];
    fullyPaid: boolean;
} {
    if (!row) return { plan: "full", installments: [], fullyPaid: false };

    const lower = (s?: string) => (s || "").trim().toLowerCase();
    const normalizePath = (p?: string) => (p || "").replace(/\\/g, "/");
    const asSlipString = (sp?: any): string => {
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
        typeof p?.Status === "string" ? p.Status : p?.Status?.StatusName || p?.status || p?.StatusName || "";

    const toPopupStatus = (s?: string): InstallmentUI["status"] => {
        const v = lower(s);
        if (["pending payment", "unpaid", "awaiting payment"].includes(v)) return "pending_payment";
        if (["pending verification", "submitted", "slip under review"].includes(v)) return "pending_verification";
        if (["approved", "paid", "payment completed"].includes(v)) return "approved";
        if (["rejected", "failed"].includes(v)) return "rejected";
        if (v === "refunded") return "refunded";
        if (v === "awaiting receipt") return "awaiting_receipt";
        return "unpaid";
    };

    const isValidDue = (d?: string | null) => !!d && new Date(d).getFullYear() > 1970;
    const firstValidDate = (...ds: (string | undefined)[]) => ds.find((d) => isValidDue(d)) || undefined;

    const option = lower(row?.PaymentOption?.OptionName);
    const isDepositPlan = option === "deposit";

    const invoice = row?.RoomBookingInvoice || {};
    const finance = row?.Finance || {};
    const total = typeof finance.TotalAmount === "number" ? finance.TotalAmount : invoice.TotalAmount;
    const depositCfg = typeof finance.DepositAmount === "number" ? finance.DepositAmount : undefined;

    const depositDue = firstValidDate(invoice.DepositDueDate, (invoice as any).DepositeDueDate, invoice.IssueDate);
    const dueAll = firstValidDate(invoice.DueDate);

    // รวม payments แล้วเรียงเก่า→ใหม่
    const pays: any[] = Array.isArray(row?.Payments) ? [...row.Payments] : [];
    if (row?.Payment && !pays.find((p) => (p.ID ?? p.id) === (row.Payment.ID ?? row.Payment.id))) {
        pays.push(row.Payment);
    }
    pays.sort((a, b) => {
        const ad = Date.parse(a?.PaymentDate ?? "");
        const bd = Date.parse(b?.PaymentDate ?? "");
        const aEmpty = Number.isNaN(ad);
        const bEmpty = Number.isNaN(bd);
        if (aEmpty && !bEmpty) return 1;
        if (!aEmpty && bEmpty) return -1;
        if (!aEmpty && !bEmpty && ad !== bd) return ad - bd;
        return (a?.ID ?? a?.id ?? 0) - (b?.ID ?? b?.id ?? 0);
    });

    // ===== แผนชำระเต็มจำนวน =====
    if (!isDepositPlan) {
        const p = row?.Payment || pays[0] || {};
        const amount =
            (typeof p?.Amount === "number" && p.Amount > 0) ? p.Amount :
                (typeof total === "number" ? total : undefined);

        const inst: InstallmentUI = {
            key: "full",
            label: "ชำระเต็มจำนวน",
            paymentId: p?.ID ?? p?.id,
            amount,
            status: toPopupStatus(statusNameOf(p)),
            slipPath: normalizePath(asSlipString(p?.SlipPath)),
            dueDate: dueAll,
        };
        return { plan: "full", installments: [inst], fullyPaid: inst.status === "approved" };
    }

    // ===== แผนมัดจำ + ยอดคงเหลือ =====
    const approxEq = (a?: number, b?: number, tol = 1e-6) =>
        typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= tol;

    const isDeposit = (p: any) => {
        const note = lower(p?.Note);
        const type = p?.PaymentTypeID;
        if (type === 1) return true;         // 1 = deposit
        if (type === 2) return false;        // 2 = balance
        if (note === "deposit" || note === "มัดจำ") return true;
        if (note === "balance" || note === "ยอดคงเหลือ") return false;
        if (depositCfg && approxEq(p?.Amount, depositCfg)) return true;
        if (depositCfg && total && approxEq(p?.Amount, total - depositCfg)) return false;
        return false;
    };

    let depPay = pays.find(isDeposit);
    let balPay = pays.find((p) => !isDeposit(p));

    if (!depPay && pays.length) depPay = pays[0];
    if (!balPay && pays.length > 1) balPay = pays.find((p) => (p?.ID ?? 0) !== (depPay?.ID ?? 0));

    // ===== Amounts: หลีกเลี่ยงใช้ 0 เป็นค่าจริง =====
    let depositAmount =
        (typeof depPay?.Amount === "number" && depPay.Amount > 0) ? depPay.Amount :
            (typeof depositCfg === "number" ? depositCfg :
                (typeof total === "number" && typeof balPay?.Amount === "number" && balPay.Amount > 0
                    ? Math.max(total - balPay.Amount, 0)
                    : undefined));

    let balanceAmount =
        (typeof balPay?.Amount === "number" && balPay.Amount > 0) ? balPay.Amount :
            (typeof total === "number" && typeof depositAmount === "number"
                ? Math.max(total - depositAmount, 0)
                : undefined);

    const depositInst: InstallmentUI = {
        key: "deposit",
        label: "ชำระมัดจำ",
        paymentId: depPay?.ID ?? depPay?.id,
        amount: depositAmount,
        status: toPopupStatus(statusNameOf(depPay)),
        slipPath: normalizePath(asSlipString(depPay?.SlipPath)),
        dueDate: depositDue,
    };

    const balanceInst: InstallmentUI = {
        key: "balance",
        label: "ชำระยอดคงเหลือ",
        paymentId: balPay?.ID ?? balPay?.id,
        amount: balanceAmount,
        status: balPay?.ID ? toPopupStatus(statusNameOf(balPay)) : "unpaid",
        slipPath: normalizePath(asSlipString(balPay?.SlipPath)),
        dueDate: dueAll,
        locked: toPopupStatus(statusNameOf(depPay)) !== "approved",
    };

    const fullyPaid = depositInst.status === "approved" && balanceInst.status === "approved";
    return { plan: "deposit", installments: [depositInst, balanceInst], fullyPaid };
}


/* =========================
 * Types
 * ========================= */
interface BookingRoomsInterfaceUse {
    ID: number;
    CreatedAt?: string;
    Room?: { RoomNumber?: number | string; Floor?: { Number?: number } };
    BookingDates?: Array<{ Date: string }>;
    Merged_time_slots?: Array<{ start_time: string; end_time: string }>;
    StatusName?: string;
    Purpose?: string;
    BaseTotal?: number;
    DiscountAmount?: number;
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
        DiscountAmount?: number;
        BaseTotal?: number;

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
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterfaceUse[]>([]);
    const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [isLoadingApprove, setIsLoadingApprove] = useState(false)

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
    const [selectedRow, setSelectedRow] = useState<BookingRoomsInterfaceUse | null>(null);

    // payment popup
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [loading, _setLoading] = useState(false);

    // receipt menu
    const [receiptMenu, setReceiptMenu] = useState<ReceiptMenuState | null>(null);
    const openReceiptMenu = Boolean(receiptMenu?.anchorEl);

    const { user } = useUserStore();
    const isAdminLike = isAdmin() || isManager();

    // ===== data =====
    const getBookingRooms = async (pageNum: number = 1, setTotalFlag = false) => {
        try {
            const res = await ListBookingRoomsForAdmin("", pageNum, limit, selectedDate ? selectedDate.format("YYYY-MM") : "");
            if (res) {
                setBookingRooms(res.data);
                if (setTotalFlag) setTotal(res.total);
            }
            const counts = (res?.data ?? []).reduce((acc: Record<string, number>, it: any) => {
                const key = flowFromBackend(it); // "pending approvel" | "pending payment" | "partially paid" | "awaiting receipt" | "completed" | "cancelled" | "unknown"
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

            const statusKey = flowFromBackend(item as any);

            const matchStatus = selectedStatus === "all" || normalize(statusKey) === normalize(selectedStatus);

            const matchFloor = selectedFloor === "all" || item.Room?.Floor?.Number === selectedFloor;

            return matchSearch && matchDate && matchStatus && matchFloor;
        });
    }, [bookingRooms, searchText, selectedDate, selectedStatus, selectedFloor]);

    // ===== UI helpers =====
    const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
        setAlerts((prev) => [...prev, { type, message }]);
    };

    const bookingSummary = (row?: BookingRoomsInterfaceUse) => {
        if (!row) return "";
        const room = row.Room?.RoomNumber ?? "-";
        const dates = row.BookingDates?.map((d) => dateFormat(d.Date)).join(", ") || "-";
        return `Room ${room} • Dates: ${dates} • Status: ${row.StatusName ?? "-"}`;
    };

    // ===== actions =====
    const handlePrimaryAction = async (key: ActionKey, row: BookingRoomsInterfaceUse, invoiceNumber?: string, discountAmount?: number) => {
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

                    setIsLoadingApprove(true);

                    const normalizeDeposit = (dep: number, total: number) => {
                        if (!Number.isFinite(dep)) dep = 0;
                        if (dep < 0) dep = 0;
                        if (dep > total) dep = total;
                        return dep;
                    };

                    try {
                        // 1) ราคาเต็ม (BaseTotal) + ส่วนลดสิทธิ์เดิม + ส่วนลดพิเศษ
                        const baseTotal =
                            Number(row?.BaseTotal ??
                                row?.Finance?.BaseTotal ??
                                ((row?.Finance?.TotalAmount ?? 0) + (row?.Finance?.DiscountAmount ?? 0))) || 0;

                        const privilegeDiscount =
                            Number(row?.DiscountAmount ?? row?.Finance?.DiscountAmount ?? 0) || 0; // ส่วนลดสิทธิ์ที่มีอยู่แล้ว

                        const specialDiscount = Math.max(0, Number(discountAmount ?? 0));        // ส่วนลดพิเศษที่กรอกใน dialog

                        const newDiscountAmount = Math.min(baseTotal, privilegeDiscount + specialDiscount);
                        const newTotalAmount = Math.max(0, baseTotal - newDiscountAmount);

                        // 2) เซฟยอด (มัดจำใส่ครึ่งชั่วคราว เดี๋ยวอัปเดตหลังรู้ PaymentOption)
                        const firstPatch: BookingRoomsInterface = {
                            DiscountAmount: newDiscountAmount,
                            TotalAmount: newTotalAmount,
                            DepositAmount: normalizeDeposit(newTotalAmount / 2, newTotalAmount),
                        };
                        await UpdateBookingRoomByID(row.ID, firstPatch);

                        // 3) อนุมัติ
                        const resApprove = await ApproveBookingRoom(row.ID);

                        // 4) ปรับมัดจำตาม PaymentOption
                        const optName = String(resApprove?.data?.PaymentOption?.OptionName || "").toLowerCase();
                        let deposit = newTotalAmount / 2;
                        if (optName === "full") deposit = 0;
                        deposit = normalizeDeposit(deposit, newTotalAmount);
                        await UpdateBookingRoomByID(row.ID, { DepositAmount: deposit } as BookingRoomsInterface);

                        // 5) สร้างใบแจ้งหนี้
                        const userId = Number(localStorage.getItem("userId"));
                        const today = new Date();
                        let invoiceData: RoomBookingInvoiceInterface = {};

                        if (optName === "deposit") {
                            const bookingDates: BookingDateInterface[] = resApprove.data.BookingDates || [];
                            const maxDate = new Date(Math.max(...bookingDates.map(d => new Date(d.Date ?? "").getTime())));
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
                        } else {
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

                        // 6) สร้างรายการใบแจ้งหนี้โดยอิง "ราคาเต็มต่อวัน"
                        const bookingDates: BookingDateInterface[] = resApprove.data.BookingDates || [];
                        const approvedBaseTotal =
                            Number(resApprove?.data?.BaseTotal ??
                                resApprove?.data?.Finance?.BaseTotal ??
                                ((resApprove?.data?.Finance?.TotalAmount ?? 0) + (resApprove?.data?.Finance?.DiscountAmount ?? 0))) || 0;

                        const perDayBase = bookingDates.length ? approvedBaseTotal / bookingDates.length : 0;

                        const invoiceItemData: RoomBookingInvoiceItemInterface[] = bookingDates.map((date) => ({
                            Description: `ค่าบริการอาคารอำนวยการอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 วันที่ ${thaiDateFull(
                                date.Date ?? ""
                            )} ห้อง ${resApprove.data.Room.RoomNumber}`,
                            Quantity: 1,
                            UnitPrice: perDayBase,
                            Amount: perDayBase,
                        }));

                        const items = invoiceItemData.map(it => ({ ...it, RoomBookingInvoiceID: resInvoice.data.ID }));
                        await Promise.all(items.map(it => CreateRoomBookingInvoiceItem(it).catch(() => null)));

                        // 7) ปิดแจ้งเตือน/ทำงานต่อ
                        const notificationDataUpdate: NotificationsInterface = { IsRead: true };
                        const resUpdateNotification = await UpdateNotificationsByBookingRoomID(notificationDataUpdate, resApprove.data.ID);
                        if (!resUpdateNotification || (resUpdateNotification as any).error) {
                            throw new Error((resUpdateNotification as any)?.error || "Failed to update notification.");
                        }

                        await handleUpdateNotification(
                            resApprove.data.User.ID ?? 0,
                            false,
                            undefined, undefined, undefined, undefined, undefined,
                            resApprove.data.ID
                        );

                        await handleUploadPDF(resInvoice.data.ID);

                        setOpenConfirmApprove(false);
                    } catch (err) {
                        console.error("Approve booking error:", err);
                        handleSetAlert("error", (err as Error)?.message || "An unexpected error occurred during approval.");
                    } finally {
                        setIsLoadingApprove(false);
                    }
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

                case "completed":
                    await CompleteBookingRoom(row.ID);
                    break;

                case "refund": {
                    const pid = row.Payment?.id ?? row.Payment?.ID;
                    if (!pid) throw new Error("No payment id");

                    // เขียนเหตุผลที่อยากเก็บใน cancelled_note (optional)
                    const reason = "Refunded by admin (method: bank)";

                    await RefundedBookingRoom(pid, {
                        reason,           // จะถูกบันทึกลง booking.cancelled_note
                        cancelBooking: true, // รีฟันแล้วให้ booking = Cancelled ตาม flow
                    });
                    break;
                }

                default:
                    return;
            }

            await getBookingRooms();
            await refreshSelectedRow(); 
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
            return;
        }

        try {
            await RejectBookingRoom(selectedRow.ID, n);

            const notificationDataUpdate: NotificationsInterface = {
                IsRead: true,
            };
            const resUpdateNotification = await UpdateNotificationsByBookingRoomID(notificationDataUpdate, selectedRow.ID);
            if (!resUpdateNotification || resUpdateNotification.error) throw new Error(resUpdateNotification?.error || "Failed to update notification.");

            handleSetAlert("success", `Rejected booking #${selectedRow.ID}`);
            await getBookingRooms();
            await refreshSelectedRow(); 
        } catch {
            handleSetAlert("error", "Reject failed");
        } finally {
            setOpenConfirmReject(false);
        }
    };

    // Upload/Delete receipt (global menu)
    const handleUploadReceiptForPayment = async (e: React.ChangeEvent<HTMLInputElement>, paymentId: number, isApprovedNow: boolean) => {
        try {
            const file = e.target.files?.[0];
            if (!file || file.type !== "application/pdf") {
                handleSetAlert("warning", "Please select a valid PDF file");
                return;
            }
            await UploadPaymentReceipt(paymentId, file);
            if (!isApprovedNow) {
                await ApprovePayment(paymentId);
            }
            handleSetAlert("success", "Receipt uploaded successfully");
            await getBookingRooms();
            await refreshSelectedRow(); 
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
            await refreshSelectedRow(); 
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

    // ★ ใหม่
    const refreshSelectedRow = async () => {
        try {
            if (!selectedRow?.ID) return;
            const fresh = await GetBookingRoomById(selectedRow.ID);
            if (fresh) setSelectedRow(fresh);
        } catch { }
    };

    /* =========================
     * Columns
     * ========================= */
    const getColumns = (): GridColDef[] => {
        // utils เฉพาะในฟังก์ชันนี้
        const lower = (s?: string) => (s || "").trim().toLowerCase();
        const isRowLocked = (row: BookingRoomsInterfaceUse) => {
            // ล็อคถ้า booking ถูก cancel หรือ payment ล่าสุดเป็น refunded
            const disp = lower(flowFromBackend(row as any));
            if (disp === "cancelled") return true;

            const pay = pickReceiptPayment(row as any);
            const raw = statusNameOf(pay);
            return lower(raw) === "refunded";
        };

        if (isSmallScreen) {
            return [
                {
                    field: "All Booking Rooms",
                    headerName: "All Booking Rooms",
                    flex: 1,
                    sortable: false,
                    filterable: false,
                    renderCell: (params) => {
                        const data = params.row as BookingRoomsInterfaceUse;

                        // ----- lock rule (refund/cancel ฯลฯ ห้ามกด)
                        const locked = isRowLocked(data);

                        // ----- booking chips / basics
                        const display = flowFromBackend(data);
                        const cfg = getBookingStatusConfig(display);

                        const dateTime = `${dateFormat(data.CreatedAt || "")} ${timeFormat(data.CreatedAt || "")}`;
                        const room = `Room ${data.Room?.RoomNumber ?? "-"}`;
                        const floor = `Floor ${data.Room?.Floor?.Number ?? "-"}`;
                        const who = `${data.User?.FirstName || ""} ${data.User?.LastName || ""} (${data.User?.EmployeeID || "-"})`;

                        // ----- payment state เพื่อใช้ตัดสินปุ่ม
                        const selectedPay: any = pickReceiptPayment(data);
                        const statusRaw = statusNameOf(selectedPay);
                        const toKey = (raw?: string) => {
                            const v = (raw || "").trim().toLowerCase();
                            if (v === "unpaid" || v === "pending payment") return "Pending Payment";
                            if (v === "submitted" || v === "pending verification") return "Pending Verification";
                            if (v === "approved" || v === "paid") return "Paid";
                            if (v === "rejected") return "Rejected";
                            if (v === "refunded") return "Refunded";
                            return "Pending Payment";
                        };
                        const payKey = toKey(statusRaw);
                        const canPayNow = payKey === "Pending Payment" || payKey === "Rejected";

                        const isPendingApprove = display === "pending approval" && (isManager() || isAdmin());

                        return (
                            <Grid container size={{ xs: 12 }} sx={{ px: 1 }} rowSpacing={1.2} className="card-item-container">
                                {/* --------- Info (บน) --------- */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                        {room} • {floor}
                                    </Typography>

                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 0.6 }}>
                                        <Clock size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{dateTime}</Typography>
                                    </Box>

                                    <Typography
                                        sx={{
                                            fontSize: 14,
                                            color: "text.secondary",
                                            my: 0.6,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {data.Purpose || "-"}
                                    </Typography>

                                    <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 0.6 }}>
                                        <UserRound size={16} />
                                        <Typography sx={{ fontSize: 13 }}>{who}</Typography>
                                    </Box>
                                </Grid>

                                {/* booking chip */}
                                <Grid size={{ xs: 12 }}>
                                    <Box
                                        sx={{
                                            bgcolor: cfg.colorLite,
                                            borderRadius: 10,
                                            px: 1.5,
                                            py: 0.5,
                                            display: "inline-flex",
                                            gap: 1,
                                            color: cfg.color,
                                            alignItems: "center",
                                        }}
                                    >
                                        <cfg.icon size={18} />
                                        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{cfg.label}</Typography>
                                    </Box>
                                </Grid>

                                <Divider sx={{ width: "100%", my: 1 }} />

                                {/* --------- Actions (ล่างข้อมูล) --------- */}
                                <Grid size={{ xs: 12 }}>
                                    <Grid container spacing={0.8}>

                                        {isPendingApprove ? (
                                            <>
                                                {/* Approve */}
                                                <Grid size={{ xs: 6 }}>
                                                    <Tooltip title="Approve">
                                                        <span>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => { setSelectedRow(data); setOpenConfirmApprove(true); }}
                                                                fullWidth
                                                                disabled={locked}
                                                                sx={{ minWidth: 42 }}
                                                            >
                                                                <Check size={18} />
                                                                <Typography variant="textButtonClassic" className="text-btn">Approve</Typography>
                                                            </Button>
                                                        </span>
                                                    </Tooltip>
                                                </Grid>

                                                {/* Reject */}
                                                <Grid size={{ xs: 6 }}>
                                                    <Tooltip title="Reject">
                                                        <span>
                                                            <Button
                                                                variant="outlinedCancel"
                                                                onClick={() => { setSelectedRow(data); setOpenConfirmReject(true); }}
                                                                fullWidth
                                                                disabled={locked}
                                                                sx={{ minWidth: 42 }}
                                                            >
                                                                <X size={18} />
                                                                <Typography variant="textButtonClassic" className="text-btn">Reject</Typography>
                                                            </Button>
                                                        </span>
                                                    </Tooltip>
                                                </Grid>
                                            </>
                                        ) : (
                                            <>
                                                {/* Pay Now / View Slip */}
                                                <Grid size={{ xs: 6 }}>
                                                    <Tooltip title={canPayNow ? "Pay Now" : "View Slip"}>
                                                        <span>
                                                            <Button
                                                                variant="contained"
                                                                onClick={() => { setSelectedRow(data); setOpenPaymentDialog(true); }}
                                                                disabled={locked}
                                                                fullWidth
                                                                sx={{ minWidth: 42 }}
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
                                                        </span>
                                                    </Tooltip>
                                                </Grid>

                                                {/* Details */}
                                                <Grid size={{ xs: 6 }}>
                                                    <Tooltip title="Details">
                                                        <Button
                                                            className="btn-detail"
                                                            variant="outlinedGray"
                                                            onClick={() => handleClickCheck(data)}
                                                            fullWidth
                                                            sx={{ minWidth: 42 }}
                                                        >
                                                            <Eye size={18} />
                                                            <Typography variant="textButtonClassic" className="text-btn">Details</Typography>
                                                        </Button>
                                                    </Tooltip>
                                                </Grid>
                                            </>
                                        )}

                                    </Grid>
                                </Grid>
                            </Grid>
                        );
                    },
                },
            ];
        }


        // ===== Desktop =====
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
                flex: 0.4,
                renderCell: (params) => {
                    const d = params.row as BookingRoomsInterfaceUse;
                    const room = `Room ${d.Room?.RoomNumber ?? "-"}`;
                    const floor = `Floor ${d.Room?.Floor?.Number ?? "-"}`;
                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                            <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {room} • {floor}
                            </Typography>
                            <Typography
                                sx={{ fontSize: 14, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                            >
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
                    const d = params.row as BookingRoomsInterfaceUse;

                    // วันที่จาก BookingDates ตัวแรก
                    const rawDate = d.BookingDates?.[0]?.Date || d.CreatedAt;
                    const dateStr = dayjs(rawDate).format("DD/MM/YYYY");

                    // ฟังก์ชันช่วย: รับได้ทั้ง "12:30" หรือ "2025-09-27T12:30:00+07:00"
                    const toTime = (v?: string) => {
                        if (!v) return "";
                        if (v.includes("T")) return dayjs(v).format("HH:mm");
                        // กรณีเป็น "12:30:00" ก็หั่นเหลือ HH:mm
                        const m = v.match(/^(\d{2}:\d{2})/);
                        return m ? m[1] : v;
                    };

                    // รองรับ 2 แหล่งเวลา:
                    // 1) มี Merged_time_slots เป็น [{start_time, end_time}]
                    // 2) หรือมี start/end แบบรวมมาเป็นสตริง "start - end"
                    let start = "";
                    let end = "";

                    if (Array.isArray(d.Merged_time_slots) && d.Merged_time_slots.length > 0) {
                        start = d.Merged_time_slots[0].start_time;
                        end = d.Merged_time_slots[d.Merged_time_slots.length - 1].end_time;
                    } else if (typeof (d as any).TimeRange === "string") {
                        // เผื่อกรณี FE/BE ส่งมาแบบ "start - end"
                        const [s, e] = (d as any).TimeRange.split(" - ").map((x: string) => x.trim());
                        start = s; end = e;
                    }

                    const timeStr =
                        start || end ? `${toTime(start)} - ${toTime(end)}` : "-";

                    return (
                        <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                            <Typography sx={{ fontSize: 14 }}>{dateStr}</Typography>
                            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>{timeStr}</Typography>
                        </Box>
                    );
                },
            }
            ,
            {
                field: "Status",
                headerName: "Status",
                flex: 0.4,
                renderCell: (params) => {
                    const row = params.row as BookingRoomsInterfaceUse;
                    const display = flowFromBackend(row);
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
                field: "Actions",
                headerName: "Actions",
                flex: 0.7,
                renderCell: (params) => {
                    const row = params.row as BookingRoomsInterfaceUse;
                    const dStatus = flowFromBackend(row as any);
                    const locked = isRowLocked(row); // <<< ใช้ล็อคปุ่ม

                    // เลือก payment สำหรับปุ่มชำระ/ดูสลิป
                    const selectedPay: any = pickReceiptPayment(row);
                    const statusRaw = statusNameOf(selectedPay);
                    const toConfigKey = (raw?: string) => {
                        const v = lower(raw);
                        if (v === "unpaid" || v === "pending payment") return "Pending Payment";
                        if (v === "submitted" || v === "pending verification") return "Pending Verification";
                        if (v === "approved" || v === "paid") return "Paid";
                        if (v === "rejected") return "Rejected";
                        if (v === "refunded") return "Refunded";
                        return "Pending Payment";
                    };

                    const storeUser = useUserStore.getState().user as UserInterface | null;
                    const isRowOwner = !!storeUser?.ID && !!row.User?.ID && storeUser.ID === row.User.ID;
                    const statusKey = toConfigKey(statusRaw);
                    const canPayNow =
                        !isAdminLike &&
                        isRowOwner &&
                        (statusKey === "Pending Payment" || statusKey === "Rejected");
                    const canRefund = isAdminLike && statusKey === "Paid"; // paid / awaiting receipt
                    const approved = dStatus !== "pending approval";
                    return (
                        <Box className="container-btn" sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center", height: "100%" }}>
                            {isAdminLike && dStatus === "pending approval" && (
                                <>
                                    <Tooltip title="Approve">
                                        <span>
                                            <Button
                                                className="btn-approve"
                                                variant="contained"
                                                onClick={() => {
                                                    setSelectedRow(row);
                                                    setOpenConfirmApprove(true);
                                                }}
                                                sx={{ minWidth: "42px" }}
                                                disabled={locked} // <<< ล็อค
                                            >
                                                <Check size={18} style={{ minWidth: 18, minHeight: 18 }} />
                                                <Typography variant="textButtonClassic" className="text-btn">Approve</Typography>
                                            </Button>
                                        </span>
                                    </Tooltip>
                                    <Tooltip title="Reject">
                                        <span>
                                            <Button
                                                className="btn-reject"
                                                variant="outlinedCancel"
                                                onClick={() => {
                                                    setSelectedRow(row);
                                                    setOpenConfirmReject(true);
                                                }}
                                                sx={{ minWidth: "42px" }}
                                                disabled={locked} // <<< ล็อค
                                            >
                                                <X size={18} style={{ minWidth: 18, minHeight: 18 }} />
                                                <Typography variant="textButtonClassic" className="text-btn">Reject</Typography>
                                            </Button>
                                        </span>
                                    </Tooltip>
                                </>
                            )}

                            {(canPayNow || approved) && (
                                <Tooltip title={canPayNow ? "Pay Now" : "View Slip"}>
                                    <span>
                                        <Button
                                            variant="contained"
                                            onClick={() => { setSelectedRow(row); setOpenPaymentDialog(true); }}
                                            sx={{ minWidth: 42 }}
                                            disabled={locked}
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

                                    </span>
                                </Tooltip>
                            )}


                            <Tooltip title="Details">
                                <Button className="btn-detail" variant="outlinedGray" onClick={() => handleClickCheck(row)} sx={{ minWidth: "42px" }}>
                                    <Eye size={18} style={{ minWidth: 18, minHeight: 18 }} />
                                    <Typography variant="textButtonClassic" className="text-btn">Details</Typography>
                                </Button>
                            </Tooltip>

                            {canRefund && (
                                <Tooltip title="Refund">
                                    <span>
                                        <Button
                                            variant="outlined"
                                            color="secondary"
                                            onClick={async () => {
                                                try {
                                                    const pid = selectedPay?.ID ?? selectedPay?.id;
                                                    if (!pid) throw new Error("No payment id");
                                                    await RefundedBookingRoom(pid);
                                                    handleSetAlert("success", "Refunded successfully");
                                                    await getBookingRooms();
                                                    await refreshSelectedRow(); 
                                                } catch (e) {
                                                    handleSetAlert("error", "Refund failed");
                                                }
                                            }}
                                            sx={{ minWidth: 42 }}
                                            disabled={locked} // <<< ล็อค
                                        >
                                            <HandCoins size={18} />
                                            <Typography variant="textButtonClassic" className="text-btn">Refund</Typography>
                                        </Button>
                                    </span>
                                </Tooltip>
                            )}
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
            if (res) setBookingRooms((prev) => [res, ...prev]);
        } catch (error) {
            console.error("Error fetching maintenance request:", error);
        }
    };

    const getUpdateBookingRoom = async (ID: number) => {
        try {
            const res = await GetBookingRoomById(ID);
            if (res) setBookingRooms((prev) => prev.map((item) => (item.ID === res.ID ? res : item)));
        } catch (error) {
            console.error("Error fetching update maintenance:", error);
        }
    };

    useEffect(() => {
        const socket = io(socketUrl);

        socket.on("booking_room_created", (data: { ID: number }) => {
            setTimeout(() => {
                getNewBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("booking_room_updated", (data: { ID: number }) => {
            setTimeout(() => {
                getUpdateBookingRoom(data.ID);
            }, 1500);
        });

        socket.on("booking_room_deleted", (data: { ID: number }) => {
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
                bookingRoomData={selectedRow!}
                open={openConfirmApprove}
                setOpenConfirm={setOpenConfirmApprove}
                handleFunction={(invoiceNumber, discountAmount) => handlePrimaryAction("approve", selectedRow!, invoiceNumber, discountAmount)}
                title="Confirm Booking Approval"
                showInvoiceNumberField
                buttonActive={isLoadingApprove}
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
                            Room Booking List
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
                                                    {[...new Set(bookingRooms.map((b) => flowFromBackend(b as any)).filter(Boolean))].map((s) => (
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
                                    if (row.ID && row.ID > 0) return String(row.ID);
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
                booking={selectedRow}
                refreshBooking={refreshSelectedRow}   // ★ เพิ่ม
                serviceConditions={{
                    title: "Please read the payment terms",
                    points: [
                        "Pay the amount stated on the invoice by the due date.",
                        "If a deposit has been paid, settle the remaining balance before the booking date.",
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
                        await refreshSelectedRow(); 
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
                        await refreshSelectedRow(); 
                    } catch {
                        handleSetAlert("error", "Reject payment failed");
                    }
                }}
                onUploadReceipt={async (file, paymentId) => {
                    await UploadPaymentReceipt(paymentId!, file);
                    await getBookingRooms();
                    await refreshSelectedRow(); 
                }}
                onRemoveReceipt={async (paymentId) => {
                    await DeletePaymentReceipt(paymentId!);
                    await getBookingRooms();
                    await refreshSelectedRow(); 
                }}
            />

            {/* Global Receipt menu */}
            <MuiMenu id="receipt-menu" anchorEl={receiptMenu?.anchorEl ?? null} open={openReceiptMenu} onClose={() => setReceiptMenu(null)} MenuListProps={{ "aria-labelledby": "receipt-menu-btn" }}>
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
