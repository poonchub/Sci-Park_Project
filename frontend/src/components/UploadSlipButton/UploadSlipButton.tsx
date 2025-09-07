// components/UploadSlipButton.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputAdornment,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField"; // ถ้าอยากใช้ของ MUI แท้: import { TextField } from "@mui/material"
import dayjs from "dayjs";
import type { AxiosProgressEvent } from "axios";
import { SubmitPaymentSlip } from "../../services/http";
import {
  Upload as UploadIcon,
  RefreshCw,
  Image as ImageIcon,
  Calendar,
  FileText,
} from "lucide-react";

interface UploadSlipButtonProps {
  bookingId: number;
  payerId: number;
  defaultAmount?: number;
  onSuccess?: (res: any) => void;
  onError?: (err: any) => void;
}

export default function UploadSlipButton({
  bookingId,
  payerId,
  defaultAmount = 0,
  onSuccess,
  onError,
}: UploadSlipButtonProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // --- amount: คุมด้วย string เพื่อพิมพ์ 0 / 0. / 0.12 ได้ตามใจ ---
  const [amountStr, setAmountStr] = useState<string>(
    defaultAmount > 0 ? String(defaultAmount) : ""
  );
  const parsedAmount = Math.max(
    0,
    parseFloat((amountStr || "0").replace(",", ".")) || 0
  );

  const [paymentDateLocal, setPaymentDateLocal] = useState<string>(
    dayjs().format("YYYY-MM-DDTHH:mm")
  );
  const [note, setNote] = useState<string>("");

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const hiddenFileInputRef = useRef<HTMLInputElement | null>(null);

  const isValid = useMemo(() => !!file && parsedAmount > 0, [file, parsedAmount]);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ---------- handlers ----------
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(",", ".");   // รองรับคอมมา
    v = v.replace(/[^\d.]/g, "");               // เอาเฉพาะตัวเลข/จุด
    const i = v.indexOf(".");                   // อนุญาตจุดเดียว
    if (i !== -1) v = v.slice(0, i + 1) + v.slice(i + 1).replace(/\./g, "");
    // ตัด 0 นำหน้า (แต่คง "0." ไว้)
    v = v.replace(/^0+(?=\d)/, "");
    setAmountStr(v);
  };

  const handleAmountBlur = () => {
    if (amountStr === "") return;
    const n = Math.max(0, parseFloat(amountStr) || 0);
    setAmountStr(n.toFixed(2));
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(f.type)) {
      alert("อนุญาตเฉพาะไฟล์ JPG/PNG/WebP");
      e.currentTarget.value = "";
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      alert("ไฟล์ใหญ่เกิน 10 MB");
      e.currentTarget.value = "";
      return;
    }

    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setOpen(true);
    e.currentTarget.value = ""; // เลือกไฟล์เดิมซ้ำได้
  };

  const handleChangeFile = () => {
    hiddenFileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (!file) return;
    try {
      setUploading(true);
      setProgress(0);

      const res = await SubmitPaymentSlip(
        bookingId,
        file,
        {
          Amount: parsedAmount,                                   // ← ใช้ค่าที่แปลงแล้ว
          PaymentDate: dayjs(paymentDateLocal).toISOString(),     // แปลงจาก datetime-local -> ISO
          Note: note,
          PayerID: payerId,
        },
        {
          onUploadProgress: (evt: AxiosProgressEvent) => {
            if (typeof evt.total === "number" && evt.total > 0) {
              setProgress(Math.round((evt.loaded * 100) / evt.total));
            } else if (typeof evt.progress === "number") {
              setProgress(Math.round(evt.progress * 100));
            }
          },
        }
      );

      onSuccess?.(res);
      // reset
      setOpen(false);
      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      setAmountStr(defaultAmount > 0 ? String(defaultAmount) : "");
      setPaymentDateLocal(dayjs().format("YYYY-MM-DDTHH:mm"));
      setNote("");
    } catch (err) {
      onError?.(err);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <>
      <Button component="label" variant="contained" startIcon={<UploadIcon size={18} />}>
        Upload Slip
        <input type="file" hidden accept="image/*" onChange={handlePickFile} />
      </Button>

      <Dialog open={open} onClose={() => !uploading && setOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>อัปโหลดสลิปการโอน</DialogTitle>

        <DialogContent>
          <Grid container spacing={3}>
            {/* ซ้าย: พรีวิว + เปลี่ยนไฟล์ + ข้อมูลไฟล์ */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={1.5}>
                <Box
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                    p: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 280,
                  }}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="slip preview"
                      style={{ maxWidth: "100%", maxHeight: 360, objectFit: "contain" }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
                      <ImageIcon />
                      <Typography color="text.secondary">เลือกรูปสลิป</Typography>
                    </Stack>
                  )}
                </Box>

                {file && (
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={file.name} size="small" />
                    <Chip label={`${(file.size / 1024 / 1024).toFixed(2)} MB`} size="small" variant="outlined" />
                    <Chip label={file.type} size="small" variant="outlined" />
                  </Stack>
                )}

                <input
                  ref={hiddenFileInputRef}
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePickFile}
                />
                <Button onClick={handleChangeFile} startIcon={<RefreshCw size={16} />} size="small">
                  เปลี่ยนรูป
                </Button>
              </Stack>
            </Grid>

            {/* ขวา: ฟอร์ม */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  รายละเอียดการชำระเงิน
                </Typography>

                {/* ยอดเงิน */}
                <TextField
                  label="ยอดเงิน (บาท)"
                  type="text"                // ใช้ text เพื่อคุมรูปแบบเอง
                  inputMode="decimal"
                  value={amountStr}
                  onChange={handleAmountChange}
                  onBlur={handleAmountBlur}
                  required
                  fullWidth
                  placeholder="เช่น 180.00"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Typography sx={{ fontWeight: 600 }}>฿</Typography>
                      </InputAdornment>
                    ),
                  }}
                />

                {/* วันที่โอน */}
                <TextField
                  label="วันที่โอน"
                  type="datetime-local"
                  value={paymentDateLocal}
                  onChange={(e) => setPaymentDateLocal(e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Calendar size={16} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* หมายเหตุ (ไม่ให้ label ลอย ใช้ placeholder แทน) */}
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  หมายเหตุ
                </Typography>
                <TextField
                  className="textarea-field"
                  placeholder="ใส่รายละเอียดเพิ่มเติม (ถ้ามี)"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  fullWidth
              
                  minRows={3}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FileText size={16} />
                      </InputAdornment>
                    ),
                  }}
                />

                {/* <TextField
                  label="Additional Special Requests (Optional)"
                  fullWidth
                  rows={2}
                  value={additionalNote}
                  onChange={(e) => setAdditionalNote(e.target.value)}
                  placeholder="Special equipment, catering arrangements, or other requests"
                  className="textarea-field"
                /> */}

                {(uploading || progress > 0) && (
                  <Box>
                    <Typography variant="body2" sx={{ mb: 0.5 }}>
                      กำลังอัปโหลด… {progress}%
                    </Typography>
                    <LinearProgress variant="determinate" value={progress} />
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary">
                  รองรับ .jpg .jpeg .png .webp (สูงสุด 10 MB)
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploading}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || uploading} variant="contained">
            ส่งสลิป
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
