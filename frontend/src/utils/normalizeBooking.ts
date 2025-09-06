// ---- helper ให้ path เป็น absolute ----
const apiBase = import.meta.env.VITE_API_BASE_URL || ""; // เช่น http://localhost:8000
const abs = (p?: string) => !p ? "" : (p.startsWith("http") ? p : `${apiBase}${p}`);

// ---- สรุปสถานะจาก field ที่อาจต่างรูปแบบ ----
const lower = (s?: string) => (s || "").toLowerCase();

export function normalizeDisplayStatus(raw: any): string {
  // ถ้า BE ให้มาอยู่แล้ว ใช้อันนั้นเป็นหลัก
  const d = lower(raw.DisplayStatus);
  if (d) return d;

  // ตกแต่งจากชื่อสถานะดั้งเดิม + สถานะจ่ายเงิน (fallback)
  const statusName = lower(raw.StatusName);
  const payStatus =
    lower(raw.Payment?.status) ||
    lower(raw.Payment?.Status?.Name);

  // กติกาง่าย ๆ ให้ได้ key ชุดเดียวกับ FE ใช้
  if (statusName === "cancelled") return "cancelled";
  if (["completed", "done"].includes(statusName)) return "completed";
  if (["confirmed"].includes(statusName) && !payStatus) return "confirmed";
  if (["review", "payment review", "pending verification"].includes(payStatus)) return "payment review";
  if (["paid", "awaiting receipt", "refunded"].includes(payStatus)) return "payment";
  if (["rejected", "unconfirmed"].includes(statusName)) return "pending";

  return "pending"; // ค่าเริ่มต้น
}

// ---- แปลง Payment ให้เป็นรูปเดียวกันเสมอ ----
function normalizePayment(rawPay: any) {
  if (!rawPay) return undefined;
  const id = rawPay.id ?? rawPay.ID;
  const status = rawPay.status ?? rawPay.Status?.Name;
  const method = rawPay.method ?? rawPay.Method;
  const ref = rawPay.ref ?? rawPay.TransactionRef;
  const date = rawPay.date ?? rawPay.PaymentDate;
  const slipImages =
    rawPay.SlipImages ??
    (rawPay.SlipPath ? [abs(rawPay.SlipPath)] : []);

  return { id, status, method, ref, date, slipImages };
}

// ---- ใช้กับแต่ละ row ----
export function normalizeBookingRow(raw: any) {
  return {
    ...raw,
    DisplayStatus: normalizeDisplayStatus(raw),
    Payment: normalizePayment(raw.Payment),
  };
}
