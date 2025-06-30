import { RoomtypesInterface } from "./IRoomTypes";
import { TimeSlotsInterface } from "./ITimeSlot";

export interface RoomPriceInterface {
    ID?:    number;
    Price?: number;
    TimeSlotID?:    number;
    TimeSlot?:      TimeSlotsInterface;
    RoomtypeID?:    number;
    Roomtype?:      RoomtypesInterface;
}