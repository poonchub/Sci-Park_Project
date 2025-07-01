import { EquipmentsInterface } from "./IEquipments";
import { RoomtypesInterface } from "./IRoomTypes";

export interface RoomEquipmentsInterface {
    ID?:        number;
    Quantity?:  number;

    RoomTypeID?:    number;
    RoomType?:      RoomtypesInterface;
    EquipmentID?:   number;
    Equipment?:     EquipmentsInterface;
}