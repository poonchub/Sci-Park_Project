import { FloorsInterface } from "./IFloors";
import { RoomtypesInterface } from "./IRoomTypes";
import { RoomStatusInterface } from "./IRoomStatus";

export interface RoomsInterface {
    ID?: number;
    RoomNumber?: string;
    Capacity?: number;
    RoomStatusID?: number;
    RoomStatus?: RoomStatusInterface;  // <-- เปลี่ยนจาก string เป็น object
    FloorID?: number;
    Floor?: FloorsInterface
    RoomTypeID?: number;
    RoomType?: RoomtypesInterface;
}