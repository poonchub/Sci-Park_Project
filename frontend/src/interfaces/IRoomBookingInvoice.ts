import { BookingRoomsInterface } from "./IBookingRooms";
import { RoomBookingInvoiceItemInterface } from "./IRoomBookingInvoiceItem";
import { UserInterface } from "./IUser";

export interface RoomBookingInvoiceInterface {
    ID?:    number;
    UpdatedAt?:     number;
    InvoiceNumber?: string;
    IssueDate?:     string;
    DueDate?:       string;
    BillingPeriod?: string;
    DepositAmount?:   number;
    DiscountAmount?:  number;
    TotalAmount?:     number;
    DepositeAmount?:  number;
    InvoicePDFPath?: string;
    TaxID?:          string;
    Address?:        string;

    BookingRoomID?:  number;
    BookingRoom?:    BookingRoomsInterface;
    ApproverID?:     number;
    Approver?:        UserInterface;
    CustomerID?:     number;
    Customer?:       UserInterface;
    Items?:          RoomBookingInvoiceItemInterface[];
    // Payments?:      PaymentInterface;
    // Notifications?: NotificationsInterface[];
}