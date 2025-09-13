// utils/buildInstallments.ts
export type InstallmentKey = "full" | "deposit" | "balance";
export type LogicPayKey =
  | "unpaid"
  | "pending_payment"
  | "submitted"
  | "pending_verification"
  | "approved"
  | "rejected"
  | "refunded"
  | "awaiting_receipt";

export type InstallmentUI = {
  key: InstallmentKey;
  label: string;
  paymentId?: number;
  amount?: number;
  status: LogicPayKey;      // ใช้ตัดสินใจปุ่ม
  slipPath?: string;
  locked?: boolean;         // ใช้ล็อกงวด 2 (balance)
};

const toLogic = (raw?: string): LogicPayKey => {
  const k = (raw || "").trim().toLowerCase();
  if (k === "unpaid") return "unpaid";
  if (k === "pending payment" || k === "awaiting payment") return "pending_payment";
  if (k === "submitted") return "submitted";
  if (k === "pending verification") return "pending_verification";
  if (k === "approved" || k === "paid") return "approved";
  if (k === "rejected") return "rejected";
  if (k === "refunded") return "refunded";
  if (k === "awaiting receipt") return "awaiting_receipt";
  return "unpaid";
};

type AnyBooking = {
  TotalAmount?: number;
  DiscountAmount?: number;
  PaymentOption?: { OptionName?: string };
  Payments?: Array<{
    ID?: number;
    Amount?: number;
    SlipPath?: string;
    Note?: string;
    Status?: { Name?: string };
    Invoice?: { InvoiceType?: string }; // "Deposit" | "Final"
  }>;
  DepositAmount?: number;
};

export function buildInstallmentsForPopup(b: AnyBooking): {
  plan: "full" | "deposit";
  installments: InstallmentUI[];
  fullyPaid: boolean; // สำหรับโชว์ "Awaiting Receipt"
} {
  const plan: "full" | "deposit" =
    (b?.PaymentOption?.OptionName || "").toLowerCase() === "deposit" ? "deposit" : "full";

  const totalDue = Math.max((b.TotalAmount || 0) - (b.DiscountAmount || 0), 0);
  let sumApproved = 0;

  const payments = (b.Payments || []).map((p) => {
    const st = toLogic(p?.Status?.Name);
    if (st === "approved") sumApproved += (p.Amount || 0);
    return p;
  });

  if (plan === "full") {
    // หางวดเดียว (ล่าสุด หรือมี InvoiceType != Deposit)
    const fullPay = payments[payments.length - 1];
    const ui: InstallmentUI = {
      key: "full",
      label: "Full Payment",
      paymentId: fullPay?.ID,
      amount: fullPay?.Amount || totalDue,
      status: toLogic(fullPay?.Status?.Name),
      slipPath: fullPay?.SlipPath,
    };
    const fullyPaid = sumApproved >= totalDue && totalDue > 0;
    return { plan, installments: [ui], fullyPaid };
  }

  // plan = deposit
  // หา deposit กับ balance ด้วย Note/InvoiceType
  const isDep = (p: any) =>
    (p?.Invoice?.InvoiceType || "").toLowerCase() === "deposit" ||
    (p?.Note || "").toLowerCase().includes("deposit");
  const isBal = (p: any) =>
    (p?.Invoice?.InvoiceType || "").toLowerCase().includes("final") ||
    (p?.Note || "").toLowerCase().includes("balance");

  const dep = payments.find(isDep);
  const bal = payments.find(isBal);

  const depositAmount = b.DepositAmount || dep?.Amount || Math.round(totalDue / 2); // fallback
  const balanceAmount = bal?.Amount || Math.max(totalDue - depositAmount, 0);

  const depUI: InstallmentUI = {
    key: "deposit",
    label: "Deposit",
    paymentId: dep?.ID,
    amount: depositAmount,
    status: toLogic(dep?.Status?.Name),
    slipPath: dep?.SlipPath,
  };

  // กฎ: งวด 2 (balance) จะ "โผล่" ก็ต่อเมื่อมี record ในระบบแล้ว (สร้างตอนอนุมัติงวด 1 ฝั่ง backend)
  // หาก backend ยังไม่สร้าง -> ยังไม่แสดงงวด 2
  const installments: InstallmentUI[] = [depUI];

  if (bal) {
    const balUI: InstallmentUI = {
      key: "balance",
      label: "Final Payment",
      paymentId: bal?.ID,
      amount: balanceAmount,
      status: toLogic(bal?.Status?.Name),
      slipPath: bal?.SlipPath,
      locked: false, // มีงวด 2 แล้ว ไม่ล็อก
    };
    installments.push(balUI);
  }

  const fullyPaid = sumApproved >= totalDue && totalDue > 0;
  return { plan, installments, fullyPaid };
}
