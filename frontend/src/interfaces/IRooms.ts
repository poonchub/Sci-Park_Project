import { FloorsInterface } from "./IFloors";
import { RoomtypesInterface } from "./IRoomTypes";
import { RoomStatusInterface } from "./IRoomStatus";
import { InvoiceInterface } from "./IInvoices";
import { ServiceAreaDocumentInterface } from "./IServiceAreaDocument";

export interface RoomsInterface {
    ID?:            number;
    RoomNumber?:    string;
    RoomSize?:      number;
    Capacity?:      number;
    RoomStatusID?:  number;
    RoomStatus?:    RoomStatusInterface;
    FloorID?:       number;
    Floor?:         FloorsInterface
    RoomTypeID?:    number;
    RoomType?:      RoomtypesInterface;
    Invoices?:      InvoiceInterface[];
    ServiceAreaDocument?:   ServiceAreaDocumentInterface[];
}