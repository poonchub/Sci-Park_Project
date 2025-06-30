import { RoomsInterface } from "./IRooms";
import { TimeSlotsInterface } from "./ITimeSlot";
import { UserInterface } from "./IUser";

export interface BookingRoomsInterface {
    ID?:    number;
    Date?:  string;
    Purpose?:   string;
    UserID?:    number;
    User?:      UserInterface;
    RoomID?:    number;
    Room?:      RoomsInterface;
    TimeSlot?:  TimeSlotsInterface;
}