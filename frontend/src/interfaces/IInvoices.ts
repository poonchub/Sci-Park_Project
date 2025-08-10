import { InvoiceItemInterface } from "./IInvoiceItems";
import { PaymentInterface } from "./IPayments";
import { PaymentStatusInterface } from "./IPaymentStatuses";
import { UserInterface } from "./IUser";

export interface InvoiceInterface {
    ID?:    number;
    InvoiceNumber?: string;
    IssueDate?:     string;
    DueDate?:       string;
    BillingPeriod?: string;
    TotalAmount?:   number;
    StatusID?:      number;
    Status?:        PaymentStatusInterface;
    CreaterID?:     number;
    Creater?:       UserInterface;
    CustomerID?:    number;
    Customer?:      UserInterface;
    Items?:         InvoiceItemInterface;
    Payments?:      PaymentInterface;
}