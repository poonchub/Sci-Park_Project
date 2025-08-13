import { InvoiceInterface } from "./IInvoices";

export interface InvoiceItemInterface {
    ID?:    number;
    Description?:   string;
    UnitPrice?:     number;
    Amount?:        number;
    InvoiceID?:     number;
    Invoice?:       InvoiceInterface;
}