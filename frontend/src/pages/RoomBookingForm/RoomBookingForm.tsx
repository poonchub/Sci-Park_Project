// src/pages/RoomBookingForm/RoomBookingForm.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Divider,
  Chip,
  Alert,
  CardMedia,
  Tooltip,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  InputAdornment,
  Checkbox,
  InputLabel,
  IconButton,
  Select as MUISelect,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, Check, Building2, AlertTriangle, LinkIcon, MapPin, Info, MusicIcon, CheckCircle2, Timer } from "lucide-react";
import Carousel from "react-material-ui-carousel";
import {
  GetTimeSlots,
  GetRoomQuota,
  GetRoomsByRoomTypeID,
  CreateBookingRoom,
  GetUserById,
  GetRoomTypesByID,
  GetEquipmentByRoomType,
  UseRoomQuota,
  GetAllRoomLayouts,
  GetOrganizationInfo,

} from "../../services/http/index";
import { RoomPriceInterface } from "../../interfaces/IRoomPrices";
import { useLocation, useSearchParams } from "react-router-dom";
// import { Select } from "../../components/Select/Select";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { Base64 } from "js-base64";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { RoomsInterface } from "../../interfaces/IRooms";
import "./RoomBookingForm.css";
import "./Calendar.css";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { OrganizationInfoInterface } from "../../interfaces/IOrganizationInfo";


interface RoomBookingFormProps {
  room?: {
    id: number;
    TypeName: string;
    image?: string;
  };
  onBack?: () => void;
}

interface BookingDetail {
  time: string;
  bookedBy: string;
  status: string;
  type: "Fullday" | "Morning" | "Afternoon" | "hourly" | "half";
  hours?: string[];
}

interface BookedDate {
  bookedBy: string;
  status: string;
  fullDay?: boolean;
  morning?: boolean;
  afternoon?: boolean;
  type?: string;
  hours?: string[]; // normalized to ranges "HH:MM-HH:MM"
  hourlyBookedBy?: string;
  hourlyStatus?: string;
  morningBookedBy?: string;
  morningStatus?: string;
  afternoonBookedBy?: string;
  afternoonStatus?: string;
  bookedHours?: string[]; // normalized to ranges
  hourly?: string[]; // normalized to ranges
}

type BookedDates = {
  [date: string]: BookedDate[];
};

/** ========= Canonical time slots (08:30–16:30) ========= */
const HOURLY_SLOTS = [
  "08:30-09:30",
  "09:30-10:30",
  "10:30-11:30",
  "11:30-12:30",
  "12:30-13:30",
  "13:30-14:30",
  "14:30-15:30",
  "15:30-16:30",
];
// half-day: map to slot groups
const MORNING_SLOTS = HOURLY_SLOTS.slice(0, 4); // 08:30..12:30
const AFTERNOON_SLOTS = HOURLY_SLOTS.slice(4); // 12:30..16:30

// numeric start-hour bands for half-day conflict checks (8..15)
export const MORNING_HOUR_NUMS = [8, 9, 10, 11];
export const AFTERNOON_HOUR_NUMS = [12, 13, 14, 15];

const LARGE_ROOM_MIN_SEATS = 20;
const HOURLY_ALLOWED_ROLES = new Set([3, 4]);

/** ========= Helpers ========= */

const toRangeFromStart = (startHHMM: string): string => {
  // "08:30" -> "08:30-09:30"
  const [h, m] = startHHMM.split(":").map(Number);
  const endH = h + 1;
  const end = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `${startHHMM}-${end}`;
};
const numHourToRange = (n: number): string | null => {
  // 8..15 -> pick from HOURLY_SLOTS (8->index 0)
  const idx = n - 8;
  return HOURLY_SLOTS[idx] ?? null;
};
const normalizeToRanges = (arr?: any[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((h) => {
      if (typeof h === "string") {
        if (h.includes("-")) return h; // already range
        if (/^\d{2}:\d{2}$/.test(h)) return toRangeFromStart(h);
        return null;
      }
      if (typeof h === "number") return numHourToRange(h);
      return null;
    })
    .filter((x): x is string => !!x);
};
const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

const startHourFromRange = (range: string) => {
  // "08:30-09:30" -> 8
  const start = range.split("-")[0];
  return parseInt(start.split(":")[0], 10);
};
const endFromRange = (range: string) => range.split("-")[1];

const groupContiguousByIndex = (ranges: string[]): string[][] => {
  const idxs = Array.from(new Set(ranges.map((r) => HOURLY_SLOTS.indexOf(r))))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (!idxs.length) return [];
  const out: number[][] = [];
  let cur = [idxs[0]];
  for (let i = 1; i < idxs.length; i++) {
    if (idxs[i] === idxs[i - 1] + 1) cur.push(idxs[i]);
    else {
      out.push(cur);
      cur = [idxs[i]];
    }
  }
  out.push(cur);
  return out.map((g) => g.map((ix) => HOURLY_SLOTS[ix]));
};
const coversAll = (booked: Set<string>, required: string[]) => required.every((h) => booked.has(h));

/** ========= Component ========= */
const RoomBookingForm: React.FC<RoomBookingFormProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>(
    []
  );
  const [timeRange, setTimeRange] = React.useState<"Morning" | "Afternoon" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [roomsOfSameType, setRoomsOfSameType] = useState<
    { RoomStatusID: number; id: number; roomnumber: string; RoomStatus?: RoomStatusInterface }[]
  >([]);
  const [bookingMap, setBookingMap] = useState<{ [date: string]: BookingDetail[] }>({});
  const [selectedDateDetails, setSelectedDateDetails] = useState<{
    date: string;
    bookings: BookingDetail[];
  } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const location = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState(0);
  const roomtype = (location.state as any)?.selectedRoomtypes || {};
  const [roomData, setRoomData] = React.useState<RoomsInterface | null>(null);
  const [roomType, setRoomType] = useState<RoomtypesInterface>({});
  const [role, setRole] = useState<any>(null);
  console.log("ss", role);
  const [searchParams] = useSearchParams();
  const [capacity, setCapacity] = useState<number>(0);
  const isAllowedToBookLargeRoom = capacity >= LARGE_ROOM_MIN_SEATS ? role === 4 || role === 5 : true;

  const [setupStyles, setSetupStyles] = useState<{ ID: number; LayoutName: string }[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);
  const [timeOption, setTimeOption] = useState<"hourly" | "half" | "full" | "none">("none");
  const [selectedHours, setSelectedHours] = useState<string[]>([]);
  const [openPopupCard, setOpenPopupCard] = useState<boolean>(false);
  const [slipfile, setSlipFile] = useState<File | null>(null);


  const [isEmployee, setIsEmployee] = useState(false);
  const isHourlyAllowed = isEmployee;   // ✅ ถ้าเป็นพนักงาน = true
  const [orgInfo, setOrgInfo] = useState<OrganizationInfoInterface | null>(null);




  /** ===== Fetch/Init ===== */

  const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
  };

  useEffect(() => {
    const loadOrg = async () => {
      try {
        setLoading(true);
        const data: OrganizationInfoInterface | false = await GetOrganizationInfo();
        if (!data) {
          setOrgInfo(null);
          setOrgError("ไม่สามารถโหลดข้อมูลหน่วยงานได้");
          return;
        }
        setOrgInfo(data);
      } catch (err) {
        console.error("Load org info error:", err);
        setOrgError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    loadOrg(); // 👈 เรียกที่นี่
  }, []);




  async function fetchUserData(userId: number) {
    setLoading(true);
    try {
      const res = await GetUserById(userId);
      console.log(res);
      if (res) {
        setName(res.FirstName + " " + res.LastName);
        setPhone(res.Phone);
        setEmail(res.Email);
        setRole(res.RoleID);
        setIsEmployee(res.IsEmployee);   // ✅ ใช้ค่า IsEmployee ที่ backend ส่งมา
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
    setLoading(false);
  }

  const getRoomtype = async () => {
    try {
      const encodedId = searchParams.get("roomtype_id");
      const roomtypeID = encodedId ? Base64.decode(decodeURIComponent(encodedId)) : null;
      const res = await GetRoomTypesByID(Number(roomtypeID));
      if (res) setRoomType(res);
    } catch (error) {
      console.error("Error fetching room type:", error);
    }
  };

  async function fetchRoomData(roomId: number) {
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      if (res) {
        setRoomData(res.Room);
        setCapacity(res.Capacity);
      }
    } catch (err) {
      console.error("Failed to fetch room data", err);
    }
    setLoading(false);
  }

  const fetchRoomPricing = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      if (res) {
        setPricing(res.RoomPrices || []);
      }
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  // Booking map/dates only
  const fetchBookingMapOnly = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      if (res.BookedDates) {
        const convertedData: BookedDates = convertBookedDates(res.BookedDates);
        setBookedDates(convertedData);

        const bookingDetailMap: { [date: string]: BookingDetail[] } = {};
        for (const date in convertedData) {
          bookingDetailMap[date] = getBookingDetailsFromArray(convertedData[date]);
        }
        setBookingMap(bookingDetailMap);
      } else {
        setBookedDates({});
        setBookingMap({});
      }
    } catch (error) {
      console.error("Error fetching booking map:", error);
      setBookedDates({});
      setBookingMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId") || "0");
    if (userId) fetchUserData(userId);
    getRoomtype();
  }, []);

  useEffect(() => {
    if (roomType?.ID) {
      GetRoomsByRoomTypeID(roomType.ID).then((data) => {
        if (data) {
          const formattedData = data.map((room: any) => ({
            id: room.ID,
            roomnumber: room.RoomNumber,
            RoomStatusID: room.RoomStatusID,
            RoomStatus: {
              ID: room.RoomStatus.ID,
              StatusName: room.RoomStatus.status_name,
              Code: room.RoomStatus.code,
            },
          }));
          setRoomsOfSameType(formattedData);
        }
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    if (roomType?.ID) {
      GetEquipmentByRoomType(roomType.ID).then((data) => {
        if (data) {
          const formatted = data.map((item: any) => item.EquipmentName);
          setEquipmentList(formatted);
        }
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    const loadQuota = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "");
      const res = await GetRoomQuota(userId);
      if (res) {
        setDiscount((prev) => ({
          ...prev,
          totalAllowed: res.meeting_room.total,
          usedCount: res.meeting_room.used,
          remaining: res.meeting_room.remaining,
          used: false,
        }));
      }
    };
    loadQuota();
  }, []);

  useEffect(() => {
    GetAllRoomLayouts().then((data) => {
      setSetupStyles(data || []);
    });
  }, []);

  /** ===== Pricing ===== */

  const [discount, setDiscount] = useState<{
    type: "free-use";
    name: string;
    description: string;
    totalAllowed: number;
    usedCount: number;
    remaining: number;
    used: boolean;
  }>({
    type: "free-use",
    name: "สิทธิ์ใช้ฟรีห้องประชุม",
    description: "สามารถใช้ห้องประชุมฟรีได้ 1 ครั้ง",
    totalAllowed: 1,
    usedCount: 0,
    remaining: 1,
    used: false,
  });



  const slotIdByName = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of pricing) {
      const name =
        (p as any)?.TimeSlot?.TimeSlotName ??
        (p as any)?.TimeSlotName ??
        (p as any)?.name;
      const id =
        (p as any)?.TimeSlot?.ID ??
        (p as any)?.ID ??
        (p as any)?.TimeSlotID;
      if (name && typeof id === "number") map[name] = id;
    }
    return map;
  }, [pricing]);

  const getTimeSlotIds = (): number[] => {
    if (timeOption === "hourly" && !isHourlyAllowed) return [];
    const id = (name: string) => slotIdByName[name];

    if (timeOption === "full") {
      const fullId = id("Fullday");
      return fullId ? [fullId] : [];
    }
    if (timeOption === "half") {
      if (timeRange === "Morning") {
        const mId = id("Morning");
        return mId ? [mId] : [];
      }
      if (timeRange === "Afternoon") {
        const aId = id("Afternoon");
        return aId ? [aId] : [];
      }
      return [];
    }
    if (timeOption === "hourly") {
      // selectedHours = range names like "08:30-09:30"
      return selectedHours
        .map((name) => id(name))
        .filter((n): n is number => typeof n === "number");
    }
    return [];
  };

  const calculatePrice = (
    dates: string[],
    timeOpt: "hourly" | "half" | "full",
    timeRng: "Morning" | "Afternoon" | null,
    selHours: string[],
    priceList: RoomPriceInterface[]
  ): number => {
    if (!dates.length || priceList.length === 0) return 0;
    if (discount.used) return 0;

    let totalPrice = 0;

    if (timeOpt === "full") {
      const slot = priceList.find((p) => p.TimeSlot?.TimeSlotName === "Fullday");
      if (slot?.Price) totalPrice = slot.Price * dates.length;
    } else if (timeOpt === "half" && timeRng) {
      const slotName = timeRng === "Morning" ? "Morning" : "Afternoon";
      const slot = priceList.find((p) => p.TimeSlot?.TimeSlotName === slotName);
      if (slot?.Price) totalPrice = slot.Price * dates.length;
    } else if (timeOpt === "hourly" && selHours.length > 0) {
      for (const hourName of selHours) {
        const slot = priceList.find((p) => p.TimeSlot?.TimeSlotName === hourName);
        if (slot?.Price) totalPrice += slot.Price;
      }
      totalPrice *= dates.length;
    }

    return totalPrice;
  };

  useEffect(() => {
    if (selectedDates.length > 0 && timeOption !== "none") {
      const totalPrice = calculatePrice(
        selectedDates, timeOption, timeRange, selectedHours, pricing
      );
      setCalculatedPrice(totalPrice);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedDates, timeOption, timeRange, selectedHours, pricing, discount.used]); // 👈 เพิ่ม discount.used


  useEffect(() => {
    if (!isHourlyAllowed && timeOption === "hourly") {
      setTimeOption("none");
      setSelectedHours([]);
      // ✅ รีเซ็ตวันที่ที่เลือกในปฏิทิน เพื่อกันชน/ไม่ซ้อนทับ
      setSelectedDates([]);
    }
  }, [isHourlyAllowed, timeOption]);

  /** ===== Booking detail computation (08:30–16:30 canonical) ===== */

  const getBookingDetailsFromArray = (bookings: BookedDate[]): BookingDetail[] => {
    if (!bookings || bookings.length === 0) return [];
    const details: BookingDetail[] = [];

    bookings.forEach((b) => {
      const bookedHours = normalizeToRanges(b.hours);
      const bookedSet = new Set(bookedHours);

      // --- Full Day: flag หรือครอบคลุมทุกช่วง ---
      const isFullDayBooking = b.type === "Fullday" || coversAll(bookedSet, HOURLY_SLOTS);
      if (isFullDayBooking) {
        details.push({
          time: "Full Day (08:30-16:30)",
          bookedBy: (b as any).fullDayBookedBy || b.bookedBy || "system",
          status: (b as any).fullDayStatus || b.status || "confirmed",
          type: "Fullday",
          hours: [...HOURLY_SLOTS],
        });
        return;
      }

      // --- แยกการตัดสินใจ Morning/Afternoon ---
      const isMorningByFlag = !!b.morning || b.type === "morning";
      const isAfternoonByFlag = !!b.afternoon || b.type === "afternoon";

      // อย่านับ coverage เป็น morning/afternoon หาก booking เป็น 'hourly'
      const isMorningByCoverage = b.type !== "hourly" && coversAll(bookedSet, MORNING_SLOTS);
      const isAfternoonByCoverage = b.type !== "hourly" && coversAll(bookedSet, AFTERNOON_SLOTS);

      // รวมผลสุดท้าย (แต่กันซ้ำด้วย set)
      const addedTypes = new Set<"morning" | "afternoon">();

      const pushMorning = () => {
        if (addedTypes.has("morning")) return;
        details.push({
          time: "Morning (08:30-12:30)",
          bookedBy: b.morningBookedBy || b.bookedBy || "system",
          status: b.morningStatus || b.status || "confirmed",
          type: "Morning",
          hours: [...MORNING_SLOTS],
        });
        addedTypes.add("morning");
      };

      const pushAfternoon = () => {
        if (addedTypes.has("afternoon")) return;
        details.push({
          time: "Afternoon (12:30-16:30)",
          bookedBy: b.afternoonBookedBy || b.bookedBy || "system",
          status: b.afternoonStatus || b.status || "confirmed",
          type: "Afternoon",
          hours: [...AFTERNOON_SLOTS],
        });
        addedTypes.add("afternoon");
      };

      // ถ้า flag และ coverage ซ้อนกัน → จะ push แค่ครั้งเดียว
      if (isMorningByFlag || isMorningByCoverage) pushMorning();
      if (isAfternoonByFlag || isAfternoonByCoverage) pushAfternoon();

      // เคสเช้า+บ่ายใน booking เดียวกัน → สรุปเป็น Full Day
      if (addedTypes.has("morning") && addedTypes.has("afternoon")) {
        // ลบที่เพิ่ง push ออก แล้วแทนด้วย Full Day
        details.pop(); // afternoon
        details.pop(); // morning
        details.push({
          time: "Full Day (08:30-16:30)",
          bookedBy: b.bookedBy || "system",
          status: b.status || "confirmed",
          type: "Fullday",
          hours: [...HOURLY_SLOTS],
        });
        return;
      }

      // --- Hourly เฉพาะที่เหลือ (ไม่กินทับครึ่งวัน) ---
      const hourlyBase =
        b.type === "hourly"
          ? bookedHours
          : bookedHours.filter((h) => !MORNING_SLOTS.includes(h) && !AFTERNOON_SLOTS.includes(h));

      if (hourlyBase.length > 0) {
        const groups = groupContiguousByIndex(hourlyBase);
        groups.forEach((slotGroup) => {
          const start = slotGroup[0].split("-")[0];
          const end = endFromRange(slotGroup[slotGroup.length - 1]);
          details.push({
            time: `${start}-${end}`,
            bookedBy: b.hourlyBookedBy || b.bookedBy || "system",
            status: b.hourlyStatus || b.status || "confirmed",
            type: "hourly",
            hours: slotGroup,
          });
        });
      }
    });

    // --- รวม morning+afternoon ข้าม booking record ที่ "คนเดียวกัน/สถานะเดียวกัน" ---
    const key = (d: BookingDetail) => `${d.bookedBy}__${d.status}`;
    const byKey = new Map<string, BookingDetail[]>();
    details.forEach((d) => {
      const k = key(d);
      const list = byKey.get(k) ?? [];
      list.push(d);
      byKey.set(k, list);
    });

    const merged: BookingDetail[] = [];
    byKey.forEach((list) => {
      const hasMorning = list.find((d) => d.type === "Morning");
      const hasAfternoon = list.find((d) => d.type === "Afternoon");
      if (hasMorning && hasAfternoon) {
        merged.push({
          time: "Full Day (08:30-16:30)",
          bookedBy: hasMorning.bookedBy,
          status: hasMorning.status,
          type: "Fullday",
          hours: [...HOURLY_SLOTS],
        });
        list
          .filter((d) => d.type !== "Morning" && d.type !== "Afternoon")
          .forEach((d) => merged.push(d));
      } else {
        merged.push(...list);
      }
    });

    // --- de-dup รายการที่ยังเหมือนกันทุกประการ ---
    const seen = new Set<string>();
    const deduped = merged.filter((d) => {
      const sig = `${d.type}|${d.time}|${d.bookedBy}|${d.status}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });

    return deduped;
  };


  const convertBookedDates = (apiData: Record<string, any>): BookedDates => {
    const converted: BookedDates = {};
    Object.entries(apiData).forEach(([dateString, bookings]) => {
      const arr = Array.isArray(bookings) ? bookings : [bookings];
      converted[dateString] = arr.map((b) => ({
        bookedBy: b.bookedBy || "",
        status: b.status || "",
        fullDay: !!b.fullDay,
        morning: !!b.morning,
        afternoon: !!b.afternoon,
        type: b.type || "",
        hours: normalizeToRanges(b.hours),
        hourlyBookedBy: b.hourlyBookedBy || "",
        hourlyStatus: b.hourlyStatus || "",
        morningBookedBy: b.morningBookedBy || "",
        morningStatus: b.morningStatus || "",
        afternoonBookedBy: b.afternoonBookedBy || "",
        afternoonStatus: b.afternoonStatus || "",
        bookedHours: normalizeToRanges(b.bookedHours),
        hourly: normalizeToRanges(b.hourly),
      }));
    });
    return converted;
  };

  const isFullyBooked = (dateString: string): boolean => {
    const bookings = bookedDates[dateString];
    if (!bookings?.length) return false;

    if (bookings.some((b) => b.fullDay || b.type === "Fullday")) return true;

    const hasMorning = bookings.some((b) => b.morning || b.type === "Morning");
    const hasAfternoon = bookings.some((b) => b.afternoon || b.type === "Afternoon");
    if (hasMorning && hasAfternoon) return true;

    const booked = new Set<string>();
    bookings.forEach((b) => {
      const hrs = normalizeToRanges(b.hours ?? b.bookedHours ?? b.hourly ?? []);
      hrs.forEach((r) => booked.add(r));
    });
    return HOURLY_SLOTS.every((slot) => booked.has(slot));
  };

  const isPartiallyBooked = (dateString: string): boolean => {
    const bookings = bookedDates[dateString];
    if (!bookings?.length) return false;

    const partial = bookings.some(
      (b) =>
        !b.fullDay &&
        (b.morning === true ||
          b.afternoon === true ||
          normalizeToRanges(b.hours).length > 0 ||
          normalizeToRanges(b.bookedHours).length > 0 ||
          normalizeToRanges(b.hourly).length > 0)
    );

    return partial && !isFullyBooked(dateString);
  };

  const getBookingDetails = (dateString: string): BookingDetail[] => {
    const bookings = bookedDates[dateString];
    return bookings ? getBookingDetailsFromArray(bookings) : [];
  };

  /** ===== Availability & selection ===== */

  const isSlotAvailable = (dateString: string): boolean => {
    const bookings = bookedDates[dateString] ?? [];
    if (!Array.isArray(bookings)) return true;

    if (timeOption === "full") {
      // Full day: any booking makes it unavailable
      return bookings.length === 0;
    }

    if (timeOption === "half") {
      for (const booking of bookings) {
        if (booking.fullDay) return false;

        if (timeRange === "Morning") {
          if (booking.morning) return false;
          const anyStartInMorning = normalizeToRanges(booking.hours).some(
            (r) => MORNING_HOUR_NUMS.includes(startHourFromRange(r))
          );
          if (anyStartInMorning) return false;
        }

        if (timeRange === "Afternoon") {
          if (booking.afternoon) return false;
          const anyStartInAfternoon = normalizeToRanges(booking.hours).some(
            (r) => AFTERNOON_HOUR_NUMS.includes(startHourFromRange(r))
          );
          if (anyStartInAfternoon) return false;
        }
      }
      return true;
    }

    if (timeOption === "hourly") {
      const selectedHourNums = selectedHours.map((r) => startHourFromRange(r));

      for (const booking of bookings) {
        if (booking.fullDay) return false;

        if (booking.morning && selectedHourNums.some((h) => MORNING_HOUR_NUMS.includes(h))) return false;
        if (booking.afternoon && selectedHourNums.some((h) => AFTERNOON_HOUR_NUMS.includes(h)))
          return false;

        const bookedStarts: number[] = [];
        const pushRanges = (arr?: string[]) => {
          normalizeToRanges(arr).forEach((r) => {
            const n = startHourFromRange(r);
            if (!Number.isNaN(n)) bookedStarts.push(n);
          });
        };
        pushRanges(booking.hours);
        pushRanges(booking.bookedHours);
        pushRanges(booking.hourly);

        if (selectedHourNums.some((n) => bookedStarts.includes(n))) return false;
      }
      return true;
    }

    return true;
  };

  function showDateDetails(dateString: string) {
    const details = getBookingDetails(dateString);
    setSelectedDateDetails({ date: dateString, bookings: details });
    setShowDetailsModal(true);
  }

  const toggleDateSelection = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (dateString < today) return;

    const bookings = bookedDates[dateString];

    if (timeOption === "hourly" && selectedHours.length > 0) {
      const canSelectDate = selectedHours.every((range) => {
        const hourNum = startHourFromRange(range);
        if (!bookings) return true;
        if (bookings.some((b) => b.fullDay)) return false;
        if (bookings.some((b) => b.morning) && MORNING_HOUR_NUMS.includes(hourNum)) return false;
        if (bookings.some((b) => b.afternoon) && AFTERNOON_HOUR_NUMS.includes(hourNum)) return false;

        const bookedStarts: number[] = [];
        bookings.forEach((b) => {
          const collect = (arr?: string[]) => {
            normalizeToRanges(arr).forEach((r) => {
              const n = startHourFromRange(r);
              if (!Number.isNaN(n)) bookedStarts.push(n);
            });
          };
          collect(b.bookedHours);
          collect(b.hours);
          collect(b.hourly);
        });

        return !bookedStarts.includes(hourNum);
      });

      if (!canSelectDate) {
        alert(
          `Cannot select ${dateString} - Selected hours conflict with existing bookings on this date`
        );
        return;
      }
    }

    if (!isSlotAvailable(dateString) && timeOption !== "hourly") {
      showDateDetails(dateString);
      return;
    }

    setSelectedDates((prev) =>
      prev.includes(dateString)
        ? prev.filter((d) => d !== dateString)
        : [...prev, dateString].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    );
  };

  /** ===== Calendar UI ===== */

  const [currentMonthState, setCurrentMonth] = useState(new Date());

  const renderCalendar = () => {
    const today = new Date();
    const year = currentMonthState.getFullYear();
    const month = currentMonthState.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    const formatDateString = (y: number, m: number, d: number) =>
      `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const futureYears = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);

    const getCellClasses = (
      isBooked: boolean,
      isSelected: boolean,
      isPartially: boolean,
      isPast: boolean,
      isAvailable: boolean
    ) => {
      const classes = ["day-cell"];
      if (isPast) classes.push("day-cell-past");
      if (isBooked) classes.push("day-cell-booked");
      else if (isSelected) classes.push("day-cell-selected");
      else if (isPartially) classes.push("day-cell-partially");
      else if (isAvailable) classes.push("day-cell-available");
      if (!isAvailable && !isPast) classes.push("day-cell-not-available");
      return classes.join(" ");
    };

    const renderCalendarCell = (day: number, dateString: string) => {
      const cellDate = new Date(dateString);
      const todayDate = new Date(today.toISOString().split("T")[0]);
      const isPast = cellDate < todayDate;

      const isBooked = isFullyBooked(dateString);
      const isPartially = isPartiallyBooked(dateString);
      const bookingDetails = getBookingDetails(dateString);
      const isSelected = selectedDates.includes(dateString);
      const isAvailable = !isBooked && isSlotAvailable(dateString);

      const tooltipContent =
        bookingDetails.length > 0 ? (
          <Box className="tooltip-content">
            <Typography variant="subtitle2" className="tooltip-title" sx={{ fontWeight: "bold", mb: 1 }}>
              {dateString}
            </Typography>
            {bookingDetails.map((b, i) => (
              <Box key={i} sx={{ mb: 1, p: 1, borderRadius: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 0.75 }}
                >
                  <Calendar size={14} /> {b.time}
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                  sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                >
                  <User size={14} /> Booked by: {b.bookedBy}
                </Typography>

                <Typography
                  variant="caption"
                  display="block"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 0.75,
                    color: b.status === "confirmed" ? "success.main" : "warning.main",
                    fontWeight: 500,
                  }}
                >
                  {b.status === "confirmed" ? <CheckCircle2 size={14} /> : <Clock size={14} />}{" "}
                  {b.status === "confirmed" ? "Confirmed" : "Pending"}
                </Typography>

                {b.hours?.length ? (
                  <Typography
                    variant="caption"
                    display="block"
                    sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "info.main" }}
                  >
                    <Timer size={14} /> Hours: {b.hours.join(", ")}
                  </Typography>
                ) : null}
              </Box>
            ))}

            <Typography
              variant="caption"
              sx={{
                color: isAvailable ? "#4caf50" : "#f44336",
                fontWeight: "bold",
                display: "block",
                textAlign: "center",
                mt: 1,
              }}
            >
              {isAvailable ? "Available for your selection" : "Not available for your selection"}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {dateString}
            </Typography>
            <Typography variant="body2" sx={{ color: "#4caf50" }}>
              Available
            </Typography>
          </Box>
        );

      return (
        <Tooltip
          key={dateString}
          title={tooltipContent}
          arrow
          placement="top"
          componentsProps={{
            tooltip: { sx: { bgcolor: "secondary.main", color: "text.primary", maxWidth: 300, fontSize: "0.75rem" } },
          }}
        >
          <Paper
            elevation={isSelected ? 3 : 1}
            onClick={() => {
              if (!isPast && !isBooked && isAvailable) toggleDateSelection(dateString);
            }}
            className={getCellClasses(isBooked, isSelected, isPartially, isPast, isAvailable)}
          >
            {day}
            {bookingDetails.length > 0 && <Box className="booking-count">{bookingDetails.length}</Box>}
          </Paper>
        </Tooltip>
      );
    };

    return (
      <Paper className="calendar-container" sx={{ bgcolor: "secondary.main" }}>
        <Box className="month-year-selector">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              const prevMonth = new Date(year, month - 1);
              if (
                prevMonth.getFullYear() > today.getFullYear() ||
                (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() >= today.getMonth())
              ) {
                setCurrentMonth(prevMonth);
              }
            }}
            disabled={year === today.getFullYear() && month === today.getMonth()}
            className="nav-button"
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </Button>

          <Select
            value={month}
            onChange={(e: any) => {
              const newMonth = Number(e.target.value);
              if (year === today.getFullYear() && newMonth < today.getMonth()) {
                setCurrentMonth(new Date(year, today.getMonth()));
              } else {
                setCurrentMonth(new Date(year, newMonth));
              }
            }}
            size="small"
            className="month-select"
          >
            {monthNames.map((name, idx) => {
              const disabled = year === today.getFullYear() && idx < today.getMonth();
              return (
                <MenuItem key={idx} value={idx} disabled={disabled} className="month-menu-item">
                  {name}
                </MenuItem>
              );
            })}
          </Select>

          <Select
            value={year}
            onChange={(e: any) => {
              const newYear = Number(e.target.value);
              let newMonth = month;
              if (newYear === today.getFullYear() && month < today.getMonth()) {
                newMonth = today.getMonth();
              }
              setCurrentMonth(new Date(newYear, newMonth));
            }}
            size="small"
            className="year-select"
          >
            {futureYears.map((y) => (
              <MenuItem key={y} value={y} className="year-menu-item">
                {y}
              </MenuItem>
            ))}
          </Select>

          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => setCurrentMonth(new Date(year, month + 1))}
            disabled={year === futureYears[futureYears.length - 1] && month === 11}
            className="nav-button"
          >
            <ArrowForwardIosIcon fontSize="small" />
          </Button>
        </Box>

        <Box className="day-names-grid">
          {dayNames.map((day) => (
            <Typography key={day} variant="subtitle2" color="text.secondary" fontWeight="600">
              {day}
            </Typography>
          ))}
        </Box>

        <Box className="calendar-grid">
          {Array.from({ length: firstDay }).map((_, i) => (
            <Box key={`empty-${i}`} />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const d = i + 1;
            const dateString = formatDateString(year, month, d);
            return renderCalendarCell(d, dateString);
          })}
        </Box>
      </Paper>
    );
  };

  /** ===== Summary helpers ===== */
  const getTimeLabel = () => (timeOption === "half" ? "Half Day" : "Full Day");
  const getTimeRangeLabel = () => (timeRange === "Morning" ? "08:30 - 12:30" : "12:30 - 16:30");

  /** ===== Submit ===== */

  const handleHourToggle = (hourRange: string) => {
    setSelectedHours((prev) =>
      prev.includes(hourRange) ? prev.filter((h) => h !== hourRange) : [...prev, hourRange]
    );
  };

  function getRoomTypeKey(roomType: string): "meeting" | "training" | "multi" {
    switch (roomType.toLowerCase()) {
      case "meetingroom":
      case "meeting":
        return "meeting";
      case "trainingroom":
      case "training":
        return "training";
      case "multifunctionroom":
      case "multi":
        return "multi";
      default:
        return "meeting";
    }
  }

  const handleSubmitBooking = async () => {
    if (!isHourlyAllowed && timeOption === "hourly") {
      alert("Your role is not allowed to book hourly.");
      return;
    }

    const userId = parseInt(localStorage.getItem("userId") || "0");
    if (!userId || !roomData || !purpose || !selectedDates.length || getTimeSlotIds().length === 0) {
      alert("Please fill in all the required fields.");
      return;
    }

    if (calculatedPrice === 0 && !discount.used) {
      alert("ราคาที่คำนวณได้เป็น 0 โปรดตรวจสอบส่วนลดหรือข้อมูลการจอง");
      return;
    }

    const bookingData = {
      UserID: userId,
      RoomID: selectedRoomId,
      TimeSlotIDs: getTimeSlotIds(),
      Purpose: purpose,
      AdditionalInfo: JSON.stringify({
        setupStyle: selectedStyle,
        equipment: selectedEquipment,
        additionalNote,
      }),
      Dates: selectedDates,
    };

    try {
      const resBooking = await CreateBookingRoom(bookingData);

      if (resBooking.status !== 200) {
        console.error("❌ Booking failed", resBooking.status, resBooking.data?.error);
        alert(resBooking.data?.error || "เกิดข้อผิดพลาดในการจอง");
        return;
      }

      // ลดโควต้า
      const roomTypeKey = getRoomTypeKey(roomData.TypeName || "");
      const quotaRes = await UseRoomQuota({ user_id: userId, room_type: roomTypeKey });

      if (quotaRes.status === 200) {
        // สมมติ payload แบบเดิมที่เคยใช้ GetRoomQuota
        setDiscount((prev) => ({
          ...prev,
          used: false, // ใช้เครดิตรอบนี้ไปแล้ว รีเซ็ตปุ่ม
          totalAllowed: quotaRes.data?.meeting_room?.total ?? prev.totalAllowed,
          usedCount: quotaRes.data?.meeting_room?.used ?? prev.usedCount,
          remaining: quotaRes.data?.meeting_room?.remaining ?? Math.max(prev.remaining - 1, 0),
        }));
      } else {
        console.error("ลดโควต้าไม่สำเร็จ:", quotaRes.data);
      }


      await fetchBookingMapOnly(roomData.ID as number);

      // reset
      setSelectedDates([]);
      setAdditionalNote("");
      setPurpose("");
      const val = Number(selectedRoomId);
      setSelectedRoomId(val);
      fetchBookingMapOnly(val);

      handleSetAlert("success", "Booking created successfully.");
    } catch (err) {
      console.error("Booking Error:", err);
      handleSetAlert("error", "An unexpected error occurred during create booking.");
    }
  };

  /** ===== Derived data ===== */

  const roomDataHeader = {
    id: (roomtype as any).id,
    TypeName: roomType.TypeName,
    image:
      (roomtype as any).image ||
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  };

  /** ===== Render ===== */

  return (
    <Box className="booking-container">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      {/* Header */}
      <Paper elevation={2} className="booking-header-paper">
        <Box className="booking-header-content">
          <Box>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              {roomDataHeader.TypeName}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Book meeting rooms online - convenient and fast
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowLeft />}
            onClick={onBack || (() => window.history.back())}
            variant="outlined"
            
          >
            Back
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Images */}
          <Grid size={{ xs: 12 }}>
            <Carousel
              indicators
              autoPlay
              animation="slide"
              duration={500}
              navButtonsAlwaysVisible
              navButtonsProps={{ className: "button-nav-button" }}
            >
              <CardMedia
                component="img"
                image="https://www.executivecentre.com/_next/image/?url=%2F_next%2Fstatic%2Fmedia%2FplanOverview-mr-meetingRoom.1f2225da.jpg&w=3840&q=75"
                className="carousel-image"
              />
              <CardMedia
                component="img"
                image="https://www.webex.com/content/dam/www/us/en/images/workspaces/large-meeting-room/modular/large-modular-hero-new.jpg"
                alt="large meeting room"
                className="carousel-image"
              />
            </Carousel>
          </Grid>

          {/* Room Selection */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={2}
              className="booking-section paper-room-selection-paper"
              sx={{ backgroundColor: "secondary.main", borderRadius: "24px", padding: "16px", my: 5 }}
            >
              <Box className="booking-section-header">
                <Building2 className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">
                  Select Room
                </Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>Choose Sub-room In {roomtype.TypeName} category</FormLabel>
                <Select
                  startAdornment={
                    <InputAdornment position="start" className="booking-input-adornment">
                      <Building2 size={18} strokeWidth={3} />
                    </InputAdornment>
                  }
                  value={selectedRoomId}
                  onChange={(e: any) => {
                    const val = Number(e.target.value);
                    setSelectedRoomId(val);
                    if (!val) return;
                    fetchBookingMapOnly(val);
                    setSelectedDates([]);
                    fetchRoomPricing(val);
                    fetchRoomData(val);
                  }}
                  displayEmpty
                >
                  <MenuItem value={0} disabled>
                    Select a Room
                  </MenuItem>
                  {roomsOfSameType.map((r) => (
                    <MenuItem
                      key={r.id}
                      value={r.id}
                      disabled={r.RoomStatusID !== 1}
                      title={r.RoomStatusID === 1 ? "Available" : "Not Available"}
                    >
                      {r.roomnumber} {r.RoomStatusID !== 1 ? `(${r.RoomStatus?.StatusName || "Unknown Status"})` : ""}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Time Selection */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={2}
              className="booking-section-paper time-selection-paper"
              sx={{ backgroundColor: "secondary.main", borderRadius: "24px", marginTop: "24px", mt: 3 }}
            >
              <Box className="booking-section-header">
                <Clock className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">
                  Select Duration & Time
                </Typography>
              </Box>

              {loading && !pricing.length ? (
                <Box className="booking-loading-container">
                  <CircularProgress size={24} />
                  <Typography className="booking-loading-text">Loading Prices...</Typography>
                </Box>
              ) : (
                <>
                  {/* Duration Options */}
                  <FormControl component="fieldset" className="booking-duration-options">
                    <FormLabel component="legend" className="booking-duration-legend">
                      Duration Options
                    </FormLabel>
                    <RadioGroup
                      value={timeOption}
                      onChange={(e) => {
                        const val = e.target.value as "hourly" | "half" | "full";
                        setTimeOption(val);
                        setTimeRange(null);
                        setSelectedHours([]);
                        // ✅ รีเซ็ตวันที่ที่เลือกในปฏิทิน เพื่อกันชน/ไม่ซ้อนทับ
                        setSelectedDates([]);
                      }}
                    >
                      {isHourlyAllowed && (
                        <FormControlLabel
                          value="hourly"
                          control={<Radio />}
                          label={<Typography variant="body1" fontWeight="500">Hourly</Typography>}
                        />
                      )}
                      <FormControlLabel
                        value="half"
                        control={<Radio />}
                        label={<Typography variant="body1" fontWeight="500">Half Day (4 hours)</Typography>}
                      />
                      <FormControlLabel
                        value="full"
                        control={<Radio />}
                        label={<Typography variant="body1" fontWeight="500">Full Day (8 hours)</Typography>}
                      />
                    </RadioGroup>
                  </FormControl>

                  {/* Hourly Slots */}
                  {isHourlyAllowed && timeOption === "hourly" && (
                    <>
                      <Divider className="booking-time-divider" />
                      <FormControl component="fieldset">
                        <FormLabel component="legend" className="booking-time-legend">
                          Select Hourly Slots
                        </FormLabel>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                          {HOURLY_SLOTS.map((hour) => (
                            <FormControlLabel
                              key={hour}
                              control={
                                <Checkbox
                                  checked={selectedHours.includes(hour)}
                                  onChange={() => handleHourToggle(hour)}
                                />
                              }
                              label={hour}
                            />
                          ))}
                        </Box>
                      </FormControl>
                    </>
                  )}

                  {/* Half Day Slots */}
                  {timeOption === "half" && (
                    <>
                      <Divider className="booking-time-divider" />
                      <FormControl component="fieldset">
                        <FormLabel component="legend" className="booking-time-legend">
                          Time Slot (Half Day)
                        </FormLabel>
                        <RadioGroup
                          value={timeRange}
                          onChange={(e) => {
                            setTimeRange(e.target.value as "Morning" | "Afternoon");
                            setSelectedDates([]);
                          }}
                        >
                          <FormControlLabel value="Morning" control={<Radio />} label="Morning (08:30 - 12:30)" />
                          <FormControlLabel value="Afternoon" control={<Radio />} label="Afternoon (12:30 - 16:30)" />
                        </RadioGroup>
                      </FormControl>
                    </>
                  )}

                  {/* Full Day Info */}
                  {timeOption === "full" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" fontWeight="600">
                        Full Day booking covers both Morning and Afternoon slots (08:30 - 16:30)
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Right Column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Calendar */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} className="booking-section-paper calendar-paper">
              <Box className="booking-section-header">
                <Calendar className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">
                  Select Dates
                </Typography>
              </Box>

              <Box sx={{ opacity: selectedRoomId && timeOption ? 1 : 0.5, pointerEvents: selectedRoomId && timeOption ? "auto" : "none" }}>
                {renderCalendar()}
              </Box>

              {(!selectedRoomId || !timeOption) && (
                <Typography color="error" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1 }}>
                  <AlertTriangle size={16} /> กรุณาเลือกห้องและช่วงเวลาก่อน
                </Typography>
              )}
            </Paper>

            {/* Details Modal */}
            <Dialog open={showDetailsModal} onClose={() => setShowDetailsModal(false)} maxWidth="sm" fullWidth>
              <DialogTitle className="booking-dialog-title">
                <Box className="booking-dialog-header">
                  <Calendar size={20} />
                  <Typography variant="h6">Booking Details</Typography>
                </Box>
              </DialogTitle>
              <DialogContent>
                {selectedDateDetails ? (
                  <>
                    <Typography variant="subtitle1" sx={{ mb: 2 }}>
                      Date: {selectedDateDetails.date}
                    </Typography>
                    {selectedDateDetails.bookings.length > 0 ? (
                      selectedDateDetails.bookings.map((booking, index) => (
                        <Card key={index} className="booking-card">
                          <CardContent>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {booking.time}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Booked by: {booking.bookedBy}
                            </Typography>
                            <Chip
                              label={booking.status === "confirmed" ? "Confirmed" : "Pending"}
                              color={booking.status === "confirmed" ? "success" : "warning"}
                              size="small"
                            />
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Typography color="text.secondary">No bookings for this date</Typography>
                    )}
                  </>
                ) : null}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowDetailsModal(false)}>Close</Button>
              </DialogActions>
            </Dialog>
          </Grid>

          {/* Booking Summary */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={3}
              sx={{
                backgroundColor: "secondary.main",
                borderRadius: "24px",
                padding: "24px",
                mt: 3,
              }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Calendar className="booking-section-icon" />
                Booking Summary
              </Typography>

              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Meeting Room Type
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {roomData?.TypeName || "-"}
                </Typography>
              </Box>

              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Selected Room
                </Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {roomsOfSameType.find((r) => r.id === selectedRoomId)?.roomnumber || "-"}
                </Typography>
              </Box>

              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Duration & Time
                </Typography>

                <Typography fontWeight={600}>
                  {timeOption === "full"
                    ? "Full Day"
                    : timeOption === "half"
                      ? getTimeLabel() || "-"
                      : timeOption === "hourly" && isHourlyAllowed
                        ? selectedHours?.length > 0
                          ? selectedHours.join(", ")
                          : "-"
                        : "-"}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ visibility: timeOption === "half" ? "visible" : "hidden" }}
                >
                  {timeOption === "half" ? getTimeRangeLabel() || "-" : "-"}
                </Typography>
              </Box>

              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Number of Days
                </Typography>
                <Chip
                  label={
                    selectedDates && selectedDates.length > 0
                      ? `${selectedDates.length} day${selectedDates.length > 1 ? "s" : ""}`
                      : "-"
                  }
                  color={selectedDates && selectedDates.length > 0 ? "primary" : "default"}
                  size="small"
                />
              </Box>

              <Box className="booking-summary-dates" mb={3}>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Selected Dates
                </Typography>
                {selectedDates && selectedDates.length > 0 ? (
                  <Box className="booking-dates-container" display="flex" flexWrap="wrap" gap={1}>
                    {selectedDates.slice(0, 4).map((date) => (
                      <Chip key={date} label={new Date(date).toLocaleDateString("en-US")} size="small" />
                    ))}
                    {selectedDates.length > 4 && (
                      <Chip label={`+${selectedDates.length - 4} more`} size="small" variant="outlined" />
                    )}
                  </Box>
                ) : (
                  <Typography>-</Typography>
                )}
              </Box>

              <Divider sx={{ mb: 3 }} />

              <Paper
                elevation={4}
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: "background.paper",
                  borderRadius: "16px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                }}
              >
                {loading ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} py={4}>
                    <CircularProgress size={60} />
                    <Typography variant="subtitle1" color="text.secondary">
                      Calculating Price...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
                      ฿{calculatedPrice?.toLocaleString() || "0"}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Price
                    </Typography>
                  </>
                )}
              </Paper>

              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" color="primary" disabled={discount.remaining <= 0 && !discount.used}>
                  <LocalOfferIcon />
                </IconButton>
                <Typography variant="body2" color="primary" flexGrow={1}>
                  You have {discount?.remaining ?? 0} free booking
                  {discount?.remaining === 1 ? "" : "s"} left
                </Typography>
                <Button
                  variant={discount.used ? "contained" : "outlined"}
                  size="small"
                  disabled={discount.remaining <= 0 && !discount.used}
                  onClick={() => {
                    setDiscount((prev) => ({ ...prev, used: !prev.used }));
                  }}
                >
                  {discount.used ? "Cancel Free Credit" : "Use Free Credit"}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Bottom Section: Contact & Details */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} className="contact-form-paper">
            <Box className="form-header">
              <Typography variant="h5" fontWeight="700" color="primary" className="form-title">
                Complete Your Booking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fill in the details below to confirm your room reservation
              </Typography>
              <Divider className="form-divider" sx={{ backgroundColor: "primary.main" }} />
            </Box>

            <Grid container spacing={3}>
              {/* Left: Contact */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} className="info-section-paper">
                  <Box className="info-section-header">
                    <User size={24} className="info-section-icon" />
                    <Typography variant="h6" fontWeight="600">
                      Your Information
                    </Typography>
                  </Box>

                  <Box className="info-fields">
                    <TextField
                      label="Full Name"
                      fullWidth
                      value={name}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <User size={20} style={{ marginRight: 8, color: "#666" }} />,
                        readOnly: true,
                        inputProps: { className: "readonly-input" },
                      }}
                      className="readonly-field"
                    />
                    <TextField
                      label="Phone Number"
                      fullWidth
                      value={phone}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Phone size={20} style={{ marginRight: 8, color: "#666" }} />,
                        readOnly: true,
                        inputProps: { className: "readonly-input" },
                      }}
                      className="readonly-field"
                    />
                    <TextField
                      label="Email Address"
                      fullWidth
                      value={email}
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Mail size={20} style={{ marginRight: 8, color: "#666" }} />,
                        readOnly: true,
                        inputProps: { className: "readonly-input" },
                      }}
                      className="readonly-field"
                    />
                  </Box>
                </Paper>
              </Grid>

              {/* Right: Booking details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} className="info-section-paper">
                  <Box className="details-section-header">
                    <Calendar size={24} className="info-section-icon" />
                    <Typography variant="h6" fontWeight="600">
                      Booking Details
                    </Typography>
                  </Box>

                  <Box className="details-fields">
                    <TextField
                      label="Purpose of Booking"
                      fullWidth
                      required
                      rows={2}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. team planning meeting, client presentation, training session, etc."
                      error={!purpose}
                      helperText={!purpose ? "Please describe the purpose of your booking." : ""}
                      className="textarea-field"
                    />

                    <FormControl fullWidth className="form-control">
                      <InputLabel id="setup-style-label">Room Setup Style</InputLabel>
                      <Select
                        labelId="setup-style-label"
                        id="setup-style-select"
                        value={selectedStyle}
                        label="Room Setup Style"
                        onChange={(e) => setSelectedStyle(e.target.value as string)}
                      >
                        {setupStyles?.map((item) => (
                          <MenuItem key={item.ID} value={item.LayoutName}>
                            {item.LayoutName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Paper elevation={2} sx={{ p: 3, borderRadius: 2, border: "1px solid", borderColor: "divider" }}>
                      <FormControl component="fieldset" sx={{ mb: 3, width: "100%" }}>
                        <FormLabel
                          component="legend"
                          sx={{
                            mb: 2,
                            fontWeight: 600,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          Required Equipment
                        </FormLabel>

                        {/* Select All */}
                        <Box sx={{ mb: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedEquipment.length === equipmentList.length}
                                indeterminate={
                                  selectedEquipment.length > 0 &&
                                  selectedEquipment.length < equipmentList.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedEquipment(equipmentList);
                                  else setSelectedEquipment([]);
                                }}
                              />
                            }
                            label="Select All"
                            sx={{ fontWeight: 600 }}
                          />
                        </Box>

                        {/* Equipment Grid */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "repeat(1, 1fr)",
                              sm: "repeat(2, 1fr)",
                              md: "repeat(3, 1fr)",
                            },
                            gap: 2,
                            maxHeight: 200,
                            overflowY: "auto",
                            pr: 1,
                          }}
                        >
                          {equipmentList.map((item: string) => (
                            <FormControlLabel
                              key={item}
                              control={
                                <Checkbox
                                  checked={selectedEquipment.includes(item)}
                                  onChange={(e) => {
                                    if (e.target.checked) setSelectedEquipment([...selectedEquipment, item]);
                                    else setSelectedEquipment(selectedEquipment.filter((eq) => eq !== item));
                                  }}
                                />
                              }
                              label={item}
                            />
                          ))}
                        </Box>
                      </FormControl>
                    </Paper>

                    <TextField
                      label="Additional Special Requests (Optional)"
                      fullWidth
                      rows={2}
                      value={additionalNote}
                      onChange={(e) => setAdditionalNote(e.target.value)}
                      placeholder="Special equipment, catering arrangements, or other requests"
                      className="textarea-field"
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Action Section */}
            <Box className="action-section">
              <Divider className="action-divider" />

              {selectedDates.length === 0 && (
                <Alert severity="info" className="date-alert" icon={<Calendar size={16} />}>
                  Please select your booking dates from the calendar above to proceed
                </Alert>
              )}

              <Box className="confirmation-section">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleSubmitBooking()}
                  disabled={
                    loading ||
                    calculatedPrice == null ||
                    selectedDates.length === 0 ||
                    !selectedRoomId ||
                    purpose.trim() === "" ||
                    !isAllowedToBookLargeRoom ||
                    (timeOption === "hourly" && !isHourlyAllowed) ||
                    (timeOption === "half" && !timeRange) // ✅ เพิ่มบรรทัดนี้
                  }
                  className="confirm-button"
                  startIcon={loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : <Check size={24} />}
                >
                  {loading ? "Processing Your Booking..." : `Confirm Booking • ฿${calculatedPrice?.toLocaleString() || "0"}`}
                </Button>

                <Typography variant="body2" color="text.secondary" className="confirmation-note" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Info size={16} /> Your booking will be confirmed immediately after payment
                </Typography>
              </Box>

              {!isAllowedToBookLargeRoom && (
                <Box className="error-alert-container" sx={{ mt: 2 }}>
                  <Alert severity="error">
                    {/* หัวข้อ */}
                    <Typography variant="subtitle1" fontWeight="bold">
                      This room exceeds the seat capacity allowed for online booking.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Please contact our staff to make a reservation:
                    </Typography>

                    {/* Contact Card */}
                    {orgInfo && (
                      <Box
                        sx={{
                          bgcolor: "background.paper",
                          borderRadius: 2,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                        }}
                      >
                        {orgInfo.Address && (
                          <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <MapPin size={16} />
                            </span>
                            {orgInfo.Address}
                          </Typography>
                        )}
                        {orgInfo.Phone && (
                          <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Phone size={16} />
                            </span>
                            <a href={`tel:${orgInfo.Phone}`} style={{ textDecoration: "none", color: "inherit" }}>
                              {orgInfo.Phone}
                            </a>
                          </Typography>
                        )}
                        {orgInfo.Email && (
                          <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <Mail size={16} />
                            </span>
                            <a
                              href={`mailto:${orgInfo.Email}`}
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              {orgInfo.Email}
                            </a>
                          </Typography>
                        )}
                        {orgInfo.FacebookUrl && (
                          <Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                              <LinkIcon size={16} />
                            </span>
                            <a
                              href={orgInfo.FacebookUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: "none", color: "inherit" }}
                            >
                              Facebook Page
                            </a>
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Alert>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

};

export default RoomBookingForm; // ✅ เพิ่มบรรทัดนี้


