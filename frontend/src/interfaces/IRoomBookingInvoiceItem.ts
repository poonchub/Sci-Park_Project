import { RoomBookingInvoiceInterface } from "./IRoomBookingInvoice";

export interface RoomBookingInvoiceItemInterface {
    ID?:    number;
    Description?:   string;
    Quantity?:      number;
    UnitPrice?:     number;
    Amount?:        number;
    RentalRoomInvoiceID?:     number;
    RentalRoomInvoice?:       RoomBookingInvoiceInterface;
}