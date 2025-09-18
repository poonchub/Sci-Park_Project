// pages/BookingReview/BookingReview.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box, Button, Card, Container, Grid, Skeleton, Typography, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField   // << เพิ่ม
} from "@mui/material";

import { useNavigate, useLocation } from "react-router-dom";
import { Base64 } from "js-base64";
import { Calendar, Check, CheckCircle, ChevronLeft, Clock, FileText, MapPin, NotebookText, Settings, User } from "lucide-react";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import { getDisplayStatus } from "../../utils/bookingFlow";
import type { BookingAny } from "../../utils/bookingFlow";


import {
  GetBookingRoomById,
  ApproveBookingRoom,
  RejectBookingRoom,
  CompleteBookingRoom,
  ApprovePayment,
  RejectPayment,
  apiUrl,
} from "../../services/http";
import UploadSlipButton from "../../components/UploadSlipButton/UploadSlipButton";


type StepperPaymentStatus = "pending payment" | "pending verification" | "paid" | "refunded";

/* ---------- Types ---------- */
type BookingLike = {
  ID: number;
  CreatedAt?: string;
  Room?: { RoomNumber?: string | number; Floor?: { Number?: number } };
  BookingDates?: { Date: string }[];
  Merged_time_slots?: { start_time: string; end_time: string }[];
  StatusName?: string;
  Purpose?: string;
  purpose?: string;

  User?: { FirstName?: string; LastName?: string; EmployeeID?: string };

  // ✅ เพิ่มสองบรรทัดนี้
  Approver?: { FirstName?: string; LastName?: string; EmployeeID?: string };
  ConfirmedAt?: string | null;

  Payments?: Array<{
    ID?: number;
    SlipPath?: string;
    ReceiptPath?: string | null;
    Note?: string;
    Amount?: number;
    PaymentDate?: string;
    Status?: { Name?: string };
    Invoice?: { InvoiceType?: string; TotalAmount?: number };
  }>;
  Payment?: {
    id?: number;
    status?:
    | "paid"
    | "unpaid"
    | "refunded"
    | "submitted"
    | "pending verification"
    | "pending payment"
    | "approved"
    | "rejected";
    slipImages?: string[];
    note?: string;
    amount?: number;
    paymentDate?: string;
  };
  AdditionalInfo?: { SetupStyle?: string; Equipment?: string[]; AdditionalNote?: string };
};


type PaymentObj = NonNullable<BookingLike["Payment"]>;

/* ---------- Small helpers ---------- */
const norm = (s?: string) => (s || "").trim().toLowerCase();
// รองรับ string | string[] | { Path?: string }[] | { Path?: string } | undefined
const asSlipString = (sp: any): string => {
  if (!sp) return "";
  if (typeof sp === "string") return sp;
  if (Array.isArray(sp)) {
    const f = sp[0];
    if (!f) return "";
    if (typeof f === "string") return f;
    if (f && typeof f.Path === "string") return f.Path;
    if (f && typeof f.path === "string") return f.path;
  }
  if (typeof sp === "object") {
    if (typeof (sp as any).Path === "string") return (sp as any).Path;
    if (typeof (sp as any).path === "string") return (sp as any).path;
    if (typeof (sp as any).url === "string") return (sp as any).url;
  }
  return "";
};

const normalizePath = (p: string) => p.replace(/\\/g, "/").replace(/^\/+/, "");

// ปลอดภัย: รับ unknown → คืน URL พร้อมโดเมน (หรือ "" ถ้าไม่มี)
const prefixImage = (v: unknown): string => {
  const raw = asSlipString(v);
  if (!raw) return "";
  const clean = normalizePath(String(raw));
  return /^https?:\/\//i.test(clean) ? clean : `${apiUrl}/${clean}`;
};


const statusNameOf = (p?: any): string =>
  typeof p?.Status === "string"
    ? p.Status
    : p?.Status?.StatusName || p?.Status?.Name || p?.status || p?.StatusName || "";



// function toStepperPaymentStatusFromRaw(raw?: string): StepperPaymentStatus {
//   const k = (raw || "").trim().toLowerCase();
//   if (k === "paid" || k === "approved") return "paid";
//   if (k === "refunded") return "refunded";
//   if (k === "pending verification" || k === "submitted") return "pending verification";
//   return "pending payment";
// }


/* ---------- Multi-installments (สำหรับแสดงชิปย่อย) ---------- */
type InstallmentStep = {
  key: string;
  label: string;
  status: StepperPaymentStatus;
  slipCount: number;
  paidCount: number;
  paymentIds: number[];
};

function labelByInvoiceType(t?: string, i?: number) {
  const key = norm(t);
  if (key === "deposit") return "Deposit";
  if (key === "final" || key === "final payment") return "Final Payment";
  if (key === "addon" || key === "add-on") return "Add-on";
  return `Payment #${(i ?? 0) + 1}`;
}


// 👇 ใช้ชนิด element ของอาร์เรย์ที่ไม่เป็น undefined
type PaymentItem = NonNullable<BookingLike["Payments"]>[number];


// ✅ แก้ signature ให้ใช้ PaymentItem แทน
function mapPaymentStatusFromRecord(p?: PaymentItem): StepperPaymentStatus {
  const s = (statusNameOf(p) || "").trim().toLowerCase();

  if (s === "approved" || s === "paid") return "paid";
  if (s === "refunded") return "refunded";
  if (s.includes("pending") || s === "submitted") return "pending verification";

  // กันเคสอัปสลิปแล้วแต่สถานะยังไม่อัปเดต
  const hasSlip = typeof p?.SlipPath === "string" && p.SlipPath.trim() !== "";
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
        key,
        label,
        status: "pending payment",
        slipCount: 0,
        paidCount: 0,
        paymentIds: [],
      };
    }
    const g = groups[key];

    if (p?.SlipPath) g.slipCount += 1;
    if (st === "paid") g.paidCount += 1;
    g.paymentIds.push(p?.ID || 0);

    // ความเข้มของสถานะ: paid > pending verification > pending payment
    if (st === "paid") g.status = "paid";
    else if (st === "pending verification" && g.status !== "paid") g.status = "pending verification";
  });

  return Object.values(groups);
}

function combineOverallPaymentStatus(installments: InstallmentStep[]): StepperPaymentStatus {
  if (!installments.length) return "pending payment";
  if (installments.some((i) => i.status === "pending verification")) return "pending verification";
  if (installments.some((i) => i.status !== "paid")) return "pending payment";
  return "paid";
}

/* ---------- Badges ---------- */
function PaymentChip({ status }: { status?: StepperPaymentStatus }) {
  const st = (status || "pending payment").toLowerCase() as StepperPaymentStatus;
  const meta =
    st === "paid"
      ? { label: "Paid", color: "#16a34a", bg: "#dcfce7" }
      : st === "refunded"
        ? { label: "Refunded", color: "#0ea5e9", bg: "#e0f2fe" }
        : st === "pending verification"
          ? { label: "Submitted", color: "#b45309", bg: "#fef3c7" }
          : { label: "Pending Payment", color: "#6b7280", bg: "#f3f4f6" };

  return (
    <Chip
      label={meta.label}
      sx={{ color: meta.color, bgcolor: meta.bg, fontWeight: 700, borderRadius: 2 }}
    />
  );
}

function StatusChip({ displayStatus }: { displayStatus: string }) {
  const cfg = getBookingStatusConfig(displayStatus);
  const Icon = cfg.icon;
  return (
    <Box
      sx={{
        bgcolor: cfg.colorLite,
        color: cfg.color,
        px: 1.5,
        py: 0.5,
        borderRadius: 2,
        display: "inline-flex",
        alignItems: "center",
        gap: 1,
        fontWeight: 700,
      }}
    >
      <Icon size={18} strokeWidth={2} />
      <Typography variant="body2" fontWeight={700}>
        {cfg.label}
      </Typography>
    </Box>
  );
}

/* ---------- Page ---------- */
export default function BookingReview() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const fromSource = new URLSearchParams(search).get("source") || "";

  const encoded = new URLSearchParams(search).get("booking_id") || "";
  const bookingId = Number.isNaN(Number(encoded)) ? Number(Base64.decode(encoded)) : Number(encoded);

  const [booking, setBooking] = useState<BookingLike | null>(null);
  console.log("booking", booking);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<
    { type: "warning" | "error" | "success"; message: string }[]
  >([]);

  const role = localStorage.getItem("role"); // "Admin" | "Manager" | "User"

  const refreshBooking = async () => {
    if (!Number.isFinite(bookingId)) return;
    const raw: BookingLike = await GetBookingRoomById(bookingId);
    console.log("raw", raw);
    setBooking(raw || null);
  };

  const [openReject, setOpenReject] = useState(false);
  const [rejectNote, setRejectNote] = useState("");
  const [rejecting, setRejecting] = useState(false);


  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        await refreshBooking();
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  /* ---------- สถานะหลักของ Booking & Payment (ใช้แบบเดียวกับหน้า All) ---------- */
  const displayStatus = useMemo(
    () => getDisplayStatus((booking as unknown as BookingAny) || ({} as BookingAny)),
    [booking]
  );

  // รวมสถานะงวดการจ่ายให้เป็นคีย์เดียวสำหรับ stepper
  const installments = useMemo(() => buildInstallments(booking || undefined), [booking]);
  const paymentStatusForStepper: StepperPaymentStatus = useMemo(
    () => combineOverallPaymentStatus(installments),
    [installments]
  );

  // สถานะใบเสร็จ (Awaiting Receipt): อนุมัติแล้ว แต่ยังไม่มี ReceiptPath ในงวดใดงวดหนึ่ง
  const awaitingReceipt = useMemo(() => {
    const pays = booking?.Payments || [];
    const approved = pays.filter((p) => {
      const v = norm(statusNameOf(p));
      return v === "approved" || v === "paid";
    });
    return approved.length > 0 && approved.some((p) => !p.ReceiptPath);
  }, [booking]);


  // Summary ของ payment ล่าสุด (เพื่อแสดงรายละเอียด)
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
      slipImages: latest?.SlipPath ? [latest.SlipPath] : [],
      note: latest?.Note,
      amount: latest?.Amount,
      paymentDate: latest?.PaymentDate,
    };

  }, [booking]);


  // สลิปที่จะโชว์ (รวมจากทั้งหมด ถ้าอยากโชว์หลายรูป)
  const slipImagesInline: string[] = useMemo(() => {
    const pays = booking?.Payments || [];
    return pays
      .map((p) => prefixImage(p?.SlipPath))
      .filter((u): u is string => !!u);
  }, [booking]);


  const nextActionLabel = useMemo(() => {
    // ใช้ displayStatus เพื่อบอกปุ่มหลัก
    if (displayStatus === "pending") return "Approve";
    if (displayStatus === "payment review") return "Review Payment";
    if (displayStatus === "payment") return "Finish Booking";
    return null;
  }, [displayStatus]);

  const isPaymentReview = displayStatus === "payment review";
  const isAdminRole = role === "Admin" || role === "Manager";

  const handleBack = () => navigate(-1);

  const handleNextAction = async (
    key: "approve" | "reject" | "approvePayment" | "rejectPayment" | "complete"
  ) => {
    try {
      switch (key) {
        case "approve":
          await ApproveBookingRoom(bookingId);
          setAlerts((p) => [...p, { type: "success", message: "Approved booking" }]);
          break;
        case "reject":
          setOpenReject(true);   // เปิด dialog ให้กรอกเหตุผล
          return;                // จบที่นี่ก่อน ยังไม่ยิง API
          break;
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
      }
      await refreshBooking();
    } catch {
      setAlerts((p) => [...p, { type: "error", message: `Action ${key} failed` }]);
    }
  };

  const confirmReject = async () => {
    const n = rejectNote.trim();
    if (!n) {
      setAlerts((p) => [...p, { type: "warning", message: "กรุณาระบุเหตุผลการปฏิเสธ" }]);
      return;
    }
    try {
      setRejecting(true);
      await RejectBookingRoom(bookingId, n);   // ส่ง note จริง
      setAlerts((p) => [...p, { type: "warning", message: "Booking rejected" }]);
      await refreshBooking();
    } catch {
      setAlerts((p) => [...p, { type: "error", message: "Reject failed" }]);
    } finally {
      setRejecting(false);
      setOpenReject(false);
      setRejectNote("");
    }
  };


  // ---------- UI ----------
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
        <Typography variant="h6" fontWeight={700}>
          Booking not found
        </Typography>
        <Button sx={{ mt: 2 }} onClick={handleBack} variant="outlined">
          <ChevronLeft size={18} />
          <Typography sx={{ ml: 0.5 }}>Back</Typography>
        </Button>
      </Container>
    );
  }

  // เงื่อนไขแสดงปุ่ม Upload/Reupload สำหรับ Owner (จากหน้า my)
  const canOwnerUploadOrUpdate =
    fromSource === "my" &&
    ["pending payment", "unpaid", "rejected", "pending verification"].includes(
      (paymentSummary?.status || "").toLowerCase()
    );

  return (
    <Box className="booking-review-page">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <Container maxWidth="xl" sx={{ padding: "0px 0px !important" }}>
        <Grid container spacing={3}>
          {/* Header */}
          <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
            <NotebookText size={26} />
            <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
              Booking Review
            </Typography>
          </Grid>
          <Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
            <Box>
              <Button variant="outlined" onClick={handleBack}>
                <ChevronLeft size={20} style={{ minWidth: 20, minHeight: 20 }} />
                <Typography variant="textButtonClassic">Back</Typography>
              </Button>
            </Box>
          </Grid>

          {/* Status Bar */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: "auto" }} display="flex" gap={1} alignItems="center">
                  <StatusChip displayStatus={displayStatus} />
                  <PaymentChip status={paymentStatusForStepper} />
                  {awaitingReceipt && (
                    <Chip
                      label="Awaiting Receipt"
                      sx={{ bgcolor: "#f0f9ff", color: "#0369a1", fontWeight: 700, borderRadius: 2 }}
                    />
                  )}
                </Grid>
                <Grid size={{ xs: 12 }}>
                  {/* ใช้ displayStatus เป็นแกน + สถานะจ่ายรวมสำหรับเลื่อนขั้น */}
                  <BookingStepper statusName={displayStatus} paymentStatus={paymentStatusForStepper} />

                  {/* แสดงสถานะของแต่ละงวด */}
                  {installments.length > 0 && (
                    <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {installments.map((it) => {
                        const color =
                          it.status === "paid"
                            ? { fg: "#16a34a", bg: "#dcfce7" }
                            : it.status === "refunded"
                              ? { fg: "#0ea5e9", bg: "#e0f2fe" }
                              : it.status === "pending verification"
                                ? { fg: "#b45309", bg: "#fef3c7" }
                                : { fg: "#6b7280", bg: "#f3f4f6" };
                        return (
                          <Chip
                            key={it.key}
                            label={`${it.label}: ${it.status}`}
                            sx={{ bgcolor: color.bg, color: color.fg, fontWeight: 700, borderRadius: 2 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                </Grid>
                <Grid size={{ xs: 12, md: "auto" }}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {dateFormat(booking.CreatedAt || "")}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>



          {/* LEFT: Booking Details */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Header */}


            {/* Room Location */}
            <Box sx={{
              px: 4,
              py: 2.5,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mb: 3,
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>
                  <MapPin size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Room Location
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, ml: 5 }}>
                Room {booking.Room?.RoomNumber ?? "—"} • Floor {booking.Room?.Floor?.Number ?? "—"}
              </Typography>
            </Box>

            {/* Date(s) */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mb: 3,
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>
                  <Calendar size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Date(s)
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, ml: 5 }}>
                {booking.BookingDates?.length
                  ? booking.BookingDates.map((d, i) => (
                    <span key={`d-${i}`}>
                      {dateFormat(d.Date)}
                      {i < (booking.BookingDates?.length || 1) - 1 ? ", " : ""}
                    </span>
                  ))
                  : "—"}
              </Typography>
            </Box>

            {/* Time */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mb: 3,
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>
                  <Clock size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Time
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, ml: 5 }}>
                {booking.Merged_time_slots?.length
                  ? `${timeFormat(booking.Merged_time_slots[0].start_time)} - ${timeFormat(
                    booking.Merged_time_slots[booking.Merged_time_slots.length - 1].end_time
                  )} (${booking.Merged_time_slots.length} slot${booking.Merged_time_slots.length > 1 ? "s" : ""})`
                  : "—"}
              </Typography>
            </Box>

            {/* Booker */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mb: 3,
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>
                  <User size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Booker
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, ml: 5 }}>
                {booking.User?.FirstName} {booking.User?.LastName} ({booking.User?.EmployeeID})
              </Typography>
            </Box>

            {/* Purpose */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'primary.main', mr: 2, display: 'flex' }}>
                  <FileText size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Purpose
                </Typography>
              </Box>
              <Typography sx={{ color: 'text.secondary', fontSize: 15, ml: 5 }}>
                {booking.Purpose ?? booking.purpose ?? '—'}
              </Typography>
            </Box>
          </Grid>

          {/* RIGHT: Payment Section */}
          <Grid size={{ xs: 12, md: 6 }}>
            {/* Header */}


            {/* Payment Slip */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              textAlign: 'center',
              mb: 3,
              backgroundColor: 'grey.50',
              minHeight: 300
            }}>
              <Typography fontWeight={600} sx={{
                color: 'text.primary',
                fontSize: 16,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1
              }}>
                <FileText size={18} color="secondary.main" />
                Payment Slip
              </Typography>

              {slipImagesInline.length ? (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: 250
                }}>
                  <img
                    src={slipImagesInline[0]}
                    alt="payment-slip"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: 250,
                  backgroundColor: 'grey.100',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'grey.300'
                }}>
                  <Typography color="text.secondary" sx={{ fontSize: 14 }}>
                    ยังไม่มีสลิป
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Payment Details */}
            <Grid container spacing={2}>
              {/* Approver */}
              <Grid size={6}>
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'grey.200',
                  backgroundColor: 'grey.50',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ color: 'secondary.main', mr: 1.5, display: 'flex' }}>
                      <CheckCircle size={16} />
                    </Box>
                    <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 14 }}>
                      Approver
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13, ml: 3.5 }}>
                    {booking.Approver
                      ? `${booking.Approver.FirstName ?? ''} ${booking.Approver.LastName ?? ''}`
                      : '—'}
                  </Typography>
                </Box>
              </Grid>

              {/* Approved At */}
              <Grid size={6}>
                <Box sx={{
                  p: 2.5,
                  borderRadius: 2,
                  border: 1,
                  borderColor: 'grey.200',
                  backgroundColor: 'grey.50',
                  height: '100%'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ color: 'secondary.main', mr: 1.5, display: 'flex' }}>
                      <Calendar size={16} />
                    </Box>
                    <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 14 }}>
                      Approved At
                    </Typography>
                  </Box>
                  <Typography sx={{ color: 'text.secondary', fontSize: 13, ml: 3.5 }}>
                    {booking.ConfirmedAt
                      ? `${dateFormat(booking.ConfirmedAt)} ${timeFormat(booking.ConfirmedAt)}`
                      : '—'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* Additional Information */}
            <Box sx={{
              p: 3,
              borderRadius: 2,
              border: 1,
              borderColor: 'grey.200',
              mt: 2,
              backgroundColor: 'grey.50'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box sx={{ color: 'secondary.main', mr: 2, display: 'flex' }}>
                  <Settings size={18} />
                </Box>
                <Typography fontWeight={600} sx={{ color: 'text.primary', fontSize: 16 }}>
                  Additional Information
                </Typography>
              </Box>

              <Box sx={{ ml: 5 }}>
                <Box sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
                  <Typography sx={{
                    color: 'text.secondary',
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 100,
                    flexShrink: 0
                  }}>
                    Style layout:
                  </Typography>
                  <Typography sx={{ color: 'text.primary', fontSize: 14, ml: 1 }}>
                    {booking.AdditionalInfo?.SetupStyle || '—'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', mb: 1.5, alignItems: 'flex-start' }}>
                  <Typography sx={{
                    color: 'text.secondary',
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 100,
                    flexShrink: 0
                  }}>
                    Equipment:
                  </Typography>
                  <Typography sx={{ color: 'text.primary', fontSize: 14, ml: 1 }}>
                    {booking.AdditionalInfo?.Equipment?.length
                      ? booking.AdditionalInfo.Equipment.join(', ')
                      : '—'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <Typography sx={{
                    color: 'text.secondary',
                    fontSize: 14,
                    fontWeight: 500,
                    minWidth: 100,
                    flexShrink: 0
                  }}>
                    Note:
                  </Typography>
                  <Typography sx={{ color: 'text.primary', fontSize: 14, ml: 1 }}>
                    {booking.AdditionalInfo?.AdditionalNote || '—'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* ===== Actions Section ===== */}
        {canOwnerUploadOrUpdate ? (
          /* ... ของเดิม (UploadSlipButton) ... */
          <Grid size={{ xs: 12 }} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <UploadSlipButton
                bookingId={booking.ID}
                payerId={Number(localStorage.getItem("userId"))}
                onSuccess={() => {
                  setAlerts((prev) => [...prev, { type: "success", message: "อัปโหลดสลิปสำเร็จ" }]);
                  refreshBooking();
                }}
                onError={() => {
                  setAlerts((prev) => [...prev, { type: "error", message: "อัปโหลดสลิปล้มเหลว" }]);
                }}
              />
            </Box>
          </Grid>
        ) : isPaymentReview && isAdminRole ? (
          /* ... ของเดิม (Approve/Reject Payment) ... */
          <Grid size={{ xs: 12 }} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button
                variant="contained"
                color="error"
                sx={{ minWidth: 140, borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.2 }}
                onClick={() => handleNextAction("rejectPayment")}
                disabled={!paymentSummary?.id}
              >
                Reject Payment
              </Button>
              <Button
                variant="contained"
                color="primary"
                sx={{ minWidth: 160, borderRadius: 2, textTransform: "none", fontWeight: 600, py: 1.2 }}
                onClick={() => handleNextAction("approvePayment")}
                disabled={!paymentSummary?.id}
              >
                Approve Payment
              </Button>
            </Box>
          </Grid>
        ) : (
          <Grid size={{ xs: 12 }} sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
            <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              {displayStatus === "pending" && isAdminRole ? (
                <>
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1.2 }}
                    onClick={() => setOpenReject(true)}    // << เปิด dialog กรอกเหตุผล
                  >
                    Reject
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1.2 }}
                    onClick={() => handleNextAction("approve")}
                  >
                    <Check size={16} />
                    <Typography sx={{ ml: 0.5 }}>Approve</Typography>
                  </Button>
                </>
              ) : (
                nextActionLabel && (
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600, px: 3, py: 1.2 }}
                    onClick={() => {
                      if (displayStatus === "payment") return handleNextAction("complete");
                      if (displayStatus === "payment review") return handleNextAction("approvePayment");
                    }}
                  >
                    <Check size={16} />
                    <Typography sx={{ ml: 0.5 }}>{nextActionLabel}</Typography>
                  </Button>
                )
              )}
            </Box>
          </Grid>
        )}


        <Dialog open={openReject} onClose={() => !rejecting && setOpenReject(false)} fullWidth maxWidth="sm">
          <DialogTitle>Confirm Booking Rejection</DialogTitle>
          <DialogContent dividers>
            <Typography sx={{ mb: 2 }}>
              Reject this booking? This action cannot be undone.
            </Typography>
            <Typography sx={{ mb: 1, fontWeight: 600 }}>Reason</Typography>
            <TextField
              fullWidth
              multiline
              minRows={3}
              placeholder="โปรดระบุเหตุผลการปฏิเสธ..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              disabled={rejecting}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenReject(false)} disabled={rejecting}>Cancel</Button>
            <Button
              variant="contained"
              color="error"
              onClick={confirmReject}
              disabled={rejecting || !rejectNote.trim()}
            >
              {rejecting ? "Processing..." : "Reject"}
            </Button>
          </DialogActions>
        </Dialog>



      </Container>
    </Box>
  );
}
