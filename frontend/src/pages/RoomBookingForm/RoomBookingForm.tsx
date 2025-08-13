import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  CircularProgress,
  Container,
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
  SelectChangeEvent,
  InputAdornment,
  Checkbox,
  FormGroup,
  InputLabel
} from "@mui/material";
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
} from "lucide-react";
import Carousel from "react-material-ui-carousel";
import { GetTimeSlots, GetRoomQuota, GetRoomsByRoomTypeID, CreateBookingRoom, GetUserById, GetRoomTypesByID, GetEquipmentByRoomType, UseRoomQuota, GetAllRoomLayouts, GetQuota, CheckSlip, CreatePayment } from "../../services/http/index";
import { RoomPriceInterface } from "../../interfaces/IRoomPrices";
import { useLocation, useSearchParams } from "react-router-dom";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import { Select } from "../../components/Select/Select";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { Base64 } from "js-base64";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { RoomsInterface } from "../../interfaces/IRooms";
import './RoomBookingForm.css'
import './Calendar.css';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { IconButton } from '@mui/material';

import PaymentPopup from "../../components/PaymentPopup/PaymentPopup";
import { PaymentInterface } from "../../interfaces/IPayments";
import formatToLocalWithTimezone from "../../utils/formatToLocalWithTimezone";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { CalendarToday } from "@mui/icons-material";

interface RoomBookingFormProps {
  room?: {
    id: number;
    TypeName: string;
    image?: string;
  };
  onBack?: () => void;
}

// interface discount {
//   type: "free-use";
//   name: string;
//   description: string;
//   totalAllowed: number;   // สิทธิ์ทั้งหมด
//   usedCount: number;      // จำนวนครั้งที่ใช้ไปแล้ว
//   remaining: number;      // สิทธิ์ที่เหลือ
//   used: boolean;          // ใช้ในการจองนี้หรือยัง
// }

interface BookingDetail {
  time: string;          // เช่น "Morning (09:00-13:00)" หรือ "Full Day (09:00-17:00)" หรือ "09:00-10:00"
  bookedBy: string;      // ชื่อผู้จอง
  status: string;        // สถานะ เช่น "confirmed", "pending"
  type: "fullDay" | "morning" | "afternoon" | "hourly" | "half"; // ประเภทจอง
  hours?: string[];      // ช่วงเวลารายชั่วโมง เช่น ["09:00", "10:00"] (สำหรับ hourly)
}


interface RoomBookingFormProps {
  room?: {
    id: number;
    TypeName: string;  // แก้เป็น camelCase
    image?: string;

  };
  roomsOfSameType: { id: number; roomNumber: string }[]; // แก้เป็น camelCase
  onBack?: () => void;
}


interface BookedDate {
  bookedBy: string;
  status: string;
  fullDay?: boolean;
  morning?: boolean;
  afternoon?: boolean;
  type?: string;   // "morning", "afternoon", "fullDay", "hourly", ฯลฯ
  hours?: string[];       // เช่น ["09:00", "10:00"]
  hourlyBookedBy?: string;
  hourlyStatus?: string;
  morningBookedBy?: string;
  morningStatus?: string;
  afternoonBookedBy?: string;
  afternoonStatus?: string;
  bookedHours?: string[]; // อาจจะเหมือน hours หรือแยกกัน
  hourly?: string[];      // สำรองสำหรับข้อมูลบางกรณี
}

type BookedDates = {
  [date: string]: BookedDate[];
};


const RoomBookingForm: React.FC<RoomBookingFormProps> = ({
  onBack
}) => {
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
  // const [timeOption, setTimeOption] = useState<'half' | 'full'>('half');
  const [timeRange, setTimeRange] = React.useState<"morning" | "afternoon" | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  // const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);
  const [roomsOfSameType, setRoomsOfSameType] = useState<{
    RoomStatusID: number; id: number; roomnumber: string; RoomStatus?: RoomStatusInterface;  // เพิ่มตรงนี้ 
  }[]>([]);
  const [bookingMap, setBookingMap] = useState<{ [date: string]: BookingDetail[] }>({});
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ date: string, bookings: BookingDetail[] } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const location = useLocation();
  const [selectedRoomId, setSelectedRoomId] = useState(0); // ค่าตั้งต้นคือ 0
  const roomtype = location.state?.selectedRoomtypes || {};
  const [roomDat, setRoomData] = React.useState<RoomsInterface>({});
  const [roomType, setRoomType] = useState<RoomtypesInterface>({});
  const [role, setRole] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const isAllowedToBookLargeRoom = (roomDat?.Capacity ?? 0) <= 20 || role === 3 || role === 4;
  const [setupStyles, setSetupStyles] = useState<{ ID: number; LayoutName: string }[]>([]);
  const [selectedStyle, setSelectedStyle] = useState<string>('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [additionalNote, setAdditionalNote] = useState("");
  const [equipmentList, setEquipmentList] = useState<string[]>([]);

  const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);

  // ตัวเลือกหลัก: hourly, half, full, none
  const [timeOption, setTimeOption] = useState<
    "hourly" | "half" | "full" | "none"
  >("none");
  // ถ้าเลือกครึ่งวัน จะเลือก morning หรือ afternoon
  const [halfDayOption, setHalfDayOption] = useState<"morning" | "afternoon" | null>(null);
  // เลือกรายชั่วโมง (array of TimeSlotName)
  const [selectedHours, setSelectedHours] = useState<string[]>([]);

  const [openPopupCard, setOpenPopupCard] = useState<boolean>(false)
  const [slipfile, setSlipFile] = useState<File | null>(null);

  // console.log("slipfile:", slipfile);

  const fetchBookingMapOnly = async (roomId: number) => {
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      console.log("res1:", res);

      if (res.BookedDates) {
        const convertedData: BookedDates = convertBookedDates(res.BookedDates);
        setBookedDates(convertedData);

        // แปลงเป็น { [date: string]: BookingDetail[] }
        const bookingDetailMap: { [date: string]: BookingDetail[] } = {};

        for (const date in convertedData) {
          const bookingsForDate = convertedData[date];
          const details: BookingDetail[] = [];

          bookingsForDate.forEach(bd => {
            if (bd.fullDay) {
              details.push({
                time: "Full Day (09:00-17:00)",
                bookedBy: bd.bookedBy,
                status: bd.status,
                type: "fullDay",
                hours: bd.hours,
              });
            }

            if (bd.morning || bd.type === "morning") {
              details.push({
                time: "Morning (09:00-13:00)",
                bookedBy: bd.morningBookedBy || bd.bookedBy,
                status: bd.morningStatus || bd.status,
                type: "morning",
                hours: bd.hours,
              });
            }

            if (bd.afternoon || bd.type === "afternoon") {
              details.push({
                time: "Afternoon (13:00-17:00)",
                bookedBy: bd.afternoonBookedBy || bd.bookedBy,
                status: bd.afternoonStatus || bd.status,
                type: "afternoon",
                hours: bd.hours,
              });
            }

            if (bd.hours && bd.hours.length > 0 && !bd.fullDay) {
              details.push({
                time: "Hourly",
                bookedBy: bd.hourlyBookedBy || bd.bookedBy,
                status: bd.hourlyStatus || bd.status,
                type: "hourly",
                hours: bd.hours,
              });
            }
          });

          bookingDetailMap[date] = details;
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




  const isFullyBooked = (dateString: string): boolean => {
    const bookings = bookedDates[dateString];
    if (!bookings || bookings.length === 0) return false;

    // เช็คว่ามี booking fullDay จริงไหม
    if (bookings.some(b => b.fullDay === true || b.type === "fullDay")) return true;

    // เช็คว่ามี morning และ afternoon ครบในวันนั้นไหม
    const hasMorning = bookings.some(b => b.morning === true || b.type === "morning");
    const hasAfternoon = bookings.some(b => b.afternoon === true || b.type === "afternoon");
    if (hasMorning && hasAfternoon) return true;

    // เช็คว่าชั่วโมงเต็ม 8 ชั่วโมงไหม
    const allAvailableHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];
    const bookedHoursSet = new Set<string>();
    bookings.forEach(b => {
      const hrs = b.hours ?? b.bookedHours ?? b.hourly ?? [];
      if (Array.isArray(hrs)) {
        hrs.forEach(h => bookedHoursSet.add(h));
      }
    });
    if (bookedHoursSet.size === allAvailableHours.length) return true;

    return false;
  };


  // ตรวจสอบจองบางส่วน (ครึ่งวัน หรือ รายชั่วโมง)
  const isPartiallyBooked = (dateString: string): boolean => {
    const bookings = bookedDates[dateString];
    if (!bookings || bookings.length === 0) return false;

    const partial = bookings.some(b =>
      !b.fullDay &&
      (b.morning === true || b.afternoon === true || (b.hours && b.hours.length > 0))
    );

    return partial && !isFullyBooked(dateString);
  };



  // ===== ฟังก์ชันตรวจสอบการจองบางส่วน (แก้ไขแล้ว) =====
  // const isPartiallyBooked = (dateString: string): boolean => {
  //   const booking = bookedDates[dateString];
  //   if (!booking) return false;

  //   // มีการจองบางส่วน แต่ไม่เต็ม
  //   const hasPartialBookings =
  //     booking.morning ||
  //     booking.afternoon ||
  //     (booking.bookedHours && Array.isArray(booking.bookedHours) && booking.bookedHours.length > 0) ||
  //     (booking.hourly && Array.isArray(booking.hourly) && booking.hourly.length > 0);

  //   return !!hasPartialBookings && !isFullyBooked(dateString);
  // };

  // ===== ฟังก์ชันดึงรายละเอียดการจอง (แก้ไขให้รองรับรายชั่วโมงดีขึ้น) =====
  const getBookingDetails = (dateString: string): BookingDetail[] => {
    const bookings = bookedDates[dateString];
    if (!bookings || bookings.length === 0) return [];

    let details: BookingDetail[] = [];

    bookings.forEach(b => {
      const fullDayHours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00"];

      const isFullDayBooking = b.type === "fullDay" ||
        fullDayHours.every(h => (b.hours ?? []).includes(h));


      if (isFullDayBooking) {
        details.push({
          time: "Full Day (08:00-17:00)",
          bookedBy: b.bookedBy || "system",
          status: b.status || "confirmed",
          type: "fullDay",
          hours: b.hours,
        });
        return;
      }

      // ... (ส่วนอื่นเหมือนเดิม)
      if (b.morning || b.type === "morning") {
        details.push({
          time: "Morning (08:00-12:00)",
          bookedBy: b.morningBookedBy || b.bookedBy || "system",
          status: b.morningStatus || b.status || "confirmed",
          type: "morning",
          hours: b.hours,
        });
      }

      if (b.afternoon || b.type === "afternoon") {
        details.push({
          time: "Afternoon (12:00-17:00)",
          bookedBy: b.afternoonBookedBy || b.bookedBy || "system",
          status: b.afternoonStatus || b.status || "confirmed",
          type: "afternoon",
          hours: b.hours,
        });
      }

      if (b.type === "hourly" && b.hours && b.hours.length > 0 && !isFullDayBooking) {
        // ...แปลงช่วงเวลารายชั่วโมงเหมือนเดิม
        const hourNums = b.hours.map(h => parseInt(h.split(':')[0])).sort((a, b) => a - b);
        let groups: number[][] = [];
        let group = [hourNums[0]];
        for (let i = 1; i < hourNums.length; i++) {
          if (hourNums[i] === hourNums[i - 1] + 1) group.push(hourNums[i]);
          else {
            groups.push(group);
            group = [hourNums[i]];
          }
        }
        groups.push(group);

        groups.forEach(g => {
          const start = g[0];
          const end = g[g.length - 1] + 1;
          details.push({
            time: `${start.toString().padStart(2, '0')}:00-${end.toString().padStart(2, '0')}:00`,
            bookedBy: b.hourlyBookedBy || b.bookedBy || "system",
            status: b.hourlyStatus || b.status || "confirmed",
            type: "hourly",
            hours: g.map(h => `${h.toString().padStart(2, '0')}:00`)
          });
        });
      }
    });

    return details;
  };





  // ===== ฟังก์ชันตรวจสอบการจองซ้อนทับ (แก้ไขให้รองรับรายชั่วโมงดีขึ้น) =====
  const isSlotAvailable = (dateString: string): boolean => {
    const bookings = bookedDates[dateString] ?? [];
    if (!Array.isArray(bookings)) return true;

    if (timeOption === "full") {
      return bookings.length === 0;
    }

    if (timeOption === "half") {
      const morningHours = [9, 10, 11, 12];
      const afternoonHours = [13, 14, 15, 16];

      for (const booking of bookings) {
        if (booking.fullDay) return false;

        if (timeRange === "morning") {
          if (booking.morning) return false;
          if (booking.hours && booking.hours.some(h => morningHours.includes(parseInt(h.split(':')[0])))) return false;
        }

        if (timeRange === "afternoon") {
          if (booking.afternoon) return false;
          if (booking.hours && booking.hours.some(h => afternoonHours.includes(parseInt(h.split(':')[0])))) return false;
        }
      }
      return true;
    }

    if (timeOption === "hourly") {
      const selectedHourNums = selectedHours.map(h => parseInt(h.split(":")[0]));

      for (const booking of bookings) {
        if (booking.fullDay) return false;

        const morningHours = [9, 10, 11, 12];
        const afternoonHours = [13, 14, 15, 16];

        if (booking.morning && selectedHourNums.some(h => morningHours.includes(h))) return false;
        if (booking.afternoon && selectedHourNums.some(h => afternoonHours.includes(h))) return false;

        if (booking.hours && booking.hours.some(h => selectedHourNums.includes(parseInt(h.split(':')[0])))) return false;
      }
      return true;
    }

    return true;
  };



  const checkHourConflict = (booking: BookedDate, hourNum: number): boolean => {
    if (!booking) return false;

    if (booking.fullDay) return true;

    const morningHours = [9, 10, 11, 12];
    const afternoonHours = [13, 14, 15, 16];

    if (booking.morning && morningHours.includes(hourNum)) return true;
    if (booking.afternoon && afternoonHours.includes(hourNum)) return true;

    const bookedHoursNums = (booking.bookedHours || []).map(h => parseInt(h.split(":")[0]));
    if (bookedHoursNums.includes(hourNum)) return true;

    return false;
  };



  const toggleHourSelection = (hour: string) => {
    if (timeOption !== "hourly") return;
    const hourNum = parseInt(hour.split(":")[0]);

    const canSelect = selectedDates.every(dateStr => !checkHourConflict(bookedDates[dateStr][0], hourNum));

    if (!canSelect) {
      alert(`Cannot select ${hour} - conflict with existing bookings`);
      return;
    }

    setSelectedHours(prev =>
      prev.includes(hour) ? prev.filter(h => h !== hour) : [...prev, hour].sort()
    );
  };


  const toggleDateSelection = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (dateString < today) return;

    const booking = bookedDates[dateString];

    if (timeOption === "hourly" && selectedHours.length > 0) {
      const canSelectDate = selectedHours.every(hour => {
        const hourNum = parseInt(hour.split(':')[0]);

        if (!booking) return true;

        if (booking.some(b => b.fullDay)) return false;

        if (booking.some(b => b.morning)) {
          const morningHourNumbers = [9, 10, 11, 12];
          if (morningHourNumbers.includes(hourNum)) return false;
        }

        if (booking.some(b => b.afternoon)) {
          const afternoonHourNumbers = [13, 14, 15, 16];
          if (afternoonHourNumbers.includes(hourNum)) return false;
        }

        const bookedHours = booking.some(b => b.bookedHours) || booking.some(b => b.hours) || [];
        if (Array.isArray(bookedHours)) {
          const isConflict = bookedHours.some(bookedHour => {
            const bookedHourNum = typeof bookedHour === 'string' ?
              parseInt((bookedHour as string).split(':')[0]) :
              parseInt(bookedHour);
            return hourNum === bookedHourNum;
          });
          if (isConflict) return false;
        }

        return true;
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

    setSelectedDates(prev =>
      prev.includes(dateString)
        ? prev.filter(d => d !== dateString)
        : [...prev, dateString].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    );
  };

  // ===== ฟังก์ชันแปลงข้อมูลที่ได้จาก API (แก้ไขให้รองรับข้อมูลรายชั่วโมงดีขึ้น) =====
  const convertBookedDates = (apiData: Record<string, any>): BookedDates => {
    const converted: BookedDates = {};

    Object.entries(apiData).forEach(([dateString, bookings]) => {
      let bookingArray: any[] = [];

      if (Array.isArray(bookings)) {
        bookingArray = bookings;
      } else if (bookings && typeof bookings === "object") {
        bookingArray = [bookings];
      }

      converted[dateString] = bookingArray.map(b => ({
        bookedBy: b.bookedBy || "",
        status: b.status || "",
        fullDay: !!b.fullDay,
        morning: b.morning || false,
        afternoon: b.afternoon || false,
        type: b.type || "",
        hours: b.hours
          ? b.hours.map((h: any) => (typeof h === "number" ? `${h.toString().padStart(2, "0")}:00` : h))
          : [],
        hourlyBookedBy: b.hourlyBookedBy || "",
        hourlyStatus: b.hourlyStatus || "",
        morningBookedBy: b.morningBookedBy || "",
        morningStatus: b.morningStatus || "",
        afternoonBookedBy: b.afternoonBookedBy || "",
        afternoonStatus: b.afternoonStatus || "",
        bookedHours: b.bookedHours || [],
        hourly: b.hourly || [],
      }));
    });

    return converted;
  };




  // ===== State สำหรับเดือนปัจจุบัน =====
  const [currentMonthState, setCurrentMonth] = useState(new Date());

  // ===== ฟังก์ชัน renderCalendar สมบูรณ์ (ปรับปรุงแล้ว) =====
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
      "July", "August", "September", "October", "November", "December"
    ];

    const futureYears = Array.from({ length: 6 }, (_, i) => today.getFullYear() + i);

    // ฟังก์ชันสำหรับสร้าง CSS classes
    const getCellClasses = (isBooked: boolean, isSelected: boolean, isPartially: boolean, isPast: boolean, isAvailable: boolean) => {
      const classes = ['day-cell'];

      if (isPast) {
        classes.push('day-cell-past');
      }

      if (isBooked) {
        classes.push('day-cell-booked');
      } else if (isSelected) {
        classes.push('day-cell-selected');
      } else if (isPartially) {
        classes.push('day-cell-partially');
      } else if (isAvailable) {
        classes.push('day-cell-available');
      }

      if (!isAvailable && !isPast) {
        classes.push('day-cell-not-available');
      }

      return classes.join(' ');
    };

    // ฟังก์ชันการ render แต่ละ cell
    const renderCalendarCell = (day: number, dateString: string) => {
      const cellDate = new Date(dateString);
      const todayDate = new Date(today.toISOString().split("T")[0]); // ตัดเวลาให้เป็นเที่ยงคืน
      const isPast = cellDate < todayDate;



      const isBooked = isFullyBooked(dateString);
      const isPartially = isPartiallyBooked(dateString);
      const bookingDetails = getBookingDetails(dateString);
      const isSelected = selectedDates.includes(dateString);
      const isAvailable = isSlotAvailable(dateString);

      // สร้าง tooltip content ที่ละเอียดขึ้น
      const tooltipContent = bookingDetails.length > 0 ? (
        <Box className="tooltip-content">
          <Typography variant="subtitle2" className="tooltip-title" sx={{ fontWeight: 'bold', mb: 1 }}>
            {dateString}
          </Typography>
          {bookingDetails.map((b, i) => (
            <Box key={i} sx={{ mb: 1, p: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                📅 {b.time}
              </Typography>
              <Typography variant="caption" display="block">
                👤 Booked by: {b.bookedBy}
              </Typography>
              <Typography
                variant="caption"
                display="block"
                sx={{
                  color: b.status === "confirmed" ? "#4caf50" : "#ff9800",
                  fontWeight: 'medium'
                }}
              >
                ● {b.status === "confirmed" ? "Confirmed" : "Pending"}
              </Typography>
              {b.hours?.length && (
                <Typography variant="caption" display="block" sx={{ color: '#90caf9' }}>
                  🕒 Hours: {b.hours.join(', ')}
                </Typography>
              )}

            </Box>
          ))}
          <Typography variant="caption" sx={{
            color: isAvailable ? '#4caf50' : '#f44336',
            fontWeight: 'bold',
            display: 'block',
            textAlign: 'center',
            mt: 1
          }}>
            {isAvailable ? 'Available for your selection' : 'Not available for your selection'}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
            {dateString}
          </Typography>
          <Typography variant="body2" sx={{ color: '#4caf50' }}>
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
            tooltip: {
              sx: {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                maxWidth: 300,
                fontSize: '0.75rem'
              }
            }
          }}
        >
          <Paper
            elevation={isSelected ? 3 : 1}
            onClick={() => {
              if (!isPast) {
                toggleDateSelection(dateString);
              }
            }}
            className={getCellClasses(isBooked, isSelected, isPartially, isPast, isAvailable)}
          >
            {day}

            {/* จุดแสดงจำนวนการจอง */}
            {bookingDetails.length > 0 && (
              <Box className="booking-count">
                {bookingDetails.length}
              </Box>
            )}

            {/* ไอคอนแสดงสถานะ
            {isBooked && (
              <Box sx={{ position: 'absolute', bottom: 2, right: 2, fontSize: '10px' }}>
                🔒
              </Box>
            )}
            {isPartially && !isSelected && (
              <Box sx={{ position: 'absolute', bottom: 2, right: 2, fontSize: '10px' }}>
                ⚠️
              </Box>
            )}
            {isSelected && (
              <Box sx={{ position: 'absolute', bottom: 2, right: 2, fontSize: '10px' }}>
                ✅
              </Box>
            )} */}
          </Paper>
        </Tooltip>
      );
    };

    return (
      <Paper className="calendar-container" sx={{ bgcolor: 'secondary.main' }}>
        {/* <Box className="calendar-header">
          <Calendar />
          <Typography variant="h6" fontWeight="600">Select Date</Typography>
        </Box> */}

        {/* แสดงสถิติ */}
        {/* <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            📊 Legend:
            <span style={{ color: '#4caf50', margin: '0 8px' }}>🟢 Available</span>
            <span style={{ color: '#ff9800', margin: '0 8px' }}>🟡 Partially Booked</span>
            <span style={{ color: '#f44336', margin: '0 8px' }}>🔴 Fully Booked</span>
            <span style={{ color: '#1976d2', margin: '0 8px' }}>🔵 Selected</span>
          </Typography>
        </Box> */}

        <Box className="month-year-selector">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              const prevMonth = new Date(year, month - 1);
              if (prevMonth.getFullYear() > today.getFullYear() ||
                (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() >= today.getMonth())) {
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
            onChange={(e) => {
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
            onChange={(e) => {
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
            {futureYears.map(y => (
              <MenuItem key={y} value={y} className="year-menu-item">{y}</MenuItem>
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
          {dayNames.map(day => (
            <Typography
              key={day}
              variant="subtitle2"
              color="text.secondary"
              fontWeight="600"
            >
              {day}
            </Typography>
          ))}
        </Box>

        <Box className="calendar-grid">
          {Array.from({ length: firstDay }).map((_, i) => <Box key={`empty-${i}`} />)}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateString = formatDateString(year, month, day);
            return renderCalendarCell(day, dateString);
          })}
        </Box>

        {/* แสดงจำนวนวันที่เลือก
        {selectedDates.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
            <Typography variant="body2" color="primary.dark" fontWeight="bold">
              📅 Selected: {selectedDates.length} date(s)
            </Typography>
            <Typography variant="caption" display="block" color="primary.dark">
              {selectedDates.join(', ')}
            </Typography>
          </Box>
        )} */}
      </Paper>
    );
  };

  const getTimeLabel = () =>
    timeOption === "half" ? "Half Day" : "Full Day";
  const getTimeRangeLabel = () =>
    timeRange === "morning" ? "08:00 - 12:00" : "13:00 - 17:00";
  // map TimeSlotID จาก timeOption และ timeRange
  const getTimeSlotIds = (): number[] => {
    if (timeOption === "full") {
      return [3]; // เต็มวัน
    } else if (timeOption === "half") {
      return timeRange === "morning" ? [1] : [2];
    } else if (timeOption === "hourly") {
      // สมมติ backend กำหนด ID สำหรับแต่ละชั่วโมง เช่น
      // "08:00-09:00" => 101, "09:00-10:00" => 102, ... (ต้องแมปให้ตรงกับ backend)
      const hourIdMap: Record<string, number> = {
        "08:00-09:00": 4,
        "09:00-10:00": 5,
        "10:00-11:00": 6,
        "11:00-12:00": 7,
        "13:00-14:00": 9,
        "14:00-15:00": 10,
        "15:00-16:00": 11,

      };
      return selectedHours.map(h => hourIdMap[h]).filter(Boolean);
    }
    return [];
  };





  const calculatePrice = (
    dates: string[],
    timeOpt: "hourly" | "half" | "full",
    timeRng: "morning" | "afternoon" | null,
    selectedHours: string[],
    pricing: RoomPriceInterface[]
  ): number => {

    console.log("calculatePrice:", dates, timeOpt, timeRng, selectedHours, pricing);
    if (!dates.length || pricing.length === 0) return 0;

    // สมมติ discount.used เป็น boolean จาก context หรือ state ที่เข้าถึงได้ที่นี่
    if (discount.used) return 0;

    let totalPrice = 0;

    if (timeOpt === "full") {
      const slot = pricing.find(p => p.TimeSlot?.TimeSlotName === "fullDay");
      if (slot?.Price) {
        totalPrice = slot.Price * dates.length;
      }
    } else if (timeOpt === "half" && timeRng) {
      const slotName = timeRng === "morning" ? "morning" : "afternoon";
      const slot = pricing.find(p => p.TimeSlot?.TimeSlotName === slotName);
      if (slot?.Price) {
        totalPrice = slot.Price * dates.length;
      }
    } else if (timeOpt === "hourly" && selectedHours.length > 0) {
      for (const hourName of selectedHours) {
        const slot = pricing.find(p => p.TimeSlot?.TimeSlotName === hourName);
        if (slot?.Price) {
          totalPrice += slot.Price;
        }
      }
      totalPrice *= dates.length;
    }

    return totalPrice;
  };



  const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>, item: string) => {
    if (e.target.checked) {
      setSelectedEquipment([...selectedEquipment, item]);
    } else {
      setSelectedEquipment(selectedEquipment.filter((eq) => eq !== item));
    }
  };


  const getRoomtype = async () => {
    try {
      const encodedId = searchParams.get("roomtype_id");
      const roomtypeID = encodedId ? Base64.decode(decodeURIComponent(encodedId)) : null;
      const res = await GetRoomTypesByID(Number(roomtypeID));
      if (res) {
        // console.log("roomtype:", res);
        setRoomType(res);
      }
    } catch (error) {
      console.error("Error fetching maintenance request:", error);
    }
  };

  const roomData = {
    id: roomtype.id,
    TypeName: roomType.TypeName,
    image: roomtype.image || "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1000&q=80",
  };

  // const mockBookedDates: BookedDates = {
  //   "2025-07-05": { morning: true, afternoon: false },
  //   "2025-07-08": { morning: true, afternoon: true },
  //   "2025-07-12": { morning: false, afternoon: true },
  //   "2025-07-15": { morning: true, afternoon: true },
  //   "2025-07-20": { morning: true, afternoon: false },
  //   "2025-07-25": { morning: false, afternoon: true },
  // };

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



  useEffect(() => {
    if (discount.used) {
      setCalculatedPrice(0);
    } else {
      setCalculatedPrice(pricing.length > 0 ? (pricing[0].Price ?? 0) : 0);

    }
  }, [discount.used, pricing]);



  async function fetchUserData(userId: number) {
    console.log("userId:", userId);
    setLoading(true);
    try {
      const res = await GetUserById(userId);
      console.log("resUSer:", res);
      if (res) {
        setName(res.FirstName + " " + res.LastName);   // ปรับตาม key ข้อมูลจริงของ API
        setPhone(res.Phone);
        setEmail(res.Email);
        setRole(res.RoleID);
      }
    } catch (err) {
      console.error("Failed to fetch user data", err);
    }
    setLoading(false);
  }

  async function fetchRoomData(roomId: number) {

    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      // console.log("resdsหหหหหหหหหหหห:", res.Room);
      if (res) {
        setRoomData(res.Room);
        // console.log("resdsหหหหหหหหหหหห:", res.Room);
      }
    } catch (err) {
      console.error("Failed to fetch room data", err);
    }
    setLoading(false);
  }




  const fetchRoomPricing = async (roomId: number) => {
    console.log("roomId:", roomId);
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      console.log("res1:", res);
      setPricing(res.RoomPrices);
      // console.log("pricing:", res.RoomPrices);
    } catch (error) {
      // console.error("Error fetching pricing:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomType?.ID) {

      // fetchRoomPricing(roomType.ID);
      // fetchBookingMapOnly(roomType.ID);

      GetRoomsByRoomTypeID(roomType.ID).then((data) => {
        // console.log("data:", data);
        if (data) {
          // แปลงข้อมูลให้ key เป็น roomnumber (ตัวเล็ก) ตาม interface
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
          console.log("formattedData:", formattedData);
          setRoomsOfSameType(formattedData);
        }
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId") || "0");
    console.log("userId:", userId);
    if (userId) {
      fetchUserData(userId);
    }
    getRoomtype()
  }, []);



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

  // console.log("equipmentList:", equipmentList);



  useEffect(() => {
    const loadQuota = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "");
      const res = await GetRoomQuota(userId); // ✅ ส่ง userId ที่ต้องการ
      if (res) {
        // console.log("res: ", res);
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
      setSetupStyles(data);
    });
  }, []);

  // console.log("setupStyles:", setupStyles);


  useEffect(() => {
    if (selectedDates.length > 0 && timeOption !== "none") {
      console.log("selectedDates:", selectedDates);
      console.log("timeOption:", timeOption);
      console.log("timeRange:", timeRange);
      console.log("selectedHours:", selectedHours);
      console.log("pricing:", pricing);
      console.log("calculatePrice:", calculatePrice);
      const totalPrice = calculatePrice(selectedDates, timeOption, timeRange, selectedHours, pricing);
      setCalculatedPrice(totalPrice);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedDates, timeOption, timeRange, selectedHours, pricing]);


  // const handleUseQuota = async () => {
  //   const result = await UseRoomQuota({
  //     user_id: parseInt(localStorage.getItem("userId") || ""),
  //     room_type: "meeting",
  //   });

  //   if (result.status === 200) {
  //     // console.log("ใช้โควตาสำเร็จ", result.data);
  //   } else {
  //     console.error("เกิดข้อผิดพลาด", result.data);
  //   }
  // };


  // async function checkSlip() {
  //   if (!slipfile) {
  //     console.log("ไม่มีไฟล์สลิป");
  //     return false;
  //   }

  //   try {
  //     // ตรวจสอบโควต้าก่อน
  //     const resQuota = await GetQuota();
  //     if (resQuota.data.quota === 0) {
  //       console.log("โควต้าไม่เพียงพอ");
  //       return false;
  //     }

  //     // ตรวจสอบสลิป
  //     const formData = new FormData();
  //     formData.append('files', slipfile as File);
  //     const resCheckSlip = await CheckSlip(formData);

  //     console.log(resCheckSlip.data);
  //     if (resCheckSlip.success === true) {

  //       const transDateTime = new Date(resCheckSlip.data.transTimestamp);
  //       const now = new Date();
  //       const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

  //       console.log("ตรวจสอบเวลา:", transDateTime, "ปัจจุบัน:", now, "ก่อน 15 นาที:", fifteenMinutesAgo);

  //       if (
  //         resCheckSlip.data.amount === 1 &&
  //         resCheckSlip.data.receiver.displayName === "นายพูลทรัพย์ น"
  //         // transDateTime >= fifteenMinutesAgo && transDateTime <= now
  //       ) {
  //         console.log("สลิปถูกต้อง");
  //         return {
  //           success: true,
  //           message: "สลิปถูกต้อง",
  //           data: resCheckSlip.data,
  //         };
  //       } else {
  //         console.log("สลิปไม่ถูกต้อง");
  //         return false;
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error checking slip:", error);
  //     return false;
  //   }
  // }

  const handleSubmitBooking = async (resCheckSlip?: any) => {
    if (
      !User ||
      !roomData ||
      !purpose ||
      !selectedDates.length ||
      getTimeSlotIds().length === 0
    ) {
      alert("Please fill in all the required fields.");
      return;
    }

    if (calculatedPrice === 0 && !discount.used) {
      alert("ราคาที่คำนวณได้เป็น 0 โปรดตรวจสอบส่วนลดหรือข้อมูลการจอง");
      return;
    }

    const bookingData = {
      UserID: parseInt(localStorage.getItem("userId") || "0"),
      RoomID: selectedRoomId,
      TimeSlotIDs: getTimeSlotIds(),  // ต้องเป็น number[]
      Purpose: purpose,
      AdditionalInfo: JSON.stringify({
        setupStyle: selectedStyle,
        equipment: selectedEquipment,
        additionalNote,
      }),
      Dates: selectedDates, // เป็น string[]
    };

    console.log("Booking payload:", bookingData);
    console.log("Booking payload JSON:", JSON.stringify(bookingData, null, 2));


    try {
      const resBooking = await CreateBookingRoom(bookingData);

      if (resBooking.status === 200) {
        console.log("✅ Booking success", resBooking.data);
      } else {
        console.error("❌ Booking failed", resBooking.status, resBooking.data?.error);
        alert(resBooking.data?.error || "เกิดข้อผิดพลาดในการจอง");
      }

      if (resBooking.status === 200) {
        // เรียก API ลดโควต้าหลังจองสำเร็จ
        const userId = parseInt(localStorage.getItem("userId") || "0");
        const roomTypeKey = getRoomTypeKey(roomData.TypeName || "");


        const quotaRes = await UseRoomQuota({
          user_id: userId,
          room_type: roomTypeKey,
        });

        if (quotaRes.status === 200) {
          console.log("ลดโควต้าห้องเรียบร้อย:", quotaRes.data);
        } else {
          console.error("ลดโควต้าไม่สำเร็จ:", quotaRes.data);
        }

        // const paymentData: PaymentInterface = {
        //   PaymentDate: formatToLocalWithTimezone(resCheckSlip.data.transTimestamp),
        //   Amount: calculatedPrice,
        //   UserID: userId,
        //   BookingRoomID: 1,
        // }

        // const formData = new FormData();

        // for (const [key, value] of Object.entries(paymentData)) {
        //   if (value !== undefined && value !== null) {
        //     formData.append(key, value);
        //   }
        // }

        // formData.append('files', slipfile as File);

        // const resPayment = await CreatePayment(formData)
        // if (!resPayment) {
        //   console.error("❌ Payment creation failed");
        // }

        await fetchBookingMapOnly(roomData.id);

        // รีเซ็ตฟอร์ม
        setSelectedDates([]);
        setName(name);
        setPhone(phone);
        setEmail(email);
        setAdditionalNote('');
        setPurpose('');
        const val = Number(selectedRoomId);
        setSelectedRoomId(val);
        fetchBookingMapOnly(val);

        handleSetAlert("success", "Booking created successfully.");
      }
    } catch (err) {
      console.error("Booking Error:", err);
      handleSetAlert("error", "An unexpected error occurred during create booking.");
    }
  };

  // ตัวอย่างฟังก์ชันแปลงประเภทห้องให้ตรง backend
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
        return "meeting"; // หรือจัดการ error ตามที่ต้องการ
    }
  }

  const hourlySlots = [
    "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
    "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00"
  ];

  const handleHourToggle = (hour: string) => {
    if (selectedHours.includes(hour)) {
      setSelectedHours(selectedHours.filter(h => h !== hour));
    } else {
      setSelectedHours([...selectedHours, hour]);
    }
  };

  // useEffect(() => {
  //   async function doCheckSlip() {
  //     const resCheckSlip = await checkSlip();
  //     console.log("Slip check result:", resCheckSlip);

  //     if (resCheckSlip) {
  //       handleSubmitBooking(resCheckSlip);
  //     }
  //   }

  //   if (slipfile) {
  //     doCheckSlip();
  //   }
  // }, [slipfile]);

  return (
    <Box className="booking-container">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      <PaymentPopup
        open={openPopupCard}
        onClose={() => setOpenPopupCard(false)}
        amount={calculatedPrice}
        onChangeFile={setSlipFile}
      />

      {/* Header */}
      <Paper elevation={2} className="booking-header-paper">
        <Box className="booking-header-content">
          <Box>
            <Typography variant="h4" fontWeight="bold" mb={1}>
              {roomData.TypeName}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Book meeting rooms online - convenient and fast
            </Typography>
          </Box>
          <Button
            startIcon={<ArrowLeft />}
            onClick={onBack || (() => window.history.back())}
            variant="outlined"
            className="button-back-button"
          >
            Back
          </Button>
        </Box>
      </Paper>

      {/* Main Content */}
      <Grid container spacing={3}>

        {/* Left Column - Room Selection & Images */}
        <Grid size={{ xs: 12, lg: 6 }}>

          {/* Room Images Carousel */}
          <Grid size={{ xs: 12 }}>
            <Carousel
              indicators={true}
              autoPlay={true}
              animation="slide"
              duration={500}
              navButtonsAlwaysVisible={true}
              navButtonsProps={{
                className: 'button-nav-button'
              }}
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
            <Paper elevation={2} className="booking-section paper-room-selection-paper"
              sx={{
                backgroundColor: 'secondary.main',  // หรือ '#fff'
                borderRadius: '24px',
                padding: '16px',
                my: 5,

              }}>
              <Box className="booking-section-header">
                <Building2 className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">Select Room</Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>
                  Choose Sub-room In {roomtype.TypeName} category
                </FormLabel>
                <Select
                  startAdornment={
                    <InputAdornment position="start" className="booking-input-adornment">
                      <Building2 size={18} strokeWidth={3} />
                    </InputAdornment>
                  }
                  value={selectedRoomId}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedRoomId(val);

                    if (!val) return; // กัน 0, NaN, undefined

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
                      disabled={r.RoomStatusID !== 1 /* หรือ (r.RoomStatus?.Code !== "available") */}
                      title={(r.RoomStatusID === 1) ? "Available" : "Not Available"}
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
            <Paper elevation={2} className="booking-section-paper time-selection-paper"
              sx={{
                backgroundColor: 'secondary.main',
                borderRadius: '24px',
                marginTop: '24px',
                mt: 3
              }}>
              <Box className="booking-section-header">
                <Clock className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">Select Duration & Time</Typography>
              </Box>

              {loading && !pricing ? (
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
                      }}
                    >
                      <FormControlLabel
                        value="hourly"
                        control={<Radio />}
                        label={<Typography variant="body1" fontWeight="500">Hourly</Typography>}
                      />
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
                  {timeOption === "hourly" && (
                    <>
                      <Divider className="booking-time-divider" />
                      <FormControl component="fieldset">
                        <FormLabel component="legend" className="booking-time-legend">
                          Select Hourly Slots
                        </FormLabel>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                          {hourlySlots.map((hour) => (
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
                            setTimeRange(e.target.value as "morning" | "afternoon");
                            setSelectedDates([]); // หรือเคลียร์วันที่ถ้าต้องการ
                          }}
                        >
                          <FormControlLabel
                            value="morning"
                            control={<Radio />}
                            label="Morning (08:00 - 12:00)"
                          />
                          <FormControlLabel
                            value="afternoon"
                            control={<Radio />}
                            label="Afternoon (13:00 - 17:00)"
                          />
                        </RadioGroup>
                      </FormControl>
                    </>
                  )}

                  {/* Full Day Info */}
                  {timeOption === "full" && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body1" fontWeight="600">
                        Full Day booking covers both Morning and Afternoon slots (08:00 - 17:00)
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Right Column - Calendar & Booking Summary */}
        <Grid size={{ xs: 12, lg: 6 }}>

          {/* Calendar */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} className="booking-section-paper calendar-paper">
              <Box className="booking-section-header">
                <Calendar className="booking-section-icon" />
                <Typography variant="h6" fontWeight="600">Select Dates</Typography>
              </Box>
              {renderCalendar()}
            </Paper>

            {/* Modal for booking details */}
            <Dialog
              open={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              maxWidth="sm"
              fullWidth
            >
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

          {/* Booking Summary - Now positioned above contact form */}
          {/* Booking Summary */}
          <Grid size={{ xs: 12 }} >
            <Paper
              elevation={3}
              sx={{
                backgroundColor: 'secondary.main',
                borderRadius: '24px',
                padding: '24px',
                mt: 3,
              }}
            >
              <Typography
                variant="h6"
                fontWeight="bold"
                mb={3}
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <Calendar className="booking-section-icon" />
                Booking Summary
              </Typography>

              {/* Room Type */}
              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">Meeting Room Type</Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {roomData?.TypeName || '-'}
                </Typography>
              </Box>

              {/* Selected Room */}
              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">Selected Room</Typography>
                <Typography variant="subtitle1" fontWeight={600}>
                  {roomsOfSameType.find(r => r.id === selectedRoomId)?.roomnumber || '-'}
                </Typography>
              </Box>

              {/* Duration & Time */}
              {/* Duration & Time */}
              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  Duration & Time
                </Typography>

                <Typography fontWeight={600}>
                  {timeOption === "full"
                    ? "Full Day"
                    : timeOption === "half"
                      ? getTimeLabel() || "-"
                      : timeOption === "hourly"
                        ? selectedHours?.length > 0
                          ? selectedHours.join(", ")
                          : "-"
                        : "-"}
                </Typography>

                {/* แสดงบรรทัดล่างเสมอเพื่อความสูงคงที่ */}
                <Typography variant="body2" color="text.secondary" sx={{ visibility: timeOption === "half" ? "visible" : "hidden" }}>
                  {timeOption === "half" ? getTimeRangeLabel() || "-" : "-"}
                </Typography>
              </Box>


              {/* Number of Days */}
              <Box className="booking-summary-section" mb={2}>
                <Typography variant="body2" color="text.secondary">Number of Days</Typography>
                <Chip
                  label={selectedDates && selectedDates.length > 0 ? `${selectedDates.length} day${selectedDates.length > 1 ? 's' : ''}` : '-'}
                  color={selectedDates && selectedDates.length > 0 ? 'primary' : 'default'}
                  size="small"
                />
              </Box>

              {/* Selected Dates */}
              <Box className="booking-summary-dates" mb={3}>
                <Typography variant="body2" color="text.secondary" mb={1}>Selected Dates</Typography>
                {selectedDates && selectedDates.length > 0 ? (
                  <Box className="booking-dates-container" display="flex" flexWrap="wrap" gap={1}>
                    {selectedDates.slice(0, 4).map(date => (
                      <Chip key={date} label={new Date(date).toLocaleDateString('en-US')} size="small" />
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


              {/* Price Summary */}
              <Paper
                elevation={4} // เพิ่มเงาให้ชัดขึ้น
                sx={{
                  p: 3,
                  mb: 3,
                  backgroundColor: 'background.paper', // สีพื้นขาวตามธีม (ปกติคือขาว)
                  borderRadius: '16px', // มุมโค้งมนสวยๆ
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)', // เงานุ่มๆ เพิ่มความลึก
                }}
              >
                {loading ? (
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    justifyContent="center"
                    gap={2}
                    py={4}
                  >
                    <CircularProgress size={60} />
                    <Typography variant="subtitle1" color="text.secondary">
                      Calculating Price...
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h4" fontWeight="bold" color="primary" mb={1}>
                      ฿{calculatedPrice?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                      Total Price
                    </Typography>
                  </>
                )}
              </Paper>


              {/* Discount Section */}
              <Box display="flex" alignItems="center" gap={1}>
                <IconButton size="small" color="primary" disabled={discount.remaining <= 0 && !discount.used}>
                  <LocalOfferIcon />
                </IconButton>
                <Typography variant="body2" color="primary" flexGrow={1}>
                  You have {discount?.remaining ?? 0} free booking{discount?.remaining === 1 ? '' : 's'} left
                </Typography>
                <Button
                  variant={discount.used ? "contained" : "outlined"}
                  size="small"
                  disabled={discount.remaining <= 0 && !discount.used}
                  onClick={() => {
                    setDiscount(prev => ({
                      ...prev,
                      used: !prev.used,
                      remaining: prev.used ? prev.remaining + 1 : prev.remaining - 1,
                      usedCount: prev.used ? prev.usedCount - 1 : prev.usedCount + 1,
                    }));
                  }}
                >
                  {discount.used ? "Cancel Free Credit" : "Use Free Credit"}
                </Button>
              </Box>
            </Paper>
          </Grid>


        </Grid>

        {/* Full Width Contact Form - Bottom Section */}
        <Grid size={{ xs: 12 }}>
          <Paper elevation={3} className="contact-form-paper">
            {/* Header Section */}
            <Box className="form-header">
              <Typography variant="h5" fontWeight="700" color="primary" className="form-title">
                Complete Your Booking
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Fill in the details below to confirm your room reservation
              </Typography>
              <Divider className="form-divider" sx={{ backgroundColor: 'primary.main' }} />
            </Box>

            <Grid container spacing={3}>
              {/* Left Side - Contact Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} className="info-section-paper">
                  <Box className="info-section-header">
                    <User size={24} className="info-section-icon" />
                    <Typography variant="h6" fontWeight="600" >
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
                        inputProps: { className: 'readonly-input' },
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
                        inputProps: { className: 'readonly-input' },
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
                        inputProps: { className: 'readonly-input' },
                      }}
                      className="readonly-field"
                    />
                  </Box>


                </Paper>
              </Grid>

              {/* Right Side - Booking Details */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} className="info-section-paper">
                  <Box className="details-section-header">
                    <Calendar size={24} className="info-section-icon" />
                    <Typography variant="h6" fontWeight="600" >
                      Booking Details
                    </Typography>
                  </Box>

                  <Box className="details-fields">
                    <TextField
                      label="Purpose of Booking"
                      fullWidth
                      required
                      multiline
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



                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}
                    >
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
                        <Box
                          sx={{
                            mb: 2,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={selectedEquipment.length === equipmentList.length}
                                indeterminate={
                                  selectedEquipment.length > 0 &&
                                  selectedEquipment.length < equipmentList.length
                                }
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedEquipment(equipmentList);
                                  } else {
                                    setSelectedEquipment([]);
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
                                  onChange={(e) => handleEquipmentChange(e, item)}
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
                      multiline
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
                <Alert
                  severity="info"
                  className="date-alert"
                >
                  📅 Please select your booking dates from the calendar above to proceed
                </Alert>
              )}

              {/* Confirmation Button */}
              <Box className="confirmation-section">
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => handleSubmitBooking()}
                  disabled={
                    loading ||
                    !calculatedPrice == null ||
                    calculatedPrice === undefined ||
                    selectedDates.length === 0 ||
                    !selectedRoomId ||
                    purpose.trim() === "" ||
                    !isAllowedToBookLargeRoom
                  }
                  className="confirm-button"
                  startIcon={loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <Check size={24} />}
                >
                  {loading ? "Processing Your Booking..." : `Confirm Booking • ฿${calculatedPrice?.toLocaleString() || '0'}`}
                </Button>

                <Typography variant="body2" color="text.secondary" className="confirmation-note">
                  🔒 Your booking will be confirmed immediately after payment
                </Typography>
              </Box>

              {!isAllowedToBookLargeRoom && (
                <Box className="error-alert-container">
                  <Alert
                    severity="error"
                    className="error-alert"
                  >
                    ⚠️ This room exceeds the seat capacity allowed for online booking. Please call the Science Park staff to make a reservation.
                  </Alert>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>


      </Grid >
    </Box >
  );

};

export default RoomBookingForm;

function showDateDetails(dateString: string) {
  throw new Error("Function not implemented.");
}

