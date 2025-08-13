import { FloorsInterface } from "./IFloors";
import { RoomtypesInterface } from "./IRoomTypes";
import { RoomStatusInterface } from "./IRoomStatus";
import { InvoiceInterface } from "./IInvoices";

export interface RoomsInterface {
    ID?:            number;
    RoomNumber?:    string;
    Capacity?:      number;
    RoomStatusID?:  number;
    RoomStatus?:    RoomStatusInterface;
    FloorID?:       number;
    Floor?:         FloorsInterface
    RoomTypeID?:    number;
    RoomType?:      RoomtypesInterface;
    Invoice?:       InvoiceInterface[];
}