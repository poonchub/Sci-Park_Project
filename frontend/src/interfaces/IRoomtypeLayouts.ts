import { RoomLayoutsInterface } from "./IRoomLayouts";
import { RoomtypesInterface } from "./IRoomTypes";

export interface RoomTypeLayouts {
    ID?:        number;
    Capacity?:  number;
    Note?:      string;
    RoomTypeID?:    number;
    RoomType?:      RoomtypesInterface;
    RoomLayoutID?:  number;
    RoomLayout?:    RoomLayoutsInterface;
}