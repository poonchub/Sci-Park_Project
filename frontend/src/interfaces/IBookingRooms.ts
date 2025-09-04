import { RoomsInterface } from "./IRooms";
import { TimeSlotsInterface } from "./ITimeSlot";
import { UserInterface } from "./IUser";
import { AdditionalInfo } from "./IAdditionalInfo";
import { BookingDateInterface } from "./IBookingDate";

export interface BookingRoomsInterface {
  [x: string]: any;
  CreatedAt: string;
  purpose: any;
  BookingDates: BookingDateInterface[];
  TypeID: number;
  Room: any;
  Merged_time_slots: any;
  StatusName: string;
  User: any;
  ID?: number;
  Dates?: string[];
  Date?: string;
  Purpose?: string;
  UserID?: number;
  RoomID?: number;
  TimeSlotIDs?: number[];  // เปลี่ยนชื่อให้ตรงกับ backend
  AdditionalInfo?: AdditionalInfo;
}

