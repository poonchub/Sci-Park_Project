// types.ts
export interface User {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  Phone: string;
  EmployeeID: string;
}

export interface TimeSlot {
  ID: number;
  TimeSlotName: string;
  StartTime: string;
  EndTime: string;
}

export interface RoomType {
  ID: number;
  TypeName: string;
  RoomSize: string;
}

export interface RoomStatus {
  ID: number;
  StatusName: string;
}

export interface Room {
  ID: number;
  RoomNumber: string;
  FloorID: number;
  Floor: string;
  RoomStatusID: number;
  RoomStatus: RoomStatus;
  RoomTypeID: number;
  RoomType: RoomType;
}

export interface RoomPrice {
  ID: number;
  Price: number;
  TimeSlotID: number;
  TimeSlot: TimeSlot;
  RoomTypeID: number;
  RoomType: RoomType;
}

export interface BookingRoom {
  ID: number;
  Date: string;
  Purpose: string;
  UserID: number;
  User: User;
  RoomID: number;
  Room: Room;
  TimeSlotID: number;
  TimeSlot: TimeSlot;
}

export const mockUsers: User[] = [
  {
    ID: 1,
    FirstName: "Alice",
    LastName: "Johnson",
    Email: "alice@example.com",
    Password: "hashedpassword",
    Phone: "0812345678",
    EmployeeID: "EMP001",
  },
];

export const mockRoomTypes: RoomType[] = [
  { ID: 1, TypeName: "Conference", RoomSize: "Large" },
  { ID: 2, TypeName: "Meeting", RoomSize: "Medium" },
];

export const mockRoomStatuses: RoomStatus[] = [
  { ID: 1, StatusName: "Available" },
  { ID: 2, StatusName: "Occupied" },
];

export const mockTimeSlots: TimeSlot[] = [
  {
    ID: 1,
    TimeSlotName: "Morning",
    StartTime: "09:00",
    EndTime: "12:00",
  },
  {
    ID: 2,
    TimeSlotName: "Afternoon",
    StartTime: "13:00",
    EndTime: "16:00",
  },
];

export const mockRooms: Room[] = [
  {
    ID: 1,
    RoomNumber: "101",
    FloorID: 1,
    Floor: "1st",
    RoomStatusID: 1,
    RoomStatus: mockRoomStatuses[0],
    RoomTypeID: 1,
    RoomType: mockRoomTypes[0],
  },
  {
    ID: 2,
    RoomNumber: "202",
    FloorID: 2,
    Floor: "2nd",
    RoomStatusID: 1,
    RoomStatus: mockRoomStatuses[0],
    RoomTypeID: 2,
    RoomType: mockRoomTypes[1],
  },
];

export const mockBookingRooms: BookingRoom[] = [
  {
    ID: 1,
    Date: generateCustomDate(),
    Purpose: "Team Meeting",
    UserID: 1,
    User: mockUsers[0],
    RoomID: 1,
    Room: mockRooms[0],
    TimeSlotID: 1,
    TimeSlot: mockTimeSlots[0],
  },
  {
    ID: 2,
    Date: generateCustomDate(),
    Purpose: "Client Presentation",
    UserID: 1,
    User: mockUsers[0],
    RoomID: 2,
    Room: mockRooms[1],
    TimeSlotID: 2,
    TimeSlot: mockTimeSlots[1],
  },
];

function generateCustomDate(): string {
  const date = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());
  const second = pad(date.getSeconds());
  const millisecond = date.getMilliseconds(); // example: 199

  const fraction = `${millisecond}8705`.padEnd(7, '0'); // mocked nanoseconds
  const timezoneOffset = "+07:00"; // hardcoded Thai timezone

  return `${year}-${month}-${day} ${hour}:${minute}:${second}.${fraction}${timezoneOffset}`;
}

console.log(generateCustomDate());
