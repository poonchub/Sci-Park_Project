import { AdditionalInfo } from "./IAdditionalInfo";
import { PaymentOptionInterface } from "./IPaymentOption";
import { RoomsInterface } from "./IRooms";
import { UserInterface } from "./IUser";

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

  // เผื่อคุณใช้สรุป payment ในหน้า UI
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

  DepositAmount?:   number;
  DiscountAmount?:  number;
  TotalAmount?:     number;
  TaxID?:          string;
  Address?:        string;
  PaymentOptionID?: number;
  PaymentOption?:   PaymentOptionInterface;
}
