import { InvoiceInterface } from "./IInvoices";

export interface InvoiceItemInterface {
    ID?:    number;
    Description?:   string;
    Amount?:        number;
    InvoiceID?:     number;
    Invoice?:       InvoiceInterface;
}