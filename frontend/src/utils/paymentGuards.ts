// utils/paymentGuards.ts
const lower = (s?: string) => (s || "").trim().toLowerCase();

const statusNameOf = (p?: any): string =>
  typeof p?.Status === "string"
    ? p.Status
    : p?.Status?.StatusName || p?.Status?.Name || p?.status || p?.StatusName || "";

export function isRowRefunded(row: any): boolean {
  const pays: any[] = Array.isArray(row?.Payments) ? row.Payments : [];
  // ถ้ามี field Payment เดี่ยวก็รวมด้วย
  if (row?.Payment) pays.push(row.Payment);

  if (!pays.length) return false;

  // มองว่า “รีฟันแล้ว” เมื่อ payment ล่าสุดเป็น Refunded
  const latest = [...pays].sort((a, b) => {
    const ad = Date.parse(a?.PaymentDate || a?.CreatedAt || "");
    const bd = Date.parse(b?.PaymentDate || b?.CreatedAt || "");
    if (!Number.isNaN(ad) && !Number.isNaN(bd) && ad !== bd) return bd - ad; // ใหม่→เก่า
    return (b?.ID || 0) - (a?.ID || 0);
  })[0];

  return lower(statusNameOf(latest)) === "refunded";
}

export function isRowCancelled(row: any): boolean {
  // รองรับทั้ง DisplayStatus และ StatusName จาก BE
  const raw = lower(row?.DisplayStatus || row?.StatusName || "");
  return raw === "cancelled" || raw === "canceled" || raw === "cancel";
}

/** ล็อกทุก action เมื่อรีฟันหรือยกเลิก */
export function isRowReadOnly(row: any): boolean {
  return isRowRefunded(row) || isRowCancelled(row);
}
