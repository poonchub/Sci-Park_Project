// pages/BookingReview/BookingReview.tsx
import { JSX, useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, Chip, Container, Dialog, DialogActions, DialogContent, DialogTitle,
  Grid, Skeleton, TextField, Typography,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Base64 } from "js-base64";
import {
  Calendar, Check, CheckCircle, ChevronLeft, Clock, FileText, MapPin, NotebookText, Settings, User,
} from "lucide-react";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import UploadSlipButton from "../../components/UploadSlipButton/UploadSlipButton";

import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import { getDisplayStatus } from "../../utils/bookingFlow";
import type { BookingAny } from "../../utils/bookingFlow";

import {
  apiUrl,
  ApproveBookingRoom,
  ApprovePayment,
  CompleteBookingRoom,
  GetBookingRoomById,
  RejectBookingRoom,
  RejectPayment,
} from "../../services/http";

/* --------------------------- Types & Helpers --------------------------- */

type StepperPaymentStatus = "pending payment" | "pending verification" | "paid" | "refunded";

type BookingLike = {
  DisplayStatus: string | undefined;
  ID: number;
  CreatedAt?: string;
  Room?: { RoomNumber?: string | number; Floor?: { Number?: number } };
  BookingDates?: { Date: string }[];
  Merged_time_slots?: { start_time: string; end_time: string }[];
  StatusName?: string;
  Purpose?: string; purpose?: string;
  User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
  Approver?: { FirstName?: string; LastName?: string; EmployeeID?: string };
  ConfirmedAt?: string | null;
  AdditionalInfo?: { SetupStyle?: string; Equipment?: string[]; AdditionalNote?: string };
  Payments?: Array<{
    ID?: number;
    SlipPath?: string | string[] | { Path?: string }[];
    ReceiptPath?: string | string[] | { Path?: string }[] | null;
    Note?: string;
    Amount?: number;
    PaymentDate?: string;
    Status?: { Name?: string; StatusName?: string } | string;
    Invoice?: { InvoiceType?: string; TotalAmount?: number };
  }>;
};

type PaymentObj = {
  id?: number;
  status?: "paid" | "unpaid" | "refunded" | "submitted" | "pending verification" | "pending payment" | "approved" | "rejected";
  slipImages?: string[];
  note?: string;
  amount?: number;
  paymentDate?: string;
};

const norm = (s?: string) => (s || "").trim().toLowerCase();
const normalizePath = (p: string) => p.replace(/\\/g, "/").replace(/^\/+/, "");
const asPathStrings = (sp: unknown): string[] => {
  if (!sp) return [];
  if (typeof sp === "string") return [sp];
  if (Array.isArray(sp)) {
    return sp
      .map((v) => {
        if (typeof v === "string") return v;
        if (typeof v === "object" && v) {
          const obj = v as Record<string, unknown>;
          return String(obj.Path || obj.path || obj.url || "");
        }
        return "";
      })
      .filter(Boolean);
  }
  if (typeof sp === "object") {
    const obj = sp as Record<string, unknown>;
    const one = String(obj.Path || obj.path || obj.url || "");
    return one ? [one] : [];
  }
  return [];
};
const prefixImage = (v: unknown): string[] =>
  asPathStrings(v)
    .map((raw) => {
      const clean = normalizePath(String(raw));
      return /^https?:\/\//i.test(clean) ? clean : `${apiUrl}/${clean}`;
    })
    .filter(Boolean);
const statusNameOf = (p?: unknown): string => {
  if (!p) return "";
  const obj = p as any;
  if (typeof obj?.Status === "string") return obj.Status;
  return obj?.Status?.StatusName || obj?.Status?.Name || obj?.status || obj?.StatusName || "";
};

// ===== helpers (วางบนสุดของไฟล์ได้ หรือใน component ก่อน return ก็ได้) =====
const lower = (s?: string) => (s || "").trim().toLowerCase();
const getPayStatusText = (p?: any) =>
  (p?.Status?.StatusName ?? p?.Status ?? p?.StatusName ?? "").toString();

const collectPayments = (b?: any) => {
  const arr: any[] = [];
  if (Array.isArray(b?.Payments)) arr.push(...b.Payments);
  if (b?.Payment) arr.push(b.Payment); // รองรับเคส field เดี่ยว
  return arr;
};

const hasRefunded = (b?: any) =>
  collectPayments(b).some((p) => lower(getPayStatusText(p)) === "refunded");

// แปลงสถานะ payment -> key สำหรับป้าย
const mapPayStatusToChip = (raw?: string): "pending payment" | "pending verification" | "paid" | "refunded" => {
  const v = lower(raw);
  if (v === "approved" || v === "paid") return "paid";
  if (v === "refunded") return "refunded";
  if ( v.includes("pending")) return "pending verification";
  return "pending payment";
};


/* -------------------------- Installment helpers -------------------------- */
type InstallmentStep = {
  key: string;
  label: string;
  status: StepperPaymentStatus;
  slipCount: number;
  paidCount: number;
  paymentIds: number[];
  slips: string[];
  receipts: string[];
  amount?: number;
  lastPaidAt?: string;
};
type PaymentItem = NonNullable<BookingLike["Payments"]>[number];

function labelByInvoiceType(t?: string, i?: number) {
  const key = norm(t);
  if (key === "deposit") return "Deposit";
  if (key === "final" || key === "final payment") return "Final Payment";
  if (key === "addon" || key === "add-on") return "Add-on";
  return `Payment #${(i ?? 0) + 1}`;
}
function mapPaymentStatusFromRecord(p?: PaymentItem): StepperPaymentStatus {
  const s = norm(statusNameOf(p));
  if (s === "approved" || s === "paid") return "paid";
  if (s === "refunded") return "refunded";
  if (s.includes("pending") || s === "submitted") return "pending verification";
  const hasSlip = asPathStrings(p?.SlipPath).length > 0;
  if (hasSlip) return "pending verification";
  return "pending payment";
}
function buildInstallments(booking?: BookingLike): InstallmentStep[] {
  if (!booking?.Payments?.length) return [];
  const groups: Record<string, InstallmentStep> = {};
  booking.Payments.forEach((p, idx) => {
    const type = p?.Invoice?.InvoiceType;
    const key = (type || `payment-${idx + 1}`).toLowerCase();
    const label = labelByInvoiceType(type, idx);
    const st = mapPaymentStatusFromRecord(p);

    if (!groups[key]) {
      groups[key] = {
        key, label, status: "pending payment",
        slipCount: 0, paidCount: 0, paymentIds: [], slips: [], receipts: [],
        amount: undefined, lastPaidAt: undefined,
      };
    }
    const g = groups[key];
    const slips = prefixImage(p?.SlipPath);
    const receipts = prefixImage(p?.ReceiptPath);
    g.slips.push(...slips);
    g.receipts.push(...receipts);
    if (slips.length > 0) g.slipCount += slips.length;
    if (st === "paid") { g.paidCount += 1; g.lastPaidAt = p?.PaymentDate || g.lastPaidAt; }
    if (typeof p?.Amount === "number") g.amount = p.Amount!;
    g.paymentIds.push(p?.ID || 0);
    if (st === "paid") g.status = "paid";
    else if (st === "pending verification" && g.status !== "paid") g.status = "pending verification";
  });
  return Object.values(groups);
}
function combineOverallPaymentStatus(installments: InstallmentStep[]): StepperPaymentStatus {
  if (!installments.length) return "pending payment";
  // ✅ ให้ Refunded มาก่อนเสมอ
  if (installments.some((i) => i.status === "refunded")) return "refunded";
  if (installments.some((i) => i.status === "pending verification")) return "pending verification";
  if (installments.some((i) => i.status !== "paid")) return "pending payment";
  return "paid";
}


/* ------------------------------ UI bits ------------------------------ */

function InfoCard({ icon, title, children }: { icon: JSX.Element; title: string; children: React.ReactNode; }) {
  return (
    <Box sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "grey.200", mb: 3, backgroundColor: "grey.50" }}>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box sx={{ color: "primary.main", mr: 2, display: "flex" }}>{icon}</Box>
        <Typography fontWeight={600} sx={{ color: "text.primary", fontSize: 16 }}>{title}</Typography>
      </Box>
      {children}
    </Box>
  );
}
function PaymentGrid({ installments }: { installments: InstallmentStep[] }) {
  if (!installments.length) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: 250, backgroundColor: "grey.100", borderRadius: 2, border: "2px dashed", borderColor: "grey.300" }}>
        <Typography color="text.secondary" sx={{ fontSize: 14 }}>ยังไม่มีสลิป</Typography>
      </Box>
    );
  }
  const items = installments.slice(0, 2);
  return (
    <Grid container spacing={2}>
      {items.map((it) => {
        const color =
          it.status === "paid" ? { fg: "#16a34a", bg: "#dcfce7" } :
            it.status === "refunded" ? { fg: "#0ea5e9", bg: "#e0f2fe" } :
              it.status === "pending verification" ? { fg: "#b45309", bg: "#fef3c7" } :
                { fg: "#6b7280", bg: "#f3f4f6" };
        return (
          <Grid key={it.key} size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 2.25, borderRadius: 2, borderLeft: `4px solid ${color.fg}`, height: "100%" }}>
              <Typography fontWeight={700} sx={{ mb: 0.5 }}>{it.label}</Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip label={it.status} size="small" sx={{ bgcolor: color.bg, color: color.fg, fontWeight: 700, borderRadius: 2 }} />
                {typeof it.amount === "number" && (
                  <Typography variant="body2" color="text.secondary">• Amount: {it.amount.toLocaleString()} THB</Typography>
                )}
              </Box>
              {it.lastPaidAt && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Paid on: {dateFormat(it.lastPaidAt)} {timeFormat(it.lastPaidAt)}
                </Typography>
              )}
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {(it.slips[0] ? [it.slips[0]] : []).map((u, i) => (
                  <Box key={`${it.key}-slip-${i}`} sx={{ width: 140, height: 140, borderRadius: 1.5, bgcolor: "grey.100", border: 1, borderColor: "grey.200", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <img src={u} alt={`${it.label}-slip`} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </Box>
                ))}
              </Box>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}

/* ----------------------- Action policy (ศูนย์รวม) ----------------------- */

type ActionKey = "approve" | "reject" | "approvePayment" | "rejectPayment" | "complete" | "uploadSlip";
type ActionItem = { key: ActionKey; label: string; color?: "primary" | "error" | "inherit"; disabled?: boolean; };

function computeActions(params: {
  fromSource: string;            // "my" | "all" | ""
  isAdminRole: boolean;          // role === Admin/Manager
  displayStatus: string;         // จาก getDisplayStatus()
  latestPayment?: PaymentObj;    // payment ล่าสุด (สรุป)
  isRefunded?: boolean;          // 👈 เพิ่ม
  isCancelled?: boolean;         // 👈 เพิ่ม
}): ActionItem[] {
  const actions: ActionItem[] = [];

  // 👇 ถ้ารีฟันหรือยกเลิกแล้ว ไม่ต้องมีปุ่มอะไรต่อ
  if (params.isRefunded || params.isCancelled) {
    return actions; // []
  }

  const disp = norm(params.displayStatus);
  const pay = params.latestPayment;
  const payStatus = norm(pay?.status || "");

  // เจ้าของ (จาก "my"): อนุญาตอัปสลิปในสถานะต่อไปนี้
  const canOwnerUpload =
    params.fromSource === "my" &&
    ["pending payment", "unpaid", "rejected", "pending verification"].includes(payStatus);

  if (canOwnerUpload) {
    actions.push({ key: "uploadSlip", label: "Upload / Update Slip", color: "primary" });
  }

  // แอดมิน
  if (params.isAdminRole) {
    if (disp === "pending") {
      actions.push({ key: "reject", label: "Reject", color: "error" });
      actions.push({ key: "approve", label: "Approve", color: "primary" });
    } else if (disp === "payment review") {
      actions.push({ key: "rejectPayment", label: "Reject Payment", color: "error", disabled: !pay?.id });
      actions.push({ key: "approvePayment", label: "Approve Payment", color: "primary", disabled: !pay?.id });
    } else if (disp === "payment") {
      actions.push({ key: "complete", label: "Finish Booking", color: "primary" });
    }
  }

  return actions;
}


/* --------------------------------- Page --------------------------------- */

export default function BookingReview() {
  const navigate = useNavigate();
  const { search } = useLocation();

  const fromSource = new URLSearchParams(search).get("source") || ""; // "my" | "all" | ""
  const encoded = new URLSearchParams(search).get("booking_id") || "";
  const bookingId = Number.isNaN(Number(encoded)) ? Number(Base64.decode(encoded)) : Number(encoded);

  const [booking, setBooking] = useState<BookingLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
  const [openReject, setOpenReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const role = localStorage.getItem("role"); // "Admin" | "Manager" | "User"
  const isAdminRole = role === "Admin" || role === "Manager";

  const refreshBooking = useCallback(async () => {
    if (!Number.isFinite(bookingId)) return;
    const raw: BookingLike = await GetBookingRoomById(bookingId);
    setBooking(raw || null);
  }, [bookingId]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try { await refreshBooking(); } finally { setLoading(false); }
    })();
  }, [refreshBooking]);

  // Derived
  const displayStatus = useMemo(
    () => getDisplayStatus((booking as unknown as BookingAny) || ({} as BookingAny)),
    [booking]
  );
  const installments = useMemo(() => buildInstallments(booking || undefined), [booking]);
  const paymentStatusForStepper: StepperPaymentStatus = useMemo(
    () => combineOverallPaymentStatus(installments),
    [installments]
  );


  // 👇 เพิ่มสองแฟล็กนี้เลย
  const isRefunded = String(paymentStatusForStepper).toLowerCase() === "refunded";
  const isCancelled = String(displayStatus).toLowerCase() === "cancelled";
  const paymentSummary: PaymentObj = useMemo(() => {
    const pays = booking?.Payments || [];
    if (!pays.length) return {};
    const latest = [...pays].sort((a, b) => {
      const ad = new Date(a?.PaymentDate || 0).getTime();
      const bd = new Date(b?.PaymentDate || 0).getTime();
      if (ad && bd && ad !== bd) return bd - ad;
      return (b?.ID || 0) - (a?.ID || 0);
    })[0];
    return {
      id: latest?.ID,
      status: (statusNameOf(latest).toLowerCase() as PaymentObj["status"]) || "pending payment",
      slipImages: asPathStrings(latest?.SlipPath),
      note: latest?.Note,
      amount: latest?.Amount,
      paymentDate: latest?.PaymentDate,
    };
  }, [booking]);

  // Centralized actions
  const actions = useMemo(
    () =>
      computeActions({
        fromSource,
        isAdminRole,
        displayStatus: String(displayStatus),
        latestPayment: paymentSummary,
        isRefunded,
        isCancelled,
      }),
    [fromSource, isAdminRole, displayStatus, paymentSummary, isRefunded, isCancelled]
  );

  // Handlers
  const handleBack = () => navigate(-1);
  const handleAction = useCallback(
    async (key: ActionKey) => {
      try {
        switch (key) {
          case "approve":
            await ApproveBookingRoom(bookingId);
            setAlerts((p) => [...p, { type: "success", message: "Approved booking" }]);
            break;
          case "reject":
            setOpenReject(true);
            return;
          case "approvePayment":
            if (!paymentSummary?.id) throw new Error("No payment id");
            await ApprovePayment(paymentSummary.id);
            setAlerts((p) => [...p, { type: "success", message: "Payment approved" }]);
            break;
          case "rejectPayment":
            if (!paymentSummary?.id) throw new Error("No payment id");
            await RejectPayment(paymentSummary.id);
            setAlerts((p) => [...p, { type: "warning", message: "Payment rejected" }]);
            break;
          case "complete":
            await CompleteBookingRoom(bookingId);
            setAlerts((p) => [...p, { type: "success", message: "Booking marked completed" }]);
            break;
          case "uploadSlip":
            // ปุ่มนี้เรนเดอร์เป็น UploadSlipButton อยู่แล้ว (ด้านล่าง)
            return;
        }
        await refreshBooking();
      } catch {
        setAlerts((p) => [...p, { type: "error", message: `Action ${key} failed` }]);
      }
    },
    [bookingId, paymentSummary?.id, refreshBooking]
  );

  const confirmReject = useCallback(async () => {
    const n = rejectNote.trim();
    if (!n) {
      setAlerts((p) => [...p, { type: "warning", message: "กรุณาระบุเหตุผลการปฏิเสธ" }]);
      return;
    }
    try {
      setRejecting(true);
      await RejectBookingRoom(bookingId, n);
      setAlerts((p) => [...p, { type: "warning", message: "Booking rejected" }]);
      await refreshBooking();
    } catch {
      setAlerts((p) => [...p, { type: "error", message: "Reject failed" }]);
    } finally {
      setRejecting(false);
      setOpenReject(false);
      setRejectNote("");
    }
  }, [bookingId, rejectNote, refreshBooking]);

  /* ------------------------------- UI ------------------------------- */

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={140} sx={{ borderRadius: 2, mb: 2 }} />
        <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 2 }} />
      </Container>
    );
  }
  if (!booking) {
    return (
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Typography variant="h6" fontWeight={700}>Booking not found</Typography>
        <Button sx={{ mt: 2 }} onClick={handleBack} variant="outlined">
          <ChevronLeft size={18} />
          <Typography sx={{ ml: 0.5 }}>Back</Typography>
        </Button>
      </Container>
    );
  }

  // ===== booking chip key (ใช้ StatusName ก่อน ถ้าไม่มีค่อย fallback)
  const bookingStatusKey = String(
    booking?.StatusName ?? booking?.DisplayStatus ?? displayStatus
  ).toLowerCase();

  // ===== payment chip key (อิงจาก payment จริง ๆ )
  const pays = collectPayments(booking);
  let paymentChipKey: "pending payment" | "pending verification" | "paid" | "refunded" = "pending payment";
  if (pays.length) {
    // เลือกตัวท้ายสุดตามเวลา (หรือ ID) เพื่อดูสถานะล่าสุด
    const latest = [...pays].sort((a, b) => {
      const ad = new Date(a?.PaymentDate || 0).getTime();
      const bd = new Date(b?.PaymentDate || 0).getTime();
      if (ad && bd && ad !== bd) return bd - ad;
      return (b?.ID || 0) - (a?.ID || 0);
    })[0];
    paymentChipKey = mapPayStatusToChip(getPayStatusText(latest));
  }

  // ✅ override: ถ้า booking ถูกยกเลิกและมีอย่างน้อย 1 payment = refunded ให้แสดงป้าย Refunded เสมอ
  if (bookingStatusKey === "cancelled" && hasRefunded(booking)) {
    paymentChipKey = "refunded";
  }


  // เดิม
  // const showOwnerUpload = actions.some(a => a.key === "uploadSlip");

  // แก้
  const showOwnerUpload = !isRefunded && !isCancelled && actions.some(a => a.key === "uploadSlip");


  return (
    <Box className="booking-review-page">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <Container maxWidth="xl" sx={{ padding: "0px 0px !important" }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid container className="title-box" direction="row" size={{ xs: 5 }} sx={{ gap: 1 }}>
            <NotebookText size={26} />
            <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
              Booking Review
            </Typography>
          </Grid>
          <Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
            <Button variant="outlined" onClick={handleBack}>
              <ChevronLeft size={20} />
              <Typography variant="textButtonClassic">Back</Typography>
            </Button>
          </Grid>

          {/* Status Bar */}
          {/* Status Bar */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                {/* === Booking / Payment chips === */}
                <Grid size={{ xs: 12, md: "auto" }} display="flex" alignItems="center" gap={1.5}>
                  {/* Booking chip (ใช้ StatusName/DisplayStatus) */}
                  {(() => {
                    const cfg = getBookingStatusConfig(bookingStatusKey); // หรือ bookingStatus[bookingStatusKey] ถ้าใช้ obj map ของคุณ
                    const Icon = cfg.icon;
                    return (
                      <Chip
                        icon={<Icon size={16} />}
                        label={`Booking: ${cfg.label}`}
                        sx={{
                          bgcolor: cfg.colorLite,
                          color: cfg.color,
                          fontWeight: 700,
                          borderRadius: 2,
                          '& .MuiChip-icon': { color: cfg.color },
                        }}
                      />
                    );
                  })()}

                  {/* Payment chip (อิงจาก Payment จริง + override เมื่อ Cancelled + Refunded) */}
                  {(() => {
                    const meta =
                      ({
                        "pending payment": { label: "Pending Payment", fg: "#6b7280", bg: "#f3f4f6" },
                        "pending verification": { label: "pending verification", fg: "#b45309", bg: "#fef3c7" },
                        "paid": { label: "Paid", fg: "#16a34a", bg: "#dcfce7" },
                        "refunded": { label: "Refunded", fg: "#0284c7", bg: "#e0f2fe" },
                      } as const)[paymentChipKey] || { label: "Pending Payment", fg: "#6b7280", bg: "#f3f4f6" };

                    return (
                      <Chip
                        label={`Payment: ${meta.label}`}
                        sx={{ bgcolor: meta.bg, color: meta.fg, fontWeight: 700, borderRadius: 2 }}
                      />
                    );
                  })()}
                </Grid>


                {/* Stepper */}
                <Grid size={{ xs: 12 }}>
                  <BookingStepper
                    statusName={String(displayStatus)}
                    paymentStatus={paymentStatusForStepper}
                  />
                </Grid>

                {/* Created at */}
                <Grid size={{ xs: 12, md: "auto" }}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {dateFormat(booking.CreatedAt || "")}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>



          {/* LEFT */}
          <Grid size={{ xs: 12, md: 6 }}>
            <InfoCard icon={<MapPin size={18} />} title="Room Location">
              <Typography sx={{ color: "text.secondary", fontSize: 15, ml: 5 }}>
                Room {booking.Room?.RoomNumber ?? "—"} • Floor {booking.Room?.Floor?.Number ?? "—"}
              </Typography>
            </InfoCard>

            <InfoCard icon={<Calendar size={18} />} title="Date(s)">
              <Typography sx={{ color: "text.secondary", fontSize: 15, ml: 5 }}>
                {booking.BookingDates?.length
                  ? booking.BookingDates.map((d, i) => (
                    <span key={`d-${i}`}>{dateFormat(d.Date)}{i < (booking.BookingDates?.length || 1) - 1 ? ", " : ""}</span>
                  ))
                  : "—"}
              </Typography>
            </InfoCard>

            <InfoCard icon={<Clock size={18} />} title="Time">
              <Typography sx={{ color: "text.secondary", fontSize: 15, ml: 5 }}>
                {booking.Merged_time_slots?.length
                  ? `${timeFormat(booking.Merged_time_slots[0].start_time)} - ${timeFormat(booking.Merged_time_slots.at(-1)!.end_time)} (${booking.Merged_time_slots.length} slot${booking.Merged_time_slots.length > 1 ? "s" : ""})`
                  : "—"}
              </Typography>
            </InfoCard>

            <InfoCard icon={<User size={18} />} title="Booker">
              <Typography sx={{ color: "text.secondary", fontSize: 15, ml: 5 }}>
                {booking.User?.FirstName} {booking.User?.LastName} ({booking.User?.EmployeeID})
              </Typography>
            </InfoCard>

            <InfoCard icon={<FileText size={18} />} title="Purpose">
              <Typography sx={{ color: "text.secondary", fontSize: 15, ml: 5 }}>
                {booking.Purpose ?? booking.purpose ?? "—"}
              </Typography>
            </InfoCard>
          </Grid>

          {/* RIGHT */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "grey.200", textAlign: "left", mb: 3, backgroundColor: "grey.50", minHeight: 300 }}>
              <Typography fontWeight={600} sx={{ color: "text.primary", fontSize: 16, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                <FileText size={18} color="secondary.main" />
                Payment
              </Typography>
              <PaymentGrid installments={installments} />
            </Box>

            {/* Approver / Approved At */}
            <Grid container spacing={2}>
              <Grid size={6}>
                <Box sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: "grey.200", backgroundColor: "grey.50", height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: "secondary.main", mr: 1.5, display: "flex" }}><CheckCircle size={16} /></Box>
                    <Typography fontWeight={600} sx={{ color: "text.primary", fontSize: 14 }}>Approver</Typography>
                  </Box>
                  <Typography sx={{ color: "text.secondary", fontSize: 13, ml: 3.5 }}>
                    {booking.Approver ? `${booking.Approver.FirstName ?? ""} ${booking.Approver.LastName ?? ""}` : "—"}
                  </Typography>
                </Box>
              </Grid>
              <Grid size={6}>
                <Box sx={{ p: 2.5, borderRadius: 2, border: 1, borderColor: "grey.200", backgroundColor: "grey.50", height: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
                    <Box sx={{ color: "secondary.main", mr: 1.5, display: "flex" }}><Calendar size={16} /></Box>
                    <Typography fontWeight={600} sx={{ color: "text.primary", fontSize: 14 }}>Approved At</Typography>
                  </Box>
                  <Typography sx={{ color: "text.secondary", fontSize: 13, ml: 3.5 }}>
                    {booking.ConfirmedAt ? `${dateFormat(booking.ConfirmedAt)} ${timeFormat(booking.ConfirmedAt)}` : "—"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Additional Info */}
            <Box sx={{ p: 3, borderRadius: 2, border: 1, borderColor: "grey.200", mt: 2, backgroundColor: "grey.50" }}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box sx={{ color: "secondary.main", mr: 2, display: "flex" }}><Settings size={18} /></Box>
                <Typography fontWeight={600} sx={{ color: "text.primary", fontSize: 16 }}>Additional Information</Typography>
              </Box>
              <Box sx={{ ml: 5 }}>
                <Box sx={{ display: "flex", mb: 1.5, alignItems: "flex-start" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, fontWeight: 500, minWidth: 100, flexShrink: 0 }}>Style layout:</Typography>
                  <Typography sx={{ color: "text.primary", fontSize: 14, ml: 1 }}>{booking.AdditionalInfo?.SetupStyle || "—"}</Typography>
                </Box>
                <Box sx={{ display: "flex", mb: 1.5, alignItems: "flex-start" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, fontWeight: 500, minWidth: 100, flexShrink: 0 }}>Equipment:</Typography>
                  <Typography sx={{ color: "text.primary", fontSize: 14, ml: 1 }}>
                    {booking.AdditionalInfo?.Equipment?.length ? booking.AdditionalInfo.Equipment.join(", ") : "—"}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                  <Typography sx={{ color: "text.secondary", fontSize: 14, fontWeight: 500, minWidth: 100, flexShrink: 0 }}>Note:</Typography>
                  <Typography sx={{ color: "text.primary", fontSize: 14, ml: 1 }}>{booking.AdditionalInfo?.AdditionalNote || "—"}</Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ===== Actions Section (รวมทุกเงื่อนไขไว้แล้ว) ===== */}
        {/* ===== Actions Section (รวมทุกเงื่อนไขไว้แล้ว) ===== */}
        <Grid size={{ xs: 12 }} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: "grey.200" }}>
          {/* 👇 ถ้ารีฟันหรือยกเลิกแล้ว ไม่เรนเดอร์ปุ่มใด ๆ เลย */}
          {(isRefunded || isCancelled) ? null : (
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, flexWrap: "wrap" }}>
              {showOwnerUpload && (
                <UploadSlipButton
                  bookingId={booking.ID}
                  payerId={Number(localStorage.getItem("userId"))}
                  onSuccess={() => { setAlerts((prev) => [...prev, { type: "success", message: "อัปโหลดสลิปสำเร็จ" }]); refreshBooking(); }}
                  onError={() => { setAlerts((prev) => [...prev, { type: "error", message: "อัปโหลดสลิปล้มเหลว" }]); }}
                />
              )}

              {actions
                .filter(a => a.key !== "uploadSlip")
                .map((a) => (
                  <Button
                    key={a.key}
                    variant={a.key === "reject" || a.key === "rejectPayment" ? "outlined" : "contained"}
                    color={a.color || "primary"}
                    disabled={a.disabled}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1.2 }}
                    onClick={() => (a.key === "reject" ? setOpenReject(true) : handleAction(a.key))}
                  >
                    {(a.key === "approve" || a.key === "approvePayment" || a.key === "complete") && <Check size={16} />}
                    <Typography sx={{ ml: (a.key === "approve" || a.key === "approvePayment" || a.key === "complete") ? 0.5 : 0 }}>
                      {a.label}
                    </Typography>
                  </Button>
                ))}
            </Box>
          )}
        </Grid>


        {/* Reject dialog */}
        <Dialog open={openReject} onClose={() => !rejecting && setOpenReject(false)} fullWidth maxWidth="sm">
          <DialogTitle>Confirm Booking Rejection</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 2 }}>Reject this booking? This action cannot be undone.</Typography>
            <Typography sx={{ mb: 1, fontWeight: 600 }}>Reason</Typography>
            <TextField
              fullWidth multiline minRows={3} placeholder="โปรดระบุเหตุผลการปฏิเสธ..."
              value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} disabled={rejecting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReject(false)} disabled={rejecting}>Cancel</Button>
            <Button variant="contained" color="error" onClick={confirmReject} disabled={rejecting || !rejectNote.trim()}>
              {rejecting ? "Processing..." : "Reject"}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
