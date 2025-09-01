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
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { Base64 } from "js-base64";
import { Check, ChevronLeft, NotebookText, X } from "lucide-react";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { getBookingStatusConfig } from "../../constants/bookingStatusConfig";
import BookingStepper from "../../components/BookingStepper/BookingStepper";
import { getDisplayStatus, getNextAction } from "../../utils/bookingFlow";
import { ImageList, ImageListItem } from "@mui/material"; // ถ้าจะแสดงสลิปแบบกริดในหน้ารายละเอียด
import {
  GetBookingRoomById,
  ApproveBookingRoom,
  RejectBookingRoom,
  CompleteBookingRoom,
  ApprovePayment,
  RejectPayment,

} from "../../services/http";
import { CheckCircle } from "@mui/icons-material";
import UploadSlipButton from "../../components/UploadSlipButton/UploadSlipButton";


const bookingStatuses = [
  { ID: 1, Name: "Pending" },
  { ID: 2, Name: "Confirmed" },
  { ID: 3, Name: "Payment" },
  { ID: 4, Name: "Completed" },
  { ID: 5, Name: "Cancelled" }
];
// import { ApproveBooking, RejectBooking } from "../../services/http"; // ไว้ต่อ API จริง

// ---------- MOCK SWITCH ----------
const USE_MOCK = false;

// ---------- Types (ยืดหยุ่นรองรับ mock + ของจริง) ----------
type BookingLike = {
  ID: number;
  CreatedAt?: string;
  Room?: { RoomNumber?: string | number; Floor?: { Number?: number } };
  BookingDates?: { Date: string }[];
  Merged_time_slots?: { start_time: string; end_time: string }[];
  StatusName?: string; // "pending" | "confirmed" | "cancelled" | "completed"
  Purpose?: string;
  purpose?: string;
  User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
  Payment?: {

    id?: number;  // ✅ เพิ่มตรงนี้
    status?: "paid" | "unpaid" | "refunded" | "submitted" | "pending payment" | undefined;
    date?: string;
    method?: string;
    ref?: string;
    slipImages?: string[];


  };

  AdditionalInfo?: { SetupStyle?: string; Equipment?: string[]; AdditionalNote?: string };
};

// ---------- Minimal mocks ----------
const BOOKING_MOCKS: BookingLike[] = [
  {
    ID: 101,
    CreatedAt: "2025-08-25T09:00:00Z",
    Room: { RoomNumber: "A-201", Floor: { Number: 2 } },
    BookingDates: [{ Date: "2025-08-30" }],
    Merged_time_slots: [
      { start_time: "09:00", end_time: "10:00" },
      { start_time: "10:00", end_time: "11:00" },
    ],
    StatusName: "pending",
    Purpose: "Team sync",
    User: { FirstName: "Alice", LastName: "Wong", EmployeeID: "EMP001" },
    Payment: { status: "unpaid" },
    AdditionalInfo: {
      SetupStyle: "U-shape",
      Equipment: ["Projector", "Whiteboard"],
      AdditionalNote: "Need HDMI cable",
    },
  },
  {
    ID: 102,
    CreatedAt: "2025-08-24T13:20:00Z",
    Room: { RoomNumber: "B-305", Floor: { Number: 3 } },
    BookingDates: [{ Date: "2025-08-29" }],
    Merged_time_slots: [{ start_time: "13:00", end_time: "15:00" }],
    StatusName: "confirmed",
    Purpose: "Client meeting",
    User: { FirstName: "Bob", LastName: "Lee", EmployeeID: "EMP002" },
    Payment: { status: "paid", date: "2025-08-24", method: "QR", ref: "PAY-102" },
    AdditionalInfo: { SetupStyle: "Classroom", Equipment: ["TV"] },
  },
  {
    ID: 103,
    CreatedAt: "2025-08-23T08:10:00Z",
    Room: { RoomNumber: "C-101", Floor: { Number: 1 } },
    BookingDates: [{ Date: "2025-08-28" }, { Date: "2025-08-29" }],
    Merged_time_slots: [{ start_time: "14:00", end_time: "17:00" }],
    StatusName: "cancelled",
    Purpose: "Workshop",
    User: { FirstName: "Cara", LastName: "Ng", EmployeeID: "EMP003" },
    Payment: { status: "refunded", date: "2025-08-24", method: "Credit", ref: "PAY-103" },
    AdditionalInfo: { SetupStyle: "Theater", Equipment: ["Mic", "Speakers"] },
  },
  {
    ID: 106,
    CreatedAt: "2025-08-19T09:00:00Z",
    Room: { RoomNumber: "E-402", Floor: { Number: 4 } },
    BookingDates: [{ Date: "2025-08-26" }],
    Merged_time_slots: [{ start_time: "16:00", end_time: "18:00" }],
    StatusName: "completed",
    Purpose: "Board review",
    User: { FirstName: "Frank", LastName: "Lim", EmployeeID: "EMP006" },
    Payment: { status: "paid", date: "2025-08-19", method: "Cash" },
  },
];

const findMockById = (id: number) => BOOKING_MOCKS.find((b) => Number(b.ID) === Number(id)) || null;



// ---------- Stepper logic ----------
const STEPS = ["Requested", "Approved", "Payment", "Completed"] as const;
function getActiveStep(statusName?: string, paymentStatus?: string) {
  const s = (statusName || "").toLowerCase();
  const pay = (paymentStatus || "").toLowerCase();

  if (s === "cancelled") return -1;

  if (s === "pending") return 0;
  if (s === "confirmed") {
    if (pay === "submitted" || pay === "pending verification") return 2; // ⬅ ไป Payment Review
    return 1; // แค่ Approved
  }
  if (s === "completed") return 3;

  if (pay === "paid") return 2;

  return 0;
}


function PaymentChip({ status }: { status?: string }) {
  const st = (status || "unpaid").toLowerCase();
  const meta =
    st === "paid"
      ? { label: "Paid", color: "#16a34a", bg: "#dcfce7" }
      : st === "refunded"
        ? { label: "Refunded", color: "#0ea5e9", bg: "#e0f2fe" }
        : { label: "Unpaid", color: "#ef4444", bg: "#fee2e2" };
  return (
    <Chip label={meta.label} sx={{ color: meta.color, bgcolor: meta.bg, fontWeight: 700, borderRadius: 2 }} />
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
      <Typography variant="body2" fontWeight={700}>{cfg.label}</Typography>
    </Box>
  );
}

// ---------- Page (โครง Maintenance → BookingReview) ----------
export default function BookingReview() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const fromSource = new URLSearchParams(location.search).get("source") || "";

  const encoded = new URLSearchParams(search).get("booking_id") || "";
  let bookingId = NaN;
  try {
    bookingId = Number(Base64.decode(encoded));
  } catch {
    bookingId = Number(encoded);
  }

  const [booking, setBooking] = useState<BookingLike | null>(null);
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<
    { type: "warning" | "error" | "success"; message: string }[]
  >([]);

  const [openApprove, setOpenApprove] = useState(false);
  const [openReject, setOpenReject] = useState(false);
  // const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  // ✅ ตรวจ role
  const role = localStorage.getItem("role"); // "admin", "manager", "user"
  console.log("Role:", role);


  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        if (!Number.isFinite(bookingId)) {
          setBooking(null);
          return;
        }

        const b = await GetBookingRoomById(bookingId);
        console.log("Raw API response:", b);

        // 🔹 เตรียม slipImages จาก array Payments ก่อน
        let slipImages: string[] = [];
        if (b?.Payments?.length) {
          slipImages = b.Payments
            .filter((p: any) => p.SlipPath)
            .map((p: any) =>
              p.SlipPath.startsWith("http")
                ? p.SlipPath
                : `http://localhost:8000${p.SlipPath}`
            );
        }

        // 🔹 สร้าง/แก้ PaymentSummary ให้แน่ใจว่ามี id, status, slipImages
        const firstPay = b?.Payments?.[0];
        b.Payment = {
          id: firstPay?.ID || b?.Payment?.id || 0,
          status:
            b?.Payment?.status ||
            (slipImages.length > 0 ? "submitted" : "unpaid"),
          slipImages: slipImages.length > 0
            ? slipImages
            : (b?.Payment?.slipImages || []),
        };

        console.log("Normalized Payment:", b.Payment);

        setBooking(b);
        console.log("display:", getDisplayStatus(b));
      } finally {
        setLoading(false);
      }
    })();
  }, [bookingId]);



  const statusName = booking?.StatusName || "pending";
  const paymentStatus = booking?.Payment?.status;
  const activeStep = useMemo(() => getActiveStep(statusName, paymentStatus), [statusName, paymentStatus]);
  const isCancelled = statusName.toLowerCase() === "cancelled";
  const next = useMemo(() => booking ? getNextAction(booking) : null, [booking]);
  const PrimaryIcon = next?.icon;


  const refreshBooking = async () => {
    if (booking) {
      const bookingId = booking.ID;
      const updatedBooking = await GetBookingRoomById(bookingId);
      setBooking(updatedBooking);
    }
  };

  // Actions (hook API จริงภายหลัง)
  const handleApprove = async () => {
    setOpenApprove(false);
    try {
      await ApproveBookingRoom(bookingId);
      setAlerts((p) => [...p, { type: "success", message: "Approved booking" }]);
      const b = await GetBookingRoomById(bookingId);
      const refreshed = await GetBookingRoomById(bookingId);
      console.log("Refreshed booking:", refreshed);
      setBooking(b);
    } catch {
      setAlerts((p) => [...p, { type: "error", message: "Approve failed" }]);
    }
  };

  const handleReject = async (note?: string) => {
    setOpenReject(false);
    try {
      await RejectBookingRoom(bookingId, note);
      setAlerts((p) => [...p, { type: "success", message: "Rejected booking" }]);
      const b = await GetBookingRoomById(bookingId);
      setBooking(b);
    } catch {
      setAlerts((p) => [...p, { type: "error", message: "Reject failed" }]);
    }
  };

  const handleBack = () => navigate(-1);

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

  const handleNextAction = async (
    key: "approve" | "reject" | "approvePayment" | "rejectPayment" | "complete" | "payment"
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
          console.log(booking?.Payment);
          if (!booking?.Payment?.id) throw new Error("No payment id");
          await ApprovePayment(booking.Payment.id);
          setAlerts((p) => [...p, { type: "success", message: "Payment approved" }]);
          break;

        case "rejectPayment":
          if (!booking?.Payment?.id) throw new Error("No payment id");
          await RejectPayment(booking.Payment.id);
          setAlerts((p) => [...p, { type: "warning", message: "Payment rejected" }]);
          break;

        case "complete":
          await CompleteBookingRoom(bookingId);
          setAlerts((p) => [...p, { type: "success", message: "Booking marked completed" }]);
          break;
        case "payment":
          return { key: "complete", label: "Complete", icon: CheckCircle }; // << ตรงนี้ต้องมี
      }

      // ✅ refresh booking ทุกครั้งหลัง action
      const refreshed = await GetBookingRoomById(bookingId);
      setBooking(refreshed);

    } catch (err) {
      console.error(err);
      setAlerts((p) => [...p, { type: "error", message: `Action ${key} failed` }]);
    }
  };






  return (
    <Box className="booking-review-page">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <Container maxWidth="xl" sx={{ padding: "0px 0px !important" }}>
        <Grid container spacing={3}>
          {/* Header เหมือน Maintenance */}
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

          {/* แถบสถานะด้านบน (Status + Payment + Stepper) */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2, borderRadius: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid size={{ xs: 12, md: "auto" }} display="flex" gap={1} alignItems="center">
                  <StatusChip statusName={statusName} />
                  <PaymentChip status={paymentStatus} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <BookingStepper statusName={statusName} paymentStatus={paymentStatus} />

                </Grid>
                <Grid size={{ xs: 12, md: "auto" }}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {dateFormat(booking.CreatedAt || "")}
                  </Typography>
                </Grid>
              </Grid>
            </Card>
          </Grid>

          {/* Main Data Card เหมือนฝั่ง Maintenance */}
          <Grid size={{ xs: 12 }}>
            <Card className="data-card" sx={{ width: "100%", borderRadius: 2 }}>
              <CardContent>
                <Grid
                  container
                  spacing={{ xs: 3 }}
                  sx={{
                    px: { xs: 2, md: 6 },
                    py: { xs: 1, md: 4 },
                  }}
                >
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
                          )} (${booking.Merged_time_slots.length} slot${booking.Merged_time_slots.length > 1 ? "s" : ""
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

                  {booking?.Payment?.slipImages?.length ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography fontWeight={600} sx={{ mb: 1 }}>
                        Payment Slip
                      </Typography>

                      {/* แสดงสลิป */}
                      <ImageList cols={2} gap={12} rowHeight={500} sx={{ m: 0 }}>
                        {booking.Payment.slipImages.map((src: string, i: number) => {
                          // ถ้า path เป็น relative → prefix
                          const fullUrl = src.startsWith("http") ? src : `http://localhost:8000${src}`;
                          return (
                            <ImageListItem
                              key={`inline-slip-${i}`}
                              sx={{
                                borderRadius: 2,
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={fullUrl}
                                alt={`slip-${i}`}
                                loading="lazy"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain", // 👈 จะโชว์เต็มรูป ไม่โดนตัด
                                  backgroundColor: "#f9f9f9", // 👈 เติม bg ให้ดูสะอาด
                                  borderRadius: "8px",
                                }}
                              />
                            </ImageListItem>
                          );
                        })}
                      </ImageList>





                    </Box>
                  ) : null}






                  {/* ถ้ามาจาก mybooking → ให้ upload slip */}
                  {fromSource === "my" && booking?.Payment?.status === "pending payment" && !booking?.Payment?.slipImages?.length ? (
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{
                        display: "flex",
                        justifyContent: "flex-end", // 👉 ชิดขวาสุด
                        gap: 2,
                        mt: 2,
                      }}>
                        <UploadSlipButton
                          bookingId={booking.ID}
                          payerId={Number(localStorage.getItem("userId"))}
                          onSuccess={() => {
                            setAlerts((prev) => [...prev, { type: "success", message: "อัปโหลดสลิปสำเร็จ" }]);
                            refreshBooking();
                          }}
                          onError={(err) => {
                            setAlerts((prev) => [...prev, { type: "error", message: "อัปโหลดสลิปล้มเหลว" }]);
                          }}
                        />
                      </Box>
                    </Grid>
                  ) : getDisplayStatus(booking) === "payment review" ? (
                    role === "Admin" || role === "Manager" ? (
                      <Grid size={{ xs: 12 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "flex-end", // 👉 ชิดขวาสุด
                            gap: 2,
                            mt: 2,
                          }}
                        >
                          {/* ปุ่ม Reject */}
                          <Button
                            variant="contained"
                            color="error"
                            sx={{ minWidth: 140 }}
                            onClick={() => handleNextAction("rejectPayment")}
                          >
                            Reject Payment
                          </Button>

                          {/* ปุ่ม Approve */}
                          <Button
                            variant="contained"
                            color="primary"
                            sx={{ minWidth: 160 }}
                            onClick={() => handleNextAction("approvePayment")}
                          >
                            Approve Payment
                          </Button>
                        </Box>
                      </Grid>
                    ) : null   // ❌ ถ้าไม่ใช่ admin/manager → ไม่เห็นปุ่ม
                  ) : (
                    <Grid
                      size={{ xs: 12 }}
                      display="flex"
                      justifyContent="flex-end"
                      gap={1}
                      sx={{ mt: 2 }}
                    >
                      {next && (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => handleNextAction(next.key as "approve" | "approvePayment" | "complete" | "reject" | "rejectPayment" | "payment")}
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





      {/* Dialogs */}
      <ConfirmDialog
        open={openApprove}
        setOpenConfirm={setOpenApprove}
        handleFunction={() => handleApprove()}
        title="Confirm Booking Approval"
        message="Are you sure you want to approve this booking?"
        buttonActive={false}
      />
      <ConfirmDialog
        open={openReject}
        setOpenConfirm={setOpenReject}
        handleFunction={(note) => handleReject(note)}
        title="Confirm Booking Rejection"
        message="Are you sure you want to reject this booking? This action cannot be undone."
        showNoteField
        buttonActive={false}
      />



    </Box>
  );
}
