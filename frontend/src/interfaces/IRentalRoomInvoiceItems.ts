import { RentalRoomInvoiceInterface } from "./IRentalRoomInvoices";

export interface RentalRoomInvoiceItemInterface {
    ID?:    number;
    Description?:   string;
    Amount?:        number;
    RentalRoomInvoiceID?:     number;
    RentalRoomInvoice?:       RentalRoomInvoiceInterface;
}