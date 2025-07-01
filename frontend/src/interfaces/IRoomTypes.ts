import { RoomEquipmentsInterface } from "./IRoomEquipments";
import { RoomsInterface } from "./IRooms";
import { RoomTypeImagesInterface } from "./IRoomTypeImages";
import { RoomTypeLayouts } from "./IRoomtypeLayouts";

export interface RoomtypesInterface {
    ID?:            number;
    TypeName?:      string;
    HalfDayRate?:   number;
    FullDayRate?:   number;
    RoomSize?:      number;
    Rooms?:         RoomsInterface[];
    RoomTypeLayouts?:   RoomTypeLayouts[];
    RoomTypeImages?:    RoomTypeImagesInterface[];
    RoomEquipments?:     RoomEquipmentsInterface[];
}