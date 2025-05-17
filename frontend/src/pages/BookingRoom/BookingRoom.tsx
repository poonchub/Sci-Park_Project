import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CardMedia,
    CardActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Paper,
    Stepper,
    Step,
    StepLabel,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Chip,
    Divider,
    Tabs,
    Tab
} from '@mui/material';
import {
    DatePicker,
    TimePicker,
    LocalizationProvider
} from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { format } from 'date-fns';
import {
    MeetingRoom,
    People,
    BusinessCenter,
    Event,
    CheckCircleOutline,
    FilterList,
    Search,
    Room
} from '@mui/icons-material';
import { format } from 'date-fns';

// ข้อมูลห้องประชุมตัวอย่าง
const meetingRoomsData = [
    {
        id: 1,
        name: "ห้องประชุม Innovation",
        capacity: 20,
        pricePerHour: 1000,
        size: "เล็ก",
        description: "เหมาะสำหรับการประชุมขนาดเล็ก มีอุปกรณ์ครบครัน",
        facilities: ["โปรเจคเตอร์", "ไวไฟความเร็วสูง", "กระดานไวท์บอร์ด", "เครื่องปรับอากาศ"],
        image: "/api/placeholder/800/500",
        location: "อาคาร A ชั้น 2"
    },
    {
        id: 2,
        name: "ห้องประชุม Discovery",
        capacity: 50,
        pricePerHour: 2500,
        size: "กลาง",
        description: "เหมาะสำหรับการประชุมขนาดกลาง พร้อมอุปกรณ์โสตทัศนูปกรณ์ครบชุด",
        facilities: ["โปรเจคเตอร์", "ไวไฟความเร็วสูง", "ระบบเสียง", "ไมโครโฟนไร้สาย", "เครื่องปรับอากาศ"],
        image: "/api/placeholder/800/500",
        location: "อาคาร B ชั้น 1"
    },
    {
        id: 3,
        name: "ห้องประชุม Science Hub",
        capacity: 100,
        pricePerHour: 5000,
        size: "ใหญ่",
        description: "ห้องประชุมขนาดใหญ่ เหมาะสำหรับการสัมมนาและการประชุมใหญ่",
        facilities: ["โปรเจคเตอร์คู่", "ไวไฟความเร็วสูง", "ระบบเสียงคุณภาพสูง", "ไมโครโฟนไร้สาย 4 ตัว", "ระบบบันทึกวิดีโอ", "เครื่องปรับอากาศ"],
        image: "/api/placeholder/800/500",
        location: "อาคาร C ชั้น 3"
    },
    {
        id: 4,
        name: "ห้องประชุม Tech Space",
        capacity: 30,
        pricePerHour: 1500,
        size: "เล็ก",
        description: "ห้องประชุมทันสมัยพร้อมอุปกรณ์เทคโนโลยีล่าสุด",
        facilities: ["จอทัชสกรีน", "ไวไฟความเร็วสูง", "ระบบประชุมทางไกล", "เครื่องปรับอากาศ"],
        image: "/api/placeholder/800/500",
        location: "อาคาร A ชั้น 3"
    },
    {
        id: 5,
        name: "ห้องประชุม Research Lab",
        capacity: 40,
        pricePerHour: 2000,
        size: "กลาง",
        description: "ห้องประชุมสำหรับนักวิจัยและการนำเสนองาน",
        facilities: ["โปรเจคเตอร์", "ไวไฟความเร็วสูง", "ระบบเสียง", "กระดานอัจฉริยะ", "เครื่องปรับอากาศ"],
        image: "/api/placeholder/800/500",
        location: "อาคาร B ชั้น 2"
    },
    {
        id: 6,
        name: "ห้องประชุม Exhibition Hall",
        capacity: 200,
        pricePerHour: 10000,
        size: "ใหญ่พิเศษ",
        description: "พื้นที่ขนาดใหญ่สำหรับงานนิทรรศการและงานประชุมใหญ่",
        facilities: ["ระบบแสงสี", "เวที", "ระบบเสียงขนาดใหญ่", "โปรเจคเตอร์หลายจุด", "ไวไฟความเร็วสูง", "ระบบปรับอากาศขนาดใหญ่"],
        image: "/api/placeholder/800/500",
        location: "อาคาร D ชั้น 1"
    }
];

// คอมโพเนนต์หลัก
const BookingRoom = () => {
    // States
    const [rooms, setRooms] = useState(meetingRoomsData);
    const [filteredRooms, setFilteredRooms] = useState(meetingRoomsData);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [activeStep, setActiveStep] = useState(0);
    const [bookingDate, setBookingDate] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [bookingDetails, setBookingDetails] = useState({
        name: '',
        email: '',
        phone: '',
        organization: '',
        purpose: '',
        attendees: '',
    });
    const [openDialog, setOpenDialog] = useState(false);
    const [bookingConfirmed, setBookingConfirmed] = useState(false);
    const [bookingId, setBookingId] = useState('');
    const [filters, setFilters] = useState({
        size: 'all',
        capacity: 'all',
        search: '',
    });
    const [tabValue, setTabValue] = useState(0);

    // ขั้นตอนการจอง
    const steps = ['เลือกห้องประชุม', 'เลือกวันและเวลา', 'กรอกข้อมูลการจอง', 'ยืนยันการจอง'];

    // Effect สำหรับการกรองห้องประชุม
    useEffect(() => {
        let result = meetingRoomsData;

        // กรองตามขนาด
        if (filters.size !== 'all') {
            result = result.filter(room => room.size === filters.size);
        }

        // กรองตามความจุ
        if (filters.capacity !== 'all') {
            switch (filters.capacity) {
                case 'small':
                    result = result.filter(room => room.capacity <= 30);
                    break;
                case 'medium':
                    result = result.filter(room => room.capacity > 30 && room.capacity <= 100);
                    break;
                case 'large':
                    result = result.filter(room => room.capacity > 100);
                    break;
                default:
                    break;
            }
        }

        // ค้นหาตามชื่อ
        if (filters.search) {
            result = result.filter(room =>
                room.name.toLowerCase().includes(filters.search.toLowerCase()) ||
                room.description.toLowerCase().includes(filters.search.toLowerCase())
            );
        }

        setFilteredRooms(result);
    }, [filters]);

    // การจัดการขั้นตอนการจอง
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleReset = () => {
        setActiveStep(0);
        setSelectedRoom(null);
        setBookingDate(null);
        setStartTime(null);
        setEndTime(null);
        setBookingDetails({
            name: '',
            email: '',
            phone: '',
            organization: '',
            purpose: '',
            attendees: '',
        });
        setBookingConfirmed(false);
    };

    // เลือกห้องประชุม
    const handleSelectRoom = (room) => {
        setSelectedRoom(room);
        handleNext();
    };

    // เปลี่ยนข้อมูลการจอง
    const handleBookingDetailsChange = (e) => {
        setBookingDetails({
            ...bookingDetails,
            [e.target.name]: e.target.value
        });
    };

    // คำนวณค่าใช้จ่าย
    const calculateCost = () => {
        if (!selectedRoom || !startTime || !endTime) return 0;

        const start = new Date(startTime);
        const end = new Date(endTime);
        const hours = (end - start) / (1000 * 60 * 60);

        return selectedRoom.pricePerHour * hours;
    };

    // ยืนยันการจอง
    const handleConfirmBooking = () => {
        // สร้างรหัสการจองแบบสุ่ม
        const randomId = Math.random().toString(36).substr(2, 9).toUpperCase();
        setBookingId(randomId);
        setBookingConfirmed(true);
        setOpenDialog(true);
    };

    // ปิด Dialog
    const handleCloseDialog = () => {
        setOpenDialog(false);
        if (bookingConfirmed) {
            handleReset();
        }
    };

    // การจัดการ Filter
    const handleFilterChange = (e) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    // การจัดการ Tab
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // ส่วนแสดงผลตามขั้นตอน
    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Box>
                        <Box sx={{ mb: 4 }}>
                            <Typography variant="h5" component="h2" gutterBottom>
                                เลือกห้องประชุมที่ต้องการ
                            </Typography>
                            <Typography color="textSecondary" paragraph>
                                เลือกห้องประชุมที่เหมาะกับความต้องการของคุณ
                            </Typography>
                        </Box>

                        {/* ส่วนการกรอง */}
                        <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="body1" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <FilterList sx={{ mr: 1 }} />
                                        ตัวกรองการค้นหา
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        label="ค้นหาห้องประชุม"
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        InputProps={{
                                            startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />,
                                        }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="size-filter-label">ขนาดห้อง</InputLabel>
                                        <Select
                                            labelId="size-filter-label"
                                            name="size"
                                            value={filters.size}
                                            label="ขนาดห้อง"
                                            onChange={handleFilterChange}
                                        >
                                            <MenuItem value="all">ทั้งหมด</MenuItem>
                                            <MenuItem value="เล็ก">เล็ก</MenuItem>
                                            <MenuItem value="กลาง">กลาง</MenuItem>
                                            <MenuItem value="ใหญ่">ใหญ่</MenuItem>
                                            <MenuItem value="ใหญ่พิเศษ">ใหญ่พิเศษ</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <FormControl fullWidth>
                                        <InputLabel id="capacity-filter-label">ความจุ</InputLabel>
                                        <Select
                                            labelId="capacity-filter-label"
                                            name="capacity"
                                            value={filters.capacity}
                                            label="ความจุ"
                                            onChange={handleFilterChange}
                                        >
                                            <MenuItem value="all">ทั้งหมด</MenuItem>
                                            <MenuItem value="small">1-30 คน</MenuItem>
                                            <MenuItem value="medium">31-100 คน</MenuItem>
                                            <MenuItem value="large">มากกว่า 100 คน</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Paper>

                        {/* รายการห้องประชุม */}
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" sx={{ mb: 2 }}>
                                พบ {filteredRooms.length} ห้องประชุม
                            </Typography>

                            <Grid container spacing={3}>
                                {filteredRooms.map((room) => (
                                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={room.id}>
                                        <Card
                                            sx={{
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                transition: 'transform 0.2s',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: 4
                                                }
                                            }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="180"
                                                image={room.image}
                                                alt={room.name}
                                            />
                                            <CardContent sx={{ flexGrow: 1 }}>
                                                <Typography variant="h6" component="h3" gutterBottom>
                                                    {room.name}
                                                </Typography>

                                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                                    <Room fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary">
                                                        {room.location}
                                                    </Typography>
                                                </Box>

                                                <Box sx={{ display: 'flex', mb: 2 }}>
                                                    <Chip
                                                        label={`${room.size}`}
                                                        size="small"
                                                        sx={{ mr: 1 }}
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                    <Chip
                                                        label={`${room.capacity} คน`}
                                                        size="small"
                                                        color="primary"
                                                        variant="outlined"
                                                    />
                                                </Box>

                                                <Typography variant="body2" paragraph>
                                                    {room.description}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                                    สิ่งอำนวยความสะดวก:
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                                    {room.facilities.slice(0, 3).map((facility, index) => (
                                                        <Chip
                                                            key={index}
                                                            label={facility}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    ))}
                                                    {room.facilities.length > 3 && (
                                                        <Chip
                                                            label={`+${room.facilities.length - 3}`}
                                                            size="small"
                                                            variant="outlined"
                                                            sx={{ fontSize: '0.75rem' }}
                                                        />
                                                    )}
                                                </Box>

                                                <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
                                                    ฿{room.pricePerHour.toLocaleString()} / ชั่วโมง
                                                </Typography>
                                            </CardContent>
                                            <CardActions>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    fullWidth
                                                    onClick={() => handleSelectRoom(room)}
                                                >
                                                    เลือกห้องนี้
                                                </Button>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>

                            {filteredRooms.length === 0 && (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Typography variant="h6" color="text.secondary">
                                        ไม่พบห้องประชุมที่ตรงกับเงื่อนไขการค้นหา
                                    </Typography>
                                    <Button
                                        variant="outlined"
                                        sx={{ mt: 2 }}
                                        onClick={() => setFilters({ size: 'all', capacity: 'all', search: '' })}
                                    >
                                        ล้างตัวกรอง
                                    </Button>
                                </Box>
                            )}
                        </Box>
                    </Box>
                );
            case 1:
                return (
                    <Box>
                        <Typography variant="h5" component="h2" gutterBottom>
                            เลือกวันที่และเวลา
                        </Typography>

                        <Box sx={{ mb: 4 }}>
                            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                                <Grid container spacing={2} alignItems="flex-start">
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Box sx={{ width: '100%', p: 2, textAlign: 'center' }}>
                                            <img src={selectedRoom?.image} alt={selectedRoom.name} style={{ width: '100%', borderRadius: '8px' }} />
                                        </Box>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Typography variant="h6">{selectedRoom.name}</Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {selectedRoom.location}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                            <People sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                จำนวนคนสูงสุด: {selectedRoom.capacity} คน
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <BusinessCenter sx={{ fontSize: 20, mr: 1, color: 'text.secondary' }} />
                                            <Typography variant="body2">
                                                ขนาด: {selectedRoom.size}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body2" sx={{ mb: 1 }}>
                                            สิ่งอำนวยความสะดวก:
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
                                            {selectedRoom.facilities.map((facility, index) => (
                                                <Chip
                                                    key={index}
                                                    label={facility}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                            ฿{selectedRoom.pricePerHour.toLocaleString()} / ชั่วโมง
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Box>

                        <Paper elevation={1} sx={{ p: 3 }}>
                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <DatePicker
                                            label="วันที่จอง"
                                            value={bookingDate}
                                            onChange={(newValue) => setBookingDate(newValue)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                            disablePast
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <TimePicker
                                            label="เวลาเริ่มต้น"
                                            value={startTime}
                                            onChange={(newValue) => setStartTime(newValue)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                            minutesStep={30}
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                                        <TimePicker
                                            label="เวลาสิ้นสุด"
                                            value={endTime}
                                            onChange={(newValue) => setEndTime(newValue)}
                                            renderInput={(params) => <TextField {...params} fullWidth />}
                                            minutesStep={30}
                                            sx={{ width: '100%' }}
                                        />
                                    </LocalizationProvider>
                                </Grid>
                            </Grid>

                            {bookingDate && startTime && endTime && (
                                <Box sx={{ mt: 3 }}>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                                        สรุปการจอง
                                    </Typography>
                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                วันที่:
                                            </Typography>
                                            <Typography variant="body1">
                                                {bookingDate ? format(new Date(bookingDate), 'dd/MM/yyyy') : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                เวลา:
                                            </Typography>
                                            <Typography variant="body1">
                                                {startTime && endTime ?
                                                    `${format(new Date(startTime), 'HH:mm')} - ${format(new Date(endTime), 'HH:mm')} น.` :
                                                    '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                ค่าใช้จ่ายโดยประมาณ:
                                            </Typography>
                                            <Typography variant="body1" color="primary" fontWeight="bold">
                                                ฿{calculateCost().toLocaleString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    ย้อนกลับ
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    disabled={!bookingDate || !startTime || !endTime}
                                >
                                    ถัดไป
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                );
            case 2:
                return (
                    <Box>
                        <Typography variant="h5" component="h2" gutterBottom>
                            กรอกข้อมูลการจอง
                        </Typography>
                        <Paper elevation={1} sx={{ p: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                    <Typography variant="subtitle1" gutterBottom>
                                        รายละเอียดการจอง
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                ห้องประชุม:
                                            </Typography>
                                            <Typography variant="body1">
                                                {selectedRoom ? selectedRoom.name : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                วันที่:
                                            </Typography>
                                            <Typography variant="body1">
                                                {bookingDate ? format(new Date(bookingDate), 'dd/MM/yyyy') : '-'}
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                เวลา:
                                            </Typography>
                                            <Typography variant="body1">
                                                {startTime && endTime ?
                                                    `${format(new Date(startTime), 'HH:mm')} - ${format(new Date(endTime), 'HH:mm')} น.` :
                                                    '-'}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Box>

                            <Grid container spacing={3}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="name"
                                        label="ชื่อ-นามสกุล"
                                        fullWidth
                                        required
                                        value={bookingDetails.name}
                                        onChange={handleBookingDetailsChange}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="email"
                                        label="อีเมล"
                                        fullWidth
                                        required
                                        value={bookingDetails.email}
                                        onChange={handleBookingDetailsChange}
                                        type="email"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="phone"
                                        label="เบอร์โทรศัพท์"
                                        fullWidth
                                        required
                                        value={bookingDetails.phone}
                                        onChange={handleBookingDetailsChange}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="organization"
                                        label="หน่วยงาน/องค์กร"
                                        fullWidth
                                        value={bookingDetails.organization}
                                        onChange={handleBookingDetailsChange}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField
                                        name="attendees"
                                        label="จำนวนผู้เข้าร่วม (คน)"
                                        fullWidth
                                        required
                                        value={bookingDetails.attendees}
                                        onChange={handleBookingDetailsChange}
                                        type="number"
                                    />
                                </Grid>
                                <Grid size={{ xs: 12 }}>
                                    <TextField
                                        name="purpose"
                                        label="วัตถุประสงค์การใช้งาน"
                                        fullWidth
                                        multiline
                                        rows={3}
                                        value={bookingDetails.purpose}
                                        onChange={handleBookingDetailsChange}
                                    />
                                </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    ย้อนกลับ
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    disabled={!bookingDetails.name || !bookingDetails.email || !bookingDetails.phone || !bookingDetails.attendees}
                                >
                                    ถัดไป
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="h5" component="h2" gutterBottom>
                            ยืนยันการจอง
                        </Typography>
                        <Paper elevation={1} sx={{ p: 3 }}>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="h6" gutterBottom>
                                    สรุปข้อมูลการจอง
                                </Typography>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                                <Event sx={{ mr: 1, fontSize: 20 }} />
                                                รายละเอียดห้องประชุม
                                            </Typography>

                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    ห้องประชุม:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {selectedRoom.name}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    สถานที่:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {selectedRoom.location}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    ขนาด / ความจุ:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {selectedRoom.size} / {selectedRoom.capacity} คน
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    อัตราค่าบริการ:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    ฿{selectedRoom.pricePerHour.toLocaleString()} / ชั่วโมง
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                                <MeetingRoom sx={{ mr: 1, fontSize: 20 }} />
                                                รายละเอียดการจอง
                                            </Typography>

                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    วันที่:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {bookingDate ? format(new Date(bookingDate), 'dd/MM/yyyy') : '-'}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    เวลา:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {startTime && endTime ?
                                                        `${format(new Date(startTime), 'HH:mm')} - ${format(new Date(endTime), 'HH:mm')} น.` :
                                                        '-'}
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    จำนวนผู้เข้าร่วม:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {bookingDetails.attendees} คน
                                                </Typography>

                                                <Typography variant="body2" color="text.secondary">
                                                    วัตถุประสงค์:
                                                </Typography>
                                                <Typography variant="body1" sx={{ mb: 1 }}>
                                                    {bookingDetails.purpose || '-'}
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>

                                    <Grid size={{ xs: 12 }}>
                                        <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default' }}>
                                            <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                                                <People sx={{ mr: 1, fontSize: 20 }} />
                                                ข้อมูลผู้จอง
                                            </Typography>

                                            <Grid container spacing={2} sx={{ mt: 1 }}>
                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        ชื่อ-นามสกุล:
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                                        {bookingDetails.name}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        อีเมล:
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                                        {bookingDetails.email}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12, sm: 4 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        เบอร์โทรศัพท์:
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ mb: 1 }}>
                                                        {bookingDetails.phone}
                                                    </Typography>
                                                </Grid>

                                                <Grid size={{ xs: 12 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        หน่วยงาน/องค์กร:
                                                    </Typography>
                                                    <Typography variant="body1">
                                                        {bookingDetails.organization || '-'}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, p: 3, bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}>
                                    <Grid container alignItems="center" spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <Typography variant="subtitle1">
                                                ค่าใช้จ่ายทั้งหมด:
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                (ราคานี้ยังไม่รวมภาษีมูลค่าเพิ่ม 7%)
                                            </Typography>
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                                ฿{calculateCost().toLocaleString()}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    onClick={handleBack}
                                    sx={{ mr: 1 }}
                                >
                                    ย้อนกลับ
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleConfirmBooking}
                                >
                                    ยืนยันการจอง
                                </Button>
                            </Box>
                        </Paper>
                    </Box>
                );
            default:
                return 'Unknown step';
        }
    };

    // Dialog ยืนยันการจอง
    const renderConfirmationDialog = () => (
        <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                {bookingConfirmed ? 'การจองสำเร็จ' : 'เกิดข้อผิดพลาด'}
            </DialogTitle>
            <DialogContent>
                {bookingConfirmed ? (
                    <Box sx={{ textAlign: 'center', py: 2 }}>
                        <CheckCircleOutline sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <DialogContentText gutterBottom>
                            การจองของคุณได้รับการยืนยันเรียบร้อยแล้ว
                        </DialogContentText>
                        <Typography variant="h6" gutterBottom sx={{ my: 2 }}>
                            รหัสการจอง: <Box component="span" fontWeight="bold">{bookingId}</Box>
                        </Typography>
                        <DialogContentText>
                            เราได้ส่งรายละเอียดการจองไปยังอีเมล {bookingDetails.email} ของคุณแล้ว
                        </DialogContentText>
                    </Box>
                ) : (
                    <DialogContentText>
                        เกิดข้อผิดพลาดในการจอง กรุณาลองใหม่อีกครั้ง
                    </DialogContentText>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} color="primary" autoFocus>
                    {bookingConfirmed ? 'เสร็จสิ้น' : 'ปิด'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    return (
        <Container maxWidth={false} sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Tabs value={tabValue} onChange={handleTabChange} centered>
                    <Tab
                        icon={<Event />}
                        label="จองห้องประชุม"
                        iconPosition="start"
                    />
                    <Tab
                        icon={<Search />}
                        label="ตรวจสอบการจอง"
                        iconPosition="start"
                        disabled
                    />
                </Tabs>
            </Box>

            {tabValue === 0 && (
                <>
                    <Box sx={{ mb: 4 }}>
                        <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label) => (
                                <Step key={label}>
                                    <StepLabel>{label}</StepLabel>
                                </Step>
                            ))}
                        </Stepper>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                        {getStepContent(activeStep)}
                    </Box>
                </>
            )}

            {tabValue === 1 && (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Typography variant="h6" gutterBottom>
                        ฟีเจอร์การตรวจสอบการจองกำลังอยู่ในระหว่างการพัฒนา
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        โปรดกลับมาใหม่ในเร็วๆ นี้
                    </Typography>
                </Box>
            )}

            {renderConfirmationDialog()}
        </Container>
    );
};

export default BookingRoom;