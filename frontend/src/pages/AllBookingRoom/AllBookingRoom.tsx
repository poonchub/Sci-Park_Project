import { faMagnifyingGlass, faRotateRight, faEye } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    Box, Button, Card, Container, FormControl, Grid, InputAdornment, MenuItem,
    Skeleton, Typography, useMediaQuery, Dialog, DialogTitle, DialogContent, DialogActions
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";
import { TextField } from "../../components/TextField/TextField";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "../../components/DatePicker/DatePicker";
import { CalendarMonth } from "@mui/icons-material";
import { Select } from "../../components/Select/Select";
import CustomDataGrid from "../../components/CustomDataGrid/CustomDataGrid";
import { useEffect, useState } from "react";
import theme from "../../styles/Theme";
import dateFormat from "../../utils/dateFormat";
import timeFormat from "../../utils/timeFormat";
import { ListBookingRooms } from "../../services/http";
import { BookingRoomsInterface } from "../../interfaces/IBookingRooms";
import dayjs from "dayjs";

function AllBookingRoom() {
    const [bookingRooms, setBookingRooms] = useState<BookingRoomsInterface[]>([]);
    const [searchText, setSearchText] = useState("");
    const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
    const [selectedType, setSelectedType] = useState<number>(0);

    const [openDetail, setOpenDetail] = useState(false);
    const [selectedBooking, setSelectedBooking] = useState<BookingRoomsInterface | null>(null);

    const [page, setPage] = useState(0);
    const [limit, setLimit] = useState(20);
    const [total, setTotal] = useState(0);
    const [isLoadingData, setIsLoadingData] = useState(true);

    const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

    const handleViewDetail = (row: BookingRoomsInterface) => {
        setSelectedBooking(row);
        setOpenDetail(true);
    };

    const getColumns = (): GridColDef[] => [
        {
            field: "id",
            headerName: "No.",
            flex: 0.5,
            align: "center",
            headerAlign: "center"
        },
        {
            field: "Room",
            headerName: "Room",
            flex: 1.8,
            renderCell: (params) => {
                const room = params.row.Room;
                const roomNumber = room?.RoomNumber || "-";
                const floor = room?.Floor?.Number || "-";
                return (
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography fontWeight={600}>{`ห้อง ${roomNumber} ชั้น ${floor}`}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {params.row.purpose || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "Date",
            headerName: "Date",
            flex: 1,
            renderCell: (params) => {
                const bookingDates = params.row.BookingDates || [];
                if (bookingDates.length === 0) return "-";
                const firstDate = dateFormat(bookingDates[0].Date);
                return (
                    <Typography>
                        {firstDate}
                        {bookingDates.length > 1 && ` (+${bookingDates.length - 1} วัน)`}
                    </Typography>
                );
            }
        },
        {
            field: "TimeSlots",
            headerName: "Time Slot",
            flex: 1.5,
            renderCell: (params) => {
                const slots = params.row.merged_time_slots || [];
                if (slots.length === 0) return "-";
                const firstSlot = slots[0];
                const lastSlot = slots[slots.length - 1];
                return (
                    <Typography>
                        {timeFormat(firstSlot.start_time)} - {timeFormat(lastSlot.end_time)} น.
                        {slots.length > 1 && ` (${slots.length} ช่วงเวลา)`}
                    </Typography>
                );
            }
        },
        {
            field: "status_name",
            headerName: "Status",
            flex: 1,
            renderCell: (params) => {
                const statusName = params.row.status_name || "-";
                let color = "gray";
                if (statusName === "confirmed") color = "green";
                if (statusName === "pending") color = "orange";
                if (statusName === "cancelled") color = "red";
                return <Typography color={color}>{statusName}</Typography>;
            }
        },
        {
            field: "Booker",
            headerName: "Booker",
            flex: 1.2,
            renderCell: (params) => {
                const u = params.row.User || {};
                return (
                    <Box>
                        <Typography fontWeight={500}>
                            {u.FirstName || "-"} {u.LastName || ""}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {u.EmployeeID || "-"}
                        </Typography>
                    </Box>
                );
            }
        },
        {
            field: "Actions",
            headerName: "Actions",
            flex: 1,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleViewDetail(params.row)}
                >
                    <FontAwesomeIcon icon={faEye} style={{ marginRight: 5 }} />
                    ดูรายละเอียด
                </Button>
            )
        }
    ];

    const getBookingRooms = async () => {
        try {
            const res = await ListBookingRooms();
            console.log("API Data:", res);
            console.log("ตรวจ key ก่อนส่งเข้า DataGrid:");
            filteredData.forEach((row, i) => {
                console.log(i, "getRowId =", row.ID, "Room =", row.Room?.RoomNumber);
            });

            res.forEach((b: { id: any; Room: { RoomNumber: any; Floor: { Number: any; }; }; }, i: any) => {
                console.log(`[${i}] bookingId=${b.id} room=${b.Room?.RoomNumber} floor=${b.Room?.Floor?.Number}`);
            });
            setBookingRooms(res);
            setTotal(res.length);
        } catch (error) {
            console.error("Error fetching booking rooms:", error);
        } finally {
            setIsLoadingData(false);
        }
    };



    const handleClearFilter = () => {
        setSearchText("");
        setSelectedDate(null);
        setSelectedType(0);
    };

    useEffect(() => {
        getBookingRooms();
    }, []);

    const filteredData = bookingRooms.filter(item => {
        const matchSearch = searchText === "" || item.purpose?.toLowerCase().includes(searchText.toLowerCase());
        const matchDate = !selectedDate || item.BookingDates?.some((d: { Date: string | number | dayjs.Dayjs | Date | null | undefined; }) => dayjs(d.Date).isSame(selectedDate, "month"));
        const matchType = selectedType === 0 || item.TypeID === selectedType;
        return matchSearch && matchDate && matchType;
    });

    return (
        <Box>
            <Container maxWidth="xl">
                <Typography variant="h5" fontWeight={700} mb={2}>รายการจองห้อง</Typography>
                <Card sx={{ mb: 2, p: 2 }}>
                    <Grid container spacing={1} alignItems="center">
                        <Grid size={{ xs: 12, sm: 5 }}>
                            <TextField
                                fullWidth
                                placeholder="ค้นหา"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <DatePicker
                                    views={["month", "year"]}
                                    format="MM/YYYY"
                                    value={selectedDate}
                                    onChange={setSelectedDate}
                                    slots={{ openPickerIcon: CalendarMonth }}
                                    sx={{ width: "100%" }}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid size={{ xs: 6, sm: 3 }}>
                            <FormControl fullWidth>
                                <Select value={selectedType} onChange={(e) => setSelectedType(Number(e.target.value))}>
                                    <MenuItem value={0}>ทุกประเภท</MenuItem>
                                    <MenuItem value={1}>ประเภท A</MenuItem>
                                    <MenuItem value={2}>ประเภท B</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 2, sm: 1 }}>
                            <Button onClick={handleClearFilter} sx={{ height: "45px" }}>
                                <FontAwesomeIcon icon={faRotateRight} />
                            </Button>
                        </Grid>
                    </Grid>
                </Card>

                {isLoadingData ? (
                    <Skeleton variant="rectangular" height={220} />
                ) : (
                    <CustomDataGrid
                        rows={filteredData}
                        columns={getColumns()}
                        getRowId={(row: any) => row.id} // ✅ ใช้ id จาก backend โดยตรง
                        rowCount={filteredData.length}
                        page={page}
                        limit={limit}
                        onPageChange={setPage}
                        onLimitChange={setLimit}
                        noDataText="ไม่พบข้อมูลการจองห้อง"
                    />



                )}
                <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>รายละเอียดการจอง</DialogTitle>
                    <DialogContent dividers>
                        {selectedBooking && (
                            <>
                                <Typography><strong>ห้อง:</strong> {`ห้อง ${selectedBooking.Room?.RoomNumber || "-"} ชั้น ${selectedBooking.Room?.Floor?.Number || "-"}`}</Typography>
                                <Typography><strong>วันที่:</strong> {selectedBooking.BookingDates?.map((d: { Date: string; }) => dateFormat(d.Date)).join(", ")}</Typography>
                                <Typography><strong>เวลา:</strong> {selectedBooking.merged_time_slots?.map((s: { start_time: string; end_time: string; }) => `${timeFormat(s.start_time)} - ${timeFormat(s.end_time)} น.`).join(", ")}</Typography>
                                <Typography><strong>สถานะ:</strong> {selectedBooking.StatusName || "-"}</Typography>
                                <Typography><strong>ผู้จอง:</strong> {`${selectedBooking.User?.FirstName || "-"} ${selectedBooking.User?.LastName || ""}`}</Typography>
                                <Typography><strong>รหัสพนักงาน:</strong> {selectedBooking.User?.EmployeeID || "-"}</Typography>
                                <Typography><strong>วัตถุประสงค์:</strong> {selectedBooking.purpose || "-"}</Typography>
                                <Typography><strong>ข้อมูลเพิ่มเติม:</strong></Typography>
                                <ul>
                                    <li>รูปแบบการจัด: {selectedBooking.AdditionalInfo?.setupStyle || "-"}</li>
                                    <li>อุปกรณ์: {selectedBooking.AdditionalInfo?.equipment?.length
                                        ? selectedBooking.AdditionalInfo.equipment.join(", ")
                                        : "-"}</li>
                                    <li>หมายเหตุเพิ่มเติม: {selectedBooking.AdditionalInfo?.additionalNote || "-"}</li>
                                </ul>

                            </>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDetail(false)}>ปิด</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </Box>
    );
}

export default AllBookingRoom;
