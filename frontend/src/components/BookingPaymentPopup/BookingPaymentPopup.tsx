import React, { useMemo, useState } from "react";
import {
  Box, Button, Card, CardMedia, Dialog, DialogActions, DialogContent,
  DialogTitle, IconButton, Step, StepLabel, Stepper, Typography, Grid
} from "@mui/material";
import {  Wallet, X } from "lucide-react";
import { apiUrl } from "../../services/http";
import dateFormat from "../../utils/dateFormat";
import ImageUploader from "../ImageUploader/ImageUploader";
import AlertGroup from "../AlertGroup/AlertGroup";
import { CheckSlip } from "../../services/http";


// ===== เพิ่ม util สำหรับตรวจสลิปอัตโนมัติ =====
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"]);
const MAX_SIZE = 5 * 1024 * 1024;

const ensureFile = (file?: File) => {
  if (!file) throw new Error("กรุณาแนบสลิป");
  if (!ALLOWED.has(file.type)) throw new Error("ชนิดไฟล์ไม่ถูกต้อง");
  if (file.size > MAX_SIZE) throw new Error("ไฟล์มีขนาดเกิน 5MB");
};

type SlipCheckState = {
  loading?: boolean;
  ok?: boolean;
  transTs?: string;
  error?: string;
};

// ลองส่ง "files" ก่อน แล้ว fallback เป็น "slip"
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
    try { return await tryOnce("slip"); }
    catch {
      const msg = e1?.response?.data?.error || e1?.message || "Slip check failed";
      const status = e1?.response?.status;
      throw new Error(status ? `${status}: ${msg}` : msg);
    }
  }
};


/* =======================
 * Types
 * ======================= */

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
  locked?: boolean;   // ใช้ล็อกการ์ดยอดคงเหลือจนกว่าจะอนุมัติมัดจำ
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

  bookingSummary?: string;
  serviceConditions?: { title: string; points: string[] };

  onUploadFor?: (key: InstallmentUI["key"], file: File, paymentId?: number) => Promise<void>;
  onUpdateFor?: (key: InstallmentUI["key"], file: File, paymentId?: number) => Promise<void>;
  onApproveFor?: (key: InstallmentUI["key"], paymentId?: number) => Promise<void>;
  onRejectFor?: (key: InstallmentUI["key"], paymentId?: number) => Promise<void>;
}

/* =======================
 * Helpers
 * ======================= */
const steps = ["รอชำระเงิน", "รอตรวจสอบสลิป", "ชำระสำเร็จ"] as const;
const norm = (s?: string) => (s || "").trim().toLowerCase();

const isImage = (url?: string) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".webp"].some((ext) => u.includes(ext));
};

const getStepIndex = (status?: InstallmentUI["status"]) => {
  const s = norm(status);
  if (s === "pending_payment" || s === "unpaid" || s === "overdue") return 0;
  if (s === "pending_verification" || s === "rejected" || s === "submitted") return 1;
  if (s === "approved") return 2;
  return 0;
};

const slipUrl = (path?: string) =>
  !path ? "" : /^https?:\/\//i.test(path) ? path : `${apiUrl}/${path}`;

const ownerUploadableStatuses = new Set([
  "unpaid",
  "pending_payment",
  "pending_verification",
  "rejected",
]);

const canShowAdminActions = (isAdmin?: boolean, status?: InstallmentUI["status"], hasSlip?: boolean) =>
  Boolean(isAdmin && hasSlip && norm(status) === "pending_verification");

// จัดลำดับสำหรับเลย์เอาต์: full = การ์ดเดียว, deposit = ซ้าย(มัดจำ), ขวา(ยอดคงเหลือ)
const orderInstallments = (plan: "full" | "deposit", items?: InstallmentUI[]) => {
  const arr = Array.isArray(items) ? items : [];
  if (plan === "full") return arr.filter((i) => i?.key === "full");
  const dep = arr.find((i) => i?.key === "deposit");
  const bal = arr.find((i) => i?.key === "balance");
  return [dep, bal].filter(Boolean) as InstallmentUI[];
};

/* =======================
 * Component
 * ======================= */
const BookingPaymentPopup: React.FC<BookingPaymentPopupProps> = ({
  open,
  onClose,

  plan = "full",
  installments = [],
  fullyPaid = false,

  isOwner = false,
  isAdmin = false,
  isLoading = false,

  bookingSummary,
  serviceConditions,

  onUploadFor,
  onUpdateFor,
  onApproveFor,
  onRejectFor,
}) => {
  const [alerts, setAlerts] = useState<
    { type: "warning" | "error" | "success"; message: string }[]
  >([]);
  const [files, setFiles] = useState<Record<InstallmentUI["key"], File[]>>({
    full: [], deposit: [], balance: [],
  });
  const [slipCheck, setSlipCheck] = useState<Record<InstallmentUI["key"], SlipCheckState>>({
    full: {}, deposit: {}, balance: {},
  });

  const setFileFor = (key: InstallmentUI["key"]) => async (fList: File[]) => {
    setFiles((prev) => ({ ...prev, [key]: fList }));
    const file = fList?.[0];
    if (!file) {
      setSlipCheck((p) => ({ ...p, [key]: {} }));
      return;
    }
    try {
      ensureFile(file);
      setSlipCheck((p) => ({ ...p, [key]: { loading: true, ok: false, error: undefined } }));
      const ts = await verifySlip(file);                  // 🔍 ตรวจทันที
      (file as any).transTimestamp = ts;                  // ฝังเวลาไว้ในไฟล์
      setSlipCheck((p) => ({ ...p, [key]: { loading: false, ok: true, transTs: ts } }));
    } catch (err: any) {
      setSlipCheck((p) => ({ ...p, [key]: { loading: false, ok: false, error: err?.message || "ตรวจสลิปไม่สำเร็จ" } }));
    }
  };


  const list = useMemo(() => orderInstallments(plan, installments), [plan, installments]);

  const openSlip = (path?: string) => {
    const url = slipUrl(path || "");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  const renderInstallment = (inst: InstallmentUI, idx: number, _length: number) => {
    const hasSlip = Boolean(inst.slipPath && inst.slipPath.trim() !== "");
    const url = slipUrl(inst.slipPath);
    const statusN = norm(inst.status);

    const canUpload = isOwner && !hasSlip && ownerUploadableStatuses.has(statusN);
    const canUpdate = isOwner && hasSlip && (statusN === "pending_verification" || statusN === "rejected");
    const canAdminAct = canShowAdminActions(isAdmin, inst.status, hasSlip);
    // const hasNewFile = (files[inst.key]?.length ?? 0) > 0;

    const file = files[inst.key]?.[0];
    const chk = slipCheck[inst.key] || {};
    const verified = !!chk.ok && !!chk.transTs;


    const title =
      plan === "full"
        ? "ชำระเต็มจำนวน"
        : inst.key === "deposit"
          ? "ชำระมัดจำ"
          : "ชำระยอดคงเหลือ";

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
          {/* ล็อกการ์ดยอดคงเหลือจนกว่าจะอนุมัติมัดจำ */}
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
              <Typography color="text.secondary">โปรดชำระมัดจำให้สำเร็จก่อน</Typography>
            </Box>
          )}

          <Typography fontWeight={700}>{title}</Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">จำนวนเงิน</Typography>
              <Typography>
                {typeof inst.amount === "number"
                  ? inst.amount.toLocaleString("th-TH", { style: "currency", currency: "THB" })
                  : "—"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography color="text.secondary">วันครบกำหนด</Typography>
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

          {/* กล่อง Slip ใหญ่ตามไวร์เฟรม */}
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
              isImage(url) ? (
                <CardMedia
                  component="img"
                  image={url}
                  onClick={() => openSlip(url)}
                  sx={{ borderRadius: 2, maxHeight: 240, objectFit: "contain", cursor: "zoom-in" }}
                />
              ) : (
                <Button variant="outlined" onClick={() => openSlip(url)}>
                  เปิดสลิปที่แนบไว้
                </Button>
              )
            ) : canUpload && !inst.locked ? (
              file ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    {chk.loading ? "กำลังตรวจสลิป..." : verified ? `ตรวจแล้ว • เวลาโอน: ${new Date(chk.transTs!).toLocaleString()}` : (chk.error || "ตรวจสลิปไม่สำเร็จ")}
                  </Typography>
                  <ImageUploader
                    value={files[inst.key]}
                    onChange={setFileFor(inst.key)}   // เปลี่ยนไฟล์ = ตรวจใหม่
                    setAlerts={setAlerts}
                    maxFiles={1}
                    buttonText="เปลี่ยนสลิป"
                  />
                </Box>
              ) : (
                <ImageUploader
                  value={files[inst.key]}
                  onChange={setFileFor(inst.key)}     // อัปโหลด = ตรวจทันที
                  setAlerts={setAlerts}
                  maxFiles={1}
                  buttonText="อัปโหลดสลิป"
                />
              )
            ) : (
              <Typography variant="body2" color="text.secondary">ยังไม่มีการอัปโหลดสลิป</Typography>

            )}
          </Box>

          {/* ปุ่มการทำงานต่อใบ */}
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            {isOwner && !inst.locked && (
              <>
                {canUpdate ? (
                  <Button
                    variant="contained"
                    onClick={() => onUpdateFor?.(inst.key, files[inst.key]?.[0], inst.paymentId)}
                    disabled={isLoading || !file || !verified}
                    fullWidth
                  >
                    อัปเดตสลิป
                  </Button>
                ) : (
                  canUpload && (
                    <Button
                      variant="contained"
                      onClick={() => onUploadFor?.(inst.key, files[inst.key]?.[0], inst.paymentId)}
                      disabled={isLoading || !file || !verified}
                      fullWidth
                    >
                      ส่งสลิป
                    </Button>
                  )
                )}
              </>
            )}

            {canAdminAct && (
              <>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => onApproveFor?.(inst.key, inst.paymentId)}
                  disabled={isLoading}
                  fullWidth
                >
                  อนุมัติ
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => onRejectFor?.(inst.key, inst.paymentId)}
                  disabled={isLoading}
                  fullWidth
                >
                  ปฏิเสธ
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
      maxWidth="lg"           // กว้างขึ้นเพื่อวาง 2 การ์ดข้างกัน
      fullWidth
      slotProps={{ paper: { sx: { borderRadius: 3, overflow: "hidden" } } }}
    >
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Wallet size={22} />
          <Typography variant="h6" fontWeight={700}>Payment</Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="close payment dialog">
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ minWidth: 500 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="h6" fontWeight={700}>รายละเอียดการจอง</Typography>
              <Typography variant="body2" color="text.secondary">{bookingSummary || "—"}</Typography>
            </Card>
          </Grid>

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

          {/* แบนเนอร์ fully paid */}
          {fullyPaid && (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2, bgcolor: "rgba(111,66,193,.10)", border: "1px solid rgba(111,66,193,.35)" }}>
                <Typography sx={{ fontWeight: 600, color: "#6F42C1" }}>
                  ชำระครบแล้ว — รอตรวจสอบออกใบเสร็จ/ใบกำกับภาษี
                </Typography>
              </Card>
            </Grid>
          )}

          {/* การ์ดชำระเงิน: มัดจำซ้าย / คงเหลือขวา (หรือ full การ์ดเดียว) */}
          {list.length === 0 ? (
            <Grid size={{ xs: 12 }}>
              <Card sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  ยังไม่มีข้อมูลการชำระเงินสำหรับการจองนี้
                </Typography>
              </Card>
            </Grid>
          ) : (
            list.map((inst, idx, arr) => renderInstallment(inst, idx, arr.length))
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" onClick={onClose} disabled={isLoading}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BookingPaymentPopup;
