// src/pages/RoomBookingForm/RoomBookingForm.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  FormHelperText,
  Zoom,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  ArrowLeft,
  Check,
  Building2,
  AlertTriangle,
  LinkIcon,
  MapPin,
  Info,
  CheckCircle2,
  Timer,
  HelpCircle,
  X,
} from "lucide-react";
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
  CreateRoomBookingInvoice,
  ListPaymentOptions,
  UpdateUserSignature,
} from "../../services/http";
import { RoomPriceInterface } from "../../interfaces/IRoomPrices";
import { useLocation, useSearchParams } from "react-router-dom";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { Base64 } from "js-base64";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { RoomsInterface } from "../../interfaces/IRooms";
import "./RoomBookingForm.css";
import "./Calendar.css";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { OrganizationInfoInterface } from "../../interfaces/IOrganizationInfo";
import { RoomBookingInvoiceInterface } from "../../interfaces/IRoomBookingInvoice";
import PDFPopup from "../../components/PDFPopup/PDFPopup";
import { PaymentOptionInterface } from "../../interfaces/IPaymentOption";
import { provincesData } from "../../constants/provinceData";
import { useUserStore } from "../../store/userStore";
import SignatureCanvas from "react-signature-canvas";

/* ========= Config / URL helper ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function toPublicUrl(p?: string) {
  if (!p) return "";
  let u = String(p).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(u)) return u;
  if (!u.startsWith("/")) u = "/" + u; // "images/..." → "/images/..."
  return `${API_BASE}${u}`;
}

/* ========= Canonical time slots (08:30–16:30) ========= */
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
const MORNING_SLOTS = HOURLY_SLOTS.slice(0, 4);
const AFTERNOON_SLOTS = HOURLY_SLOTS.slice(4);
export const MORNING_HOUR_NUMS = [8, 9, 10, 11];
export const AFTERNOON_HOUR_NUMS = [12, 13, 14, 15];

const LARGE_ROOM_MIN_SEATS = 20;

/* ========= Small helpers ========= */
const toRangeFromStart = (startHHMM: string): string => {
  const [h, m] = startHHMM.split(":").map(Number);
  const endH = h + 1;
  const end = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  return `${startHHMM}-${end}`;
};
const numHourToRange = (n: number): string | null => {
  const idx = n - 8;
  return HOURLY_SLOTS[idx] ?? null;
};
const normalizeToRanges = (arr?: any[]): string[] => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((h) => {
      if (typeof h === "string") {
        if (h.includes("-")) return h;
        if (/^\d{2}:\d{2}$/.test(h)) return toRangeFromStart(h);
        return null;
      }
      if (typeof h === "number") return numHourToRange(h);
      return null;
    })
    .filter((x): x is string => !!x);
};
const startHourFromRange = (range: string) => parseInt(range.split("-")[0].split(":")[0], 10);
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

/* ========= Types ========= */
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
  hours?: string[];
  hourlyBookedBy?: string;
  hourlyStatus?: string;
  morningBookedBy?: string;
  morningStatus?: string;
  afternoonBookedBy?: string;
  afternoonStatus?: string;
  bookedHours?: string[];
  hourly?: string[];
}
type BookedDates = Record<string, BookedDate[]>;

type AddressProps = {
  AddressNumber?: string;
  Street?: string;
  SubDistrict?: string;
  District?: string;
  Province?: string;
  PostalCode?: string;
  TaxID?: string;
}

/* ========= Component ========= */
const RoomBookingForm: React.FC<RoomBookingFormProps> = ({ onBack }) => {
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
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
  // const [bookingMap, setBookingMap] = useState<{ [date: string]: BookingDetail[] }>({});
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ date: string; bookings: BookingDetail[] } | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const location = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState(0);
  const roomtype = (location.state as any)?.selectedRoomtypes || {};
  const [roomData, setRoomData] = React.useState<RoomsInterface | null>(null);
  const [roomType, setRoomType] = useState<RoomtypesInterface>({});
  const [role, setRole] = useState<any>(null);

  const [searchParams] = useSearchParams();
  const [capacity, setCapacity] = useState<number>(0);
  const isAllowedToBookLargeRoom = capacity < LARGE_ROOM_MIN_SEATS ? true : role === 4 || role === 5;

  const [setupStyles, setSetupStyles] = useState<{ ID: number; LayoutName: string }[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);
  const [timeOption, setTimeOption] = useState<"hourly" | "half" | "full" | "none">("none");
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  const [isEmployee, setIsEmployee] = useState(false);
  const isHourlyAllowed = isEmployee;
  const [orgInfo, setOrgInfo] = useState<OrganizationInfoInterface | null>(null);
  const [errors, setErrors] = useState<AddressProps>({});

  /* Alerts helper */
  const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
  };

  const getPaymentOption = async () => {
    try {
      const resOptions = await ListPaymentOptions();
      if (resOptions) {
        setPaymentOptions(resOptions);
      }
    } catch (error) {
      console.error("Error fetching payment options:", error);
    }
  };

  /* Load org info (contact card) */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data: OrganizationInfoInterface | false = await GetOrganizationInfo();
        if (!data) {
          setOrgInfo(null);
          handleSetAlert("error", "ไม่สามารถโหลดข้อมูลหน่วยงานได้");
          return;
        }
        setOrgInfo(data);
        getPaymentOption()
      } catch (err) {
        console.error("Load org info error:", err);
        handleSetAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูลหน่วยงาน");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Load user profile */
  async function fetchUserData(userId: number) {
    setLoading(true);
    try {
      const res = await GetUserById(userId);
      if (res) {
        setName(res.FirstName + " " + res.LastName);
        setPhone(res.Phone);
        setEmail(res.Email);
        setRole(res.RoleID);
        setIsEmployee(res.IsEmployee);
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    } finally {
      setLoading(false);
    }
  }

  /* Load room type from query */
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

  /* Load basic room data, pricing, bookings */
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
    } finally {
      setLoading(false);
    }
  }

  const fetchRoomPricing = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      if (res) setPricing(res.RoomPrices || []);
    } catch (error) {
      console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

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
        // setBookingMap(bookingDetailMap);
      } else {
        setBookedDates({});
        // setBookingMap({});
      }
    } catch (error) {
      console.error("Error fetching booking map:", error);
      setBookedDates({});
      // setBookingMap({});
    } finally {
      setLoading(false);
    }
  };

  /* Bootstrap */
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
    GetAllRoomLayouts().then((data) => {
      setSetupStyles(data || []);
    });
  }, []);

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

  /* Discounts (free-use quota) */
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

  /* Price calc */
  const slotIdByName = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const p of pricing) {
      const name = (p as any)?.TimeSlot?.TimeSlotName ?? (p as any)?.TimeSlotName ?? (p as any)?.name;
      const id = (p as any)?.TimeSlot?.ID ?? (p as any)?.ID ?? (p as any)?.TimeSlotID;
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
      return selectedHours.map((name) => id(name)).filter((n): n is number => typeof n === "number");
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
      const totalPrice = calculatePrice(selectedDates, timeOption, timeRange, selectedHours, pricing);
      setCalculatedPrice(totalPrice);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedDates, timeOption, timeRange, selectedHours, pricing, discount.used]);

  useEffect(() => {
    if (!isHourlyAllowed && timeOption === "hourly") {
      setTimeOption("none");
      setSelectedHours([]);
      setSelectedDates([]);
    }
  }, [isHourlyAllowed, timeOption]);

  /* Booking detail computation */
  const getBookingDetailsFromArray = (bookings: BookedDate[]): BookingDetail[] => {
    if (!bookings || bookings.length === 0) return [];
    const details: BookingDetail[] = [];

    bookings.forEach((b) => {
      const bookedHours = normalizeToRanges(b.hours);
      const bookedSet = new Set(bookedHours);

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

      const isMorningByFlag = !!b.morning || b.type === "morning";
      const isAfternoonByFlag = !!b.afternoon || b.type === "afternoon";

      const isMorningByCoverage = b.type !== "hourly" && coversAll(bookedSet, MORNING_SLOTS);
      const isAfternoonByCoverage = b.type !== "hourly" && coversAll(bookedSet, AFTERNOON_SLOTS);

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

      if (isMorningByFlag || isMorningByCoverage) pushMorning();
      if (isAfternoonByFlag || isAfternoonByCoverage) pushAfternoon();

      if (addedTypes.has("morning") && addedTypes.has("afternoon")) {
        details.pop();
        details.pop();
        details.push({
          time: "Full Day (08:30-16:30)",
          bookedBy: b.bookedBy || "system",
          status: b.status || "confirmed",
          type: "Fullday",
          hours: [...HOURLY_SLOTS],
        });
        return;
      }

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

  /* Availability & selection */
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

  function showDateDetails(dateString: string) {
    const details = getBookingDetails(dateString);
    setSelectedDateDetails({ date: dateString, bookings: details });
    setShowDetailsModal(true);
  }

  const isSlotAvailable = (dateString: string): boolean => {
    const bookings = bookedDates[dateString] ?? [];
    if (!Array.isArray(bookings)) return true;

    if (timeOption === "full") return bookings.length === 0;

    if (timeOption === "half") {
      for (const booking of bookings) {
        if (booking.fullDay) return false;
        if (timeRange === "Morning") {
          if (booking.morning) return false;
          const anyStartInMorning = normalizeToRanges(booking.hours).some((r) => MORNING_HOUR_NUMS.includes(startHourFromRange(r)));
          if (anyStartInMorning) return false;
        }
        if (timeRange === "Afternoon") {
          if (booking.afternoon) return false;
          const anyStartInAfternoon = normalizeToRanges(booking.hours).some((r) => AFTERNOON_HOUR_NUMS.includes(startHourFromRange(r)));
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
        if (booking.afternoon && selectedHourNums.some((h) => AFTERNOON_HOUR_NUMS.includes(h))) return false;

        const bookedStarts: number[] = [];
        const collect = (arr?: string[]) =>
          normalizeToRanges(arr).forEach((r) => {
            const n = startHourFromRange(r);
            if (!Number.isNaN(n)) bookedStarts.push(n);
          });
        collect(booking.hours);
        collect(booking.bookedHours);
        collect(booking.hourly);

        if (selectedHourNums.some((n) => bookedStarts.includes(n))) return false;
      }
      return true;
    }

    return true;
  };

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
          const collect = (arr?: string[]) =>
            normalizeToRanges(arr).forEach((r) => {
              const n = startHourFromRange(r);
              if (!Number.isNaN(n)) bookedStarts.push(n);
            });
          collect(b.bookedHours);
          collect(b.hours);
          collect(b.hourly);
        });
        return !bookedStarts.includes(hourNum);
      });

      if (!canSelectDate) {
        alert(`Cannot select ${dateString} - Selected hours conflict with existing bookings on this date`);
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

  /* Calendar UI */
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
                <Typography variant="body2" sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Calendar size={14} /> {b.time}
                </Typography>
                <Typography variant="caption" display="block" sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
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

  /* Summary labels */
  const getTimeLabel = () => (timeOption === "half" ? "Half Day" : "Full Day");
  const getTimeRangeLabel = () => (timeRange === "Morning" ? "08:30 - 12:30" : "12:30 - 16:30");

  /* Hour slot toggle */
  const handleHourToggle = (hourRange: string) => {
    setSelectedHours((prev) => (prev.includes(hourRange) ? prev.filter((h) => h !== hourRange) : [...prev, hourRange]));
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

  /* Submit booking */
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
      DepositAmount: calculatedPrice / 2,
      DiscountAmount: 0,
      TotalAmount: calculatedPrice,
      Address: `${addressFormData?.AddressNumber} ${addressFormData?.Street} ${addressFormData?.SubDistrict} ${addressFormData?.District} ${addressFormData?.Province} ${addressFormData?.PostalCode}`,
      TaxID: addressFormData?.TaxID,
      PaymentOptionID: selectedOption
    };

    try {
      const resBooking = await CreateBookingRoom(bookingData);
      if (resBooking.status !== 200) {
        console.error("❌ Booking failed", resBooking.status, resBooking.data?.error);
        alert(resBooking.data?.error || "เกิดข้อผิดพลาดในการจอง");
        return;
      }

      const roomTypeKey = getRoomTypeKey(roomData.TypeName || "");
      const quotaRes = await UseRoomQuota({ user_id: userId, room_type: roomTypeKey });
      if (quotaRes.status === 200) {
        setDiscount((prev) => ({
          ...prev,
          used: false,
          totalAllowed: quotaRes.data?.meeting_room?.total ?? prev.totalAllowed,
          usedCount: quotaRes.data?.meeting_room?.used ?? prev.usedCount,
          remaining: quotaRes.data?.meeting_room?.remaining ?? Math.max(prev.remaining - 1, 0),
        }));
      } else {
        console.error("ลดโควต้าไม่สำเร็จ:", quotaRes.data);
      }

      await fetchBookingMapOnly(roomData.ID as number);

      setSelectedDates([]);
      setAdditionalNote("");
      setPurpose("");
      const val = Number(selectedRoomId);
      setSelectedRoomId(val);
      fetchBookingMapOnly(val);
      setOpenPopupInvoiceCondition(false)

      handleSetAlert("success", "Booking created successfully.");
    } catch (err) {
      console.error("Booking Error:", err);
      handleSetAlert("error", "An unexpected error occurred during create booking.");
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!addressFormData?.AddressNumber || !addressFormData?.AddressNumber.trim()) {
      newErrors.AddressNumber = "Please enter your house or building number";
    }

    if (!addressFormData?.Street || !addressFormData?.Street.trim()) {
      newErrors.Street = "Please enter your street name";
    }

    if (!addressFormData?.SubDistrict || !addressFormData?.SubDistrict.trim()) {
      newErrors.SubDistrict = "Please enter your sub-district";
    }

    if (!addressFormData?.District || !addressFormData?.District.trim()) {
      newErrors.District = "Please enter your district";
    }

    if (!addressFormData?.Province || !addressFormData?.Province.trim()) {
      newErrors.Province = "Please enter your province";
    }

    if (!addressFormData?.PostalCode || !/^\d{5}$/.test(addressFormData.PostalCode)) {
      newErrors.PostalCode = "Please enter a valid 5-digit postal code";
    }

    if (!addressFormData?.TaxID || !/^\d{13}$/.test(addressFormData.TaxID)) {
      newErrors.TaxID = "Please enter a valid 13-digit Tax ID";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };


  /* Header data */
  const roomDataHeader = {
    id: (roomtype as any).id,
    TypeName: roomType.TypeName,

    image:
      (roomtype as any).image ||
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  };
  console.log(roomType)

  /* ===== RoomType images for Carousel (ใช้รูปจริง) ===== */
  const carouselSrcs = useMemo(() => {
    type RTImage = { ID?: number; FilePath?: string; IsCover?: boolean; SortOrder?: number };
    const imgs: RTImage[] = ((roomType as any)?.RoomTypeImages ?? []).slice();

    imgs.sort((a, b) => {
      const ca = a.IsCover ? 0 : 1;
      const cb = b.IsCover ? 0 : 1;
      if (ca !== cb) return ca - cb;
      const sa = a.SortOrder ?? 9999;
      const sb = b.SortOrder ?? 9999;
      if (sa !== sb) return sa - sb;
      return (a.ID ?? 0) - (b.ID ?? 0);
    });

    const mapped = imgs.map((img) => toPublicUrl(img.FilePath)).filter(Boolean);
    return mapped.length
      ? mapped
      : ["https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop"];
  }, [roomType]);

  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionInterface[]>([])
  const [addressFormData, setAddressFormdata] = useState<AddressProps>()
  const [selectedOption, setSelectedOption] = useState<number>(0)
  const [openPopupInvoiceCondition, setOpenPopupInvoiceCondition] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [checkedCondition, setCheckedCondition] = useState(false);
  const { user } = useUserStore()
  const [openPopupSignature, setOpenPopupSignature] = useState(false)
  const sigRef = useRef<SignatureCanvas>(null);

  const handleSave = async () => {
    if (sigRef.current?.isEmpty()) {
      alert("กรุณาลงลายเซ็นก่อน");
      return;
    }

    try {
      // Get the canvas element directly
      const canvas = sigRef.current?.getCanvas();
      if (!canvas) {
        setAlerts([{ type: "error", message: "Failed to get signature canvas" }]);
        return;
      }

      // Create a new canvas with white background
      const newCanvas = document.createElement('canvas');
      const ctx = newCanvas.getContext('2d');
      if (!ctx) {
        setAlerts([{ type: "error", message: "Failed to create canvas context" }]);
        return;
      }

      // Set canvas size
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;

      // Fill with white background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);

      // Draw the signature on top
      ctx.drawImage(canvas, 0, 0);

      // Convert to blob
      newCanvas.toBlob(async (blob) => {
        if (!blob) {
          setAlerts([{ type: "error", message: "Failed to convert signature to image" }]);
          return;
        }

        // Create file from blob
        const file = new File([blob], "signature.jpg", { type: "image/jpeg" });

        // Save signature to backend
        if (user?.ID) {
          const result = await UpdateUserSignature({
            UserID: user.ID,
            Signature_Image: file
          });

          if (result.status === "success") {
            setAlerts([{ type: "success", message: "Signature saved successfully" }]);
            setOpenPopupSignature(false);

            // Refresh user data to show updated signature
            try {
              const updatedUser = await GetUserById(Number(localStorage.getItem("userId")));
              if (updatedUser) {
                // setUser(updatedUser);
                // Load the new signature image
                if (updatedUser.SignaturePath) {
                  // await loadSignatureImage(updatedUser.SignaturePath);
                }
              }
            } catch (error) {
              // Handle error silently
            }
          } else {
            setAlerts([{ type: "error", message: result.message }]);
          }
        }
      }, 'image/jpeg', 0.9);

    } catch (error) {
      setAlerts([{ type: "error", message: "Failed to save signature. Please try again." }]);
    }
  };

  const handleClear = () => {
        sigRef.current?.clear();
    };

  const serviceConditions = {
    title: "โปรดอ่านเงื่อนการให้บริการและเงื่อนไขการชำระเงิน",
    points: [
      "ขอบข่ายการให้บริการปกติ (โดยไม่เก็บเงินค่าใช้จ่ายเพิ่ม)",
      "   • เครื่องปรับอากาศ (เปิดก่อนการเริ่มงาน 30 นาที) พร้อมเจ้าหน้าที่ดูแล",
      "   • แม่บ้านทำความสะอาดภายในอาคาร (ในวันและเวลาทำการ)",
      "   • พื้นที่จอดรถด้านหน้าอาคาร",
      "   • การจัดระบบจราจร (กรณีมีผู้เข้าร่วมงานจำนวน 200 คนขึ้นไป)",
      "   • จัดสถานที่ โต๊ะ-เก้าอี้ และระบบสื่อโสตทัศนูปกรณ์ (เครื่องเสียง/จอ LED)",
      "เงื่อนไขการชำระเงิน",
      "   • ชำระค่ามัดจำ ร้อยละ 50 (ของค่าใช้จ่าย) ภายใน 7 วัน หลังลงนามรับทราบและยืนยัน หรือชำระทั้งหมด",
      "   • ชำระค่าใช้จ่ายส่วนที่เหลือ ภายใน 7 วัน หลังจากเสร็จสิ้นการจัดกิจกรรม",
      "   • กรณีชำระค่าบริการก่อนวันจัดกิจกรรม ทางอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 จะไม่สามารถคืนค่าบริการได้ทุกกรณี แต่ทางผู้จัดสามารถเลื่อนวันจัดกิจกรรมได้",
      "หมายเหตุ",
      "   • กรณีมีค่าใช้จ่ายอื่นๆ เพิ่มเติมนอกเหนือจากที่ตกลงกันไว้ตั้งแต่ต้น ท่านจะต้องรับผิดชอบและชำระค่าใช้จ่ายเพิ่มเติมเองทั้งหมด",
      "   • กรณีที่ท่านมีความประสงค์ยกเลิกการใช้พื้นที่หรือยกเลิกการจัดกิจกรรม โดยไม่แจ้งให้ทราบล่วงหน้าก่อนจัดกิจกรรม 7 วัน ทางอุทยานวิทยาศาสตร์ภูมิภาค ภาคตะวันออกเฉียงเหนือ 2 จะยึดเงินค่ามัดจำทั้งหมด",
      "คำประกาศเกี่ยวกับความเป็นส่วนตัว",
      "   • เราจะเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านซึ่งเป็นผู้ติดต่อหรือตัวแทนของนิติบุคคล เพื่อใช้ในการดำเนินการทางธุรกิจกับท่าน เช่น การจัดทำสัญญา การออกเอกสารทางบัญชี และการสื่อสารที่เกี่ยวข้องกับการให้บริการ",
      "   • หากท่านให้ข้อมูลส่วนบุคคลของผู้อื่น โปรดตรวจสอบให้แน่ใจว่าท่านได้รับความยินยอมจากบุคคลเหล่านั้นแล้ว",
      "   • การดำเนินการต่อไปถือว่าท่านรับทราบและตกลงตามนโยบายความเป็นส่วนตัวของเรา",
    ],
  };

  /* ===== Render ===== */
  return (
    <Box className="booking-container">

      {/* Condition Popup */}
      <Dialog
        open={openPopupInvoiceCondition}
        onClose={() => setOpenPopupInvoiceCondition(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "primary.main",
            textAlign: "center",
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}
        >
          <HelpCircle size={22} style={{ minWidth: '22px', minHeight: '22px', marginBottom: '2px' }} />
          Room Booking Condition
          <IconButton
            aria-label="close"
            onClick={() => setOpenPopupInvoiceCondition(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <X size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ px: 5 }}>
          <Typography
            sx={{
              whiteSpace: "pre-line",
              fontSize: 18,
              fontWeight: 600,
            }}
            gutterBottom
          >
            {serviceConditions.title}
          </Typography>
          {serviceConditions.points.map((line, index) => {
            const trimmed = line.trimStart();
            const isBullet = trimmed.startsWith("•");

            return (
              <Typography
                key={index}
                component="div"
                sx={{
                  pl: isBullet ? 3 : 0,
                  whiteSpace: "normal",
                  mb: 0.5,
                  color: isBullet
                    ? "text.secondary"
                    : "text.primary",
                }}
              >
                {line}
              </Typography>
            );
          })}
          <Grid container size={{ xs: 12 }} direction={'column'} sx={{ my: 1.6 }}>
            <FormControlLabel
            control={
              <Checkbox
                checked={checkedCondition}
                onChange={(e) => {
                  setCheckedCondition(e.target.checked);
                }}
              />
            }
            label="ข้าพเจ้าได้อ่านและรับทราบเงื่อนไขการให้บริการและการชำระเงิน"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={checkedPrivacy}
                onChange={(e) => {
                  setCheckedPrivacy(e.target.checked);
                }}
              />
            }
            label="ข้าพเจ้าได้อ่านและยอมรับตามนโยบายความเป็นส่วนตัว"
          />
          </Grid>
          
          <Grid size={{ xs: 12, md: 12 }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600 }}
              gutterBottom
            >
              Payment Option
            </Typography>
            <FormControl>
              <Select
                displayEmpty
                defaultValue={0}
                value={selectedOption || 0}
                onChange={(e) => setSelectedOption(Number(e.target.value))}
                sx={{ width: '260px' }}
              >
                <MenuItem value={0}>
                  <em>{"-- Select Payment Option --"}</em>
                </MenuItem>
                {paymentOptions.map((item, index) => {
                  return (
                    <MenuItem key={index} value={item.ID} >
                      {item.OptionName}
                    </MenuItem>
                  );
                }
                )}
              </Select>
            </FormControl>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              handleSubmitBooking()
            }}
            disabled={!checkedCondition || !checkedPrivacy || selectedOption === 0}
            variant="contained"
            startIcon={<Check size={18} />}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Signature */}
      <Dialog open={openPopupSignature} onClose={() => setOpenPopupSignature(false)}>
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* <ScrollText size={26} /> */}
          Create Signature
          <IconButton
            aria-label="close"
            onClick={() => setOpenPopupInvoiceCondition(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <X size={20} style={{ minWidth: '20px', minHeight: '20px' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ minWidth: 350, pt: "10px !important" }}>
          <Grid container size={{ xs: 12 }} spacing={2} sx={{ display: "flex", justifyContent: "center" }}>
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{
                width: 400,
                height: 300,
                style: { border: "2px solid #000", borderRadius: "8px" },
              }}
            />
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Zoom in={openPopupSignature} timeout={400}>
            <Button onClick={handleClear}>Clear</Button>
          </Zoom>
          <Zoom in={openPopupSignature} timeout={400}>
            <Button
              onClick={handleSave}
              variant="contained"
            // startIcon={<CircleX size={18} />}
            >
              Save
            </Button>
          </Zoom>
        </DialogActions>
      </Dialog>

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
          <Button startIcon={<ArrowLeft />} onClick={onBack || (() => window.history.back())} variant="text">
            Back
          </Button>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid size={{ xs: 12, lg: 6 }}>
          {/* Images (ใช้รูปจริงของ RoomType) */}
          <Grid size={{ xs: 12 }}>
            <Carousel
              indicators
              autoPlay
              animation="slide"
              duration={500}
              navButtonsAlwaysVisible
              navButtonsProps={{ className: "button-nav-button" }}
            >
              {carouselSrcs.map((src, idx) => (
                <CardMedia
                  key={`rt-img-${idx}`}
                  component="img"
                  image={src}
                  alt={`${roomType?.TypeName || "Room Type"} ${idx + 1}`}
                  className="carousel-image"
                  sx={{
                    height: { xs: 220, sm: 320, md: 420 },
                    width: "100%",
                    objectFit: "cover",
                    borderRadius: 2,
                    bgcolor: "#f5f5f5",
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1600&auto=format&fit=crop";
                  }}
                />
              ))}
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
                              control={<Checkbox checked={selectedHours.includes(hour)} onChange={() => handleHourToggle(hour)} />}
                              label={hour}
                            />
                          ))}
                        </Box>
                      </FormControl>
                    </>
                  )}

                  {/* Half Day */}
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

                  {/* Full Day info */}
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

              <Box
                sx={{
                  opacity: selectedRoomId && timeOption ? 1 : 0.5,
                  pointerEvents: selectedRoomId && timeOption ? "auto" : "none",
                  padding: "44px",
                }}
              >
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

                    <Grid container spacing={1} size={{ xs: 12 }}>
                      {/* Address Number */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Address Number
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.AddressNumber || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, AddressNumber: e.target.value }))
                          }
                          placeholder="Enter your house/building number"
                          error={!!errors.AddressNumber}
                          helperText={errors.AddressNumber}
                        />
                      </Grid>

                      {/* Street */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Street
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.Street || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, Street: e.target.value }))
                          }
                          placeholder="Enter street name"
                          error={!!errors.Street}
                          helperText={errors.Street}
                        />
                      </Grid>

                      {/* Sub-district */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Sub-district
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.SubDistrict || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, SubDistrict: e.target.value }))
                          }
                          placeholder="Enter sub-district"
                          error={!!errors.SubDistrict}
                          helperText={errors.SubDistrict}
                        />
                      </Grid>

                      {/* District */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          District
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.District || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, District: e.target.value }))
                          }
                          placeholder="Enter district"
                          error={!!errors.District}
                          helperText={errors.District}
                        />
                      </Grid>

                      {/* Province */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Province
                        </Typography>
                        <FormControl
                          fullWidth
                          error={!!errors.Province}
                        >
                          <Select
                            displayEmpty
                            defaultValue={""}
                            value={addressFormData?.Province || ""}
                            onChange={(e) =>
                              setAddressFormdata((prev) => ({ ...prev, Province: e.target.value as string }))
                            }
                            sx={{ width: '100%' }}
                          >
                            <MenuItem value={""}>
                              <em>{"-- เลือกจังหวัด --"}</em>
                            </MenuItem>
                            {provincesData.map((item, index) => {
                              return (
                                <MenuItem key={index} value={item}>{item}</MenuItem>
                              );
                            }
                            )}
                          </Select>
                          {errors.Province && (
                            <FormHelperText>
                              {errors.Province}
                            </FormHelperText>
                          )}
                        </FormControl>
                      </Grid>

                      {/* Postal Code */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Postal Code
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.PostalCode || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, PostalCode: e.target.value }))
                          }
                          placeholder="Enter postal code"
                          error={!!errors.PostalCode}
                          helperText={errors.PostalCode}
                        />
                      </Grid>

                      {/* Tax ID */}
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Tax ID
                        </Typography>
                        <TextField
                          fullWidth
                          value={addressFormData?.TaxID || ""}
                          onChange={(e) =>
                            setAddressFormdata((prev) => ({ ...prev, TaxID: e.target.value }))
                          }
                          placeholder="Enter tax ID"
                          error={!!errors.TaxID}
                          helperText={errors.TaxID}
                        />
                      </Grid>
                    </Grid>
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
                                checked={selectedEquipment.length === equipmentList.length && equipmentList.length > 0}
                                indeterminate={
                                  selectedEquipment.length > 0 && selectedEquipment.length < equipmentList.length
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
                  onClick={() => {
                    if (!validateForm()) {
                      return;
                    }
                    setOpenPopupInvoiceCondition(true)
                  }}
                  disabled={
                    loading ||
                    calculatedPrice == null ||
                    selectedDates.length === 0 ||
                    !selectedRoomId ||
                    purpose.trim() === "" ||
                    !isAllowedToBookLargeRoom ||
                    (timeOption === "hourly" && !isHourlyAllowed) ||
                    (timeOption === "half" && !timeRange)
                  }
                  className="confirm-button"
                  startIcon={loading ? <CircularProgress size={24} sx={{ color: "white" }} /> : <Check size={24} />}
                >
                  {loading
                    ? "Processing Your Booking..."
                    : `Confirm Booking • ฿${calculatedPrice?.toLocaleString() || "0"}`}
                </Button>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="confirmation-note"
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Info size={16} /> Your booking will be confirmed immediately after payment
                </Typography>
              </Box>

              {!isAllowedToBookLargeRoom && (
                <Box className="error-alert-container" sx={{ mt: 2 }}>
                  <Alert severity="error">
                    <Typography variant="subtitle1" fontWeight="bold">
                      This room exceeds the seat capacity allowed for online booking.
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Please contact our staff to make a reservation:
                    </Typography>

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
                            <a href={`mailto:${orgInfo.Email}`} style={{ textDecoration: "none", color: "inherit" }}>
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

export default RoomBookingForm;
