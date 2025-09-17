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
  MenuItem,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";


import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import AlertGroup from "../../components/AlertGroup/AlertGroup";

import {
  ClipboardList,
  Eye,
  X,
  Clock,
  HelpCircle,
  Calendar,
  FileText,
  HandCoins,
  BrushCleaning,
  Search,
} from "lucide-react";

import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { Base64 } from "js-base64";

// API
import {
  ListBookingRoomsByUser,
  CancelBookingRoom,
  SubmitPaymentSlip,
  apiUrl,
  ListBookingRoomsForAdmin,
  ListBookingRoomsForUser,
  UpdateNotificationsByBookingRoomID,
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
import { paymentStatusConfig } from "../../constants/paymentStatusConfig";
import { getPaymentPrimaryButton as pickPaymentPrimaryButton } from "../../utils/getPaymentPrimaryButton";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { formatToMonthYear } from "../../utils/formatToMonthYear";
import AnimatedBell from "../../components/AnimatedIcons/AnimatedBell";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { UserInterface } from "../../interfaces/IUser";
import { useUserStore } from "../../store/userStore";

import BookingPaymentPopup, {
  type InstallmentUI,
} from "../../components/BookingPaymentPopup/BookingPaymentPopup";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";

/* ========= Types ========= */
interface BookingRoomsInterface {
  ID: number;
  CreatedAt?: string;
  Room?: { RoomNumber?: number | string; Floor?: { Number?: number } };
  BookingDates?: Array<{ Date: string }>;
  Merged_time_slots?: Array<{ start_time: string; end_time: string }>;
  StatusName?: string;
  Purpose?: string;
  User?: { ID?: number; FirstName?: string; LastName?: string; EmployeeID?: string };

  PaymentOption?: { OptionName?: string };
  Payments?: Array<{
    ID?: number;
    id?: number;
    Amount?: number;
    Status?: any;                    // string | { StatusName: string }
    status?: string;
    PaymentDate?: string;
    SlipPath?: string[] | string | { Path?: string }[];
    ReceiptPath?: string | null;
    Note?: string;                   // "Balance" สำหรับยอดคงเหลือ
    CreatedAt?: string;
  }>;

  RoomBookingInvoice?: {
    InvoiceType?: string;
    TotalAmount?: number;
    InvoicePath?: string;
    InvoicePDFPath?: string;
    InvoiceNumber?: string;
    IssueDate?: string;
    DueDate?: string;
    DepositeDueDate?: string;
    DepositDueDate?: string;
  };

  Finance?: {
    TotalAmount?: number;
    DepositAmount?: number;
    IsFullyPaid?: boolean;
  };

  DisplayStatus?: string;

  // payment หลัก/fallback จาก BE บางเคส
  Payment?: {
    ID?: number;
    Status?: any;
    status?: string;
    Amount?: number;
    PaymentDate?: string;
    ReceiptPath?: string | null;
    SlipPath?: string | string[] | { Path?: string }[];
    Note?: string;
    CreatedAt?: string;
  };
}

/* ========= Helpers ========= */
const lower = (s?: string) => (s || "").trim().toLowerCase();
const normalizePath = (p?: string) => (p || "").replace(/\\/g, "/");

// รองรับ string | string[] | { Path: string }[]
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

// รับทั้ง string และ object.StatusName
const statusNameOf = (p?: any): string =>
  typeof p?.Status === "string"
    ? p.Status
    : p?.Status?.StatusName || p?.status || p?.StatusName || "";

const isValidDue = (d?: string | null) =>
  !!d && new Date(d).getFullYear() > 1970;

const toPopupStatus = (s?: string): InstallmentUI["status"] => {
  const v = lower(s);
  if (v === "pending payment" || v === "unpaid") return "pending_payment";
  if (v === "pending verification" || v === "submitted") return "pending_verification";
  if (v === "approved" || v === "paid") return "approved";
  if (v === "rejected") return "rejected";
  if (v === "refunded") return "refunded";
  if (v === "awaiting receipt") return "awaiting_receipt";
  return "unpaid";
};

// วันแรกของการใช้งาน
const earliestBookingDate = (row: BookingRoomsInterface) => {
  const dts = row.BookingDates || [];
  if (dts.length === 0) return null;
  const first = dts
    .map((d) => dayjs(d.Date))
    .sort((a, b) => a.valueOf() - b.valueOf())[0];
  return first ?? null;
};

// ยกเลิกได้ >= 2 วันก่อนวันแรก และไม่ใช่ cancelled/completed
const canCancel = (row: BookingRoomsInterface) => {
  const s = lower(row.StatusName);
  if (s === "cancelled" || s === "completed") return false;
  const first = earliestBookingDate(row);
  if (!first) return false;
  const todayStart = dayjs().startOf("day");
  const cutoff = todayStart.add(2, "day");
  return first.isAfter(cutoff);
};

/** ผูกข้อมูลให้ popup: deposit ซ้าย / balance ขวา ด้วย Note === "Balance" */
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


/* ========= Component ========= */
function MyBookingRoom() {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId"));

  // state
  const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [alerts, setAlerts] = useState<
    { type: "warning" | "error" | "success"; message: string }[]
  >([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<number | "all">("all");

  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);

  const [openConfirmCancel, setOpenConfirmCancel] = useState(false);
  const [targetBooking, setTargetBooking] = useState<BookingRoomsInterface | null>(null);

  // Payment popup
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedRow, setSelectedRow] = useState<BookingRoomsInterface | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useUserStore();
  const currentUserId = user?.ID;
  const isOwnerPopup =
    !!currentUserId && !!selectedRow?.User?.ID && currentUserId === selectedRow.User.ID;

  const bookingSummary = (row?: BookingRoomsInterface) => {
    if (!row) return "";
    const room = row.Room?.RoomNumber ?? "-";
    const dates = row.BookingDates?.map((d) => dateFormat(d.Date)).join(", ") || "-";
    return `ห้อง ${room} • วันที่ ${dates} • สถานะ: ${row.StatusName ?? "-"}`;
  };
  const serviceConditions = {
    title: "โปรดอ่านเงื่อนไขการชำระเงิน",
    points: [
      "ชำระตามยอดที่ระบุในใบแจ้งหนี้ภายในกำหนด",
      "หากชำระมัดจำแล้ว ให้ชำระยอดคงเหลือก่อนวันใช้งาน",
    ],
  };

  // load data
  const getBookingRooms = async (pageNum: number = 1, setTotalFlag = false) => {
    try {

      const res = await ListBookingRoomsForUser(
        "",
        pageNum,
        limit,
        selectedDate ? selectedDate.format("YYYY-MM") : "",
        userId
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
        if (
          ![
            "pending",
            "confirmed",
            "payment review",
            "payment",
            "completed",
            "cancelled",
          ].includes(key)
        ) {
          key = "unknown";
        }
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

  // filter
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
      const matchStatus = selectedStatus === "all" || normalize(statusKey) === normalize(selectedStatus);

      const matchFloor = selectedFloor === "all" || item.Room?.Floor?.Number === selectedFloor;

      return matchSearch && matchDate && matchStatus && matchFloor;
    });
  }, [bookingRooms, searchText, selectedDate, selectedStatus, selectedFloor]);

  const totalFiltered = filtered.length;

  // actions
  const handleCancelBooking = async (id: number) => {
    try {
      await CancelBookingRoom(id);
      setAlerts((a) => [...a, { type: "success", message: "Booking cancelled" }]);
      await getBookingRooms();
    } catch {
      setAlerts((a) => [...a, { type: "error", message: "Cancel failed" }]);
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

  const handleSlip = async (
    key: "full" | "deposit" | "balance",
    file?: File,
    paymentId?: number
  ) => {
    if (!selectedRow || !file) return;
    setLoading(true);
    try {
      const transTimestamp: string | undefined = (file as any)?.transTimestamp;
      // ถ้าอยากกันพลาด: ถ้าไม่มี transTimestamp ก็ใส่เวลาปัจจุบัน
      const ts = transTimestamp || new Date().toISOString();

      const amt = popupData.installments.find(i => i.key === key)?.amount;

      const userID = Number(localStorage.getItem("userId"))

      await SubmitPaymentSlip(selectedRow.ID, file, {
        PayerID: userID || undefined,
        PaymentID: paymentId || undefined,
        installment: key,
        amount: amt,
        transTimestamp: ts, // ✅ ปล่อยให้ฟังก์ชัน map เป็น PaymentDate เอง
      });

      const notificationDataUpdate: NotificationsInterface = {
        IsRead: false,
      };
      const resUpdateNotification = await UpdateNotificationsByBookingRoomID(
        notificationDataUpdate,
        selectedRow.ID
      );
      if (!resUpdateNotification || resUpdateNotification.error)
        throw new Error(resUpdateNotification?.error || "Failed to update notification.");

      if (key == "balance" || key == "full") {
        await handleUpdateNotification(userID ?? 0, true, undefined, undefined, undefined, undefined, undefined, selectedRow.ID);
      }

      setAlerts(a => [...a, { type: "success", message: paymentId ? "อัปเดตสลิปสำเร็จ" : "อัปโหลดสลิปสำเร็จ" }]);
      await getBookingRooms();
      setOpenPaymentDialog(false);
    } catch (e: any) {
      setAlerts(a => [...a, { type: "error", message: e?.message || "อัปโหลดสลิปล้มเหลว" }]);
    } finally {
      setLoading(false);
    }
  };
  const haldel = handleSlip; // alias


  // columns
  const getColumns = (): GridColDef[] => [
    {
      field: "ID",
      headerName: "No.",
      flex: 0.3,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const requestID = params.row.ID;
        console.log("Daata: ", params.row)
        const notification = params.row.Notifications ?? [];
        const hasNotificationForUser = notification.some((n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead);
        console.log("hasNotificationForUser: ", hasNotificationForUser)
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
          <Box sx={{ display: "flex", flexDirection: "column" }}>
            <Typography sx={{ fontSize: 14 }}>
              {room} • {floor}
            </Typography>
            <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
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

        if (sn === "cancelled" || display === "cancelled") {
          display = "cancelled";
        } else if (sn === "completed") {
          display = "completed";
        } else {
          const payments = (row as any).Payments as any[] | undefined;
          const approved = (payments || []).filter((p) =>
            ["approved", "paid"].includes(String(p.Status || p.status).toLowerCase())
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
    {
      field: "All Invoice",
      headerName: "All Invoice",
      flex: 1,
      renderCell: (item) => {
        const data = item.row as any;

        const pay = data.Payment || {};
        const receiptPath: string = pay.ReceiptPath || "";

        // raw status → key ของ paymentStatusConfig (Title Case)
        let statusKey: keyof typeof paymentStatusConfig;
        switch ((data?.Payment?.Status ?? data?.Payment?.status ?? "").trim().toLowerCase()) {
          case "unpaid":
          case "pending payment":
            statusKey = "Pending Payment";
            break;
          case "submitted":
          case "pending verification":
            statusKey = "Pending Verification";
            break;
          case "rejected":
            statusKey = "Rejected";
            break;
          case "refunded":
            statusKey = "Refunded";
            break;
          case "approved":
          case "paid":
            statusKey = "Paid";
            break;
          default:
            statusKey = "Pending Payment";
        }
        // ถ้าอนุมัติแล้วแต่ยังไม่แนบใบเสร็จ → แสดง Awaiting Receipt
        if (statusKey === "Paid" && !receiptPath) statusKey = "Awaiting Receipt";

        const cfgPay =
          paymentStatusConfig[statusKey] || {
            color: "#000",
            colorLite: "rgba(0,0,0,0.08)",
            icon: HelpCircle,
            label: "Unknown",
          };
        const { color: statusColor, colorLite: statusColorLite, icon: statusIcon, label: uiStatus } = cfgPay;

        // invoice & amount
        const invoice = data.RoomBookingInvoice || {};
        const invoiceNumber = invoice.InvoiceNumber ?? data.InvoiceNumber ?? "-";
        const billingPeriod = invoice.IssueDate
          ? formatToMonthYear(invoice.IssueDate)
          : data.BookingDates?.[0]?.Date
            ? formatToMonthYear(data.BookingDates[0].Date)
            : "-";
        const dueDate = invoice.DueDate ? dateFormat(invoice.DueDate) : "-";

        const rb = data.Finance || {};
        const totalAmountNum = rb.TotalAmount ?? data.TotalAmount ?? invoice.TotalAmount ?? undefined;
        const totalAmount =
          typeof totalAmountNum === "number"
            ? totalAmountNum.toLocaleString("th-TH", { style: "currency", currency: "THB" })
            : "—";

        const invoicePDFPath = invoice.InvoicePDFPath ?? data.InvoicePDFPath ?? "";

        const storeUser = useUserStore.getState().user as UserInterface | null;
        const isRowOwner = !!storeUser?.ID && !!data.User?.ID && storeUser.ID === data.User.ID;
        const primary = pickPaymentPrimaryButton(data, isRowOwner);
        const StatusName = data.StatusName;

        const fileName = receiptPath ? String(receiptPath).split("/").pop() : "";
        const user = useUserStore.getState().user as UserInterface | undefined;
        const notifications: NotificationsInterface[] = (data.Notifications || []) as any[];
        const hasNotificationForUser = !!user && notifications.some((n) => n.UserID === user.ID && !n.IsRead);

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
                <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Total Amount</Typography>
                <Typography sx={{ fontSize: 16, fontWeight: 500, color: "text.main" }}>{totalAmount}</Typography>
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

            <Grid size={{ xs: 12 }}>
              {fileName ? (
                <Box
                  sx={{
                    display: "inline-flex",
                    gap: 1,
                    border: "1px solid rgb(109, 110, 112, 0.4)",
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: "#FFF",
                    cursor: "pointer",
                    transition: "all ease 0.3s",
                    alignItems: "center",
                    width: { xs: "100%", mobileS: "auto" },
                    "&:hover": { color: "primary.main", borderColor: "primary.main" },
                  }}
                  onClick={() => window.open(`${apiUrl}/${receiptPath}`, "_blank")}
                >
                  <FileText size={16} style={{ minWidth: 16, minHeight: 16 }} />
                  <Typography variant="body1" sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {fileName}
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "inline-flex",
                    gap: 1,
                    border: "1px solid rgb(109, 110, 112, 0.4)",
                    borderRadius: 1,
                    px: 1,
                    py: 0.5,
                    bgcolor: "#FFF",
                    alignItems: "center",
                    color: "text.secondary",
                    width: { xs: "100%", mobileS: "auto" },
                  }}
                >
                  <FileText size={16} style={{ minWidth: 16, minHeight: 16 }} />
                  <Typography variant="body1" sx={{ fontSize: 14 }}>No receipt file uploaded</Typography>
                </Box>
              )}
            </Grid>

            <Divider sx={{ width: "100%", my: 1 }} />

            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                <Grid container spacing={0.8} size={{ xs: 12 }}>
                  {primary.show && (
                    <Grid size={{ xs: 6 }}>
                      <Tooltip title={primary.tooltip || ""}>
                        <Button
                          variant="contained"
                          disabled={StatusName === "Pending"}
                          onClick={() => {
                            setSelectedRow(data);
                            setOpenPaymentDialog(true);
                          }}
                          sx={{ minWidth: "42px", width: "100%", height: "100%" }}
                        >
                          {React.createElement(primary.icon || HandCoins, { size: 18 })}
                          <Typography variant="textButtonClassic" className="text-btn">
                            {primary.label}
                          </Typography>
                        </Button>
                      </Tooltip>
                    </Grid>
                  )}

                  <Grid size={{ xs: 6 }}>
                    <Tooltip title="Download PDF">
                      <Button
                        variant="outlinedGray"
                        onClick={() => invoicePDFPath && window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")}
                        disabled={!invoicePDFPath}
                        sx={{ minWidth: "42px", width: "100%", height: "100%" }}
                      >
                        <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                        <Typography variant="textButtonClassic" className="text-btn">
                          Download PDF
                        </Typography>
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
      flex: 0.6,
      renderCell: (params) => {
        const row = params.row as BookingRoomsInterface;
        const owner = !!currentUserId && !!row.User?.ID && currentUserId === row.User.ID;

        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Details">
              <Button variant="outlinedGray" onClick={() => handleClickCheck(row)}>
                <Eye size={18} />
                <Typography variant="textButtonClassic">Details</Typography>
              </Button>
            </Tooltip>

            {owner && canCancel(row) && (
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
    },
  ];

  // popup data
  const popupData = useMemo(
    () => buildInstallmentsFromBooking(selectedRow || undefined),
    [selectedRow]
  );

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
                          input: {
                            startAdornment: <InputAdornment position="start">
                              <Search size={20} />
                            </InputAdornment>
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
                          {[...new Set(bookingRooms.map((b) => getDisplayStatus(b)).filter(Boolean))].map((s) => (
                            <MenuItem key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
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

          <Grid size={{ xs: 12 }} minHeight="200px">
            {!isLoadingData ? (
              <CustomDataGrid
                rows={filtered}
                columns={getColumns()}
                getRowId={(row) => row.ID}
                rowCount={total}
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

      <BookingPaymentPopup
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        plan={popupData.plan}
        installments={popupData.installments}
        fullyPaid={popupData.fullyPaid}
        isOwner={!!isOwnerPopup}
        isAdmin={false}
        isLoading={loading}
        serviceConditions={serviceConditions}
        bookingSummary={bookingSummary(selectedRow || undefined)}

        onUploadFor={async (key, file, paymentId) => {
          await handleSlip(key, file, paymentId);        // อัปโหลดครั้งแรก (ถ้าไม่มี paymentId BE จะสร้างใหม่)
        }}
        onUpdateFor={async (key, file, paymentId) => {
          await haldel(key, file, paymentId);            // อัปเดตใบเดิม (มี paymentId)
        }}
      />

    </Box>
  );
}

export default MyBookingRoom;
