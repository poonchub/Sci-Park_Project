// src/mocks/bookings.ts
export const USE_BOOKING_MOCK = true; // เปลี่ยนเป็น false เมื่อต้องการใช้ API จริง

export type BookingMock = {
  ID: number;
  CreatedAt: string;
  Room: { RoomNumber: string | number; Floor: { Number: number } };
  BookingDates: { Date: string }[];
  Merged_time_slots: { start_time: string; end_time: string }[];
  StatusName: "pending" | "confirmed" | "cancelled" | "completed" | string;

  // รองรับทั้ง Purpose/purpose + เติม TypeID ให้ตรง interface เดิม
  Purpose?: string;
  purpose?: string;
  TypeID?: number;

  User: { FirstName?: string; LastName?: string; EmployeeID?: string };

  Payment?: {
    status: "submitted" | "paid" | "unpaid" | "refunded";
    date?: string;
    method?: string;
    ref?: string;
    slipImages?: string[];
  };

  AdditionalInfo?: {
    SetupStyle?: string;
    Equipment?: string[];
    AdditionalNote?: string;
  };
};

export const BOOKING_MOCKS: BookingMock[] = [
  {
    ID: 101,
    CreatedAt: "2025-08-25T09:00:00Z",
    Room: { RoomNumber: "A-201", Floor: { Number: 2 } },
    BookingDates: [{ Date: "2025-08-30" }],
    Merged_time_slots: [
      { start_time: "09:00", end_time: "10:00" },
      { start_time: "10:00", end_time: "11:00" },
    ],
    StatusName: "pending",
    Purpose: "Team sync",
    purpose: "Team sync",
    TypeID: 0,
    User: { FirstName: "Alice", LastName: "Wong", EmployeeID: "EMP001" },
    Payment: { status: "unpaid" },
    AdditionalInfo: {
      SetupStyle: "U-shape",
      Equipment: ["Projector", "Whiteboard"],
      AdditionalNote: "Need HDMI cable",
    },
  },
  {
    ID: 102,
    CreatedAt: "2025-08-24T13:20:00Z",
    Room: { RoomNumber: "B-305", Floor: { Number: 3 } },
    BookingDates: [{ Date: "2025-08-29" }],
    Merged_time_slots: [{ start_time: "13:00", end_time: "15:00" }],
    StatusName: "confirmed",
    Purpose: "Client meeting",
    User: { FirstName: "Bob", LastName: "Lee", EmployeeID: "EMP002" },
    Payment: {
      status: "submitted", // ต้องเป็น submitted ด้วยถึงจะเข้าหน้า Payment Review
      date: "2025-08-24",
      method: "QR",
      ref: "PAY-102",
      slipImages: [
        "https://via.placeholder.com/400x300?text=Slip+1",
        "https://via.placeholder.com/400x300?text=Slip+2"
      ]
    },
    AdditionalInfo: { SetupStyle: "Classroom", Equipment: ["TV"] },
  }
  ,
  {
    ID: 103,
    CreatedAt: "2025-08-23T08:10:00Z",
    Room: { RoomNumber: "C-101", Floor: { Number: 1 } },
    BookingDates: [{ Date: "2025-08-28" }, { Date: "2025-08-29" }],
    Merged_time_slots: [{ start_time: "14:00", end_time: "17:00" }],
    StatusName: "cancelled",
    Purpose: "Workshop",
    purpose: "Workshop",
    TypeID: 2,
    User: { FirstName: "Cara", LastName: "Ng", EmployeeID: "EMP003" },
    Payment: { status: "refunded", date: "2025-08-24", method: "Credit", ref: "PAY-103" },
    AdditionalInfo: { SetupStyle: "Theater", Equipment: ["Mic", "Speakers"] },
  },
  {
    ID: 104,
    CreatedAt: "2025-08-25T09:00:00Z",
    Room: { RoomNumber: "A-202", Floor: { Number: 2 } },
    BookingDates: [{ Date: "2025-08-30" }],
    Merged_time_slots: [{ start_time: "10:00", end_time: "12:00" }],
    StatusName: "confirmed",
    Purpose: "Team discussion",
    User: { FirstName: "Jane", LastName: "Smith", EmployeeID: "EMP104" },
    Payment: {
      status: "submitted",
      slipImages: [
        "https://via.placeholder.com/400x300.png?text=Slip+1",
        "https://via.placeholder.com/400x300.png?text=Slip+2"
      ]
    },
    AdditionalInfo: {
      SetupStyle: "Classroom",
      Equipment: ["TV", "Speaker"],
      AdditionalNote: "Need adapter"
    }
  }
  ,
  {
    ID: 105,
    CreatedAt: "2025-08-20T15:00:00Z",
    Room: { RoomNumber: "D-501", Floor: { Number: 5 } },
    BookingDates: [{ Date: "2025-08-31" }],
    Merged_time_slots: [{ start_time: "09:30", end_time: "10:30" }],
    StatusName: "pending",
    Purpose: "Daily standup",
    purpose: "Daily standup",
    TypeID: 0,
    User: { FirstName: "Eve", LastName: "Tan", EmployeeID: "EMP005" },
    Payment: { status: "unpaid" },
  },
  {
    ID: 106,
    CreatedAt: "2025-08-19T09:00:00Z",
    Room: { RoomNumber: "E-402", Floor: { Number: 4 } },
    BookingDates: [{ Date: "2025-08-26" }],
    Merged_time_slots: [{ start_time: "16:00", end_time: "18:00" }],
    StatusName: "completed",
    Purpose: "Board review",
    purpose: "Board review",
    TypeID: 2,
    User: { FirstName: "Frank", LastName: "Lim", EmployeeID: "EMP006" },
    Payment: { status: "paid", date: "2025-08-19", method: "Cash" },
  },
  {
    ID: 107,
    CreatedAt: "2025-08-25T14:00:00Z",
    Room: { RoomNumber: "F-101", Floor: { Number: 1 } },
    BookingDates: [{ Date: "2025-09-01" }],
    Merged_time_slots: [{ start_time: "09:00", end_time: "11:00" }],
    StatusName: "confirmed",            // ✅ อยู่ในขั้น Confirmed
    Purpose: "Design workshop",
    purpose: "Design workshop",
    TypeID: 3,
    User: { FirstName: "Grace", LastName: "Ho", EmployeeID: "EMP007" },
    Payment: {
      status: "submitted",              // ✅ อยู่ในขั้น Submitted
      method: "QR",
      slipImages: ["/mock/slip1.jpg", "/mock/slip2.jpg"] // ✅ mock รูป slip
    },
  }

];

export const findBookingMockById = (id: number) =>
  BOOKING_MOCKS.find((b) => b.ID === id) || null;
