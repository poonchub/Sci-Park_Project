import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  Box, Button, Card, CardMedia, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Step, StepLabel, Stepper, Typography, Grid, Divider, Tooltip,
  useMediaQuery
} from "@mui/material";
import {
  Clock, FileText, HelpCircle, Wallet, X,
  CheckCircle2, AlertCircle, Upload, Trash2, Download
} from "lucide-react";
import { apiUrl, CheckSlip, GetQuota } from "../../services/http";
import dateFormat from "../../utils/dateFormat";
import ImageUploader from "../ImageUploader/ImageUploader";
import AlertGroup from "../AlertGroup/AlertGroup";

// ===== Configs =====
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024;

const RECEIPT_ALLOWED = new Set(["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"]);
const RECEIPT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

// ⬇️ เพิ่ม
type BookingLike = {
  TotalAmount?: number;
  DepositAmount?: number;
  Finance?: { TotalAmount?: number; DepositAmount?: number };
  PaymentOption?: { OptionName?: string };
  Payments?: any[];
  RoomBookingInvoice?: { DueDate?: string; IssueDate?: string; InvoicePDFPath?: string; InvoiceNumber?: string; TotalAmount?: number };
};

const inferPlanFromBooking = (planProp?: "full" | "deposit", booking?: BookingLike): "full" | "deposit" => {
  if (planProp) return planProp;
  const opt = lower((booking as any)?.PaymentOption?.OptionName);
  return opt === "deposit" ? "deposit" : "full";
};

const toNum = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const mapUIStatus = (raw?: string): InstallmentUI["status"] => {
  const s = norm(raw);
  if (s === "approved" || s === "paid") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "refunded") return "refunded";
  if (s === "submitted" || s === "pending_verification") return "pending_verification";
  if (s === "pending_payment" || s === "unpaid" || s === "overdue") return "pending_payment";
  return "pending_payment";
};

// ✅ ถูก: required มาก่อน แล้วค่อย optional
const pickDepositAndBalancePayment = (total: number, booking?: BookingLike) => {
  const pays: any[] = Array.isArray(booking?.Payments) ? booking!.Payments : [];
  if (!pays.length) return { dep: undefined, bal: undefined };

  if (pays.length >= 2) {
    const withAmount = pays.map(p => ({ ...p, _amt: toNum(p?.Amount ?? p?.amount, 0) }));
    const dep = withAmount.find(p => p._amt > 0 && p._amt <= total / 2) ?? withAmount[0];
    const bal = withAmount.find(p => p !== dep) ?? undefined;
    return { dep, bal };
  }

  const only = pays[0];
  const amt = toNum(only?.Amount ?? only?.amount, 0);
  if (amt > 0 && amt < total) return { dep: only, bal: undefined };
  return { dep: undefined, bal: only };
};


// สร้างรายการงวดจาก booking โดยไม่พึ่งพา props installments (เพื่อกันข้อมูลไม่ครบ)
const deriveInstallments = (
  planResolved: "full" | "deposit",
  booking?: BookingLike
): InstallmentUI[] => {
  const total =
    toNum(booking?.Finance?.TotalAmount, NaN) ?? NaN; // ใช้ ?? NaN เพื่อคุมลำดับ fallback
  const totalAmount = Number.isFinite(total)
    ? total
    : toNum(booking?.TotalAmount, toNum((booking as any)?.RoomBookingInvoice?.TotalAmount, 0));

  const depositAmountRaw =
    toNum(booking?.Finance?.DepositAmount, NaN) ?? NaN;
  const depositAmount = Number.isFinite(depositAmountRaw)
    ? depositAmountRaw
    : toNum(booking?.DepositAmount, Math.round(totalAmount * 0.3)); // fallback 30% ถ้าไม่มีข้อมูล

  const balanceAmount = Math.max(0, totalAmount - (planResolved === "deposit" ? depositAmount : totalAmount));
  // เดิม: const { dep, bal } = pickDepositAndBalancePayment(booking, totalAmount);
  const { dep, bal } = pickDepositAndBalancePayment(totalAmount, booking);

  if (planResolved === "full") {
    const p = bal || dep; // เผื่อข้อมูลเก่าเก็บไว้ที่ dep
    return [
      {
        key: "full",
        label: "Full Payment",
        amount: totalAmount,
        paymentId: p?.ID,
        status: mapUIStatus(statusNameOf(p)),
        slipPath: p?.SlipPath ?? p?.slip_path,
        locked: false,
        dueDate: booking?.RoomBookingInvoice?.DueDate,
      },
    ];
  }

  // deposit plan
  const depStatus = mapUIStatus(statusNameOf(dep));
  const isDepositApproved = depStatus === "approved";
  const balStatus = mapUIStatus(statusNameOf(bal));

  const depositUI: InstallmentUI = {
    key: "deposit",
    label: "Deposit",
    amount: depositAmount,
    paymentId: dep?.ID,
    status: dep ? depStatus : "pending_payment",
    slipPath: dep?.SlipPath ?? dep?.slip_path,
    locked: false,
    dueDate: booking?.RoomBookingInvoice?.DueDate, // หรืออาจจะมี due แยกตามงวด
  };

  const balanceUI: InstallmentUI = {
    key: "balance",
    label: "Balance",
    amount: balanceAmount,
    paymentId: bal?.ID,
    status: bal ? balStatus : "pending_payment",
    slipPath: bal?.SlipPath ?? bal?.slip_path,
    locked: !isDepositApproved, // ⬅️ lock จนกว่ามัดจำอนุมัติ
    dueDate: booking?.RoomBookingInvoice?.DueDate,
  };

  return [depositUI, balanceUI];
};

// ===== Types =====
type SlipCheckState = {
  loading?: boolean;
  ok?: boolean;
  transTs?: string;
  error?: string;
  fallbackNow?: boolean; // used current time instead of verified timestamp
};

export type InstallmentUI = {
  key: "full" | "deposit" | "balance";
  label: string;
  paymentId?: number;
  amount?: number;
  status:
  | "unpaid"
  | "pending_payment"
  | "submitted"
  | "pending_verification"
  | "approved"
  | "rejected"
  | "refunded"
  | "awaiting_receipt";
  slipPath?: string;
  locked?: boolean;
  dueDate?: string;
};

interface BookingPaymentPopupProps {
  open: boolean;
  onClose: () => void;

  plan: "full" | "deposit";
  installments: InstallmentUI[];
  fullyPaid?: boolean;

  isOwner: boolean;
  isAdmin: boolean;
  isLoading: boolean;

  booking?: any; // ✅ row ของ booking สำหรับดึง All Invoice มาแสดงใน popup
  refreshBooking?: () => Promise<any>; // ✅ ฟังก์ชันรีโหลด booking แบบสด หลังอัปโหลด/ลบเสร็จ
  isFromMy?: boolean;
  bookingSummary?: string;
  serviceConditions?: { title: string; points: string[] };

  onUploadFor?: (key: InstallmentUI["key"], file: File, paymentId?: number) => Promise<void>;
  onUpdateFor?: (key: InstallmentUI["key"], file: File, paymentId?: number) => Promise<void>;
  onApproveFor?: (key: InstallmentUI["key"], paymentId?: number) => Promise<void>;
  onRejectFor?: (key: InstallmentUI["key"], paymentId?: number) => Promise<void>;

  // ใหม่: จัดการไฟล์ใบเสร็จ (เฉพาะส่วน Invoice Overview)
  onUploadReceipt?: (file: File, paymentId?: number) => Promise<void>;
  onRemoveReceipt?: (paymentId?: number) => Promise<void>;
}

// ===== Helpers =====
const steps = ["Awaiting Payment", "Pending Verification", "Paid"] as const;

const ensureFile = (file?: File) => {
  if (!file) throw new Error("Please attach the slip.");
  if (!ALLOWED.has(file.type)) throw new Error("Invalid file type.");
  if (file.size > MAX_SIZE) throw new Error("File size exceeds 5MB.");
};

// Call slip verification (try field "files" first, then fallback to "slip")
const verifySlip = async (file: File) => {
  const tryOnce = async (field: "files" | "slip") => {
    const fd = new FormData();
    fd.append(field, file, file.name);
    const r = await CheckSlip(fd);
    return r?.data?.transTimestamp || r?.transTimestamp || r?.data?.timestamp;
  };
  try {
    return await tryOnce("files");
  } catch (e1: any) {
    try {
      return await tryOnce("slip");
    } catch {
      const msg = e1?.response?.data?.error || e1?.message || "Slip check failed";
      const status = e1?.response?.status;
      throw new Error(status ? `${status}: ${msg}` : msg);
    }
  }
};

const getStepIndex = (status?: InstallmentUI["status"]) => {
  const s = norm(status);
  if (s === "pending_payment" || s === "unpaid" || s === "overdue") return 0;
  if (s === "pending_verification" || s === "rejected" || s === "submitted") return 1;
  if (s === "approved") return 2;
  return 0;
};


const canShowAdminActions = (isAdmin?: boolean, status?: InstallmentUI["status"], hasSlip?: boolean) =>
  Boolean(isAdmin && hasSlip && norm(status) === "pending_verification");

// Card order: full = single; deposit plan = left (deposit), right (balance)
const orderInstallments = (plan: "full" | "deposit", items?: InstallmentUI[]) => {
  const arr = Array.isArray(items) ? items : [];
  if (plan === "full") return arr.filter((i) => i?.key === "full");
  const dep = arr.find((i) => i?.key === "deposit");
  const bal = arr.find((i) => i?.key === "balance");
  return [dep, bal].filter(Boolean) as InstallmentUI[];
};

// ===== Helpers for "Invoice Overview" (ย้ายมาจาก All Invoice) =====
// --- helpers (ประกาศก่อนที่จะถูกเรียกใช้) ---
const lower = (s?: string) => (s || "").trim().toLowerCase();
const norm = (s?: string) => lower(s).replace(/\s+/g, "_");

const statusNameOf = (p?: any) => (p?.Status?.Name ?? p?.status ?? "").toString();

const isImgUrl = (u?: string) => !!u && /\.(png|jpe?g|gif|webp|gif)$/i.test((u.split("?")[0] || ""));
const isPdfUrl = (u?: string) => !!u && /\.pdf$/i.test((u.split("?")[0] || ""));

const slipUrl = (path?: string) =>
  !path ? "" : /^https?:\/\//i.test(path) ? path : `${apiUrl}/${path}`;

const paymentStatusKey = (raw?: string) => {
  const v = lower(raw);
  if (v === "unpaid" || v === "pending payment") return "Pending Payment";
  if (v === "submitted" || v === "pending verification") return "Pending Verification";
  if (v === "approved" || v === "paid") return "Paid";
  if (v === "rejected") return "Rejected";
  if (v === "refunded") return "Refunded";
  return "Pending Payment";
};
const pickReceiptPaymentFromBooking = (data: any) => {
  const pays = Array.isArray(data?.Payments)
    ? data.Payments
    : Array.isArray((data as any)?.Payment)
      ? (data as any).Payment
      : [];
  if (!pays.length) return undefined;
  const approved = pays.find((p: any) =>
    ["approved", "paid"].includes(lower(p?.Status?.Name ?? p?.status))
  );
  return approved || pays[pays.length - 1];
};

const asSlipString = (s?: string) => (s || "").replace(/^\/+/, "");
const formatToMonthYear = (d?: string) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(+dt)) return "-";
  return dt.toLocaleString("en-US", { month: "long", year: "numeric" });
};

// สี/ไอคอนแบบ self-contained (เลียนแบบ config เดิม ไม่ต้อง import อะไรเพิ่ม)
const statusVisuals = {
  "Pending Payment": { color: "#5f6368", lite: "rgba(95,99,104,0.12)", icon: Wallet, label: "Pending Payment" },
  "Pending Verification": { color: "#f57c00", lite: "rgba(245,124,0,0.12)", icon: HelpCircle, label: "Pending Verification" },
  Paid: { color: "#2e7d32", lite: "rgba(46,125,50,0.12)", icon: Wallet, label: "Paid" },
  Rejected: { color: "#d32f2f", lite: "rgba(211,47,47,0.12)", icon: HelpCircle, label: "Rejected" },
  Refunded: { color: "#6a1b9a", lite: "rgba(106,27,154,0.12)", icon: HelpCircle, label: "Refunded" },
} as const;


const BookingPaymentPopup: React.FC<BookingPaymentPopupProps> = ({
  open,
  onClose,

  plan = "full",
  installments = [],
  fullyPaid = false,

  isOwner = false,
  isAdmin = false,
  isLoading = false,
  isFromMy = false,

  booking, // ✅ row ที่ส่งเข้ามาตอนกด Pay Now / View Slip
  refreshBooking, // ⬅️ เพิ่มบรรทัดนี้

  bookingSummary,
  serviceConditions,

  onUploadFor,
  onApproveFor,
  onRejectFor,

  onUploadReceipt,
  onRemoveReceipt,
}) => {
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
  const [files, setFiles] = useState<Record<InstallmentUI["key"], File[]>>({ full: [], deposit: [], balance: [] });
  const [slipCheck, setSlipCheck] = useState<Record<InstallmentUI["key"], SlipCheckState>>({
    full: {},
    deposit: {},
    balance: {},
  });

  const resetLocalStates = () => {
    setFiles({ full: [], deposit: [], balance: [] });
    setSlipCheck({ full: {}, deposit: {}, balance: {} });
    setReplaceMode(false);
  };

  // ✅ รีเซ็ต state ทุกครั้งที่ booking เปลี่ยน หรือ dialog เปิดใหม่
  useEffect(() => {
    if (open) resetLocalStates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking]);

  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [receiptUploading, setReceiptUploading] = useState(false);
  const allowOwnerUpload = isOwner && isFromMy;
  // ⬇️ แทนที่บรรทัดเดิม
  const planResolved = useMemo(() => inferPlanFromBooking(plan, booking), [plan, booking]);

  // ถ้า props.installments ส่งมาถูกต้องครบอยู่แล้วก็ใช้ได้เลย
  // แต่เพื่อกันกรณีไม่ครบ/ผิด ให้ derive จาก booking เป็นหลัก
  const computedInstallments = useMemo<InstallmentUI[]>(() => {
    const derived = deriveInstallments(planResolved, booking);
    // ถ้า caller ส่ง installments มาและค่าตรง ให้ merge โดยให้ derived เป็นค่า default
    if (Array.isArray(installments) && installments.length) {
      const mapByKey = new Map(derived.map(i => [i.key, i]));
      const merged = installments.map(i => ({ ...mapByKey.get(i.key), ...i }));
      // เติมตัวที่อาจหายไปจาก props
      derived.forEach(i => {
        if (!merged.find(m => m.key === i.key)) merged.push(i);
      });
      return merged;
    }
    return derived;
  }, [planResolved, booking, installments]);

  const list = useMemo(() => orderInstallments(planResolved, computedInstallments), [planResolved, computedInstallments]);
  // lightbox viewer state (ต้องอยู่ "ใน" component เท่านั้น)
  const [viewer, setViewer] = useState<{ open: boolean; url: string }>({ open: false, url: "" });
  const fullScreen = useMediaQuery("(max-width:900px)");
  const openViewer = (url: string) => setViewer({ open: true, url });
  const closeViewer = () => setViewer({ open: false, url: "" });

  const [replaceMode, setReplaceMode] = useState(false);

  // ===== ใส่ไฟล์สลิป + ตรวจสิทธิ์โควต้า + verify SlipOK (เหมือนเดิม) =====
  const setFileFor = (key: InstallmentUI["key"]) => async (fList: File[]) => {
    setFiles((prev) => ({ ...prev, [key]: fList }));
    const file = fList?.[0];
    if (!allowOwnerUpload || !file) {
      setSlipCheck((p) => ({ ...p, [key]: {} }));
      return;
    }

    try {
      ensureFile(file);
      setSlipCheck((p) => ({ ...p, [key]: { loading: true, ok: false, error: undefined, fallbackNow: false } }));

      let useFallbackNow = false;
      try {
        const quota = await GetQuota();
        const remaining = Number(quota?.data?.remaining ?? quota?.remaining ?? quota?.quota ?? -1);
        const expired = Boolean(quota?.data?.expired ?? quota?.expired ?? false);
        if (remaining <= 0 || expired) {
          useFallbackNow = true;
        //   setAlerts((a) => [
        //     ...a,
        //     {
        //       type: "warning",
        //       message:
        //         remaining <= 0
        //           ? "Slip-check quota/credits exhausted — using current time instead."
        //           : "Slip-check package expired — using current time instead.",
        //     },
        //   ]);
        }
      } catch {
        useFallbackNow = true;
        setAlerts((a) => [...a, { type: "warning", message: "Unable to verify slip-check quota — using current time instead." }]);
      }

      let ts: string;
      if (!useFallbackNow) {
        ts = await verifySlip(file);
        (file as any).transTimestamp = ts;
        setSlipCheck((p) => ({ ...p, [key]: { loading: false, ok: true, transTs: ts, fallbackNow: false } }));
      } else {
        ts = new Date().toISOString();
        (file as any).transTimestamp = ts;
        setSlipCheck((p) => ({ ...p, [key]: { loading: false, ok: true, transTs: ts, fallbackNow: true } }));
      }
    } catch (err: any) {
      setSlipCheck((p) => ({
        ...p,
        [key]: { loading: false, ok: false, error: err?.message || "Slip verification failed.", fallbackNow: false },
      }));
    }
  };

  // ====== ดึงข้อมูล All Invoice จาก booking ที่ส่งเข้ามา ======
  const invoiceUI = useMemo(() => {
    const data: any = booking || {};
    const selectedPay = pickReceiptPaymentFromBooking(data);
    const statusRaw = statusNameOf(selectedPay);
    const statusKey = paymentStatusKey(statusRaw);
    const vis = statusVisuals[statusKey as keyof typeof statusVisuals] ?? statusVisuals["Pending Payment"];

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

    const receiptPath = asSlipString(selectedPay?.ReceiptPath);
    const fileName = receiptPath ? receiptPath.split("/").pop() : "";
    const invoicePDFPath = invoice?.InvoicePDFPath ?? (data as any).InvoicePDFPath ?? "";

    const isApprovedNow = ["approved", "paid"].includes(lower(statusRaw));

    return {
      statusKey,
      vis,
      invoiceNumber,
      billingPeriod,
      dueDate,
      totalAmount,
      fileName,
      receiptPath,
      invoicePDFPath,
      isApprovedNow,
      paymentId: selectedPay?.ID as number | undefined, // ✅ ใช้กับ upload/remove receipt
    };
  }, [booking]);



  // ====== จัดการ Receipt (Upload/Replace/Remove) ======
  const handleSelectReceipt: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const f = e.target.files?.[0];
    e.currentTarget.value = ""; // reset ให้เลือกไฟล์ซ้ำได้
    if (!f) return;

    if (!RECEIPT_ALLOWED.has(f.type)) {
      setAlerts((a) => [...a, { type: "error", message: "รองรับเฉพาะ PDF/PNG/JPG/WEBP" }]);
      return;
    }
    if (f.size > RECEIPT_MAX_SIZE) {
      setAlerts((a) => [...a, { type: "error", message: "ไฟล์ใหญ่เกิน 10MB" }]);
      return;
    }
    if (!invoiceUI.paymentId) {
      setAlerts((a) => [...a, { type: "error", message: "ไม่พบเลขอ้างอิงการชำระเงิน (paymentId)" }]);
      return;
    }
    if (!onUploadReceipt) {
      setAlerts((a) => [...a, { type: "error", message: "ยังไม่ได้เชื่อมต่อการอัปโหลดใบเสร็จ" }]);
      return;
    }

    try {
      setReceiptUploading(true);
      await onUploadReceipt(f, invoiceUI.paymentId);
      await refreshBooking?.();            // ⬅️ รีเฟรชทันที
      setAlerts((a) => [...a, { type: "success", message: invoiceUI.fileName ? "เปลี่ยนใบเสร็จสำเร็จ" : "อัปโหลดใบเสร็จสำเร็จ" }]);
    } catch (err: any) {
      setAlerts((a) => [...a, { type: "error", message: err?.message || "อัปโหลดใบเสร็จล้มเหลว" }]);
    } finally {
      setReceiptUploading(false);
    }
  };

  const handleRemoveReceipt = async () => {
    if (!invoiceUI.paymentId) return;
    if (!onRemoveReceipt) {
      setAlerts((a) => [...a, { type: "error", message: "ยังไม่ได้เชื่อมต่อการลบใบเสร็จ" }]);
      return;
    }
    try {
      setReceiptUploading(true);
      await onRemoveReceipt(invoiceUI.paymentId);
      await refreshBooking?.();            // ⬅️ รีเฟรชทันที
      setAlerts((a) => [...a, { type: "success", message: "ลบใบเสร็จแล้ว" }]);
    } catch (err: any) {
      setAlerts((a) => [...a, { type: "error", message: err?.message || "ลบใบเสร็จล้มเหลว" }]);
    } finally {
      setReceiptUploading(false);
    }
  };

  const renderInstallment = (inst: InstallmentUI, idx: number, _length: number) => {
    const hasSlip = Boolean(inst.slipPath && inst.slipPath.trim() !== "");
    const url = slipUrl(inst.slipPath);


    // ✅ อนุญาตอัปโหลดเฉพาะ: unpaid, pending_payment
    const ownerUploadableStatuses = new Set(["unpaid", "pending_payment"]);

    // ❌ ไม่อนุญาต Update/Replace ใน pending_verification
    const canUpdate = false;

    const chk = (slipCheck[inst.key] || {}) as SlipCheckState;
    const verified = !!chk.ok && !!chk.transTs;
    const title = planResolved === "full" ? "Full Payment" : inst.key === "deposit" ? "Deposit Payment" : "Balance Payment";

    const checkedLabel = chk.loading
      ? "Verifying slip..."
      : verified
        ? chk.fallbackNow
          ? `Using current time instead • ${new Date(chk.transTs!).toLocaleString()}`
          : `Verified • Transfer time: ${new Date(chk.transTs!).toLocaleString()}`
        : chk.error || "Slip verification failed.";

    return (
      <Grid key={`${inst.key}-${idx}`} size={{ xs: 12, md: plan === "full" ? 12 : 6 }}>
        <Card
          sx={{
            p: 2,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            gap: 1.2,
            position: "relative",
            opacity: inst.locked ? 0.6 : 1,
          }}
        >
          {inst.locked && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(255,255,255,.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                zIndex: 1,
              }}
            >
              <Typography color="text.secondary">Please complete the deposit payment first.</Typography>
            </Box>
          )}

          <Typography fontWeight={700}>{title}</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">Amount</Typography>
              <Typography>
                {typeof inst.amount === "number"
                  ? inst.amount.toLocaleString("th-TH", { style: "currency", currency: "THB" })
                  : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">Due Date</Typography>
              <Typography>{inst.dueDate ? dateFormat(inst.dueDate) : "—"}</Typography>
            </Box>
          </Box>

          <Stepper activeStep={getStepIndex(inst.status)} alternativeLabel sx={{ my: 1 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Slip area */}
          <Box
            sx={{
              mt: 1,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              minHeight: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 1.5,
            }}
          >
            {hasSlip ? (
              <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2, width: "100%" }}>
                {/* Current slip display */}
                {!replaceMode ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    {isImgUrl(url) ? (
                      <CardMedia
                        component="img"
                        image={url}
                        onClick={() => openViewer(url)}
                        sx={{ borderRadius: 2, maxHeight: 200, objectFit: "contain", cursor: "zoom-in" }}
                      />
                    ) : (
                      <Button variant="outlined" onClick={() => openViewer(url)}>
                        Open attached slip
                      </Button>
                    )}

                    {/* Replace ได้เฉพาะตอนถูก Reject เท่านั้น */}
                    {canUpdate && (
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => setReplaceMode(true)}
                        sx={{ mt: 1 }}
                        disabled={inst.locked}
                      >
                        Replace Slip
                      </Button>
                    )}
                  </Box>
                ) : (
                  /* Replace mode */
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, width: "100%" }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Upload new slip
                    </Typography>

                    {files[inst.key]?.[0] && (
                      <Typography variant="body2" color="text.secondary">
                        {checkedLabel}
                      </Typography>
                    )}

                    <ImageUploader
                      value={files[inst.key]}
                      onChange={setFileFor(inst.key)}
                      setAlerts={setAlerts}
                      maxFiles={1}
                      buttonText={files[inst.key]?.[0] ? "Change Selected File" : "Select New Slip"}
                    />

                    <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                      <Button
                        variant="outlinedGray"
                        size="small"
                        onClick={() => {
                          setReplaceMode(false);
                          setFileFor(inst.key)([]); // clear selected file
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : !inst.locked ? (
              allowOwnerUpload ? (
                /* No slip - show upload interface (เฉพาะ Owner + จากหน้า My) */
                files[inst.key]?.[0] ? (
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {checkedLabel}
                    </Typography>
                    <ImageUploader
                      value={files[inst.key]}
                      onChange={setFileFor(inst.key)}
                      setAlerts={setAlerts}
                      maxFiles={1}
                      buttonText="Change Slip"
                    />
                  </Box>
                ) : (
                  <ImageUploader
                    value={files[inst.key]}
                    onChange={setFileFor(inst.key)}
                    setAlerts={setAlerts}
                    maxFiles={1}
                    buttonText="Upload Slip"
                  />
                )
              ) : (
                // ไม่ใช่เจ้าของ หรือเปิดมาจากหน้า All: แสดงแบบอ่านอย่างเดียว
                <Typography variant="body2" color="text.secondary">
                  Only the booking owner can upload a slip, and only from the “My bookings” page.
                </Typography>
              )
            ) : (
              <Typography variant="body2" color="text.secondary">
                No slip uploaded yet.
              </Typography>
            )
            }
          </Box>


          {/* Actions */}
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            {allowOwnerUpload && !inst.locked && (
              ownerUploadableStatuses.has(norm(inst.status)) && !hasSlip ? (
                <Button
                  variant="contained"
                  onClick={async () => {
                    try {
                      const file = files[inst.key]?.[0];
                      await onUploadFor?.(inst.key, file as File, inst.paymentId);
                      setAlerts((a) => [...a, { type: "success", message: "ส่งสลิปสำเร็จ" }]);
                      resetLocalStates();            // ⬅️ ล้างไฟล์/สถานะชั่วคราว
                      await refreshBooking?.();      // ⬅️ รีเฟรชข้อมูลสด
                    } catch (err: any) {
                      setAlerts((a) => [...a, { type: "error", message: err?.message || "ส่งสลิปล้มเหลว" }]);
                    }
                  }}
                  disabled={isLoading || !files[inst.key]?.[0] || !slipCheck[inst.key]?.ok}
                  fullWidth
                >
                  Submit Slip
                </Button>
              ) : null
            )}

            {canShowAdminActions(isAdmin, inst.status, !!inst.slipPath) && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={async () => {
                    try {
                      await onApproveFor?.(inst.key, inst.paymentId);
                      await refreshBooking?.();    // ⬅️ รีเฟรชทันที
                      setAlerts((a) => [...a, { type: "success", message: "อนุมัติการชำระเงินแล้ว" }]);
                    } catch (err: any) {
                      setAlerts((a) => [...a, { type: "error", message: err?.message || "อนุมัติไม่สำเร็จ" }]);
                    }
                  }}
                  disabled={isLoading}
                  fullWidth
                >
                  Approve
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={async () => {
                    try {
                      await onRejectFor?.(inst.key, inst.paymentId);
                      // เคลียร์สถานะ UI ให้กลับไปโหมดอัปโหลดใหม่
                      resetLocalStates();
                      // ขอข้อมูลล่าสุดจากเซิร์ฟเวอร์ (ที่ตอนนี้เป็น pending_payment + ไม่มีสลิป)
                      await refreshBooking?.();
                      setAlerts((a) => [...a, { type: "success", message: "ปฏิเสธการชำระเงินแล้ว" }]);
                    } catch (err: any) {
                      setAlerts((a) => [...a, { type: "error", message: err?.message || "ปฏิเสธไม่สำเร็จ" }]);
                    }
                  }}
                  disabled={isLoading}
                  fullWidth
                >
                  Reject
                </Button>
              </>
            )}
          </Box>


        </Card>
      </Grid>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
    >
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, color: 'primary.main' }}>
          <Wallet size={22} />
          <Typography variant="h6" fontWeight={700} >
            Payment
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close payment dialog">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ minWidth: 500 }}>
        <Grid container spacing={2}>
          {/* ===== Invoice Overview (ย้ายของจาก All Invoice มาโชว์ที่นี่) ===== */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2 }}>
              <Grid container spacing={1} alignItems="center">
                <Grid size={{ xs: 12, md: 7 }}>
                  <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, width: "100%" }}>
                    <Typography sx={{ fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {invoiceUI.invoiceNumber}
                    </Typography>
                  </Box>

                  {/* <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.6 }}>
                    <Calendar size={14} style={{ minHeight: 14, minWidth: 14 }} />
                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {`Billing Period: ${invoiceUI.billingPeriod}`}
                    </Typography>
                  </Box> */}

                  <Box sx={{ color: "text.secondary", display: "flex", alignItems: "center", gap: 0.6, my: 0.6 }}>
                    <Clock size={14} style={{ minHeight: 14, minWidth: 14 }} />
                    <Typography sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {`Due Date: ${invoiceUI.dueDate}`}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1.2 }}>
                    <Typography sx={{ fontSize: 14, color: "text.secondary" }}>Total Amount</Typography>
                    <Typography sx={{ fontSize: 16, fontWeight: 600 }}>{invoiceUI.totalAmount}</Typography>
                  </Box>
                </Grid>

                {/* <Grid size={{ xs: 12, md: 5 }}>
                  <Box
                    sx={{
                      bgcolor: invoiceUI.vis.lite,
                      borderRadius: 10,
                      px: 1.5,
                      py: 0.8,
                      display: "flex",
                      gap: 1,
                      color: invoiceUI.vis.color,
                      alignItems: "center",
                      justifyContent: "center",
                      width: "100%",
                    }}
                  >
                    {React.createElement(invoiceUI.vis.icon, { size: 16 })}
                    <Typography sx={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%" }}>
                      {invoiceUI.vis.label}
                    </Typography>
                  </Box>
                </Grid> */}

                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1.2 }} />

                  {/* ===== Receipt & PDF rows: unified look & feel ===== */}
                  <Grid container spacing={1.2}>
                    {/* === Small helpers (ในสโคปนี้ได้เลย) === */}
                    {(() => {
                      const fileNameFromPath = (p?: string) => (p ? p.split("/").pop() || "" : "");
                      const StatusHeader = ({
                        ok,
                        labelWhenOk,
                        labelWhenNo,
                      }: {
                        ok: boolean;
                        labelWhenOk: string;
                        labelWhenNo: string;
                      }) => (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.6 }}>
                          {ok ? <CheckCircle2 size={18} color="#2e7d32" /> : <AlertCircle size={18} color="#d32f2f" />}
                          <Typography sx={{ fontWeight: 700 }}>
                            {ok ? labelWhenOk : labelWhenNo}
                          </Typography>
                        </Box>
                      );

                      const FilePill = ({
                        label,
                        onClick,
                      }: {
                        label: string;
                        onClick?: () => void;
                      }) => (
                        <Box
                          onClick={onClick}
                          sx={{
                            display: "inline-flex",
                            gap: 1,
                            border: "1px solid rgba(109,110,112,0.4)",
                            borderRadius: 1,
                            px: 1,
                            py: 0.5,
                            cursor: onClick ? "pointer" : "default",
                            transition: "all .3s",
                            alignItems: "center",
                            "&:hover": onClick ? { color: "primary.main", borderColor: "primary.main" } : undefined,
                            minWidth: 0,
                            maxWidth: "100%",
                          }}
                        >
                          <FileText size={16} />
                          <Typography
                            variant="body1"
                            sx={{ fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 240 }}
                            title={label}
                          >
                            {label}
                          </Typography>
                        </Box>
                      );

                      const receiptFileName = invoiceUI.fileName || fileNameFromPath(invoiceUI.receiptPath);
                      const invoicePdfName = fileNameFromPath(invoiceUI.invoicePDFPath);

                      return (
                        <>
                          {/* ===== Receipt ===== */}
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined" sx={{ p: 1.2, display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
                              <StatusHeader
                                ok={!!receiptFileName}
                                labelWhenOk="Receipt (Attached)"
                                labelWhenNo="Receipt (Not attached)"
                              />

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                                {receiptFileName ? (
                                  <FilePill
                                    label={receiptFileName}
                                    onClick={() => invoiceUI.receiptPath && window.open(`${apiUrl}/${invoiceUI.receiptPath}`, "_blank")}
                                  />
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No file uploaded
                                  </Typography>
                                )}

                                {/* Hidden input สำหรับอัปโหลดใบเสร็จ */}
                                <input
                                  ref={receiptInputRef}
                                  type="file"
                                  accept=".pdf,image/*"
                                  hidden
                                  onChange={handleSelectReceipt}
                                />

                                {/* ปุ่ม Upload/Replace/Remove (เฉพาะแอดมิน) */}
                                {isAdmin && (
                                  <>
                                    <Button
                                      variant="contained"
                                      startIcon={<Upload size={16} />}
                                      onClick={() => receiptInputRef.current?.click()}
                                      disabled={receiptUploading}
                                    >
                                      {receiptFileName ? "Replace Receipt" : "Upload Receipt"}
                                    </Button>
                                    {receiptFileName && onRemoveReceipt && (
                                      <Button
                                        variant="outlinedGray"
                                        color="error"
                                        startIcon={<Trash2 size={14} />}
                                        onClick={handleRemoveReceipt}
                                        disabled={receiptUploading}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </>
                                )}
                              </Box>
                            </Card>
                          </Grid>

                          {/* ===== Invoice PDF ===== */}
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Card variant="outlined" sx={{ p: 1.2, display: "flex", flexDirection: "column", gap: 1, height: "100%" }}>
                              <StatusHeader
                                ok={!!invoiceUI.invoicePDFPath}
                                labelWhenOk="Invoice PDF (Available)"
                                labelWhenNo="Invoice PDF (Not available)"
                              />

                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
                                {invoiceUI.invoicePDFPath ? (
                                  <>
                                    {/* แสดงเป็นพิลล์ให้เหมือน Receipt */}
                                    <FilePill
                                      label={invoicePdfName || "invoice.pdf"}
                                      onClick={() => window.open(`${apiUrl}/${invoiceUI.invoicePDFPath}`, "_blank")}
                                    />
                                    <Tooltip title="Download PDF">
                                      <span>
                                        <Button
                                          variant="outlinedGray"
                                          onClick={() => window.open(`${apiUrl}/${invoiceUI.invoicePDFPath}`, "_blank")}
                                        >
                                          <Download size={16} />
                                          <Typography variant="textButtonClassic" className="text-btn" sx={{ ml: 0.5 }}>
                                            Download PDF
                                          </Typography>
                                        </Button>
                                      </span>
                                    </Tooltip>
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    No PDF generated yet
                                  </Typography>
                                )}
                              </Box>
                            </Card>
                          </Grid>
                        </>
                      );
                    })()}
                  </Grid>

                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* ===== Booking Summary เดิม ===== */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700}>
                Booking Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bookingSummary || "—"}
              </Typography>
            </Card>
          </Grid>

          {/* ===== เงื่อนไขการใช้บริการ (มีเดิม) ===== */}
          {serviceConditions && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {serviceConditions.title}
                </Typography>
                {serviceConditions.points.map((p, idx) => (
                  <Typography key={idx} variant="body2" sx={{ color: "text.secondary", ml: 1, mb: 0.5 }}>
                    {p}
                  </Typography>
                ))}
              </Card>
            </Grid>
          )}

          {fullyPaid && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2, border: "1px solid rgba(111,66,193,.35)" }}>
                <Typography sx={{ fontWeight: 600, color: "#6F42C1" }}>
                  Fully paid — awaiting receipt/tax invoice issuance.
                </Typography>
              </Card>
            </Grid>
          )}

          {/* ===== การแบ่งงวด/อัปสลิป เดิม ===== */}
          {list.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  No payment information for this booking yet.
                </Typography>
              </Card>
            </Grid>
          ) : (
            list.map((inst, idx, arr) => renderInstallment(inst, idx, arr.length))
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlinedGray" onClick={onClose} disabled={isLoading}>
          Close
        </Button>
      </DialogActions>

      {/* Fullscreen viewer for slip (image/pdf) */}
      <Dialog
        open={viewer.open}
        onClose={closeViewer}
        fullScreen={fullScreen}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { backgroundColor: "#000" } }}
      >
        <Box sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: fullScreen ? "100vh" : "85vh",
          position: "relative",
          background: "#000"
        }}>
          <IconButton
            onClick={closeViewer}
            sx={{ position: "absolute", top: 8, right: 8, color: "#fff" }}
            aria-label="close viewer"
          >
            <X />
          </IconButton>

          <Box sx={{ position: "absolute", top: 8, right: 56, display: "flex", gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              onClick={() => window.open(viewer.url, "_blank", "noopener,noreferrer")}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            >
              Open
            </Button>
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                const a = document.createElement("a");
                a.href = viewer.url;
                a.download = viewer.url.split("/").pop() || "file";
                document.body.appendChild(a);
                a.click();
                a.remove();
              }}
              sx={{ color: "#fff", borderColor: "rgba(255,255,255,0.5)" }}
            >
              Download
            </Button>
          </Box>

          {isImgUrl(viewer.url) ? (
            <img
              src={viewer.url}
              alt="slip"
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
            />
          ) : isPdfUrl(viewer.url) ? (
            <iframe
              title="pdf"
              src={viewer.url}
              style={{ width: "100%", height: "100%", border: "none", background: "#000" }}
            />
          ) : (
            <Typography color="#fff">Cannot preview this file type.</Typography>
          )}
        </Box>
      </Dialog>

    </Dialog>
  );
};

export default BookingPaymentPopup;
