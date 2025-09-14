// pages/BookingReview/BookingReview.tsx
import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Skeleton,
  Typography,
  Chip,
  ImageList,
  ImageListItem,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { Base64 } from "js-base64";
import { Check, ChevronLeft, NotebookText } from "lucide-react";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import { getDisplayStatus, getNextAction } from "../../utils/bookingFlow";
import type { PaymentStatus as StepperPaymentStatus } from "../../components/BookingStepper/BookingStepper";

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

// ---------- Types ----------
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
  Payments?: Array<{
    ID?: number;
    SlipPath?: string;
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
      | "pending payment";
    slipImages?: string[];
    note?: string;
    amount?: number;
    paymentDate?: string;
  };
  AdditionalInfo?: { SetupStyle?: string; Equipment?: string[]; AdditionalNote?: string };
};
type PaymentObj = NonNullable<BookingLike["Payment"]>;
type PaymentStatus = NonNullable<PaymentObj["status"]>;

// ---------- Small helpers ----------
const norm = (s?: string) => (s || "").trim().toLowerCase();
const prefixImage = (url: string) => (url.startsWith("http") ? url : `${apiUrl}/${url}`);

// ✅ แปลงเป็น key สำหรับ “ตัดสินใจปุ่ม”
type LogicKey =
  | "unpaid"
  | "pending_payment"
  | "pending_verification"
  | "rejected"
  | "paid"
  | "refunded";

function toLogicStatus(raw?: string): LogicKey {
  const k = norm(raw);
  if (k === "paid" || k === "approved") return "paid";
  if (k === "refunded") return "refunded";
  if (k === "pending verification" || k === "submitted") return "pending_verification";
  if (k === "rejected") return "rejected";
  if (k === "pending payment" || k === "awaiting payment" || k === "unpaid") return "pending_payment";
  return "unpaid";
}

// ✅ map LogicKey -> StepperPaymentStatus (ที่ Stepper รองรับ)
function toStepperPaymentStatusFromLogic(k: LogicKey): StepperPaymentStatus {
  switch (k) {
    case "paid":
      return "paid";
    case "refunded":
      return "refunded";
    case "pending_verification":
      return "pending verification";
    case "rejected":
    case "pending_payment":
    case "unpaid":
    default:
      return "pending payment";
  }
}

// ---------- Multi-installments ----------
type InstallmentStep = {
  key: string; // 'deposit' | 'final' | 'addon' | 'payment-#1' ...
  label: string; // 'Deposit' | 'Final Payment' | 'Add-on' | 'Payment #1'
  status: StepperPaymentStatus; // ใช้สถานะที่ stepper รองรับ
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

function mapPaymentStatusFromRecord(p?: BookingLike["Payments"][number]): StepperPaymentStatus {
  const s = norm(p?.Status?.Name);
  if (s.includes("approve") || s === "paid") return "paid";
  if (s.includes("pending")) return "pending verification";
  if (s.includes("reject")) return "pending payment";
  if (p?.SlipPath) return "submitted";
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

    // ความเข้มของสถานะ: paid > pending verification/submitted > pending payment
    if (st === "paid") g.status = "paid";
    else if (["pending verification", "submitted"].includes(st) && g.status !== "paid") {
      g.status = st as StepperPaymentStatus;
    }
  });

  return Object.values(groups);
}

function combineOverallPaymentStatus(installments: InstallmentStep[]): StepperPaymentStatus {
  if (!installments.length) return "pending payment";
  if (installments.some((i) => i.status === "pending verification" || i.status === "submitted")) {
    return "submitted";
  }
  if (installments.some((i) => i.status !== "paid")) {
    return "pending payment";
  }
  return "paid";
}

// ---------- Badges ----------
function PaymentChip({ status }: { status?: StepperPaymentStatus }) {
  const st = (status || "pending payment").toLowerCase() as StepperPaymentStatus;
  const meta =
    st === "paid"
      ? { label: "Paid", color: "#16a34a", bg: "#dcfce7" }
      : st === "refunded"
      ? { label: "Refunded", color: "#0ea5e9", bg: "#e0f2fe" }
      : st === "submitted" || st === "pending verification"
      ? { label: "Submitted", color: "#b45309", bg: "#fef3c7" }
      : { label: "Pending Payment", color: "#6b7280", bg: "#f3f4f6" };

  return (
    <Chip
      label={meta.label}
      sx={{ color: meta.color, bgcolor: meta.bg, fontWeight: 700, borderRadius: 2 }}
    />
  );
}

function StatusChip({ statusName }: { statusName?: string }) {
  const key = (statusName || "unknown").toLowerCase();
  const cfg = getBookingStatusConfig(key);
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

// ---------- Normalize booking (สำคัญมาก) ----------
function normalizeBooking(b?: BookingLike | null): BookingLike | null {
  if (!b) return b;

  // เลือก payment ล่าสุด (ตาม index สุดท้าย)
  const latest = b?.Payments?.length ? b.Payments[b.Payments.length - 1] : undefined;

  // รวม slip images: จาก Payments[*].SlipPath ก่อน, ถ้าไม่มีค่อยใช้ Payment.slipImages/SlipPath
  const slipFromArray =
    b?.Payments?.filter((p) => !!p.SlipPath).map((p) => prefixImage(p.SlipPath!)) || [];
  const slipFromSummary =
    (Array.isArray(b?.Payment?.slipImages) && b?.Payment?.slipImages?.length
      ? b?.Payment?.slipImages
      : []) || [];

  // ถ้า summary ไม่มีรูป ให้เอาจาก array
  const slipImages = slipFromSummary.length ? slipFromSummary : slipFromArray;

  // raw status ที่พอหาได้
  const raw =
    b?.Payment?.status ||
    (latest?.Status?.Name?.toLowerCase() as PaymentStatus | undefined) ||
    (slipImages.length ? ("submitted" as PaymentStatus) : ("pending payment" as PaymentStatus));

  // แปลงเป็น logicKey แล้วค่อยแปลงเป็น Stepper key
  const logicKey = toLogicStatus(raw);
  const stepperKey = toStepperPaymentStatusFromLogic(logicKey);

  const note = b?.Payment?.note ?? latest?.Note ?? undefined;
  const amount =
    typeof b?.Payment?.amount === "number"
      ? b.Payment!.amount
      : typeof latest?.Amount === "number"
      ? latest!.Amount
      : undefined;
  const paymentDate = b?.Payment?.paymentDate ?? latest?.PaymentDate ?? undefined;

  b.Payment = {
    id: b?.Payment?.id ?? latest?.ID,
    status: stepperKey as PaymentStatus,
    slipImages,
    note,
    amount,
    paymentDate,
  };

  return b;
}

// ---------- Page ----------
export default function BookingReview() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const fromSource = new URLSearchParams(search).get("source") || "";

  const encoded = new URLSearchParams(search).get("booking_id") || "";
  const bookingId = Number.isNaN(Number(encoded)) ? Number(Base64.decode(encoded)) : Number(encoded);

  const [booking, setBooking] = useState<BookingLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<
    { type: "warning" | "error" | "success"; message: string }[]
  >([]);

  const role = localStorage.getItem("role"); // "Admin" | "Manager" | "User"

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!Number.isFinite(bookingId)) {
          setBooking(null);
          return;
        }
        const raw: BookingLike = await GetBookingRoomById(bookingId);
        console.log("raw", raw);
        setBooking(normalizeBooking(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId, search]);

  const statusName = booking?.StatusName || "pending";

  // ✅ Summary ที่ Normalize แล้ว
  const payment = booking?.Payment ?? {};

  // ✅ งวดการจ่าย + สถานะรวมของการจ่าย (รองรับ deposit/final/add-on)
  const installments = useMemo(() => buildInstallments(booking || undefined), [booking]);
  const overallPaymentStatus: StepperPaymentStatus = useMemo(
    () => combineOverallPaymentStatus(installments),
    [installments]
  );

  // ใช้สถานะรวมไปแสดงใน Stepper
  const paymentStatusForStepper: StepperPaymentStatus = overallPaymentStatus;

  const next = useMemo(() => (booking ? getNextAction(booking) : null), [booking]);

  const refreshBooking = async () => {
    if (!booking) return;
    const updated = await GetBookingRoomById(booking.ID);
    setBooking(normalizeBooking(updated));
  };

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
          await RejectBookingRoom(bookingId, undefined);
          setAlerts((p) => [...p, { type: "warning", message: "Booking rejected" }]);
          break;
        case "approvePayment":
          if (!payment?.id) throw new Error("No payment id");
          await ApprovePayment(payment.id);
          setAlerts((p) => [...p, { type: "success", message: "Payment approved" }]);
          break;
        case "rejectPayment":
          if (!payment?.id) throw new Error("No payment id");
          await RejectPayment(payment.id);
          setAlerts((p) => [...p, { type: "warning", message: "Payment rejected" }]);
          break;
        case "complete":
          await CompleteBookingRoom(bookingId);
          setAlerts((p) => [...p, { type: "success", message: "Booking marked completed" }]);
          break;
      }
      const refreshed = await GetBookingRoomById(bookingId);
      setBooking(normalizeBooking(refreshed));
    } catch {
      setAlerts((p) => [...p, { type: "error", message: `Action ${key} failed` }]);
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
  const logicKey = toLogicStatus(payment?.status);
  const canOwnerUploadOrUpdate =
    fromSource === "my" &&
    ["unpaid", "pending_payment", "rejected", "pending_verification"].includes(logicKey);

  // Admin/Manager แสดง approve/reject payment เมื่ออยู่ช่วง Payment Review
  const isPaymentReview = getDisplayStatus(booking) === "payment review";
  const isAdminRole = role === "Admin" || role === "Manager";

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
                  <StatusChip statusName={statusName} />
                  <PaymentChip status={paymentStatusForStepper} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <BookingStepper statusName={statusName} paymentStatus={paymentStatusForStepper} />
                  {/* แสดงสถานะของแต่ละงวด */}
                  {installments.length > 0 && (
                    <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {installments.map((it) => {
                        const color =
                          it.status === "paid"
                            ? { fg: "#16a34a", bg: "#dcfce7" }
                            : it.status === "refunded"
                            ? { fg: "#0ea5e9", bg: "#e0f2fe" }
                            : it.status === "submitted" || it.status === "pending verification"
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

          {/* Main */}
          <Grid size={{ xs: 12 }}>
            <Card className="data-card" sx={{ width: "100%", borderRadius: 2 }}>
              <CardContent>
                <Grid container spacing={{ xs: 3 }} sx={{ px: { xs: 2, md: 6 }, py: { xs: 1, md: 4 } }}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600 }}>
                      Information
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Room</Typography>
                      <Typography>
                        Room {booking.Room?.RoomNumber ?? "-"} • Floor {booking.Room?.Floor?.Number ?? "-"}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Date(s)</Typography>
                      <Typography>
                        {booking.BookingDates?.length
                          ? booking.BookingDates.map((d, i) => (
                              <span key={`d-${i}`}>
                                {dateFormat(d.Date)}
                                {i < (booking.BookingDates?.length || 1) - 1 ? ", " : ""}
                              </span>
                            ))
                          : "-"}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Time</Typography>
                      <Typography>
                        {booking.Merged_time_slots?.length
                          ? `${timeFormat(booking.Merged_time_slots[0].start_time)} - ${timeFormat(
                              booking.Merged_time_slots[booking.Merged_time_slots.length - 1].end_time
                            )} (${booking.Merged_time_slots.length} slot${
                              booking.Merged_time_slots.length > 1 ? "s" : ""
                            })`
                          : "-"}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Booker</Typography>
                      <Typography>
                        {booking.User?.FirstName} {booking.User?.LastName} ({booking.User?.EmployeeID})
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Purpose</Typography>
                      <Typography>{booking.Purpose ?? booking.purpose ?? "-"}</Typography>
                    </Box>

                    <Box sx={{ mb: 1 }}>
                      <Typography fontWeight={600}>Additional Information</Typography>
                      <Box component="ul" sx={{ pl: 3, mt: 0.5 }}>
                        <li>Style layout: {booking.AdditionalInfo?.SetupStyle || "-"}</li>
                        <li>
                          Equipment:{" "}
                          {booking.AdditionalInfo?.Equipment?.length
                            ? booking.AdditionalInfo.Equipment.join(", ")
                            : "-"}
                        </li>
                        <li>Note: {booking.AdditionalInfo?.AdditionalNote || "-"}</li>
                      </Box>
                    </Box>
                  </Grid>

                  {/* ===== Payment Section ===== */}
                  <Grid size={{ xs: 12 }} sx={{ mt: { xs: 2, md: 3 } }}>
                    <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600, mb: { xs: 1, md: 2 } }}>
                      Payment
                    </Typography>

                    <Grid container spacing={{ xs: 3 }} alignItems="flex-start">
                      {/* Left: Slip */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography fontWeight={600} sx={{ mb: 1 }}>
                          Payment Slip
                        </Typography>

                        {payment?.slipImages?.length ? (
                          <ImageList cols={1} gap={12} rowHeight={420} sx={{ m: 0 }}>
                            {payment.slipImages.map((src: string, i: number) => (
                              <ImageListItem key={`inline-slip-${i}`} sx={{ borderRadius: 2, overflow: "hidden" }}>
                                <img
                                  src={prefixImage(src)}
                                  alt={`slip-${i}`}
                                  loading="lazy"
                                  style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                    borderRadius: "8px",
                                  }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        ) : (
                          <Typography color="text.secondary">ยังไม่มีสลิป</Typography>
                        )}
                      </Grid>

                      {/* Right: Payment details */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography fontWeight={600} sx={{ mb: 1 }}>
                          Payment Details
                        </Typography>

                        <Grid container spacing={{ xs: 2 }}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography color="text.secondary">Amount</Typography>
                            <Typography>
                              {typeof payment?.amount === "number" ? `฿ ${payment.amount.toFixed(2)}` : "-"}
                            </Typography>
                          </Grid>

                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography color="text.secondary">Transfer Date</Typography>
                            <Typography>{payment?.paymentDate ? dateFormat(payment.paymentDate) : "-"}</Typography>
                          </Grid>

                          <Grid size={{ xs: 12 }}>
                            <Typography color="text.secondary">Note</Typography>
                            <Typography sx={{ whiteSpace: "pre-wrap" }}>{payment?.note || "-"}</Typography>
                          </Grid>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* ===== Actions ===== */}
                  {/* Owner (จากหน้า My): อัป/แก้สลิปได้ในสถานะที่กำหนด */}
                  {canOwnerUploadOrUpdate ? (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
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
                    // Admin/Manager: ช่วง Payment Review → แสดง Approve/Reject Payment
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}>
                        <Button
                          variant="contained"
                          color="error"
                          sx={{ minWidth: 140 }}
                          onClick={() => handleNextAction("rejectPayment")}
                          disabled={!payment?.id}
                        >
                          Reject Payment
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ minWidth: 160 }}
                          onClick={() => handleNextAction("approvePayment")}
                          disabled={!payment?.id}
                        >
                          Approve Payment
                        </Button>
                      </Box>
                    </Grid>
                  ) : (
                    // ปุ่มต่อไปตาม flow (approve/reject booking, complete ฯลฯ)
                    <Grid size={{ xs: 12 }} display="flex" justifyContent="flex-end" gap={1} sx={{ mt: 2 }}>
                      {next && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleNextAction(
                              next.key as "approve" | "approvePayment" | "complete" | "reject" | "rejectPayment"
                            )
                          }
                        >
                          <Check size={16} />
                          <Typography sx={{ ml: 0.5 }}>{next.label}</Typography>
                        </Button>
                      )}
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
