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
  CardMedia,
  Tooltip,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  InputAdornment,
  Checkbox,
  InputLabel,
  IconButton,
  Container,
  Alert,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select"; // ⬅️ select ของโปรเจกต์ (ใช้ในส่วนทั่วไป)
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import {
  Calendar,
  Clock,
  User,
  Mail,
  Phone,
  Check,
  Building2,
  AlertTriangle,
  Info,
  CheckCircle2,
  Timer,
  HelpCircle,
  X,
  ChevronLeft,
  FileText,
  BookOpenCheck ,
  TicketPercent ,
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
  ListPaymentOptions,
  CreateNotification,
} from "../../services/http";
import { RoomPriceInterface } from "../../interfaces/IRoomPrices";
import { useLocation, useSearchParams } from "react-router-dom";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { Base64 } from "js-base64";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { RoomsInterface } from "../../interfaces/IRooms";
import "./RoomBookingForm.css";
import "./Calendar.css";

import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { OrganizationInfoInterface } from "../../interfaces/IOrganizationInfo";
import { PaymentOptionInterface } from "../../interfaces/IPaymentOption";
import { useUserStore } from "../../store/userStore";
import { NotificationsInterface } from "../../interfaces/INotifications";
import { validateCorporateRegistrationNumber } from "../../utils/corporateRegistrationValidator";
import NumberedLabel from "../../components/NumberedLabel/NumberedLabel";

/* ========= Config / URL helper ========= */
const API_BASE =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, "") || "http://localhost:8000";

function toPublicUrl(p?: string) {
  if (!p) return "";
  let u = String(p).trim().replace(/\\/g, "/");
  if (/^https?:\/\//i.test(u)) return u;
  if (!u.startsWith("/")) u = "/" + u;
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
const startHourFromRange = (range: string) =>
  parseInt(range.split("-")[0].split(":")[0], 10);
const endFromRange = (range: string) => range.split("-")[1];
const groupContiguousByIndex = (ranges: string[]): string[][] => {
  const idmd = Array.from(new Set(ranges.map((r) => HOURLY_SLOTS.indexOf(r))))
    .filter((i) => i >= 0)
    .sort((a, b) => a - b);
  if (!idmd.length) return [];
  const out: number[][] = [];
  let cur = [idmd[0]];
  for (let i = 1; i < idmd.length; i++) {
    if (idmd[i] === idmd[i - 1] + 1) cur.push(idmd[i]);
    else {
      out.push(cur);
      cur = [idmd[i]];
    }
  }
  out.push(cur);
  return out.map((g) => g.map((ix) => HOURLY_SLOTS[ix]));
};
const coversAll = (booked: Set<string>, required: string[]) =>
  required.every((h) => booked.has(h));

/* ========= Types ========= */
interface RoomBookingFormProps {
  room?: { id: number; TypeName: string; image?: string };
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
  AddressName?: string;
  AddressNumber?: string;
  Street?: string;
  SubDistrict?: string;
  District?: string;
  Province?: string;
  PostalCode?: string;
  TaxID?: string;
};

type UserPackageLite = {
  package_name?: string;
  meeting_room_limit?: number;            // ฟรีห้องประชุม/ปี
  training_room_limit?: number;           // โควตา 50% สำหรับ training
  multi_function_room_limit?: number;     // โควตา 50% สำหรับ hall
};

type PackageBenefits = {
  meetingFreePerYear: number;
  meetingHalf: boolean;       // เปิดสิทธิ์ 50% สำหรับ meeting (จะยังถูกปิดถ้ามีสิทธิ์ฟรีเหลือ)
  trainingHalf: boolean;      // เปิดสิทธิ์ 50% สำหรับ training
  hallHalf: boolean;          // เปิดสิทธิ์ 50% สำหรับ hall
  trainingHalfQuota: number;
  hallHalfQuota: number;
};

function benefitsFromPackage(pkg?: UserPackageLite | null): PackageBenefits {
  const tier = String(pkg?.package_name ?? "none").trim().toLowerCase();

  const meetingFreePerYear = Number(pkg?.meeting_room_limit) || 0;
  const trainingHalfQuota = Number(pkg?.training_room_limit) || 0;
  const hallHalfQuota = Number(pkg?.multi_function_room_limit) || 0;

  return {
    meetingFreePerYear,
    // อนุญาต 50% สำหรับ meeting ตั้งแต่ Silver ขึ้นไป (tier !== 'none')
    // การ "บังคับใช้สิทธิ์ฟรีก่อน" ยังควบคุมด้วย disabled เงื่อนไข quotas.meeting.remaining > 0
    meetingHalf: tier !== "none",

    // เปิดตามโควตา
    trainingHalf: trainingHalfQuota > 0,
    hallHalf: hallHalfQuota > 0,

    trainingHalfQuota,
    hallHalfQuota,
  };
}

/* ========= Component ========= */
const RoomBookingForm: React.FC<RoomBookingFormProps> = ({ onBack }) => {
  /* --- UI & form state --- */
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
  const [timeRange, setTimeRange] = useState<"Morning" | "Afternoon" | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);

  /* --- booking data --- */
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [roomsOfSameType, setRoomsOfSameType] = useState<
    { RoomStatusID: number; id: number; roomnumber: string; RoomStatus?: RoomStatusInterface }[]
  >([]);
  const [selectedRoomId, setSelectedRoomId] = useState(0);
  const [roomData, setRoomData] = useState<RoomsInterface | null>(null);
  const [roomType, setRoomType] = useState<RoomtypesInterface>({});

  const [setupStyles, setSetupStyles] = useState<{ ID: number; LayoutName: string }[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>("");
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [equipmentList, setEquipmentList] = useState<string[]>([]);
  const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);
  const [timeOption, setTimeOption] = useState<"hourly" | "half" | "full" | "none">("none");
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  /* --- user/org --- */
  const [isEmployee, setIsEmployee] = useState(false);
  const isHourlyAllowed = isEmployee;
  const [, setOrgInfo] = useState<OrganizationInfoInterface | null>(null); // ไม่ใช้ค่าอ่านตรง ๆ เพื่อกัน warning
  const [errors, setErrors] = useState<AddressProps>({});
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useUserStore();
  const [paymentOptions, setPaymentOptions] = useState<PaymentOptionInterface[]>([]);
  const [selectedOption, setSelectedOption] = useState<number>(0);
  const [openPopupInvoiceCondition, setOpenPopupInvoiceCondition] = useState(false);
  const [checkedPrivacy, setCheckedPrivacy] = useState(false);
  const [checkedCondition, setCheckedCondition] = useState(false);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [currentLanguage, setCurrentLanguage] = useState<'th' | 'en'>('en')

  const [userPackage, setUserPackage] = useState<UserPackageLite | null>(null);
  const [pkgBenefits, setPkgBenefits] = useState<PackageBenefits>({
    meetingFreePerYear: 0,
    meetingHalf: false,
    trainingHalf: false,
    hallHalf: false,
    trainingHalfQuota: 0,
    hallHalfQuota: 0
  });
  const hasPackage = !!userPackage && String(userPackage.package_name || "").toLowerCase() !== "none";

  /* --- address --- */
  const [addressFormData, setAddressFormdata] = useState<AddressProps>({
    AddressName: "มหาวิทยาลัยเทคโนโลยีสุรนารี",
    AddressNumber: "111",
    Street: "ถนนมหาวิทยาลัย",
    SubDistrict: "สุรนารี",
    District: "เมืองนครราชสีมา",
    Province: "นครราชสีมา",
    PostalCode: "30000",
    TaxID: "1329901260995",
  });

  /* ========= Helpers ========= */
  const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlerts((prev) => [...prev, { type, message }]);
  };

  const getPaymentOption = async () => {
    try {
      const res = await ListPaymentOptions();
      if (res) setPaymentOptions(res);
    } catch (error) {
      console.error("Error fetching payment options:", error);
    }
  };

  /* ========= Real-time Validation ========= */
  // Real-time validation for Tax ID
  useEffect(() => {
    if (addressFormData?.TaxID && addressFormData.TaxID.length === 13) {
      const isValidFormat = /^\d{13}$/.test(addressFormData.TaxID);
      if (isValidFormat) {
        const isValidTaxID = validateCorporateRegistrationNumber(addressFormData.TaxID);
        if (isValidTaxID) {
          // Clear error if valid
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.TaxID;
            return newErrors;
          });
          setFormErrors(prev => {
            const newFormErrors = { ...prev };
            delete newFormErrors.TaxID;
            return newFormErrors;
          });
        } else {
          // Set error if invalid
          setErrors(prev => ({ ...prev, TaxID: "Invalid Tax ID. Please check the 13-digit number." }));
          setFormErrors(prev => ({ ...prev, TaxID: "Invalid Tax ID. Please check the 13-digit number." }));
        }
      } else {
        // Set error if format is invalid
        setErrors(prev => ({ ...prev, TaxID: "Please enter a valid 13-digit Tax ID" }));
        setFormErrors(prev => ({ ...prev, TaxID: "Please enter a valid 13-digit Tax ID" }));
      }
    } else if (addressFormData?.TaxID && addressFormData.TaxID.length > 0 && addressFormData.TaxID.length < 13) {
      // Show progress message while typing
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.TaxID;
        return newErrors;
      });
      setFormErrors(prev => {
        const newFormErrors = { ...prev };
        delete newFormErrors.TaxID;
        return newFormErrors;
      });
    }
  }, [addressFormData?.TaxID]);

  /* ========= Bootstrap / Loaders ========= */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data: OrganizationInfoInterface | false = await GetOrganizationInfo();
        if (!data) {
          setOrgInfo(null);
          handleSetAlert("error", "Unable to load organization information");
          return;
        }
        setOrgInfo(data);
        getPaymentOption();
      } catch (err) {
        console.error("Load org info error:", err);
        handleSetAlert("error", "An error occurred while loading organization information");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function fetchUserData(userId: number) {
    setLoading(true);
    try {
      const res = await GetUserById(userId);
      if (res) {
        setName(res.FirstName + " " + res.LastName);
        setPhone(res.Phone);
        setEmail(res.Email);
        setIsEmployee(!!res.IsEmployee);
        const pkg: UserPackageLite = res.Package || null;
        setUserPackage(pkg);
        setPkgBenefits(benefitsFromPackage(pkg));
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    } finally {
      setLoading(false);
    }
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
      if (res?.BookedDates) {
        const convertedData: BookedDates = convertBookedDates(res.BookedDates);
        setBookedDates(convertedData);
      } else {
        setBookedDates({});
      }
    } catch (error) {
      console.error("Error fetching booking map:", error);
      setBookedDates({});
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
          const formatted = data.map((room: any) => ({
            id: room.ID,
            roomnumber: room.RoomNumber,
            RoomStatusID: room.RoomStatusID,
            RoomStatus: {
              ID: room.RoomStatus.ID,
              StatusName: room.RoomStatus.status_name,
              Code: room.RoomStatus.code,
            },
          }));
          setRoomsOfSameType(formatted);
        }
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    if (roomType?.ID) {
      GetEquipmentByRoomType(roomType.ID).then((data) => {
        if (data) setEquipmentList(data.map((item: any) => item.EquipmentName));
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    GetAllRoomLayouts().then((data) => setSetupStyles(data || []));
  }, []);

  /* ========= Membership & Quotas ========= */
  const [quotas, setQuotas] = useState({
    meeting: { total: 0, used: 0, remaining: 0 },
    training: { total: 0, used: 0, remaining: 0 },
    multi: { total: 0, used: 0, remaining: 0 },
  });

  const [discount, setDiscount] = useState({
    type: "free-use" as const,
    name: "Free Meeting Room Credit",
    description: "You can use the meeting room for free once",
    totalAllowed: 0,
    usedCount: 0,
    remaining: 0,
    used: false,
  });

  const [applyMemberDiscount, setApplyMemberDiscount] = useState<boolean>(false);

  useEffect(() => {
    const loadQuota = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "");
      const res = await GetRoomQuota(userId);
      if (!res) return;

      const mt = res.meeting || res.meeting_room || { total: 0, used: 0, remaining: 0 };
      const tt = res.training || { total: 0, used: 0, remaining: 0 };
      const ft = res.multi || { total: 0, used: 0, remaining: 0 };
      setQuotas({ meeting: mt, training: tt, multi: ft });

      setDiscount((prev) => ({
        ...prev,
        totalAllowed: mt.total,
        usedCount: mt.used,
        remaining: mt.remaining,
        used: false,
      }));
    };
    loadQuota();
  }, []);

  // หาหมวดจาก roomType (ถ้า backend ยังไม่มี Category ให้เดาเบา ๆ จากชื่อ)
  const inferCategory = (name: string): "meetingroom" | "trainingroom" | "multifunctionroom" => {
    const n = (name || "").toLowerCase();
    if (/training|seminar/.test(n)) return "trainingroom";
    if (/hall/.test(n)) return "multifunctionroom";
    return "meetingroom";
  };
  const currentCategory = (roomType as any)?.Category
    ? String((roomType as any).Category).toLowerCase()
    : inferCategory(roomType?.TypeName || roomData?.TypeName || "");
  const isMeetingCategory = currentCategory === "meetingroom";

  // ตั้งค่า default ของปุ่ม “Apply 50% Member Discount”
  useEffect(() => {
    let def = false;
    if (hasPackage) {
      if (currentCategory === "trainingroom" && pkgBenefits.trainingHalf) def = true;
      else if (currentCategory === "multifunctionroom" && pkgBenefits.hallHalf) def = true;
      else if (isMeetingCategory && pkgBenefits.meetingHalf && quotas.meeting.remaining <= 0) def = true;
    }
    setApplyMemberDiscount(def);
  }, [currentCategory, quotas, hasPackage, pkgBenefits, isMeetingCategory]);

  /* ========= Price calc ========= */
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

    // Meeting: ใช้สิทธิ์ฟรี → 0 บาท
    if (hasPackage && isMeetingCategory && pkgBenefits.meetingFreePerYear > 0 && discount.used) return 0;

    // 1) base price
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

    // 2) membership 50% (toggle)
    const canHalf =
      (isMeetingCategory && pkgBenefits.meetingHalf && quotas.meeting.remaining <= 0) ||
      (currentCategory === "trainingroom" && pkgBenefits.trainingHalf) ||
      (currentCategory === "multifunctionroom" && pkgBenefits.hallHalf);

    if (hasPackage && applyMemberDiscount && canHalf) {
      totalPrice *= 0.5;
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
  }, [
    selectedDates,
    timeOption,
    timeRange,
    selectedHours,
    pricing,
    discount.used,
    applyMemberDiscount,
    quotas,
    currentCategory,
    hasPackage,
    isMeetingCategory,
  ]);

  useEffect(() => {
    if (!isHourlyAllowed && timeOption === "hourly") {
      setTimeOption("none");
      setSelectedHours([]);
      setSelectedDates([]);
    }
  }, [isHourlyAllowed, timeOption]);

  /* ========= Booking detail computation ========= */
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

  /* ========= Availability & selection ========= */
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
    // Modal functionality removed for now
    console.log("Date details:", dateString, details);
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
          const anyStartInMorning = normalizeToRanges(booking.hours).some((r) =>
            MORNING_HOUR_NUMS.includes(startHourFromRange(r))
          );
          if (anyStartInMorning) return false;
        }
        if (timeRange === "Afternoon") {
          if (booking.afternoon) return false;
          const anyStartInAfternoon = normalizeToRanges(booking.hours).some((r) =>
            AFTERNOON_HOUR_NUMS.includes(startHourFromRange(r))
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

  /* ========= Header data ========= */
  const roomtypeState = (location.state as any)?.selectedRoomtypes || {};
  const roomDataHeader = {
    id: (roomtypeState as any).id,
    TypeName: roomType.TypeName,
    image:
      (roomtypeState as any).image ||
      "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  };

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

  /* ========= Submit booking ========= */
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const thaiRegex = /^[\u0E00-\u0E7F\s]+$/; // Allow only Thai characters + spaces

    // Validate purpose field
    if (!purpose?.trim()) {
      newErrors.purpose = "Please describe the purpose of your booking.";
    }

    if (!addressFormData?.AddressNumber?.trim())
      newErrors.AddressNumber = "Please enter your house or building number";

    if (!addressFormData?.Street?.trim()) {
      newErrors.Street = "Please enter your street name (in Thai)";
    } else if (!thaiRegex.test(addressFormData.Street)) {
      newErrors.Street = "Street name must be in Thai";
    }

    if (!addressFormData?.SubDistrict?.trim()) {
      newErrors.SubDistrict = "Please enter your sub-district (in Thai)";
    } else if (!thaiRegex.test(addressFormData.SubDistrict)) {
      newErrors.SubDistrict = "Sub-district must be in Thai";
    }

    if (!addressFormData?.District?.trim()) {
      newErrors.District = "Please enter your district (in Thai)";
    } else if (!thaiRegex.test(addressFormData.District)) {
      newErrors.District = "District must be in Thai";
    }

    if (!addressFormData?.Province?.trim()) {
      newErrors.Province = "Please enter your province (in Thai)";
    } else if (!thaiRegex.test(addressFormData.Province)) {
      newErrors.Province = "Province must be in Thai";
    }

    if (!addressFormData?.PostalCode || !/^\d{5}$/.test(addressFormData.PostalCode))
      newErrors.PostalCode = "Please enter a valid 5-digit postal code";

    if (!addressFormData?.TaxID || !/^\d{13}$/.test(addressFormData.TaxID)) {
      newErrors.TaxID = "Please enter a valid 13-digit Tax ID";
    } else if (!validateCorporateRegistrationNumber(addressFormData.TaxID)) {
      newErrors.TaxID = "Invalid Tax ID. Please check the 13-digit number.";
    }

    setErrors(newErrors);
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitBooking = async () => {
    if (!user?.SignaturePath || user.SignaturePath === "") {
      handleSetAlert("warning", "Please upload your signature before proceeding.");
      return;
    }
    if (!isHourlyAllowed && timeOption === "hourly") {
      alert("Your role is not allowed to book hourly.");
      return;
    }

    const userId = parseInt(localStorage.getItem("userId") || "0");
    if (!userId || !roomData || !purpose || !selectedDates.length || getTimeSlotIds().length === 0) {
      alert("Please fill in all the required fields.");
      return;
    }

    // 🚫 ราคาเป็น 0 ต้องเป็นกรณีใช้สิทธิ์ฟรี meeting เท่านั้น
    if (
      calculatedPrice === 0 &&
      !(hasPackage && isMeetingCategory && pkgBenefits.meetingFreePerYear > 0 && discount.used)
    ) {
      alert("The calculated price is 0. Please check the discount or booking information");
      return;
    }

    const canHalf =
      (isMeetingCategory && pkgBenefits.meetingHalf && quotas.meeting.remaining <= 0) ||
      (currentCategory === "trainingroom" && pkgBenefits.trainingHalf) ||
      (currentCategory === "multifunctionroom" && pkgBenefits.hallHalf);

    const bookingData = {
      UserID: userId,
      RoomID: selectedRoomId,
      TimeSlotIDs: getTimeSlotIds(),
      Purpose: purpose,
      AdditionalInfo: JSON.stringify({
        setupStyle: selectedStyle,
        equipment: selectedEquipment,
        additionalNote,
        discounts: {
          usedFreeCredit:
            hasPackage && isMeetingCategory && pkgBenefits.meetingFreePerYear > 0 ? discount.used : false,
          appliedMember50:
            hasPackage && canHalf ? applyMemberDiscount : false,
        },
        package: {
          name: userPackage?.package_name || "none",
          meeting_room_limit: userPackage?.meeting_room_limit ?? 0,
          training_room_limit: userPackage?.training_room_limit ?? 0,
          multi_function_room_limit: userPackage?.multi_function_room_limit ?? 0,
        },
      }),
      Dates: selectedDates,
      DepositAmount: calculatedPrice / 2,
      DiscountAmount: 0,
      TotalAmount: calculatedPrice,
      Address: `${addressFormData.AddressName} - ${addressFormData?.AddressNumber} ${addressFormData?.Street} ${addressFormData?.SubDistrict} ${addressFormData?.District} ${addressFormData?.Province} ${addressFormData?.PostalCode}`,
      TaxID: addressFormData?.TaxID,
      PaymentOptionID: selectedOption,
    };

    try {
      const resBooking = await CreateBookingRoom(bookingData);
      if (resBooking.status !== 200) {
        console.error("❌ Booking failed", resBooking.status, resBooking.data?.error);
        alert(resBooking.data?.error || "An error occurred during booking");
        return;
      }

      // Meeting: ตัดโควตาเฉพาะเมื่อกดใช้สิทธิ์ฟรีจริง ๆ
      if (hasPackage && isMeetingCategory && pkgBenefits.meetingFreePerYear > 0 && discount.used) {
        const quotaRes = await UseRoomQuota({ user_id: userId, room_type: "meeting" });
        if (quotaRes.status === 200) {
          const refreshed = await GetRoomQuota(userId);
          if (refreshed?.meeting) {
            setQuotas((q) => ({ ...q, meeting: refreshed.meeting }));
            setDiscount((prev) => ({
              ...prev,
              totalAllowed: refreshed.meeting.total,
              usedCount: refreshed.meeting.used,
              remaining: refreshed.meeting.remaining,
              used: false,
            }));
          }
        } else {
          console.error("Failed to reduce quota:", quotaRes.data);
        }
      }

      const notificationData: NotificationsInterface = {
        BookingRoomID: resBooking.data.booking_id,
      };

      await CreateNotification(notificationData);

      // refresh หน้าปฏิทิน
      await fetchBookingMapOnly(roomData.ID as number);

      // reset บางส่วน
      setSelectedDates([]);
      setAdditionalNote("");
      setPurpose("");
      if (selectedRoomId) {
        const val = Number(selectedRoomId);
        setSelectedRoomId(val);
        await fetchBookingMapOnly(val);
      }
      setOpenPopupInvoiceCondition(false);

      handleSetAlert("success", "Booking created successfully.");
    } catch (err) {
      console.error("Booking Error:", err);
      handleSetAlert("error", "An unexpected error occurred during create booking.");
    }
  };

  /* ========= UI: Calendar ========= */
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
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
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
            <Typography variant="body2" sx={{ color: "#4caf50" }}>Available</Typography>
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
      <Box className="calendar-container">
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
      </Box>
    );
  };

  /* ========= Summary labels ========= */
  const getTimeLabel = () => (timeOption === "half" ? "Half Day" : "Full Day");
  const getTimeRangeLabel = () => (timeRange === "Morning" ? "08:30 - 12:30" : "12:30 - 16:30");
  const handleHourToggle = (hourRange: string) => {
    setSelectedHours((prev) => (prev.includes(hourRange) ? prev.filter((h) => h !== hourRange) : [...prev, hourRange]));
  };

  const thaiTerms = [
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
    "เกี่ยวกับความเป็นส่วนตัว",
    "   • เราจะเก็บรวบรวมและใช้ข้อมูลส่วนบุคคลของท่านเพื่อการดำเนินการทางธุรกิจกับท่าน เช่น การจัดทำสัญญา การออกเอกสารทางบัญชี และการสื่อสารที่เกี่ยวข้องกับการให้บริการ",
    "   • หากท่านให้ข้อมูลส่วนบุคคลของผู้อื่น โปรดตรวจสอบว่าท่านได้รับความยินยอมจากบุคคลเหล่านั้นแล้ว",
    "   • การดำเนินการต่อไปถือว่าท่านรับทราบและตกลงตามนโยบายความเป็นส่วนตัวของเรา",
    "เงื่อนไขเกี่ยวกับลายเซ็น (สำคัญ)",
    "   • โปรดอัปโหลดลายเซ็นที่โปรไฟล์เพื่อใช้ในการออกเอกสาร (บังคับ)",
    "   • ท่านสามารถลบลายเซ็นได้เมื่อได้รับใบแจ้งหนี้แล้ว",
    "   • หากลบลายเซ็นก่อนที่จะได้รับใบแจ้งหนี้ จะไม่สามารถดำเนินการจองห้องต่อได้",
  ]

  const englishTerms = [
    "Scope of Standard Services (without additional charges)",
    "   • Air conditioning (turned on 30 minutes before the event) with staff on duty",
    "   • Housekeeping for indoor cleaning (on business days and during business hours)",
    "   • Parking spaces in front of the building",
    "   • Traffic management (in case of more than 200 attendees)",
    "   • Venue setup, tables, chairs, and audiovisual equipment (sound system/LED screen)",
    "Payment Terms",
    "   • Pay a deposit of 50% (of total expenses) within 7 days after signing acknowledgment and confirmation, or pay in full",
    "   • Pay the remaining balance within 7 days after the completion of the event",
    "   • In case of advance payment before the event date, the Northeastern Science Park 2 will not provide any refund. However, the organizer may reschedule the event date.",
    "Remarks",
    "   • Any additional expenses beyond the initial agreement must be borne and paid in full by the organizer.",
    "   • If the organizer wishes to cancel the venue or event without prior notice at least 7 days before the event, the Northeastern Science Park 2 will retain the entire deposit.",
    "Privacy",
    "   • We will collect and use your personal information for business operations with you, such as contract preparation, accounting documentation, and service-related communications.",
    "   • If you provide personal information of others, please ensure you have obtained their consent.",
    "   • Proceeding further shall be deemed as acknowledgment and agreement to our privacy policy.",
    "Signature Conditions (Important)",
    "   • Please upload your signature to your profile for document issuance (mandatory).",
    "   • You may delete your signature after receiving the invoice.",
    "   • If you delete your signature before receiving the invoice, the room reservation cannot proceed.",
  ]

  /* ========= Render ========= */
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HelpCircle size={22} style={{ minWidth: "22px", minHeight: "22px", marginBottom: "2px" }} />
            Room Booking Condition
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              variant="outlinedGray"
              size="small"
              onClick={() => setCurrentLanguage(currentLanguage === 'th' ? 'en' : 'th')}
              sx={{ minWidth: 80, fontSize: '0.75rem' }}
            >
              {currentLanguage === 'th' ? 'EN' : 'TH'}
            </Button>
            <IconButton
              aria-label="close"
              onClick={() => setOpenPopupInvoiceCondition(false)}
            >
              <X size={20} style={{ minWidth: "20px", minHeight: "20px" }} />
            </IconButton>
          </Box>

        </DialogTitle>

        <DialogContent dividers sx={{ px: 5 }}>
          <Typography sx={{ whiteSpace: "pre-line", fontSize: 18, fontWeight: 600 }} gutterBottom>
            {currentLanguage === "en" ? "Please read the Terms of Service and Payment Terms" : "โปรดอ่านเงื่อนการให้บริการและเงื่อนไขการชำระเงิน"}
          </Typography>
          {(currentLanguage === "en" ? englishTerms : thaiTerms).map((line, index) => {
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
                  color: "text.primary",
                  mt: isBullet ? 0 : 1.6,
                  fontWeight: isBullet ? 400 : 500,
                }}
              >
                {line}
              </Typography>
            );
          })}

          <Grid container direction={"column"} sx={{ my: 1.6 }}>
            <FormControlLabel
              control={<Checkbox checked={checkedCondition} onChange={(e) => setCheckedCondition(e.target.checked)} />}
              label={currentLanguage === "en" ? "I have read and acknowledged the Terms of Service and Payment Terms." : "ข้าพเจ้าได้อ่านและรับทราบเงื่อนไขการให้บริการและการชำระเงิน"}
            />
            <FormControlLabel
              control={<Checkbox checked={checkedPrivacy} onChange={(e) => setCheckedPrivacy(e.target.checked)} />}
              label={currentLanguage === "en" ? "I have read and accepted the Privacy Policy." : "ข้าพเจ้าได้อ่านและยอมรับตามนโยบายความเป็นส่วนตัว"}
            />
          </Grid>

          {/* Payment Option */}
          <Grid container>
            <Grid size={{ md: 12 }} >
              <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                Payment Option
              </Typography>
              <FormControl>
                <Select
                  displayEmpty
                  value={selectedOption || 0}
                  onChange={(e) => setSelectedOption(Number(e.target.value))}
                  sx={{ width: "260px" }}
                >
                  <MenuItem value={0}>
                    <em>-- Select Payment Option --</em>
                  </MenuItem>
                  {paymentOptions.map((item, index) => (
                    <MenuItem key={index} value={item.ID}>
                      {item.OptionName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 4, py: 2.5, gap: 1 }}>
          <Button variant="outlinedGray" onClick={() => setOpenPopupInvoiceCondition(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitBooking}
            disabled={!checkedCondition || !checkedPrivacy || selectedOption === 0}
            variant="contained"
            startIcon={<Check size={18} />}
            sx={{ px: 3, marginLeft: "0px !important" }}
          >
            Confirm Booking
          </Button>
        </DialogActions>
      </Dialog>

      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <Container maxWidth={false} sx={{ padding: "0px !important" }} >
        <Grid container spacing={2} size={{ md: 12 }}>

          <Grid size={{ md: 12 }} container sx={{ justifyContent: 'end' }}>
            <Button
              onClick={onBack || (() => window.history.back())}
              variant="outlinedGray"
            >
              <ChevronLeft size={20} style={{ minWidth: "20px", minHeight: "20px", marginBottom: "10px" }} />
              <Typography variant="textButtonClassic">Back</Typography>
            </Button>
          </Grid>

          {/* Header */}
          <Grid size={{ md: 12 }} >
            <Card className="booking-header-paper">
              <Box className="booking-header-content">
                <Box>
                  <Typography variant="h4" fontWeight="bold" mb={1}>
                    {roomDataHeader.TypeName}
                  </Typography>
                  <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                    Book meeting rooms online - convenient and fast
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Grid>

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
              {carouselSrcs.map((src, idx) => (
                <CardMedia
                  key={`rt-img-${idx}`}
                  component="img"
                  image={src}
                  alt={`${roomType?.TypeName || "Room Type"} ${idx + 1}`}
                  className="carousel-image"
                  sx={{
                    height: { md: 450, sm: 320, sx: 420 },
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

          <Grid size={{ md: 12 }} container spacing={2} sx={{ alignItems: 'stretch' }}>
            <Grid size={{ md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>
              {/* Section 1: Select Room + Duration & Time */}
              <Card className="booking-section-paper" sx={{ borderRadius: 3, mb: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                <Box className="booking-section-header">
                  <Building2 className="booking-section-icon" />
                  <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>
                    Select Room
                  </Typography>
                  <NumberedLabel number={1} />
                </Box>

                <Box
                  className="booking-section paper-room-selection-paper"
                  sx={{ backgroundColor: "secondary.main", borderRadius: 2, p: 3, mb: 3 }}
                >
                  <FormControl fullWidth>
                    <Select
                      value={selectedRoomId || 0}
                      displayEmpty
                      onChange={(e: any) => {
                        const val = Number(e.target.value);
                        setSelectedRoomId(val);
                        if (!val) return;
                        fetchBookingMapOnly(val);
                        setSelectedDates([]);
                        fetchRoomPricing(val);
                        fetchRoomData(val);
                      }}
                    >
                      <MenuItem value={0}>
                        <em>-- Select a Room --</em>
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
                </Box>

                <Box className="booking-section-header">
                  <Clock className="booking-section-icon" />
                  <Typography variant="h6" fontWeight="600">
                    Select Duration & Time
                  </Typography>
                </Box>
Booking Details
                {loading && !pricing.length ? (
                  <Box className="booking-loading-container">
                    <CircularProgress size={24} />
                    <Typography className="booking-loading-text">Loading Prices...</Typography>
                  </Box>
                ) : (
                  <>
                    <FormControl component="fieldset" className="booking-duration-options">
                      <RadioGroup
                        value={timeOption}
                        onChange={(e) => {
                          const val = e.target.value as "hourly" | "half" | "full";
                          setTimeOption(val);
                          setTimeRange(null);
                          setSelectedHours([]);
                          setSelectedDates([]);
                        }}
                        row
                      >
                        {isHourlyAllowed && (
                          <FormControlLabel value="hourly" control={<Radio />} label={<Typography fontWeight={500}>Hourly</Typography>} />
                        )}
                        <FormControlLabel
                          value="half"
                          control={<Radio />}
                          label={<Typography fontWeight={500}>Half Day (4 hours)</Typography>}
                        />
                        <FormControlLabel
                          value="full"
                          control={<Radio />}
                          label={<Typography fontWeight={500}>Full Day (8 hours)</Typography>}
                        />
                      </RadioGroup>
                    </FormControl>

                    {isHourlyAllowed && timeOption === "hourly" && (
                      <>
                        <Divider className="booking-time-divider" />
                        <FormControl component="fieldset">
                          <Typography variant="subtitle1" className="booking-time-legend" sx={{ fontWeight: 600, mb: 2 }}>
                            Select Hourly Slots
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                            {HOURLY_SLOTS.map((hour) => (
                              <FormControlLabel
                                key={hour}
                                control={
                                  <Radio
                                    checked={selectedHours.includes(hour)}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleHourToggle(hour);
                                    }}
                                  />
                                }
                                label={hour}
                              />
                            ))}
                          </Box>
                        </FormControl>
                      </>
                    )}

                    {timeOption === "half" && (
                      <>
                        <Divider className="booking-time-divider" />
                        <FormControl component="fieldset">
                          <Typography variant="subtitle1" className="booking-time-legend" sx={{ fontWeight: 600, mb: 2 }}>
                            Time Slot (Half Day)
                          </Typography>
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

                    {timeOption === "full" && (
                      <>
                        <Divider className="booking-time-divider" />
                        <Box sx={{ mt: 2 }}>
                          <Typography>Full Day booking covers both Morning and Afternoon (08:30 - 16:30)</Typography>
                        </Box>
                      </>
                    )}
                  </>
                )}
              </Card>

              {/* Required Equipment Card */}
              <Card className="booking-section-paper" sx={{ borderRadius: 3, mb: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                <Box className="booking-section-header">
                  <CheckCircle2 size={24} className="booking-section-icon" />
                  <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>
                    Required Equipment
                  </Typography>
                  <NumberedLabel number={2} />
                </Box>
                
                <Box sx={{ p: 2 }}>
                  {/* Select All */}
                  <Box sx={{ mb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <FormControlLabel
                      control={
                        <Radio
                          checked={selectedEquipment.length === equipmentList.length && equipmentList.length > 0}
                          onClick={(e) => {
                            e.preventDefault();
                            if (selectedEquipment.length === equipmentList.length) {
                              setSelectedEquipment([]);
                            } else {
                              setSelectedEquipment(equipmentList);
                            }
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
                      gridTemplateColumns: { xs: "repeat(1, 1fr)", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
                      gap: 1,
                      maxHeight: 150,
                      overflowY: "auto",
                    }}
                  >
                    {equipmentList.map((item: string) => (
                      <FormControlLabel
                        key={item}
                        control={
                          <Radio
                            checked={selectedEquipment.includes(item)}
                            onClick={(e) => {
                              e.preventDefault();
                              if (selectedEquipment.includes(item)) {
                                setSelectedEquipment(selectedEquipment.filter((eq) => eq !== item));
                              } else {
                                setSelectedEquipment([...selectedEquipment, item]);
                              }
                            }}
                          />
                        }
                        label={item}
                      />
                    ))}
                  </Box>
                </Box>
              </Card>

              {/* Section 2: Select Dates */}
              <Card className="booking-section-paper calendar-paper" sx={{ borderRadius: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                <Box className="booking-section-header" sx={{ flex: '0 0 auto' }}>
                  <Calendar className="booking-section-icon" />
                  <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>
                    Select Dates
                  </Typography>
                  <NumberedLabel number={3} />
                </Box>

                <Box
                  sx={{
                    flex: '1 1 auto',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: selectedRoomId && timeOption ? 1 : 0.5,
                    pointerEvents: selectedRoomId && timeOption ? "auto" : "none",
                  }}
                >
                  {renderCalendar()}
                </Box>

                {(!selectedRoomId || !timeOption) && (
                  <Typography color="error" sx={{ mt: 1, display: "flex", alignItems: "center", gap: 1, flex: '0 0 auto' }}>
                    <AlertTriangle size={16} /> Please select room and time first
                  </Typography>
                )}
              </Card>
            </Grid>
            
            <Grid size={{ md: 6 }} sx={{ display: 'flex', flexDirection: 'column' }}>

            {/* Booking Details Card */}
            <Card className="booking-section-paper" sx={{ borderRadius: 3, mb: 2, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                <Box className="booking-section-header">
                  <FileText className="booking-section-icon" />
                  <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>Booking Details</Typography>
                  <NumberedLabel number={4} />
                </Box>
                
                <Box className="info-section-paper">
                  <Box className="info-fields">
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Purpose of Booking
                        </Typography>
                        <TextField
                          fullWidth
                          required
                          rows={2}
                          value={purpose}
                          onChange={(e) => setPurpose(e.target.value)}
                          placeholder="e.g. team planning meeting, client presentation, training session, etc."
                          error={!!formErrors.purpose}
                          helperText={formErrors.purpose}
                          className="textarea-field"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Additional Special Requests (Optional)
                        </Typography>
                        <TextField
                          fullWidth
                          rows={2}
                          value={additionalNote}
                          onChange={(e) => setAdditionalNote(e.target.value)}
                          placeholder="Special equipment, catering arrangements, or other requests"
                          className="textarea-field"
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                          Room Setup Style
                        </Typography>
                        <FormControl fullWidth>
                          <Select
                            value={selectedStyle || ""}
                            displayEmpty
                            onChange={(e) => setSelectedStyle(e.target.value as string)}
                          >
                            <MenuItem value="">
                              <em>-- Room Setup Style --</em>
                            </MenuItem>
                            {setupStyles?.map((item) => (
                              <MenuItem key={item.ID} value={item.LayoutName}>
                                {item.LayoutName}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      


                      
                    </Grid>
                  </Box>
                </Box>
              </Card>

            {/* Your Information */}
            <Card elevation={3} sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', p: 3 }}>
                      <Box className="booking-section-header" sx={{ flex: '0 0 auto' }}>
                        <User size={24} className="booking-section-icon" />
                        <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>Your Information</Typography>
                        <NumberedLabel number={5} />
                      </Box>
                    
                      <Box sx={{ flex: '1 1 auto', display: 'flex', flexDirection: 'column', p: 3 }}>

                      

                      <Box className="info-fields">
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 12 }} >
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                        Full Name
                            </Typography>
                        <TextField
                          fullWidth
                          value={name}
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: { 
                              color: 'text.secondary',
                              '& .MuiInputBase-input': {
                                color: 'text.secondary'
                              }
                            }
                          }}
                          className="readonly-field"
                        />
                        </Grid>

                          <Grid size={{ md: 12 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Tax ID
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.TaxID || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, TaxID: e.target.value }))}
                              placeholder="Enter tax ID"
                              error={!!errors.TaxID}
                              helperText={
                                errors.TaxID || 
                                (addressFormData?.TaxID && addressFormData.TaxID.length === 13 && !errors.TaxID ? 
                                  "✓ Valid Tax ID" : 
                                  addressFormData?.TaxID && addressFormData.TaxID.length > 0 ? 
                                    `${addressFormData.TaxID.length}/13 digits entered` : 
                                    "")
                              }
                              sx={{
                                '& .MuiFormHelperText-root': {
                                  color: addressFormData?.TaxID && addressFormData.TaxID.length === 13 && !errors.TaxID ? 'green' : undefined
                                }
                              }}
                            />
                          </Grid>
                          
                        <Grid size={{ xs: 12 }} >
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                        Phone Number
                            </Typography>
                        <TextField
                          fullWidth
                          value={phone}
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: { 
                              color: 'text.secondary',
                              '& .MuiInputBase-input': {
                                color: 'text.secondary'
                              }
                            }
                          }}
                          className="readonly-field"
                        />
                        </Grid>
                        <Grid size={{ xs: 12 }} >
                        <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                        Email Address
                            </Typography>
                        <TextField
                          fullWidth
                          value={email}
                          variant="outlined"
                          InputProps={{
                            readOnly: true,
                            sx: { 
                              color: 'text.secondary',
                              '& .MuiInputBase-input': {
                                color: 'text.secondary'
                              }
                            }
                          }}
                          className="readonly-field"
                        />
                        </Grid>
                      
                        
                          <Grid size={{ xs: 6 }} >
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Address Number
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.AddressNumber || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, AddressNumber: e.target.value }))}
                              placeholder="Enter your house/building number"
                              error={!!errors.AddressNumber}
                              helperText={errors.AddressNumber}
                            />
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Street
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.Street || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, Street: e.target.value }))}
                              placeholder="Enter street name (in Thai)"
                              error={!!errors.Street}
                              helperText={errors.Street}
                            />
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Sub-district
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.SubDistrict || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, SubDistrict: e.target.value }))}
                              placeholder="Enter sub-district (in Thai)"
                              error={!!errors.SubDistrict}
                              helperText={errors.SubDistrict}
                            />
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              District
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.District || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, District: e.target.value }))}
                              placeholder="Enter district (in Thai)"
                              error={!!errors.District}
                              helperText={errors.District}
                            />
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Province
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.Province || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, Province: e.target.value }))}
                              placeholder="Enter province name (in Thai)"
                              error={!!errors.Province}
                              helperText={errors.Province}
                            />
                          </Grid>

                          <Grid size={{ md: 6 }}>
                            <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                              Postal Code
                            </Typography>
                            <TextField
                              fullWidth
                              value={addressFormData?.PostalCode || ""}
                              onChange={(e) => setAddressFormdata((prev) => ({ ...prev, PostalCode: e.target.value }))}
                              placeholder="Enter postal code"
                              error={!!errors.PostalCode}
                              helperText={errors.PostalCode}
                            />
                          </Grid>

                          
                        </Grid>
                      </Box>
                    </Box>

                  
                  </Card>
            </Grid>
          </Grid>

          {/* Section 4: Your Information */}
                  {/* Section 2: Booking Summary */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ mb: 4, mx: 0, width: '100%' }} />
            <Card sx={{ backgroundColor: "secondary.main", borderRadius: 2, p: 3, mb: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box className="booking-section-header" sx={{ mb: 3 }}>
                <BookOpenCheck className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600" sx={{ marginRight: 1 }}>
                  Booking Summary
                </Typography>
                <NumberedLabel number={6} />
              </Box>

              <Box sx={{ paddingX: 2 }}>
                <Grid container spacing={2}>
                  {/* Left Column - 3 items */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Meeting Room Type</Typography>
                      <Typography variant="subtitle1" fontWeight={600}>{roomType?.TypeName || roomData?.TypeName || "-"}</Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Selected Room</Typography>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {roomsOfSameType.find((r) => r.id === selectedRoomId)?.roomnumber || "-"}
                      </Typography>
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Duration & Time</Typography>
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
                      <Typography variant="body2" color="text.secondary" sx={{ visibility: timeOption === "half" ? "visible" : "hidden" }}>
                        {timeOption === "half" ? getTimeRangeLabel() || "-" : "-"}
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Right Column - 3 items */}
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary">Number of Days</Typography>
                      <Chip
                        label={
                          selectedDates?.length
                            ? `${selectedDates.length} day${selectedDates.length > 1 ? "s" : ""}`
                            : "-"
                        }
                        color={selectedDates?.length ? "primary" : "default"}
                        size="small"
                      />
                    </Box>

                    <Box mb={2}>
                      <Typography variant="body2" color="text.secondary" mb={1}>Selected Equipment</Typography>
                      {selectedEquipment?.length ? (
                        <Box display="flex" flexWrap="wrap" gap={1}>
                          {selectedEquipment.slice(0, 3).map((equipment) => (
                            <Chip key={equipment} label={equipment} size="small" variant="outlined" />
                          ))}
                          {selectedEquipment.length > 3 && (
                            <Chip label={`+${selectedEquipment.length - 3} more`} size="small" variant="outlined" />
                          )}
                        </Box>
                      ) : (
                        <Typography>-</Typography>
                      )}
                    </Box>

                    <Box mb={3}>
                      <Typography variant="body2" color="text.secondary" mb={1}>Selected Dates</Typography>
                      {selectedDates?.length ? (
                        <Box display="flex" flexWrap="wrap" gap={1}>
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
                  </Grid>
                </Grid>
              </Box>
              
              <Divider sx={{ mb: 2 }} />

              {/* Total */}
              <Box sx={{ px: 2, py: 1.2, backgroundColor: "background.paper", borderRadius: 2 }}>
                {loading ? (
                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" gap={2} py={4}>
                    <CircularProgress size={60} />
                    <Typography variant="subtitle2" color="text.secondary">Calculating Price...</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Total Price</Typography>
                    <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
                      ฿{calculatedPrice?.toLocaleString() || "0"}
                    </Typography>
                  </>
                )}
              </Box>

              {/* Discounts Row 1: Free credit (Meeting only) */}
              {hasPackage && isMeetingCategory && pkgBenefits.meetingFreePerYear > 0 && (
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <IconButton size="small" color="primary"
                    disabled={discount.remaining <= 0 && !discount.used}
                  >
                    <TicketPercent  />
                  </IconButton>
                  <Typography variant="body2" color="primary" flexGrow={1}>
                    You have {discount?.remaining ?? 0} free booking{(discount?.remaining ?? 0) === 1 ? "" : "s"} left for Meeting Room
                  </Typography>
                  <Button
                    variant={discount.used ? "contained" : "outlined"}
                    size="small"
                    disabled={discount.remaining <= 0 && !discount.used}
                    onClick={() => setDiscount(prev => ({ ...prev, used: !prev.used }))}
                  >
                    {discount.used ? "Cancel Free Credit" : "Use Free Credit"}
                  </Button>
                </Box>
              )}

              

              {/* Discounts Row 2: 50% Member Discount (toggle-able) */}
              {hasPackage && (
                <Box display="flex" alignItems="center" gap={1} sx={{ mt: 'auto' }}>
                  <IconButton
                    size="small"
                    color="primary"
                    disabled={
                      (isMeetingCategory && (!pkgBenefits.meetingHalf || quotas.meeting.remaining > 0 || discount.used)) ||
                      (currentCategory === "trainingroom" && !pkgBenefits.trainingHalf) ||
                      (currentCategory === "multifunctionroom" && !pkgBenefits.hallHalf)
                    }
                  >
                    <TicketPercent  />
                  </IconButton>

                  <Typography variant="body2" color="primary" flexGrow={1}>
                    50% Package Discount
                    {isMeetingCategory && pkgBenefits.meetingHalf && (quotas.meeting.remaining > 0 || discount.used)
                      ? " • Available after free quota is exhausted"
                      : ""}
                  </Typography>

                  <Button
                    size="small"
                    variant={applyMemberDiscount ? "contained" : "outlined"}
                    onClick={() => setApplyMemberDiscount(v => !v)}
                    disabled={
                      (isMeetingCategory && (!pkgBenefits.meetingHalf || quotas.meeting.remaining > 0 || discount.used)) ||
                      (currentCategory === "trainingroom" && !pkgBenefits.trainingHalf) ||
                      (currentCategory === "multifunctionroom" && !pkgBenefits.hallHalf)
                    }
                  >
                    {applyMemberDiscount ? "Using 50% Off" : "Don't Use 50% Off"}
                  </Button>
                </Box>
              )}

              {/* Confirm Booking Button */}
              <Box sx={{ mt: 3, textAlign: 'right' }}>
                <Button
                  variant="contained"
                  onClick={() => {
                    if (!validateForm()) return;
                    setOpenPopupInvoiceCondition(true);
                  }}
                  disabled={
                    loading ||
                    calculatedPrice == null ||
                    selectedDates.length === 0 ||
                    !selectedRoomId ||
                    purpose.trim() === "" ||
                    (timeOption === "hourly" && !isHourlyAllowed) ||
                    (timeOption === "half" && !timeRange)
                  }
                  startIcon={loading ? <CircularProgress size={20} sx={{ color: "white" }} /> : <CheckCircle2 size={20} />}
                >
                  {loading ? "Processing Your Booking..." : `Confirm Booking • ฿${calculatedPrice?.toLocaleString() || "0"}`}
                </Button>
              </Box>
            </Card>
          </Grid>
                

                {/* Action Section */}
                <Grid size={{ xs: 12 }}>
                
                <Box className="action-section">
                  {selectedDates.length === 0 && (
                    <Alert severity="warning" className="date-alert" icon={<AlertTriangle size={20} color="white" />}>
                      Please select your booking dates from the calendar above to proceed
                    </Alert>
                  )}

                  <Typography variant="body2" color="text.secondary" className="confirmation-note" sx={{ display: "flex", alignItems: "center", gap: 0.5, textAlign: 'center' }}>
                    <Info size={16} /> Your booking will be confirmed immediately after payment
                  </Typography>
                </Box>
                
                </Grid>

        </Grid>
      </Container>
    </Box >
  );
};

export default RoomBookingForm;
