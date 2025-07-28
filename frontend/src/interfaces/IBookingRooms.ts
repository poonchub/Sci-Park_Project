import { RoomsInterface } from "./IRooms";
import { TimeSlotsInterface } from "./ITimeSlot";
import { UserInterface } from "./IUser";

export interface BookingRoomsInterface {
    ID?: number;
    Dates?: string[];           // กรณีส่งหลายวัน
    Date?: string;              // กรณีส่งวันเดียว
    Purpose?: string;
    UserID?: number;
    RoomID?: number;
    TimeSlotID?: number;
    AdditionalInfo?: string;     // เพิ่มให้ตรงกับ backend
    // CustomerName?: string;   // <- เพิ่มตรงนี้ถ้าต้องส่งชื่อ
    // CustomerPhone?: string;  // <- เพิ่มตรงนี้ถ้าต้องส่งเบอร์
    // CustomerEmail?: string;  // <- เพิ่มตรงนี้ถ้าต้องส่งอีเมล        // เพิ่มให้ตรงกับ backend
}
