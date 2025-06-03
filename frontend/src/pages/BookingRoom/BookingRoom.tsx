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
    FormControl,
    InputLabel,
    MenuItem,
    Paper,
    Chip,
    Tabs,
    Tab
} from '@mui/material';

import {
    Event,
    Search,
    Room
} from '@mui/icons-material';
import { TextField } from '../../components/TextField/TextField';
import { Select } from '../../components/Select/Select';

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

const BookingRoom = () => {

    const [filteredRooms, setFilteredRooms] = useState(meetingRoomsData);
    const [filters, setFilters] = useState({
        size: 'all',
        capacity: 'all',
        search: '',
    });
    const [tabValue, setTabValue] = useState(0);

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

    // การจัดการ Filter
    const handleFilterChange = (e: { target: { name: any; value: any; }; }) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    // การจัดการ Tab
    const handleTabChange = (_event: any, newValue: React.SetStateAction<number>) => {
        setTabValue(newValue);
    };

    return (
        <Box className="booking-room-page">
            <Container maxWidth={'xl'} sx={{ py: 4 }}>

                {/* Header Section */}
                <Grid className='title-box' size={{ xs: 12, md: 12 }}>
                    <Typography variant="h5" className="title" sx={{
                        fontWeight: 700,
                        fontSize: {

                        }
                    }}>
                        การจองห้องประชุม
                    </Typography>
                </Grid>
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
                        />
                    </Tabs>
                </Box>

                {tabValue === 0 && (
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
                                <Grid size={{ xs: 12, md: 4 }}>
                                    <TextField
                                        fullWidth
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder='ค้นหาห้องประชุม'
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                                    <FormControl fullWidth>
                                        <Select
                                            labelId="size-filter-label"
                                            name="size"
                                            value={filters.size}
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
                                        <Select
                                            labelId="capacity-filter-label"
                                            name="capacity"
                                            value={filters.capacity}
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

            </Container>
        </Box>

    );
};

export default BookingRoom;