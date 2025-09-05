import { FloorsInterface } from "./IFloors";
import { RoomtypesInterface } from "./IRoomTypes";
import { RoomStatusInterface } from "./IRoomStatus";
import { RentalRoomInvoiceInterface } from "./IRentalRoomInvoices";
import { ServiceAreaDocumentInterface } from "./IServiceAreaDocument";

export interface RoomsInterface {
    TypeName:       string;
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
    RentalRoomInvoices?:      RentalRoomInvoiceInterface[];
    ServiceAreaDocument?:   ServiceAreaDocumentInterface[];
}