import { RentalRoomInvoiceItemInterface } from "./IRentalRoomInvoiceItems";
import { NotificationsInterface } from "./INotifications";
import { PaymentInterface } from "./IPayments";
import { PaymentStatusInterface } from "./IPaymentStatuses";
import { RoomsInterface } from "./IRooms";
import { UserInterface } from "./IUser";

export interface RentalRoomInvoiceInterface {
    ID?:    number;
    UpdatedAt?:     number;
    InvoiceNumber?: string;
    IssueDate?:     string;
    DueDate?:       string;
    BillingPeriod?: string;
    TotalAmount?:   number;
    InvoicePDFPath?: string;
    RoomID?:        number;
    Room?:          RoomsInterface;
    StatusID?:      number;
    Status?:        PaymentStatusInterface;
    CreaterID?:     number;
    Creater?:       UserInterface;
    CustomerID?:    number;
    Customer?:      UserInterface;
    Items?:         RentalRoomInvoiceItemInterface[];
    Payments?:      PaymentInterface;
    Notifications?: NotificationsInterface[];
}