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
    Tab,
    CardActionArea,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions
} from '@mui/material';
import { analyticsService, KEY_PAGES } from '../../services/analyticsService';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';

import {
    Event,
    Search,
    Room
} from '@mui/icons-material';
import { TextField } from '../../components/TextField/TextField';
import { Select } from '../../components/Select/Select';
import { ListRoomTypesForBooking } from '../../services/http';
import { RoomtypesInterface } from '../../interfaces/IRoomTypes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExpand } from '@fortawesome/free-solid-svg-icons';
import { Clock12, CloudSun, Cloudy, Sun, Users, XCircle } from 'lucide-react';
import Carousel from 'react-material-ui-carousel';
import { equipmentConfig } from '../../constants/equipmentConfig';

const BookingRoom = () => {
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([])
    const [selectedRoomtypes, setSelectedRoomTypes] = useState<RoomtypesInterface>()

    const [isLoadingData, setIsLoadingData] = useState(true);

    // Initialize interaction tracker
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.BOOKING_ROOM,
        
    });
    const [filters, setFilters] = useState({
        price: 'all',
        capacity: 'all',
        search: '',
    });
    const [openPopupCard, setOpenPopupCard] = useState(false)

    const getRoomTypes = async () => {
        try {
            const res = await ListRoomTypesForBooking();
            if (res) {
                setRoomTypes(res);
            }
        } catch (error) {
            console.error("Error fetching booking rooms:", error);
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    getRoomTypes(),
                ]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching booking rooms:", error);
            }
        };

        fetchInitialData();
    }, []);

    // Analytics tracking
    useEffect(() => {
        const startTime = Date.now();
        let sent = false;

        

        // ส่ง request ตอนเข้า (duration = 0)
        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem('userId')),
            page_path: KEY_PAGES.BOOKING_ROOM,
            page_name: 'Booking Room',
            duration: 0, // ตอนเข้า duration = 0
            is_bounce: false,
        });

        // ฟังก์ชันส่ง analytics ตอนออก
        const sendAnalyticsOnLeave = (isBounce: boolean) => {
            if (sent) {
                
                return;
            }
            sent = true;
            const duration = Math.floor((Date.now() - startTime) / 1000);
            
            analyticsService.trackPageVisit({
                user_id: Number(localStorage.getItem('userId')),
                page_path: KEY_PAGES.BOOKING_ROOM,
                page_name: 'Booking Room',
                duration,
                is_bounce: isBounce,
                interaction_count: getInteractionCount(),
            });
        };

        // ออกจากหน้าแบบปิด tab/refresh
        const handleBeforeUnload = () => {
            sendAnalyticsOnLeave(true);
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // ออกจากหน้าแบบ SPA (React)
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            sendAnalyticsOnLeave(false);
        };
    }, []);

    // การจัดการ Filter
    const handleFilterChange = (e: { target: { name: any; value: any; }; }) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    const handleClickCard = (data: RoomtypesInterface) => {
        setOpenPopupCard(true)
        setSelectedRoomTypes(data)
    };

    const handleClickButton = () => {

    };

    const filteredRoomTypes = roomTypes.filter((roomType) => {
        const roomTypeName = roomType.TypeName;

        const match =
            roomTypeName?.toLowerCase()?.includes(filters.search.toLowerCase())

        return match;
    });

    const roomTypeItemCard = filteredRoomTypes.map((item, index) => {
        const roomSizeStr = `Size: ${item.RoomSize} sqm`
        const halfDayPriceStr = `Half-day: ฿${item.HalfDayRate?.toLocaleString('th-TH')}`
        const fullDayPriceStr = `Full-day: ฿${item.FullDayRate?.toLocaleString('th-TH')}`

        return (
            <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                }}>
                    <CardActionArea
                        slotProps={{
                            focusHighlight: {
                                sx: {
                                    bgcolor: 'rgba(0, 0, 0, 0)',
                                }
                            },
                        }}
                        sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start'
                        }}
                        onClick={() => handleClickCard(item)}
                    >
                        <CardMedia
                            component="img"
                            height="200"
                            image="https://www.hoteljosef.com/wp-content/uploads/2024/06/conference-rooms-prague-projector-690x470.jpg"
                            alt="green iguana"
                        />
                        <CardContent sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            px: 2.6,
                            width: '100%'
                        }}>
                            <Typography variant="h6">
                                {item.TypeName}
                            </Typography>
                            <Box sx={{
                                color: 'text.secondary',
                                display: "flex",
                                alignItems: "center",
                                gap: 0.8,
                            }}>
                                <FontAwesomeIcon
                                    icon={faExpand}
                                    style={{
                                        width: "16px",
                                        height: "16px",
                                        paddingBottom: "2px"
                                    }}
                                />
                                <Typography variant="body2" >
                                    {roomSizeStr}
                                </Typography>
                            </Box>

                            <Box sx={{
                                bgcolor: 'rgba(8, 175, 241, 0.06)',
                                borderRadius: 2,
                                px: 2,
                                py: 1.5,
                                my: 1
                            }}>
                                <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                    Pricing (THB)
                                </Typography>
                                <Grid container spacing={0.8}>
                                    <Grid size={{ xs: 12, sm: 6 }}
                                        sx={{
                                            display: 'inline-flex',
                                            gap: 1,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Clock12 size={16} strokeWidth={2.2} />
                                        <Typography variant='body2'>
                                            {halfDayPriceStr}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}
                                        sx={{
                                            display: 'inline-flex',
                                            gap: 1,
                                            alignItems: 'center'
                                        }}
                                    >
                                        <Sun size={16} strokeWidth={2.2} />
                                        <Typography variant='body2'>
                                            {fullDayPriceStr}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                    Available Equipment
                                </Typography>
                                <Grid container spacing={0.8}>
                                    {
                                        item.RoomEquipments?.map((roomEquipment, index) => {
                                            const equipmentName = roomEquipment.Equipment?.EquipmentName

                                            if (!equipmentName || !equipmentConfig[equipmentName]) return null;

                                            const config = equipmentConfig[equipmentName];
                                            const Icon = config.icon;

                                            return (
                                                <Box key={index}
                                                    sx={{
                                                        display: 'inline-flex',
                                                        gap: 1,
                                                        alignItems: 'center',
                                                        border: '1px solid #e2e8f0',
                                                        px: 1.2,
                                                        py: 0.6,
                                                        borderRadius: 1
                                                    }}
                                                >
                                                    <Icon size={16} strokeWidth={2.2} />
                                                    <Typography variant='body2'>
                                                        {equipmentName}
                                                    </Typography>
                                                </Box>
                                            )
                                        })
                                    }
                                    {
                                        item.RoomEquipments?.length === 0 && (
                                            <Box key={index}
                                                sx={{
                                                    display: 'inline-flex',
                                                    gap: 1,
                                                    alignItems: 'center',
                                                    border: '1px solid #e2e8f0',
                                                    px: 1.2,
                                                    py: 0.6,
                                                    borderRadius: 1
                                                }}
                                            >
                                                <XCircle size={16} strokeWidth={2.2} />
                                                <Typography variant='body2'>There is no equipment in this room.</Typography>
                                            </Box>
                                        )
                                    }
                                </Grid>
                            </Box>

                            <Box>
                                <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                    Seating Capacity
                                </Typography>
                                <Grid container spacing={0.8}>
                                    {
                                        item.RoomTypeLayouts?.map((layout, index) => {
                                            const layoutStr = `${layout.RoomLayout?.LayoutName}: ${layout.Capacity} ${layout.Note ? `(${layout.Note})` : ''}`

                                            return (
                                                <Grid size={{ xs: 12, sm: 6 }}
                                                    sx={{
                                                        display: 'inline-flex',
                                                        gap: 1,
                                                        alignItems: 'center',
                                                        color: 'text.secondary'
                                                    }}
                                                    key={index}
                                                >
                                                    <Users size={16} strokeWidth={2.2} />
                                                    <Typography variant='body2'>
                                                        {layoutStr}
                                                    </Typography>
                                                </Grid>
                                            )
                                        })
                                    }
                                </Grid>
                            </Box>
                        </CardContent>
                    </CardActionArea>
                    <CardActions sx={{ mb: 0.8, px: 2.6 }}>
                        <Button variant='contained' sx={{ width: '100%', py: 1.2 }}>
                            Booking Room
                        </Button>
                    </CardActions>
                </Card>
            </Grid>
        )
    })

    return (
        <Box className="booking-room-page">

            <Dialog
                open={openPopupCard}
                onClose={() => setOpenPopupCard(false)}
                slotProps={{
                    paper: {
                        sx: {
                            width: '70%',
                            maxWidth: '1200px',
                        },
                    },
                }}
            >
                {/* Dialog title with warning icon */}
                <DialogTitle
                    sx={{
                        fontWeight: 700,
                        // color: 'primary.main',
                        // textAlign: 'center'
                    }}
                >
                    {selectedRoomtypes?.TypeName}
                </DialogTitle>

                {/* Message content (split into separate lines for readability) */}
                <DialogContent sx={{ minWidth: 500 }}>
                    <Carousel
                        indicators={true}
                        autoPlay={true}
                        animation="slide"
                        duration={500}
                        navButtonsAlwaysVisible
                        // navButtonsAlwaysInvisible={selectedNews?.NewsImages?.length && selectedNews?.NewsImages?.length <= 1 ? true : false}
                        navButtonsProps={{
                            style: {
                                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            }
                        }}
                    >
                        <CardMedia
                            component="img"
                            image="https://www.corporatevision-news.com/wp-content/uploads/2020/04/7-Steps-to-Make-the-Best-Conference-Room-for-Your-Office.jpg"
                            alt="green iguana"
                            sx={{
                                height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                borderRadius: 2
                            }}
                        />
                        <CardMedia
                            component="img"
                            image="https://www.webex.com/content/dam/www/us/en/images/workspaces/large-meeting-room/modular/large-modular-hero-new.jpg"
                            alt="green iguana"
                            sx={{
                                height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                borderRadius: 2
                            }}
                        />
                    </Carousel>
                    <DialogContentText
                        sx={{
                            color: 'text.primary',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2
                        }}
                    >
                        <Grid container spacing={2}>
                            <Grid
                                size={{ xs: 6 }}
                                sx={{
                                    bgcolor: '#f9fafb',
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    <Typography gutterBottom fontWeight={500}>
                                        Room Size
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.8,
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={faExpand}
                                            style={{
                                                width: "18px",
                                                height: "18px",
                                                paddingBottom: "2px"
                                            }}
                                        />
                                        <Typography fontSize={18} fontWeight={600}>
                                            {`${selectedRoomtypes?.RoomSize?.toLocaleString('th')} sqm`}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>

                            <Grid
                                size={{ xs: 6 }}
                                sx={{
                                    bgcolor: '#f9fafb',
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    <Typography gutterBottom fontWeight={500}>
                                        Pricing (THB)
                                    </Typography>
                                    <Grid size={{ xs: 12 }}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.8,
                                            }}
                                        >
                                            <Clock12 size={16} strokeWidth={2.2} />
                                            <Typography>
                                                Half-day rate:
                                            </Typography>
                                        </Box>
                                        <Typography fontSize={18} fontWeight={700} color='#2563eb'>
                                            {`฿${selectedRoomtypes?.HalfDayRate?.toLocaleString('th')}`}
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12 }}
                                        sx={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            color: 'text.secondary'
                                        }}
                                    >
                                        <Box
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 0.8,
                                            }}
                                        >
                                            <Sun size={16} strokeWidth={2.2} />
                                            <Typography>
                                                Half-day rate:
                                            </Typography>
                                        </Box>
                                        <Typography fontSize={18} fontWeight={700} color='#2563eb'>
                                            {`฿${selectedRoomtypes?.HalfDayRate?.toLocaleString('th')}`}
                                        </Typography>
                                    </Grid>
                                </Box>
                            </Grid>

                            <Grid
                                size={{ xs: 6 }}
                                sx={{
                                    bgcolor: '#f9fafb',
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        // flexDirection: 'column',
                                        flexWrap: 'wrap',
                                        gap: 1
                                    }}
                                >
                                    <Typography gutterBottom fontWeight={500} width={'100%'}>
                                        Seating Capacity
                                    </Typography>
                                    {
                                        selectedRoomtypes?.RoomTypeLayouts?.map((layout, index) => {
                                            const layoutName = layout.RoomLayout?.LayoutName
                                            const note = layout.Note
                                            return (
                                                <Grid size={{ xs: 12, md: 6 }}
                                                    container
                                                    direction={'column'}
                                                    sx={{
                                                        gap: 1,
                                                        alignItems: 'center',
                                                        bgcolor: '#FFF',
                                                        py: 1.4,
                                                        px: 0.6,
                                                        borderRadius: 1
                                                    }}
                                                    key={index}
                                                >
                                                    <Users size={18} strokeWidth={2.2} />
                                                    <Typography variant='body2' fontWeight={500}>
                                                        {layoutName}
                                                    </Typography>
                                                    <Typography fontSize={18} fontWeight={700} color='#2563eb'>
                                                        {layout.Capacity}
                                                    </Typography>
                                                    {note &&
                                                        <Typography color='text.secondary' fontSize={14}>
                                                            {`(${note})`}
                                                        </Typography>
                                                    }

                                                </Grid>
                                            )
                                        })
                                    }
                                </Box>
                            </Grid>

                            <Grid
                                size={{ xs: 6 }}
                                sx={{
                                    bgcolor: '#f9fafb',
                                    borderRadius: 2,
                                    p: 2,
                                }}
                            >
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 1
                                    }}
                                >
                                    <Typography gutterBottom fontWeight={500} width={'100%'}>
                                        Available Equipment
                                    </Typography>
                                    {
                                        selectedRoomtypes?.RoomEquipments?.map((roomEquipment, index) => {
                                            const equipmentName = roomEquipment.Equipment?.EquipmentName
                                            const equipmentQuantity = roomEquipment.Quantity

                                            if (!equipmentName || !equipmentConfig[equipmentName]) return null;

                                            const config = equipmentConfig[equipmentName];
                                            const Icon = config.icon;

                                            return (
                                                <Grid key={index}
                                                    container
                                                    sx={{
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        bgcolor: '#FFF',
                                                        px: 1.6,
                                                        py: 1,
                                                        borderRadius: 1,
                                                    }}
                                                    size={{ xs: 12 }}
                                                >
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 1
                                                        }}
                                                    >
                                                        <Icon size={16} strokeWidth={2.2} />
                                                        <Typography variant='body2'>
                                                            {equipmentName}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant='body2' fontWeight={600}>{equipmentQuantity}</Typography>
                                                </Grid>
                                            )
                                        })
                                    }
                                    {
                                        selectedRoomtypes?.RoomEquipments?.length === 0 && (
                                            <Grid
                                                container
                                                sx={{
                                                    alignItems: 'center',
                                                    bgcolor: '#FFF',
                                                    px: 1.6,
                                                    py: 1,
                                                    borderRadius: 1,
                                                }}
                                                size={{ xs: 12 }}
                                                spacing={1}
                                            >
                                                <XCircle size={16} strokeWidth={2.2} />
                                                <Typography variant='body2'>There is no equipment in this room.</Typography>
                                            </Grid>
                                        )
                                    }
                                </Box>
                            </Grid>
                        </Grid>
                    </DialogContentText>
                </DialogContent>

                {/* Action buttons */}
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            setOpenPopupCard(false);
                        }}
                        variant="contained"
                    // disabled={buttonActive}
                    >
                        Booking Room
                    </Button>
                </DialogActions>
            </Dialog>

            <Container maxWidth={'xl'} sx={{ padding: "0px 0px !important" }}>

                <Grid container spacing={3}>
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

                    {/* Filter section */}
                    {/* <Grid size={{ xs: 12, md: 12 }}>
                        <Card sx={{ p: 2, mb: 3 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder='ค้นหาห้องประชุม'
                                    />
                                </Grid>

                                <Grid size={{ xs: 12, md: 3 }}>
                                    <FormControl fullWidth>
                                        <Select
                                            value={filters.price}
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
                                <Grid size={{ xs: 12, md: 3 }}>
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
                        </Card>
                    </Grid> */}

                    <Grid container spacing={2.5} size={{ xs: 12, md: 12 }}>
                        {roomTypeItemCard}
                    </Grid>
                </Grid>
            </Container>
        </Box>

    );
};

export default BookingRoom;