import { RoomsInterface } from "./IRooms";
import { TimeSlotsInterface } from "./ITimeSlot";
import { UserInterface } from "./IUser";

export interface BookingRoomsInterface {
  purpose: any;
  BookingDates: any;
  TypeID: number;
  Room: any;
  merged_time_slots: any;
  StatusName: string;
  User: any;
  ID?: number;
  Dates?: string[];
  Date?: string;
  Purpose?: string;
  UserID?: number;
  RoomID?: number;
  TimeSlotIDs?: number[];  // เปลี่ยนชื่อให้ตรงกับ backend
  AdditionalInfo?: string;
}

