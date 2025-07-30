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
  InputAdornment
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
  X,
  Type,
  Building2,
} from "lucide-react";
import Carousel from "react-material-ui-carousel";
import { GetTimeSlots, GetRoomQuota, GetRoomsByRoomTypeID, CreateBookingRoom, GetUserById, GetRoomTypesByID } from "../../services/http/index";
import { RoomPriceInterface } from "../../interfaces/IRoomPrices";
import { useLocation, useSearchParams } from "react-router-dom";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import { Select } from "../../components/Select/Select";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { Base64 } from "js-base64";
import AlertGroup from "../../components/AlertGroup/AlertGroup";
import { set } from "react-hook-form";
import { RoomsInterface } from "../../interfaces/IRooms";
import './RoomBookingForm.css'
import './Calendar.css';

interface RoomBookingFormProps {
  room?: {
    id: number;
    TypeName: string;
    image?: string;
  };
  onBack?: () => void;
}

interface discount {
  type: "free-use";
  name: string;
  description: string;
  totalAllowed: number;   // สิทธิ์ทั้งหมด
  usedCount: number;      // จำนวนครั้งที่ใช้ไปแล้ว
  remaining: number;      // สิทธิ์ที่เหลือ
  used: boolean;          // ใช้ในการจองนี้หรือยัง
}

interface BookingDetail {
  time: string;
  bookedBy: string;
  status: string;
}

interface RoomBookingFormProps {
  room?: {
    id: number;
    TypeName: string;
    image?: string;
  };
  roomsOfSameType: { id: number; RoomNumber: string; }[]; // 👈 เพิ่มตัวนี้
  onBack?: () => void;
}


interface BookedDate {
  morning: boolean;
  afternoon: boolean;
}

type BookedDates = {
  [date: string]: BookedDate;
};

const RoomBookingForm: React.FC<RoomBookingFormProps> = ({
  onBack
}) => {
  const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
  const [timeOption, setTimeOption] = useState<'half' | 'full'>('half');
  const [timeRange, setTimeRange] = useState<'morning' | 'afternoon'>('morning');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookedDates, setBookedDates] = useState<BookedDates>({});
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [pricing, setPricing] = useState<RoomPriceInterface[]>([]);
  const [roomsOfSameType, setRoomsOfSameType] = useState<{ id: number; roomnumber: string }[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [bookingMap, setBookingMap] = useState<{ [date: string]: BookingDetail[] }>({});
  const [selectedDateDetails, setSelectedDateDetails] = useState<{ date: string, bookings: BookingDetail[] } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const location = useLocation();
  // console.log("selectedRoomtypes111:", selectedRoomtypes);
  const [selectedRoomId, setSelectedRoomId] = useState(0); // ค่าตั้งต้นคือ 0
  console.log("selectedRoomId:", selectedRoomId);
  const roomtype = location.state?.selectedRoomtypes || {};
  // console.log("room:", room);
  const [roomDat, setRoomData] = React.useState<RoomsInterface>({});
  const [roomType, setRoomType] = useState<RoomtypesInterface>({});
  const [role, setRole] = useState<any>(null);
  const [searchParams] = useSearchParams();
  const isAllowedToBookLargeRoom = (roomDat?.Capacity ?? 0) <= 20 || role === 3 || role === 4;
  console.log("roomDat.Capacity:", roomDat?.Capacity);
  console.log("role:", role);
  console.log("isAllowedToBookLargeRoom:", isAllowedToBookLargeRoom);

  const getRoomtype = async () => {
    try {
      const encodedId = searchParams.get("roomtype_id");
      const roomtypeID = encodedId ? Base64.decode(decodeURIComponent(encodedId)) : null;
      const res = await GetRoomTypesByID(Number(roomtypeID));
      if (res) {
        console.log("roomtype:", res);
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

  const mockBookedDates: BookedDates = {
    "2025-07-05": { morning: true, afternoon: false },
    "2025-07-08": { morning: true, afternoon: true },
    "2025-07-12": { morning: false, afternoon: true },
    "2025-07-15": { morning: true, afternoon: true },
    "2025-07-20": { morning: true, afternoon: false },
    "2025-07-25": { morning: false, afternoon: true },
  };

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
      console.log("resds:", res.Room);
      if (res) {
        setRoomData(res.Room);
      }
    } catch (err) {
      console.error("Failed to fetch room data", err);
    }
    setLoading(false);
  }

  const fetchBookingMapOnly = async (roomId: number) => {
    setLoading(true);
    // console.log("roomId:", roomId);
    try {
      const res = await GetTimeSlots(roomId);
      console.log("res2:", res);

      if (res.BookedDates) {
        setBookedDates(res.BookedDates);
        console.log("BookedDates:", res.BookedDates);
        const bookingData = convertBookedDates(res.BookedDates);
        setBookingMap(bookingData);
        console.log("bookingData:", bookingData);
      } else {
        setBookingMap({});
      }
    } catch (error) {
      console.error("Error fetching booking map:", error);
      setBookingMap({});
    }


  };



  const fetchRoomPricing = async (roomId: number) => {
    console.log("roomId:", roomId);
    setLoading(true);
    try {
      const res = await GetTimeSlots(roomId);
      console.log("res1:", res);
      setPricing(res.RoomPrices);
      console.log("pricing:", res.RoomPrices);
    } catch (error) {
      console.error("Error fetching pricing:", error);
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
          }));
          setRoomsOfSameType(formattedData);
        }
      });
    }
  }, [roomType?.ID]);

  useEffect(() => {
    const userId = Number(localStorage.getItem("userId") || "0");
    if (userId) {
      fetchUserData(userId);
    }
    getRoomtype()
  }, []);

  useEffect(() => {
    const loadQuota = async () => {
      const userId = parseInt(localStorage.getItem("userId") || "");
      const res = await GetRoomQuota(userId); // ✅ ส่ง userId ที่ต้องการ
      if (res) {
        console.log("res: ", res);
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
    if (selectedDates.length > 0) {
      calculatePrice(selectedDates, timeOption, timeRange);
    } else {
      setCalculatedPrice(0);
    }
  }, [selectedDates, timeOption, timeRange, pricing]);

  const convertBookedDates = (bookedDatesObj: any): { [date: string]: BookingDetail[] } => {
    console.log("bookedDatesObj input:", bookedDatesObj);

    const map: { [date: string]: BookingDetail[] } = {};

    Object.entries(bookedDatesObj).forEach(([date, slots]: [string, any]) => {
      map[date] = [];

      if (slots.morning) {
        map[date].push({
          time: "morning (08:00-12:00)",
          bookedBy: "system", // หรือเพิ่มชื่อผู้จองจริงถ้ามี
          status: "confirmed",
        });
      }
      if (slots.afternoon) {
        map[date].push({
          time: "afternoon (13:00-17:00)",
          bookedBy: "system",
          status: "confirmed",
        });
      }
    });

    return map;
  };

  // const fetchRoomPricing = async (roomId: number) => {
  //   setLoading(true);
  //   try {
  //     const res = await GetTimeSlots(roomId);

  //     setPricing(res.RoomPrices);

  //     if (res.BookedDates) {
  //       setBookedDates(res.BookedDates);
  //       const bookingData = convertBookedDates(res.BookedDates);
  //       setBookingMap(bookingData);
  //     } else {
  //       setBookingMap({});
  //     }
  //   } catch (error) {
  //     console.error("Error fetching pricing:", error);
  //     setBookingMap({});
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const calculatePrice = async (
    dates: string[],
    timeOpt: "half" | "full",
    timeRng: "morning" | "afternoon"
  ) => {
    if (!dates.length || pricing.length === 0) return;

    setLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));

      // 🟡 ใช้สิทธิ์จองฟรี
      if (discount.used) {
        setCalculatedPrice(0);
        return;
      }

      let totalPrice = 0;

      dates.forEach((date) => {
        // ✅ กำหนดชื่อช่วงเวลา
        const timeSlotMap = {
          full: "เต็มวัน",
          morning: "เช้า",
          afternoon: "บ่าย",
        };

        const slotName = timeOpt === "full" ? timeSlotMap.full : timeSlotMap[timeRng];


        // 🔍 หาราคาจาก backend
        const slot = pricing.find(
          (p) => p.TimeSlot?.TimeSlotName === slotName
        );

        if (slot?.Price) {
          totalPrice += slot.Price; // ❌ ไม่เพิ่ม 10% ในวันหยุด
        }
      });

      setCalculatedPrice(totalPrice);
    } catch (error) {
      console.error("Error calculating price:", error);
      setCalculatedPrice(0);
    } finally {
      setLoading(false);
    }
  };

  const isFullyBooked = (dateString: string): boolean => {
    const booking = bookedDates[dateString];
    return booking?.morning && booking?.afternoon;
  };


  const toggleDateSelection = (dateString: string) => {
    const today = new Date().toISOString().split("T")[0];
    if (dateString < today || !isSlotAvailable(dateString)) return;


    setSelectedDates((prev) =>
      prev.includes(dateString)
        ? prev.filter((d) => d !== dateString)
        : [...prev, dateString].sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    );
  };

  const getBookingDetails = (dateString: string): BookingDetail[] => {
    return bookingMap[dateString] || [];
  };

  const showDateDetails = (dateString: string) => {
    const details = getBookingDetails(dateString);
    setSelectedDateDetails({ date: dateString, bookings: details });
    setShowDetailsModal(true);
  };


  // const renderCalendar = () => {
  //   const year = currentMonth.getFullYear();
  //   const month = currentMonth.getMonth();
  //   const daysInMonth = new Date(year, month + 1, 0).getDate();
  //   const firstDay = new Date(year, month, 1).getDay();

  //   const today = new Date().toISOString().split("T")[0];
  //   const formatDateString = (y: number, m: number, d: number) =>
  //     `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  //   const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  //   const monthNames = [
  //     "january", "february", "march", "april", "may", "june", "july",
  //     "august", "september", "october", "november", "december"
  //   ];

  //   return (
  //     <Paper sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 3 }}>
  //       {/* Header */}
  //       <Box display="flex" alignItems="center" mb={3}>
  //         <Calendar style={{ marginRight: 8, color: '#1976d2' }} />
  //         <Typography variant="h6" fontWeight="600">Select Date</Typography>
  //       </Box>

  //       {/* Month selector */}
  //       <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
  //         <Button onClick={() => setCurrentMonth(new Date(year, month - 1))}>‹</Button>
  //         <Typography variant="h6" fontWeight="600" color="primary">{monthNames[month]} {year}</Typography>
  //         <Button onClick={() => setCurrentMonth(new Date(year, month + 1))}>›</Button>
  //       </Box>

  //       {/* Legend */}
  //       <Box display="flex" gap={2} mb={3}>
  //         <Box display="flex" alignItems="center" gap={1}>
  //           <Box sx={{ width: 16, height: 16, backgroundColor: '#1976d2', borderRadius: 1 }} />
  //           <Typography variant="caption">Selected</Typography>
  //         </Box>
  //         <Box display="flex" alignItems="center" gap={1}>
  //           <Box sx={{ width: 16, height: 16, backgroundColor: '#fdecea', borderRadius: 1 }} />
  //           <Typography variant="caption">Booked All Day</Typography>
  //         </Box>
  //         <Box display="flex" alignItems="center" gap={1}>
  //           <Box sx={{ width: 16, height: 16, backgroundColor: '#fffde7', borderRadius: 1 }} />
  //           <Typography variant="caption">Booked Partial</Typography>
  //         </Box>
  //       </Box>



  //       {/* Day labels */}
  //       <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", mb: 2 }}>
  //         {dayNames.map((day) => (
  //           <Typography key={day} variant="subtitle2" color="text.secondary" fontWeight="600">{day}</Typography>
  //         ))}
  //       </Box>

  //       {/* Calendar cells */}
  // <Box sx={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1 }}>
  //   {Array.from({ length: firstDay }).map((_, i) => <Box key={`empty-${i}`} />)}

  //   {Array.from({ length: daysInMonth }).map((_, i) => {
  //     const day = i + 1;
  //     const dateString = formatDateString(year, month, day);
  //     const isPast = dateString < today;

  //     const booking = bookedDates[dateString];
  //     const isBooked = isFullyBooked(dateString);
  //     const isPartially =
  //       booking && (booking.morning || booking.afternoon) && !isBooked; // ✅ บางช่วง
  //     const isSelected = selectedDates.includes(dateString);
  //     const bookingDetails = getBookingDetails(dateString);
  //     const isAvailable = isSlotAvailable(dateString);

  //     const bgColor = isBooked
  //       ? "#fdecea"
  //       : isSelected
  //         ? "#1976d2"
  //         : isPartially
  //           ? "#fffde7"
  //           : "#ffffff";

  //     const textColor = isBooked
  //       ? "#d32f2f"
  //       : isSelected
  //         ? "#fff"
  //         : isPartially
  //           ? "#f57c00"
  //           : isPast
  //             ? "#ccc"
  //             : "#000";

  //     return (
  //       <Tooltip
  //         key={dateString}
  //         title={
  //           bookingDetails.length > 0 ? (
  //             <Box sx={{ p: 1 }}>
  //               <Typography variant="subtitle2" sx={{ mb: 1 }}>
  //                 Bookings on {dateString}
  //               </Typography>
  //               {bookingDetails.map((b, i) => (
  //                 <Box key={i}>
  //                   <Typography variant="caption">
  //                     {b.time} - {b.bookedBy}
  //                   </Typography>
  //                   <br />
  //                   <Typography
  //                     variant="caption"
  //                     color={b.status === "confirmed" ? "green" : "orange"}
  //                   >
  //                     {b.status === "confirmed" ? "Confirmed" : "Pending Confirmation"}
  //                   </Typography>
  //                 </Box>
  //               ))}
  //             </Box>
  //           ) : (
  //             `${dateString} - Available`
  //           )
  //         }
  //         arrow
  //       >
  //         <Paper
  //           elevation={isSelected ? 3 : 1}
  //           onClick={() => {
  //             if (!isPast && isAvailable) {
  //               toggleDateSelection(dateString);
  //             } else if (!isAvailable && !isPast) {
  //               showDateDetails(dateString); // 👉 If not available, show details
  //             }
  //           }}
  //           sx={{
  //             height: { xs: 45, md: 50 },
  //             backgroundColor: bgColor,
  //             color: textColor,
  //             display: "flex",
  //             justifyContent: "center",
  //             alignItems: "center",
  //             cursor: !isAvailable || isPast ? "not-allowed" : "pointer",
  //             position: "relative",
  //             borderRadius: 2,
  //             fontSize: { xs: 14, md: 16 },
  //             fontWeight: isSelected ? "600" : "400",
  //             opacity: isPast ? 0.5 : 1,
  //             transition: "all 0.2s ease",
  //             "&:hover": {
  //               transform: !isBooked && !isPast ? "scale(1.05)" : "none",
  //               boxShadow: !isBooked && !isPast ? 3 : 1,
  //             },
  //           }}
  //         >
  //           {day}
  //           {bookingDetails.length > 0 && (
  //             <Box
  //               sx={{
  //                 position: "absolute",
  //                 bottom: 2,
  //                 left: 2,
  //                 fontSize: 10,
  //               }}
  //             >
  //               {bookingDetails.length}
  //             </Box>
  //           )}
  //         </Paper>
  //       </Tooltip>
  //     );
  //   })}
  // </Box>
  //     </Paper>
  //   );
  // };

  const renderCalendar = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // State ที่ควรจะเป็นของ component คุณเอง
    // สมมติว่า currentMonthState คือ state วันที่ที่ใช้
    // ตัวอย่างสมมติ:
    const [currentMonthState, setCurrentMonth] = useState(today);

    // ดึงปีและเดือนจาก state
    const year = currentMonthState.getFullYear();
    const month = currentMonthState.getMonth();

    // จำนวนวันและวันแรกของเดือน
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();

    // ฟังก์ชัน format วันที่
    const formatDateString = (y: number, m: number, d: number) =>
      `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

    // วันและชื่อเดือน
    const dayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];

    // กำหนดปีที่ให้เลือก (ปัจจุบัน + 5 ปีข้างหน้า)
    const futureYears = Array.from({ length: 6 }, (_, i) => currentYear + i);

    // ฟังก์ชันจัดการเปลี่ยนเดือน
    const handleYearChange = (event: SelectChangeEvent<number | string>) => {
      const newYear = Number(event.target.value); // แปลงเป็น number
      let newMonth = month;

      if (newYear === currentYear && month < currentMonth) {
        newMonth = currentMonth;
      }

      setCurrentMonth(new Date(newYear, newMonth));
    };

    const handleMonthChange = (event: SelectChangeEvent<number | string>) => {
      const newMonth = Number(event.target.value);
      if (year === currentYear && newMonth < currentMonth) {
        setCurrentMonth(new Date(year, currentMonth));
      } else {
        setCurrentMonth(new Date(year, newMonth));
      }
    };



    // ... other imports

    return (
      <Paper
        className="calendar-container"
        sx={{
          bgcolor: 'secondary.main',
        }}
      >
        {/* Header */}
        <Box className="calendar-header">
          <Calendar />
          <Typography variant="h6" fontWeight="600">
            Select Date
          </Typography>
        </Box>

        {/* Month and Year selector */}
        <Box className="month-year-selector">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => {
              const prevMonth = new Date(year, month - 1);
              if (
                prevMonth.getFullYear() > currentYear ||
                (prevMonth.getFullYear() === currentYear &&
                  prevMonth.getMonth() >= currentMonth)
              ) {
                setCurrentMonth(prevMonth);
              }
            }}
            disabled={year === currentYear && month === currentMonth}
            className="nav-button"
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </Button>

          {/* Dropdown เลือกเดือน */}
          <Select
            value={month}
            onChange={(event) => handleMonthChange(event as SelectChangeEvent<number | string>)}
            size="small"
            className="month-select"
          >
            {monthNames.map((name, idx) => {
              const disabled = year === currentYear && idx < currentMonth;
              return (
                <MenuItem
                  key={idx}
                  value={idx}
                  disabled={disabled}
                  className="month-menu-item"
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </MenuItem>
              );
            })}
          </Select>

          {/* Dropdown เลือกปี */}
          <Select
            value={year}
            onChange={(event) => handleYearChange(event as SelectChangeEvent<number | string>)}
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

        {/* ส่วนแสดงวันในเดือน */}
        <Box className="day-names-grid">
          {dayNames.map((day) => (
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
            const isPast = new Date(dateString) < today;

            const booking = bookedDates[dateString];
            const isBooked = isFullyBooked(dateString);
            const isPartially =
              booking && (booking.morning || booking.afternoon) && !isBooked;
            const isSelected = selectedDates.includes(dateString);
            const bookingDetails = getBookingDetails(dateString);
            const isAvailable = isSlotAvailable(dateString);

            // Determine CSS classes based on state
            const getCellClasses = () => {
              let classes = 'day-cell';

              if (isBooked) {
                classes += ' day-cell-booked';
              } else if (isSelected) {
                classes += ' day-cell-selected';
              } else if (isPartially) {
                classes += ' day-cell-partially';
              } else {
                classes += ' day-cell-available';
              }

              if (isPast) {
                classes += ' day-cell-past';  // ← เพิ่มบรรทัดนี้
              }

              if (!isAvailable) {
                classes += ' day-cell-not-available';
              }

              return classes;
            };

            return (
              <Tooltip
                key={dateString}
                title={
                  bookingDetails.length > 0 ? (
                    <Box className="tooltip-content">
                      <Typography variant="subtitle2" className="tooltip-title">
                        Bookings on {dateString}
                      </Typography>
                      {bookingDetails.map((b, i) => (
                        <Box key={i}>
                          <Typography variant="caption">
                            {b.time} - {b.bookedBy}
                          </Typography>
                          <br />
                          <Typography
                            variant="caption"
                            color={b.status === "confirmed" ? "green" : "orange"}
                          >
                            {b.status === "confirmed" ? "Confirmed" : "Pending Confirmation"}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    `${dateString} - Available`
                  )
                }
                arrow
              >
                <Paper
                  elevation={isSelected ? 3 : 1}
                  onClick={() => {
                    if (!isPast && isAvailable) {
                      toggleDateSelection(dateString);
                    } else if (!isAvailable && !isPast) {
                      showDateDetails(dateString);
                    }
                  }}
                  className={getCellClasses()}
                  sx={isPast ? { color: '#ccc !important' } : {}}
                >
                  {day}
                  {bookingDetails.length > 0 && (
                    <Box className="booking-count">
                      {bookingDetails.length}
                    </Box>
                  )}
                </Paper>
              </Tooltip>
            );
          })}
        </Box>
      </Paper>
    );
  };
  const isSlotAvailable = (dateString: string): boolean => {
    const booking = bookedDates[dateString];

    if (!booking) return true;

    if (timeOption === 'full') {
      // จองเต็มวัน: ห้ามถ้าวันนั้นเช้า+บ่ายถูกจองแล้ว
      return !(booking.morning || booking.afternoon);
    } else {
      // จองครึ่งวัน: ต้องเช็คเฉพาะช่วงเวลา
      if (timeRange === 'morning') {
        return !booking.morning;
      } else {
        return !booking.afternoon;
      }
    }
  };




  const getTimeLabel = () =>
    timeOption === "half" ? "Half Day" : "Full Day";
  const getTimeRangeLabel = () =>
    timeRange === "morning" ? "09:00 - 13:00" : "13:00 - 17:00";
  // map TimeSlotID จาก timeOption และ timeRange
  const getTimeSlotId = () => {
    if (timeOption === "full") return 3; // เต็มวัน
    if (timeOption === "half") {
      return timeRange === "morning" ? 1 : 2; // ครึ่งวันเช้า หรือบ่าย
    }
    return 0; // กรณีผิดพลาด
  };

  // const handleSubmitBooking = async () => {
  //   if (!name || !phone || !email || selectedDates.length === 0) {
  //     alert("กรุณากรอกข้อมูลและเลือกวันที่ให้ครบถ้วน");
  //     return;
  //   }

  //   setLoading(true);

  //   try {
  //     const userId = parseInt(localStorage.getItem("userId") || "0");
  //     if (!userId) {
  //       alert("กรุณาเข้าสู่ระบบใหม่");
  //       setLoading(false);
  //       return;
  //     }

  //     const timeSlotId = getTimeSlotId();
  //     if (!timeSlotId) {
  //       alert("กรุณาเลือกช่วงเวลาที่ถูกต้อง");
  //       setLoading(false);
  //       return;
  //     }

  //     // สร้างข้อมูลสำหรับส่งไป backend
  //     const bookingData = {
  //       user_id: userId,
  //       room_id: roomData.id,
  //       time_slot_id: timeSlotId,
  //       purpose: purpose,
  //       dates: selectedDates, // ส่ง array วันที่
  //     };

  //     console.log("Booking data to send:", bookingData);

  //     // เรียก API ส่งข้อมูลทีเดียว
  //     const res = await CreateBookingRoom(bookingData);

  //     if (res) {
  //       alert(`การจองสำเร็จ! จองทั้งหมด ${selectedDates.length} วัน เราจะติดต่อกลับภายใน 24 ชั่วโมง`);
  //       // รีเซ็ตฟอร์ม
  //       setSelectedDates([]);
  //       setName('');
  //       setPhone('');
  //       setEmail('');
  //       setPurpose('');
  //     } else {
  //       alert("เกิดข้อผิดพลาดในการจอง");
  //     }
  //   } catch (error) {
  //     console.error("Error submitting booking:", error);
  //     alert("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSetAlert = (type: "success" | "error" | "warning", message: string) => {
    setAlerts((prevAlerts) => [...prevAlerts, { type, message }]);
  };

  const handleSubmitBooking = async () => {
    if (!User || !roomData || !purpose || !selectedDates.length || !getTimeSlotId) {
      alert("Please fill in all the required fields.");
      return;
    }

    const bookingData: BookingRoomsInterface[] = [{
      UserID: parseInt(localStorage.getItem("userId") || "0"),
      RoomID: selectedRoomId,
      TimeSlotID: getTimeSlotId(),
      Purpose: purpose,
      AdditionalInfo: additionalInfo, // 👈 เพิ่มตรงนี้
      Dates: selectedDates, // กรณีหลายวัน
      // CustomerName: name,
      // CustomerPhone: phone,
      // CustomerEmail: email,
    }];

    try {
      console.log("Booking data to send:", bookingData);
      const res = await CreateBookingRoom(bookingData);
      console.log("cd", res);
      if (res.status === 200) {

        await fetchBookingMapOnly(roomData.id);  // ถ้าจองเกี่ยวกับห้องนี้
        // รีเซ็ตฟอร์ม
        setSelectedDates([]);
        setName(name);
        setPhone(phone)
        setEmail(email);
        setAdditionalInfo("");
        setPurpose('');
        // renderCalendar();
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





  return (
    <Box className="booking-container">
      <AlertGroup alerts={alerts} setAlerts={setAlerts} />

      {/* Header */}
      <Paper elevation={2} className="header-paper">
        <Box className="header-content">
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
            className="back-button"
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
                className: 'nav-button'
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
            <Paper elevation={2} className="section-paper room-selection-paper">
              <Box className="section-header">
                <Building2 className="section-icon" />
                <Typography variant="h6" fontWeight="600">Select Room</Typography>
              </Box>

              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1 }}>Choose Sub-room In {roomtype.TypeName} category</FormLabel>
                <Select
                  startAdornment={
                    <InputAdornment position="start" className="input-adornment">
                      <Building2 size={18} strokeWidth={3} />
                    </InputAdornment>
                  }
                  value={selectedRoomId}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSelectedRoomId(val);
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
                    <MenuItem key={r.id} value={r.id}>
                      {r.roomnumber}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>

          {/* Time Selection */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} className="section-paper time-selection-paper">
              <Box className="section-header">
                <Clock className="section-icon" />
                <Typography variant="h6" fontWeight="600">Select Duration & Time</Typography>
              </Box>

              {loading && !pricing ? (
                <Box className="loading-container">
                  <CircularProgress size={24} />
                  <Typography className="loading-text">Loading Prices...</Typography>
                </Box>
              ) : (
                <>
                  <FormControl component="fieldset" className="duration-options">
                    <FormLabel component="legend" className="duration-legend">
                      Duration Options
                    </FormLabel>
                    <RadioGroup
                      value={timeOption}
                      onChange={(e) => setTimeOption(e.target.value as "half" | "full")}
                    >
                      <FormControlLabel
                        value="half"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="500">Half Day (4 hours)</Typography>
                            <Typography variant="body2" color="primary" fontWeight="600">
                              ฿{pricing.length > 1 && pricing[1].Price}
                            </Typography>
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="full"
                        control={<Radio />}
                        label={
                          <Box>
                            <Typography variant="body1" fontWeight="500">Full Day (8 hours)</Typography>
                            <Typography variant="body2" color="primary" fontWeight="600">
                              ฿{pricing.length > 2 && pricing[2].Price}
                            </Typography>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </FormControl>

                  {/* Time Slot Selection */}
                  <Divider className="time-divider" />
                  <FormControl component="fieldset">
                    <FormLabel component="legend" className="time-legend">
                      Time Slot {timeOption === "full" && "(Full day covers both slots)"}
                    </FormLabel>
                    <RadioGroup
                      value={timeRange}
                      onChange={(e) => {
                        setTimeRange(e.target.value as "morning" | "afternoon");
                        setSelectedDates([]);
                      }}
                    >
                      <FormControlLabel
                        value="morning"
                        control={<Radio />}
                        label="Morning (09:00 - 13:00)"
                        disabled={timeOption === "full"}
                      />
                      <FormControlLabel
                        value="afternoon"
                        control={<Radio />}
                        label="Afternoon (13:00 - 17:00)"
                        disabled={timeOption === "full"}
                      />
                    </RadioGroup>
                  </FormControl>
                </>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Right Column - Calendar & Booking Summary */}
        <Grid size={{ xs: 12, lg: 6 }}>

          {/* Calendar */}
          <Grid size={{ xs: 12 }}>
            <Paper elevation={2} className="section-paper calendar-paper">
              <Box className="section-header">
                <Calendar className="section-icon" />
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
              <DialogTitle className="dialog-title">
                <Box className="dialog-header">
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
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={3}
              className="booking-summary-paper"
              sx={{ backgroundColor: 'secondary.main' }}
            >
              <Typography variant="h6" fontWeight="bold" mb={3} color="primary">
                Booking Summary
              </Typography>

              {/* Room Type */}
              <Box className="summary-section">
                <Typography variant="body2" color="text.secondary">Meeting Room Type</Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {roomData?.TypeName || '-'}
                </Typography>
              </Box>

              {/* Selected Room */}
              <Box className="summary-section">
                <Typography variant="body2" color="text.secondary">Selected Room</Typography>
                <Typography variant="subtitle1" fontWeight="600">
                  {roomsOfSameType.find(r => r.id === selectedRoomId)?.roomnumber || '-'}
                </Typography>
              </Box>

              {/* Duration & Time */}
              <Box className="summary-section">
                <Typography variant="body2" color="text.secondary">Duration & Time</Typography>
                <Typography fontWeight="600">
                  {timeOption ? getTimeLabel() : '-'}
                </Typography>
                {timeOption === 'half' && (
                  <Typography variant="body2" color="text.secondary">
                    {getTimeRangeLabel()}
                  </Typography>
                )}
              </Box>

              {/* Number of Days */}
              <Box className="summary-section">
                <Typography variant="body2" color="text.secondary">Number of Days</Typography>
                <Chip
                  label={`${selectedDates?.length || 0} days`}
                  color={selectedDates?.length > 0 ? 'primary' : 'default'}
                  size="small"
                />
              </Box>

              {/* Selected Dates */}
              <Box className="summary-dates">
                <Typography variant="body2" color="text.secondary" mb={1}>Selected Dates</Typography>
                {selectedDates && selectedDates.length > 0 ? (
                  <Box className="dates-container">
                    {selectedDates.slice(0, 4).map((date) => (
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

              <Divider className="summary-divider" />

              {/* Price Summary */}
              <Paper elevation={1} className="price-summary">
                {loading ? (
                  <Box className="price-loading">
                    <CircularProgress size={60} />
                    <Typography className="price-loading-text">Calculating Price...</Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="h5" fontWeight="bold" color="primary" mb={1}>
                      ฿{calculatedPrice?.toLocaleString() || '0'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Price</Typography>
                  </>
                )}
              </Paper>

              {/* Discount Section */}
              <Box className="discount-section">
                <Typography variant="body2" color="primary">
                  💎 You have {discount?.remaining ?? 0} free booking(s) left
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  disabled={discount.used || discount.remaining <= 0}
                  onClick={() => {
                    setDiscount((prev) => ({
                      ...prev,
                      used: true,
                      remaining: prev.remaining - 1,
                    }));
                    setCalculatedPrice(0);
                  }}
                  className="discount-button"
                >
                  🎉 Use Free Credit
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

            <Grid container spacing={4}>
              {/* Left Side - Contact Information */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper elevation={1} className="info-section-paper">
                  <Box className="info-section-header">
                    <User size={24} className="info-section-icon" />
                    <Typography variant="h6" fontWeight="600" color="primary">
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
                    <Calendar size={24} />
                    <Typography variant="h6" fontWeight="600" color="primary">
                      Booking Details
                    </Typography>
                  </Box>

                  <Box className="details-fields">
                    <TextField
                      label="Purpose of Booking"
                      fullWidth
                      required
                      multiline
                      rows={1}
                      value={purpose}
                      onChange={(e) => setPurpose(e.target.value)}
                      placeholder="e.g. team planning meeting, client presentation, training session, etc."
                      error={!purpose}
                      helperText={!purpose ? "Please describe the purpose of your booking." : ""}
                      className="textarea-field"
                    />

                    <TextField
                      label="Additional Information (Optional)"
                      fullWidth
                      multiline
                      rows={1}
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      placeholder="e.g. Room setup style, required equipment, special requests, etc."
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
                  onClick={handleSubmitBooking}
                  disabled={
                    loading ||
                    !calculatedPrice ||
                    selectedDates.length === 0 ||
                    !selectedRoomId ||
                    purpose.trim() === "" ||
                    !isAllowedToBookLargeRoom
                  }
                  className="confirm-button"
                  startIcon={loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : <Check size={24} />}
                >
                  {loading ? "Processing Your Booking..." : `Confirm Booking • ฿${calculatedPrice.toLocaleString()}`}
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

      </Grid>
    </Box>
  );

};

export default RoomBookingForm;

function bookingMapOnlyRefetch() {
  throw new Error("Function not implemented.");
}
