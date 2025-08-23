import { InvoiceItemInterface } from "./IInvoiceItems";
import { NotificationsInterface } from "./INotifications";
import { PaymentInterface } from "./IPayments";
import { PaymentStatusInterface } from "./IPaymentStatuses";
import { RoomsInterface } from "./IRooms";
import { UserInterface } from "./IUser";

export interface InvoiceInterface {
    ID?:    number;
    UpdatedAt?:     number;
    InvoiceNumber?: string;
    IssueDate?:     string;
    DueDate?:       string;
    BillingPeriod?: string;
    TotalAmount?:   number;
    RoomID?:        number;
    Room?:          RoomsInterface;
    StatusID?:      number;
    Status?:        PaymentStatusInterface;
    CreaterID?:     number;
    Creater?:       UserInterface;
    CustomerID?:    number;
    Customer?:      UserInterface;
    Items?:         InvoiceItemInterface[];
    Payments?:      PaymentInterface;
    Notifications?: NotificationsInterface[];
}