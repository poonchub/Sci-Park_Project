import { FloorsInterface } from "./IFloors";
import { RoomtypesInterface } from "./IRoomTypes";

export interface RoomsInterface {
    ID?:            number;
    RoomNumber?:    string;
    Capacity?:      Number;
    RoomStatusID?:  number;
    RoomStatus?:    string;
    FloorID?:       number;
    Floor?:         FloorsInterface
    RoomTypeID?:    number;
    RoomType?:      RoomtypesInterface;  
}