import { AdditionalInfo } from "./IAdditionalInfo";
import { PaymentOptionInterface } from "./IPaymentOption";
import { RoomsInterface } from "./IRooms";
import { UserInterface } from "./IUser";
import { NotificationsInterface } from "./INotifications";
export interface BookingRoomsInterface {
  ID?: number;
  CreatedAt?: string;
  UpdatedAt?: string;
  DeletedAt?: string | null;

  RoomID?: number;
  UserID?: number;

  Room?: RoomsInterface;
  User?: UserInterface;

  Purpose?: string;                 // ใช้ตัวใหญ่ให้สม่ำเสมอ
  AdditionalInfo?: AdditionalInfo | string;

  BookingDates?: { Date: string }[];
  Merged_time_slots?: { start_time: string; end_time: string }[];

  StatusName?: string;

  // บาง API อาจคืน key เล็ก
  purpose?: string;
  Date?: string;

  // สรุป payment (ถ้าใช้ใน UI)
  Payment?: {
    id?: number;
    status?:
      | "paid"
      | "unpaid"
      | "refunded"
      | "submitted"
      | "pending payment"
      | "pending verification";
    amount?: number;
    paymentDate?: string;
    note?: string;
    slipImages?: string[];
  };

  // ✅ ฟิลด์การเงินหลักที่ต้องใช้
  BaseTotal?:     number;  // ← เพิ่มฐานราคา
  DepositAmount?: number;
  DiscountAmount?:number;
  TotalAmount?:   number;

  // ✅ เผื่อบาง endpoint ส่งสรุปการเงินใต้ Finance (อ่านอย่างเดียว)
  Finance?: {
    BaseTotal?:     number;
    DepositAmount?: number;
    DiscountAmount?:number;
    TotalAmount?:   number;
    IsFullyPaid?: boolean;
  };

  TaxID?:           string;
  Address?:         string;
  PaymentOptionID?: number;
  PaymentOption?:   PaymentOptionInterface;

  // (ถ้าคุณมีในบางเพจ) ใบแจ้งหนี้
  RoomBookingInvoice?: {
    InvoiceNumber?: string;
    IssueDate?: string;
    DueDate?: string;
    InvoicePDFPath?: string;
    TotalAmount?: number;
    InvoiceType?: string;
    DepositDueDate?: string;
    DepositeDueDate?: string; // เผื่อสะกดแบบเก่า
  };

  Notifications?: NotificationsInterface[];
}
