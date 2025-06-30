import { RoomsInterface } from "./IRooms";
import { RoomTypeLayouts } from "./IRoomtypeLayouts";

export interface RoomtypesInterface {
    ID?:            number;
    TypeName?:      string;
    HalfDayRate?:   number;
    FullDayRate?:   number;
    RoomSize?:      number;
    Rooms?:         RoomsInterface[];
    RoomTypeLayouts?:   RoomTypeLayouts[];
}