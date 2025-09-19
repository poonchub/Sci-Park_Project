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
  useMediaQuery,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import dayjs, { Dayjs } from "dayjs";


import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import AlertGroup from "../../components/AlertGroup/AlertGroup";

import {
  Eye,
  X,
  Clock,
  HelpCircle,
  Calendar,
  FileText,
  HandCoins,
  BrushCleaning,
  Search,
  UserRound,
  Wallet,
} from "lucide-react";

import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { Base64 } from "js-base64";

// API
import {

  CancelBookingRoom,
  SubmitPaymentSlip,
  apiUrl,

  ListBookingRoomsForUser,
  UpdateNotificationsByBookingRoomID,
} from "../../services/http";

import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";


import { flowFromBackend } from "../../utils/bookingFlow";
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
import theme from "../../styles/Theme";
import { handleUpdateNotification } from "../../utils/handleUpdateNotification";
import { isRowReadOnly } from "../../utils/paymentGuards";


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

// บนสุดของไฟล์ (ข้างๆ helpers อื่น)
// const toPaymentStatusKey = (raw?: string) => {
//   const v = (raw || "").trim().toLowerCase();
//   if (v === "unpaid" || v === "pending payment") return "Pending Payment";
//   if (v === "submitted" || v === "pending verification") return "Pending Verification";
//   if (v === "approved" || v === "paid") return "Paid";
//   if (v === "rejected") return "Rejected";
//   if (v === "refunded") return "Refunded";
//   return "Pending Payment";
// };

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

// ===== วันทำการ (จ.-ศ.) ระหว่าง from→to (ไม่นับวันสิ้นสุด) =====
const businessDaysBetween = (from: Date, to: Date) => {
  const s = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const e = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  let days = 0;
  for (let d = new Date(s); d < e; d.setDate(d.getDate() + 1)) {
    const wd = d.getDay(); // 0=อา,6=ส
    if (wd !== 0 && wd !== 6) days++;
  }
  return days;
};

// มีการชำระ “สำคัญ” แล้วหรือยัง (ผู้ใช้ยกเลิกเองไม่ได้ ต้องติดต่อแอดมินเพื่อรีฟัน)
const hasPaidLike = (pays?: any[]) =>
  (pays || []).some((p) => {
    const v = lower(statusNameOf(p));
    return v === "paid" || v === "approved" || v === "awaiting receipt" || v === "refunded";
  });

// รวม payments ให้เป็น array เดียว (รองรับ row.Payment เดี่ยว)
const collectPays = (row: BookingRoomsInterface): any[] => {
  const arr: any[] = [];
  if (Array.isArray(row.Payments)) arr.push(...row.Payments);
  if (row.Payment) arr.push(row.Payment as any);
  return arr;
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
// ยกเลิกได้: ≥ 2 วัน "ทำการ" ก่อนวันแรก, ไม่ใช่สถานะปลายทาง, และ “ยังไม่จ่ายสำคัญ”

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

const canCancel = (row: BookingRoomsInterface) => {
  const s = lower(row.StatusName);
  if (s === "cancelled" || s === "complete" || s === "completed") return false;

  const first = earliestBookingDate(row);
  if (!first) return false;

  const today = dayjs().startOf("day").toDate();
  const start = dayjs(first).startOf("day").toDate();
  const gte2BizDays = businessDaysBetween(today, start) >= 2;

  const paidLike = hasPaidLike(collectPays(row));
  return gte2BizDays && !paidLike;
};



/* ========= Component ========= */
function MyBookingRoom() {
  const navigate = useNavigate();
  const userId = Number(localStorage.getItem("userId"));

  // state
  const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
  // const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
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

  // และใช้ useMediaQuery + theme ให้เรียบร้อย:
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const isWindowScreen = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const { user } = useUserStore();

  const bookingSummary = (row?: BookingRoomsInterface) => {
    if (!row) return "";
    const room = row.Room?.RoomNumber ?? "-";
    const dates = row.BookingDates?.map((d) => dateFormat(d.Date)).join(", ") || "-";
    return `Room ${room} • Date(s): ${dates} • Status: ${row.StatusName ?? "-"}`;
  };

  const serviceConditions = {
    title: "Please read the payment terms",
    points: [
      "Pay the invoiced amount by the due date.",
      "If a deposit has been paid, please settle the remaining balance before the booking date.",
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
        console.log(res)
        if (setTotalFlag) setTotal(res.total);


        // setStatusCounts(formatted);
      }

      // const counts = res.reduce((acc: Record<string, number>, it: { DisplayStatus: any; }) => {
      //   let key = (it.DisplayStatus || "unknown").toLowerCase();
      //   if (["rejected", "unconfirmed"].includes(key)) key = "pending";
      //   if (["awaiting receipt", "refunded"].includes(key)) key = "payment";
      //   if (
      //     ![
      //       "pending",
      //       "confirmed",
      //       "payment review",
      //       "payment",
      //       "completed",
      //       "cancelled",
      //     ].includes(key)
      //   ) {
      //     key = "unknown";
      //   }
      //   acc[key] = (acc[key] || 0) + 1;
      //   return acc;
      // }, {});
      // setStatusCounts(counts);
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

      const statusKey = flowFromBackend(item);
      const matchStatus = selectedStatus === "all" || normalize(statusKey) === normalize(selectedStatus);

      const matchFloor = selectedFloor === "all" || item.Room?.Floor?.Number === selectedFloor;

      return matchSearch && matchDate && matchStatus && matchFloor;
    });
  }, [bookingRooms, searchText, selectedDate, selectedStatus, selectedFloor]);


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
  // เลือก “งวดชำระ” ที่เหมาะสมสำหรับแสดง Invoice/Receipt บนแถวหนึ่ง ๆ
  // รองรับทั้ง data.Payment (object เดี่ยว) และ data.Payments (array)
  function pickReceiptPayment(row: any): any | undefined {
    if (!row) return undefined;

    const toArray = (r: any): any[] => {
      const arr: any[] = [];
      if (Array.isArray(r?.Payments)) arr.push(...r.Payments.filter(Boolean));
      if (r?.Payment) arr.push(r.Payment);
      return arr;
    };

    const norm = (v: any) => String(v ?? "").trim().toLowerCase();
    const statusOf = (p: any) => norm(p?.Status ?? p?.status);
    const hasReceipt = (p: any) => !!(p?.ReceiptPath);
    const safeTime = (p: any) => {
      const t = Date.parse(p?.PaymentDate || p?.CreatedAt || p?.createdAt || "");
      return Number.isNaN(t) ? (typeof p?.ID === "number" ? p.ID : 0) : t;
    };

    const payments = toArray(row);
    if (payments.length === 0) return undefined;

    // เรียงจากใหม่ → เก่า
    const byNewest = (a: any, b: any) => safeTime(b) - safeTime(a);

    const isApproved = (p: any) => {
      const s = statusOf(p);
      return s === "approved" || s === "paid";
    };
    const isPending = (p: any) => {
      const s = statusOf(p);
      return s === "submitted" || s === "pending verification";
    };
    const isRefunded = (p: any) => statusOf(p) === "refunded";
    const isRejected = (p: any) => statusOf(p) === "rejected";

    // 1) อนุมัติ/จ่ายแล้ว + มีใบเสร็จ → โชว์ก่อน
    const approvedWithReceipt = payments.filter((p) => isApproved(p) && hasReceipt(p)).sort(byNewest);
    if (approvedWithReceipt.length) return approvedWithReceipt[0];

    // 2) อนุมัติ/จ่ายแล้ว (ยังไม่มีใบเสร็จ) → ไว้แสดง Awaiting Receipt
    const approved = payments.filter(isApproved).sort(byNewest);
    if (approved.length) return approved[0];

    // 3) รอตรวจสอบ
    const pending = payments.filter(isPending).sort(byNewest);
    if (pending.length) return pending[0];

    // 4) คืนเงิน
    const refunded = payments.filter(isRefunded).sort(byNewest);
    if (refunded.length) return refunded[0];

    // 5) ถูกปฏิเสธ
    const rejected = payments.filter(isRejected).sort(byNewest);
    if (rejected.length) return rejected[0];

    // 6) อื่น ๆ → เอารายการล่าสุด
    return payments.sort(byNewest)[0];
  }

  // ---- Lite type ที่ pickPaymentPrimaryButton ต้องการ ----
  type BookingRowLite = {
    ID?: number;
    StatusName?: string;
    DisplayStatus?: string;
    User?: { ID?: number };
    Finance?: { TotalAmount?: number; IsFullyPaid?: boolean };
    RoomBookingInvoice?: {
      InvoicePDFPath?: string;
      InvoiceNumber?: string;
      IssueDate?: string;
      DueDate?: string;
      TotalAmount?: number;
    };
    BookingDates?: { Date?: string }[];
    InvoicePDFPath?: string;
    InvoiceNumber?: string;
    TotalAmount?: number;

    Payment?: {
      Status?: string;
      status?: string;
      SlipPath?: string | string[];
      slipImages?: string[];
      ReceiptPath?: string | null;
      PaymentDate?: string;
      CreatedAt?: string;
      ID?: number;
    };
    Payments?: BookingRowLite["Payment"][];
    Notifications?: NotificationsInterface[];
  };

  // ---- Helper: normalize SlipPath ให้เหลือแค่ string | string[] ----
  type MaybeSlipPath = string | string[] | { Path?: string }[] | undefined;

  function normalizeSlipPath(sp: MaybeSlipPath): { SlipPath?: string | string[]; slipImages?: string[] } {
    if (!sp) return {};
    if (typeof sp === "string") return { SlipPath: sp, slipImages: [sp] };
    if (Array.isArray(sp)) {
      if (sp.length === 0) return { SlipPath: [], slipImages: [] };
      if (typeof sp[0] === "string") return { SlipPath: sp as string[], slipImages: sp as string[] };
      const arr = (sp as Array<{ Path?: string }>).map(x => x?.Path).filter((x): x is string => !!x);
      return { SlipPath: arr, slipImages: arr };
    }
    return {};
  }

  // ---- Map Payment -> BookingRowLite.Payment ----
  function mapPaymentLite(p: any): BookingRowLite["Payment"] {
    const { SlipPath, slipImages } = normalizeSlipPath(p?.SlipPath);
    return {
      Status: p?.Status ?? p?.status,
      status: p?.status ?? p?.Status,
      SlipPath,
      slipImages,
      ReceiptPath: p?.ReceiptPath ?? null,
      PaymentDate: p?.PaymentDate,
      CreatedAt: p?.CreatedAt,
      ID: p?.ID,
    };
  }

  // ---- แปลงทั้งแถว BookingRoomsInterface -> BookingRowLite ----
  function toBookingRowLite(row: BookingRoomsInterface): BookingRowLite {
    const paymentLite = row?.Payment ? mapPaymentLite(row.Payment as any) : undefined;
    const paymentsLite = Array.isArray((row as any)?.Payments)
      ? ((row as any).Payments as any[]).map(mapPaymentLite)
      : undefined;

    return {
      ID: row.ID,
      StatusName: row.StatusName,
      DisplayStatus: row.DisplayStatus,
      User: row.User ? { ID: row.User.ID } : undefined,
      Finance: row.Finance
        ? { TotalAmount: row.Finance.TotalAmount, IsFullyPaid: row.Finance.IsFullyPaid }
        : undefined,
      RoomBookingInvoice: row.RoomBookingInvoice
        ? {
          InvoicePDFPath: row.RoomBookingInvoice.InvoicePDFPath,
          InvoiceNumber: row.RoomBookingInvoice.InvoiceNumber,
          IssueDate: row.RoomBookingInvoice.IssueDate,
          DueDate: row.RoomBookingInvoice.DueDate,
          TotalAmount: row.RoomBookingInvoice.TotalAmount,
        }
        : undefined,
      BookingDates: row.BookingDates?.map(d => ({ Date: d.Date })),
      InvoicePDFPath: row.RoomBookingInvoice?.InvoicePDFPath ?? (row as any).InvoicePDFPath,
      InvoiceNumber: row.RoomBookingInvoice?.InvoiceNumber ?? (row as any).InvoiceNumber,
      TotalAmount: row.Finance?.TotalAmount ?? (row as any).TotalAmount,

      Payment: paymentLite,
      Payments: paymentsLite,
      Notifications: (row as any).Notifications,
    };
  }



  // columns
  const getColumns = (): GridColDef[] => {
    /* =========================
     * Small (mobile) – การ์ดรวม Booking + Invoice + Actions
     * ========================= */
    // ====== ใน getColumns(): ช่วง Small (mobile) ======
    if (isSmallScreen) {
      return [
        {
          field: "My Booking",
          headerName: "My Booking",
          flex: 1,
          sortable: false,
          filterable: false,
          renderCell: (params) => {
            const data = params.row as BookingRoomsInterface;
            const locked = isRowReadOnly(data); // <<< read-only เมื่อ refunded/cancelled

            // ---- Booking basics
            const room = `Room ${data.Room?.RoomNumber ?? "-"}`;
            const floor = `Floor ${data.Room?.Floor?.Number ?? "-"}`;
            const dateTime = `${dateFormat(data.CreatedAt || "")} ${timeFormat(data.CreatedAt || "")}`;
            const who = `${data.User?.FirstName || ""} ${data.User?.LastName || ""} (${data.User?.EmployeeID || "-"})`;

            // ---- Booking status chip
            const display = flowFromBackend(data);
            const bcfg = getBookingStatusConfig(display);

            // ---- Invoice/Payment (งวดที่ใช้แสดงใบเสร็จ)
            const selectedPay: any = pickReceiptPayment(data);
            const statusRaw = statusNameOf(selectedPay);

            const toConfigKey = (raw?: string): keyof typeof paymentStatusConfig => {
              const v = (raw || "").trim().toLowerCase();
              if (v === "unpaid" || v === "pending payment") return "Pending Payment";
              if (v === "submitted" || v === "pending verification") return "Pending Verification";
              if (v === "approved" || v === "paid") return "Paid";
              if (v === "rejected") return "Rejected";
              if (v === "refunded") return "Refunded";
              return "Pending Payment";
            };
            let statusKey = toConfigKey(statusRaw);

            // สถานะ booking โดยรวม (ไว้เช็คว่าได้รับการอนุมัติหรือยัง)
            const dStatus = flowFromBackend(data);
            const awaitingApproval = lower(dStatus) === "pending approved";



            const receiptPath = asSlipString(selectedPay?.ReceiptPath);
            const fileName = receiptPath ? receiptPath.split("/").pop() : "";
            if (statusKey === "Paid" && !fileName) statusKey = "Awaiting Receipt";

            const pcfg =
              paymentStatusConfig[statusKey] || {
                color: "#000",
                colorLite: "rgba(0,0,0,0.08)",
                icon: HelpCircle,
                label: "Unknown",
              };

            // ---- Invoice info
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

            // const invoicePDFPath = invoice?.InvoicePDFPath ?? (data as any).InvoicePDFPath ?? "";

            // ---- Primary Action (เฉพาะเจ้าของ)
            const storeUser = useUserStore.getState().user as UserInterface | null;
            const isRowOwner = !!storeUser?.ID && !!data.User?.ID && storeUser.ID === data.User.ID;
            const primary = pickPaymentPrimaryButton(toBookingRowLite(data), isRowOwner);

            // อนุญาตคลิกเฉพาะ: ได้รับอนุมัติแล้ว และอยู่สถานะ Pending Payment
            const isViewSlip = (primary.label || "").toLowerCase().includes("view slip");
            const canTriggerPayment = isViewSlip || (!awaitingApproval && statusKey === "Pending Payment");

            // tooltip สื่อเหตุผล
            const primaryTooltip = awaitingApproval
              ? "Awaiting approval. You can pay after the booking is approved."
              : (!isViewSlip && statusKey !== "Pending Payment")
                ? "Payment is not open for this booking."
                : (primary.tooltip || "");

            // ---- Cancel availability
            const owner = isRowOwner;
            const allowCancel = owner && canCancel(data) && !locked;

            return (
              <Grid container size={{ xs: 12 }} sx={{ px: 1 }} rowSpacing={1.5} className="card-item-container">
                {/* Header */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {room} • {floor}
                  </Typography>

                  <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 0.6 }}>
                    <Clock size={16} />
                    <Typography sx={{ fontSize: 13 }}>{dateTime}</Typography>
                  </Box>

                  <Typography sx={{ fontSize: 14, color: "text.secondary", my: 0.6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {data.Purpose || "-"}
                  </Typography>

                  <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.5, my: 0.6 }}>
                    <UserRound size={16} />
                    <Typography sx={{ fontSize: 13 }}>{who}</Typography>
                  </Box>
                </Grid>

                {/* Booking status chip + read-only chip เมื่อถูกล็อก */}
                <Grid size={{ xs: 12 }} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box
                    sx={{
                      bgcolor: bcfg.colorLite,
                      borderRadius: 10,
                      px: 1.5,
                      py: 0.5,
                      display: "inline-flex",
                      gap: 1,
                      color: bcfg.color,
                      alignItems: "center",
                    }}
                  >
                    <bcfg.icon size={18} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{bcfg.label}</Typography>
                  </Box>

                  {locked && (
                    <Box
                      sx={{
                        bgcolor: "#e5e7eb",
                        borderRadius: 10,
                        px: 1.2,
                        py: 0.4,
                        display: "inline-flex",
                        gap: 0.6,
                        color: "#374151",
                        alignItems: "center",
                      }}
                      title="Refunded/Cancelled"
                    >
                      <Typography sx={{ fontSize: 12, fontWeight: 700 }}>Read only</Typography>
                    </Box>
                  )}
                </Grid>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Invoice section */}
                <Grid size={{ xs: 12 }}>
                  <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {invoiceNumber}
                  </Typography>

                  <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.6 }}>
                    <Calendar size={14} style={{ minHeight: 14, minWidth: 14 }} />
                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {`Billing Period: ${billingPeriod}`}
                    </Typography>
                  </Box>

                  <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.6 }}>
                    <Clock size={14} style={{ minHeight: 14, minWidth: 14 }} />
                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {`Due Date: ${dueDate}`}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.2 }}>
                    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Total Amount</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 500, color: "text.main" }}>{totalAmount}</Typography>
                  </Box>

                  {/* Payment status chip */}
                  <Box
                    sx={{
                      mt: 1.2,
                      bgcolor: pcfg.colorLite,
                      borderRadius: 10,
                      px: 1.5,
                      py: 0.5,
                      display: "inline-flex",
                      gap: 1,
                      color: pcfg.color,
                      alignItems: "center",
                    }}
                  >
                    {React.createElement(pcfg.icon, { size: 16 })}
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{pcfg.label}</Typography>
                  </Box>

                  {/* Receipt file */}
                  <Box sx={{ mt: 1.2 }}>
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
                          color: "text.secondary",
                          alignItems: "center",
                        }}
                      >
                        <FileText size={16} />
                        <Typography variant="body1" sx={{ fontSize: 14 }}>No receipt file uploaded</Typography>
                      </Box>
                    )}
                  </Box>
                </Grid>

                <Divider sx={{ width: "100%", my: 1 }} />

                {/* Actions */}
                <Grid size={{ xs: 12 }}>
                  {primary.show && !locked && (
                    <Grid size={{ xs: allowCancel ? 6 : 8 }}>
                      {primary.show && !locked && (
                        <Tooltip title={primaryTooltip}>
                          <span>
                            <Button
                              variant="contained"
                              onClick={() => {
                                if (!canTriggerPayment) return;   // กันคลิก
                                setSelectedRow(data);
                                setOpenPaymentDialog(true);
                              }}
                              disabled={!canTriggerPayment}       // ปิดปุ่ม
                              sx={{ minWidth: 42 }}
                            >
                              {React.createElement(primary.icon || HandCoins, { size: 16 })}
                            </Button>
                          </span>
                        </Tooltip>
                      )}
                    </Grid>
                  )}
                </Grid>
              </Grid>
            );
          },
        },
      ];
    }

    /* =========================
     * Window (tablet) – คอลัมน์ย่อส่วน
     * ========================= */
    // ====== ใน getColumns(): ช่วง Window (tablet) ======
    if (isWindowScreen) {
      return [
        {
          field: "Title",
          headerName: "Booking",
          flex: 0.9,
          renderCell: (params) => {
            const d = params.row as BookingRoomsInterface;
            const room = `Room ${d.Room?.RoomNumber ?? "-"}`;
            const floor = `Floor ${d.Room?.Floor?.Number ?? "-"}`;
            return (
              <Box sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100%" }}>
                <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {room} • {floor}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.secondary", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.Purpose || "-"}
                </Typography>
              </Box>
            );
          },
        },
        {
          field: "Invoice",
          headerName: "Invoice",
          flex: 1.2,
          sortable: false,
          filterable: false,
          renderCell: (item) => {
            const data = item.row as any;
            const locked = isRowReadOnly(data); // <<< ล็อกเมื่อ refunded/cancelled

            // status → config
            const selectedPay = pickReceiptPayment(data);
            const statusRaw = statusNameOf(selectedPay);
            const mapKey = (raw?: string): keyof typeof paymentStatusConfig => {
              const v = (raw || "").trim().toLowerCase();
              if (v === "unpaid" || v === "pending payment") return "Pending Payment";
              if (v === "submitted" || v === "pending verification") return "Pending Verification";
              if (v === "approved" || v === "paid") return "Paid";
              if (v === "rejected") return "Rejected";
              if (v === "refunded") return "Refunded";
              return "Pending Payment";
            };
            let statusKey = mapKey(statusRaw);
            const receiptPath = asSlipString(selectedPay?.ReceiptPath);
            const fileName = receiptPath ? String(receiptPath).split("/").pop() : "";
            if (statusKey === "Paid" && !fileName) statusKey = "Awaiting Receipt";

            const cfg = paymentStatusConfig[statusKey] || {
              color: "#000",
              colorLite: "rgba(0,0,0,0.08)",
              icon: HelpCircle,
              label: "Unknown",
            };

            // amount
            const invoice = data.RoomBookingInvoice || {};
            const invoiceNumber = invoice.InvoiceNumber ?? data.InvoiceNumber ?? "-";
            const rb = data.Finance || {};
            const totalAmountNum = rb.TotalAmount ?? data.TotalAmount ?? invoice.TotalAmount ?? undefined;
            const totalAmount =
              typeof totalAmountNum === "number"
                ? totalAmountNum.toLocaleString("th-TH", { style: "currency", currency: "THB" })
                : "—";
            const invoicePDFPath = invoice.InvoicePDFPath ?? data.InvoicePDFPath ?? "";

            // primary button (ซ่อนเมื่อ locked)
            const storeUser = useUserStore.getState().user as UserInterface | null;
            const isRowOwner = !!storeUser?.ID && !!data.User?.ID && storeUser.ID === data.User.ID;
            const primary = pickPaymentPrimaryButton(data, isRowOwner);

            // เพิ่มหลังจากคำนวณ statusKey และ before return
            // const dStatus = flowFromBackend(data);
            // const awaitingApproval = lower(dStatus) === "pending approved";
            // const isViewSlip = ((primary?.label ?? "") as string).toLowerCase().includes("view slip");
            // const canTriggerPayment = isViewSlip || (!awaitingApproval && statusKey === "Pending Payment");
            // const primaryTooltip = awaitingApproval
            //   ? "Awaiting approval. You can pay after the booking is approved."
            //   : (!isViewSlip && statusKey !== "Pending Payment")
            //     ? "Payment is not open for this booking."
            //     : (primary.tooltip || "");

            return (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, width: "100%", overflow: "hidden" }}>
                <Box
                  sx={{
                    bgcolor: cfg.colorLite,
                    px: 1.2,
                    py: 0.4,
                    borderRadius: 2,
                    color: cfg.color,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.6,
                    minWidth: 150,
                  }}
                  title={locked ? "Refunded/Cancelled " : undefined}
                >
                  {React.createElement(cfg.icon, { size: 16 })}
                  <Typography sx={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
                    {cfg.label}{locked ? " (Locked)" : ""}
                  </Typography>
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {invoiceNumber}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.secondary" }}>{totalAmount}</Typography>
                </Box>

                {primary.show && !locked && (
                  <Tooltip title={primary.tooltip || ""}>
                    <Button
                      variant="contained"
                      onClick={() => {
                        setSelectedRow(data);
                        setOpenPaymentDialog(true);
                      }}
                      sx={{ minWidth: 42 }}
                    >
                      {React.createElement(primary.icon || HandCoins, { size: 16 })}
                    </Button>
                  </Tooltip>
                )}

                <Tooltip title="Download PDF">
                  <span>
                    <Button
                      variant="outlinedGray"
                      onClick={() => invoicePDFPath && window.open(`${apiUrl}/${invoicePDFPath}`, "_blank")}
                      disabled={!invoicePDFPath}
                      sx={{ minWidth: 42 }}
                    >
                      <FontAwesomeIcon icon={faFilePdf} style={{ fontSize: 16 }} />
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            );
          },
        },
        {
          field: "Actions",
          headerName: "Actions",
          flex: 0.6,
          renderCell: (params) => {
            const row = params.row as BookingRoomsInterface;
            const storeUser = useUserStore.getState().user as UserInterface | null;
            const owner = !!storeUser?.ID && !!row.User?.ID && storeUser.ID === row.User.ID;
            const locked = isRowReadOnly(row); // <<< ล็อกเมื่อ refunded/cancelled


            return (
              <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap" }}>
                {/* Details ยังดูได้ */}
                <Tooltip title="Details">
                  <Button variant="outlinedGray" onClick={() => handleClickCheck(row)} sx={{ minWidth: 42 }}>
                    <Eye size={18} />
                  </Button>
                </Tooltip>

                {/* Cancel — ซ่อนเมื่อ locked */}
                {owner && canCancel(row) && !locked && (
                  <Tooltip title="Cancel Booking">
                    <Button
                      className="btn-reject"
                      variant="outlinedCancel"
                      onClick={() => {
                        setTargetBooking(row);
                        setOpenConfirmCancel(true);
                      }}
                      sx={{ minWidth: 42 }}
                    >
                      <X size={18} />
                    </Button>
                  </Tooltip>
                )}
              </Box>
            );
          },
        },
      ];
    }


    /* =========================
     * Desktop – ใช้โค้ดเดิมของคุณ (ปรับเล็กน้อย)
     * ========================= */

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
          const hasNotificationForUser = notification.some(
            (n: NotificationsInterface) => n.UserID === user?.ID && !n.IsRead
          );
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
          const display = flowFromBackend(row);
          const cfg = getBookingStatusConfig(display);
          const locked = isRowReadOnly(row);

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
                title={locked ? "Refunded/Cancelled " : undefined}
              >
                <cfg.icon size={18} />
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {cfg.label}{locked}
                </Typography>
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
          const row = params.row as BookingRoomsInterface;
          const storeUser = useUserStore.getState().user as UserInterface | null;
          const isRowOwner = !!storeUser?.ID && !!row.User?.ID && storeUser.ID === row.User.ID;

          const lower = (s?: string) => (s || "").trim().toLowerCase();
          const statusNameOf = (p?: any) => (p?.Status?.Name ?? p?.status ?? "").toString();
          const pickReceiptPayment = (data: any) => {
            const pays = Array.isArray(data?.Payments) ? data.Payments
              : Array.isArray((data as any)?.Payment) ? (data as any).Payment : [];
            if (!pays.length) return undefined;
            const approved = pays.find((p: any) => ["approved", "paid"].includes(lower(p?.Status?.Name ?? p?.status)));
            return approved || pays[pays.length - 1];
          };
          const toConfigKey = (raw?: string) => {
            const v = lower(raw);
            if (v === "unpaid" || v === "pending payment") return "Pending Payment";
            if (v === "submitted" || v === "pending verification") return "Pending Verification";
            if (v === "approved" || v === "paid") return "Paid";
            if (v === "rejected") return "Rejected";
            if (v === "refunded") return "Refunded";
            return "Pending Payment";
          };

          const selectedPay: any = pickReceiptPayment(row);
          const statusRaw = statusNameOf(selectedPay);
          const statusKey = toConfigKey(statusRaw);
          const canPayNow = statusKey === "Pending Payment" || statusKey === "Rejected";

          const locked = isRowReadOnly(row); // <<< ล็อกเมื่อ refunded/cancelled

          const dStatus = flowFromBackend(row);
          const awaitingApproval = lower(dStatus) === "pending approved";
          const isViewSlip = (canPayNow ? "" : "view slip").toLowerCase().includes("view slip");
          // ถ้า upstream ตั้ง primary.label ได้ จะดีกว่า: const isViewSlip = (primary.label||"").toLowerCase().includes("view slip")
          const canTriggerPayment = isViewSlip || (!awaitingApproval && statusKey === "Pending Payment");
          const primaryTooltip = awaitingApproval
            ? "Awaiting approval. You can pay after the booking is approved."
            : (!isViewSlip && statusKey !== "Pending Payment")
              ? "Payment is not open for this booking."
              : "";


          return (
            <Box sx={{ display: "flex", gap: 0.8, alignItems: "center", flexWrap: "wrap" }} className="container-btn">
              {/* Pay/View — ซ่อนเมื่อ locked */}
              {(!locked) && (
                <Tooltip title={primaryTooltip || (canPayNow ? "Pay Now" : "View Slip")}>
                  <span>
                    <Button
                      variant="contained"
                      onClick={() => {
                        if (!canTriggerPayment) return;  // กันคลิก
                        setSelectedRow(row);
                        setOpenPaymentDialog(true);
                      }}
                      disabled={!canTriggerPayment}      // ปิดปุ่ม
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
              )}


              {/* Details — ยังดูได้เสมอ */}
              <Tooltip title="Details">
                <Button variant="outlinedGray" onClick={() => handleClickCheck(row)} sx={{ minWidth: 42 }}>
                  <Eye size={18} />
                </Button>
              </Tooltip>

              {/* Cancel — ซ่อนเมื่อ locked */}
              {isRowOwner && canCancel(row) && !locked && (
                <Tooltip title="Cancel Booking">
                  <Button
                    className="btn-reject"
                    variant="outlinedCancel"
                    onClick={() => { setTargetBooking(row); setOpenConfirmCancel(true); }}
                    sx={{ minWidth: 42 }}
                  >
                    <X size={18} />
                  </Button>
                </Tooltip>
              )}

              {/* ข้อความแจ้งถ้าจ่ายแล้วแต่ยกเลิกเองไม่ได้ */}
              {/* {!canCancel(row) && hasPaidLike(collectPays(row)) && (
                <Typography sx={{ mt: 0.5, fontSize: 12, color: "text.secondary" }}>
                  ชำระแล้ว หากต้องการยกเลิก/ขอคืนเงิน กรุณาติดต่อเจ้าหน้าที่
                </Typography>
              )} */}
            </Box>
          );
        },
      },
    ];

  };


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

      <Container maxWidth="xl" sx={{ p: "0 !important" }}>
        <Grid container spacing={3}>
          {/* <Grid container className="title-box" direction="row" size={{ xs: 12 }} sx={{ gap: 1 }}>
            <ClipboardList size={26} />
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              My Booking Rooms
            </Typography>
          </Grid> */}

          {!isLoadingData ? (
            <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
              {/* <Grid container size={{ md: 12, lg: 12 }} spacing={3}>
                <BookingStatusCards statusCounts={statusCounts} />
              </Grid> */}

              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 2 }}>
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
                          {[...new Set(bookingRooms.map((b) => flowFromBackend(b)).filter(Boolean))].map((s) => (
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
        isOwner={true}
        isAdmin={false}
        isLoading={loading}
        isFromMy={true}        // ✅ เปิดสิทธิ์อัปโหลด
        booking={selectedRow}                              // ✅ ส่งข้อมูล All Invoice เข้าป๊อปอัพ
        serviceConditions={serviceConditions}
        bookingSummary={bookingSummary(selectedRow || undefined)}
        onUploadFor={async (key, file, paymentId) => {
          await handleSlip(key, file, paymentId);         // อัปโหลดครั้งแรก
          await getBookingRooms();                        // รีโหลด list เพื่อให้ popup เห็นค่าล่าสุด
        }}
        onUpdateFor={async (key, file, paymentId) => {
          await haldel(key, file, paymentId);             // อัปเดตสลิปเดิม
          await getBookingRooms();
        }}
      />


    </Box>
  );
}

export default MyBookingRoom;



