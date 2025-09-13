// src/utils/mockAdapters.ts
import { apiUrl } from "../services/http";

export type AllRow = {
  ID: number;
  CreatedAt?: string;
  Room?: { RoomNumber?: string | number; Floor?: { Number?: string | number } };
  BookingDates?: { Date: string }[];
  Merged_time_slots?: { start_time: string; end_time: string }[];
  StatusName?: string;
  Purpose?: string;
  User?: { FirstName?: string; LastName?: string; EmployeeID?: string };
  DisplayStatus?: string;
  Payment?: {
    id?: number;
    status?: string;
    slipImages?: string[];
    receiptPath?: string;
    depositDueAt?: string;
    remainderDueAt?: string;
    installments?: Array<{
      id: number;
      phase: "FULL" | "DEPOSIT" | "REMAINDER";
      amount: number;
      status: "PENDING_VERIFICATION" | "APPROVED" | "REJECTED";
      slipImages?: string[];
    }>;
  };
  InvoicePDFPath?: string;
};

export function computeDisplayStatus(bookingStatus: string, paymentStatus?: string): string {
  const b = (bookingStatus || "").toLowerCase();
  const p = (paymentStatus || "").toLowerCase();

  if (b === "pending") return "pending";
  if (b === "cancelled") return "cancelled";
  if (b === "completed") return "completed";

  if (["awaiting receipt", "refunded"].includes(p)) return "payment";
  if (p === "paid") return "completed";
  if (
    ["pending payment","pending verification","rejected","partially paid","overdue","unpaid","voided"]
      .includes(p)
  ) return "payment review";

  return "confirmed";
}

const parseFloorNum = (s?: string) => {
  if (!s) return undefined;
  const n = parseInt(String(s).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : s;
};

export function mapMockToAllRows(mocks: any[]): AllRow[] {
  return mocks.map((m) => {
    const slipFromInstallments: string[] =
      (m.Payment?.installments || []).flatMap((i: any) => i.slipImages || []);
    const legacyReceipt = m.Payments?.ReceiptPath ? [m.Payments.ReceiptPath] : [];
    const paymentStatus: string = (m.Payment?.paymentStatus || "").toLowerCase();

    const receiptPath =
      paymentStatus === "paid"
        ? `images/receipts/receipt-${m.Invoice?.InvoiceNumber || String(m.ID).padStart(5, "0")}.pdf`
        : undefined;

    return {
      ID: m.ID,
      CreatedAt: m.Date,
      Room: { RoomNumber: m.Room?.RoomNumber, Floor: { Number: parseFloorNum(m.Room?.Floor) } },
      BookingDates: [{ Date: m.Date }],
      Merged_time_slots: [{ start_time: m.TimeSlot?.StartTime, end_time: m.TimeSlot?.EndTime }],
      StatusName: (m.BookingStatus || "").toLowerCase(),
      Purpose: m.Purpose,
      User: {
        FirstName: m.User?.FirstName || m.User?.Firstname,
        LastName: m.User?.LastName || m.User?.Lastname,
        EmployeeID: m.User?.EmployeeID,
      },
      DisplayStatus: computeDisplayStatus(m.BookingStatus, paymentStatus),
      Payment: {
        id: m.Payment?.id,
        status: paymentStatus,
        slipImages: slipFromInstallments,
        receiptPath,
        depositDueAt: m.Payment?.depositDueAt,
        remainderDueAt: m.Payment?.remainderDueAt,
        installments: m.Payment?.installments,
      },
      InvoicePDFPath: m.Invoice?.InvoicePDFPath || legacyReceipt[0],
    };
  });
}
