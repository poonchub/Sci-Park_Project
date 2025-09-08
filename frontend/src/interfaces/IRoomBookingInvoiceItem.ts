import { RoomBookingInvoiceInterface } from "./IRoomBookingInvoice";

export interface RoomBookingInvoiceItemInterface {
    ID?:    number;
    Description?:   string;
    Quantity?:      number;
    UnitPrice?:     number;
    Amount?:        number;
    RoomBookingInvoiceID?:     number;
    RoomBookingInvoice?:       RoomBookingInvoiceInterface;
}