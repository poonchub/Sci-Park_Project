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
import { CloudSun, Cloudy, Sun, Users } from 'lucide-react';

const BookingRoom = () => {
    const [roomtypes, setRoomTypes] = useState<RoomtypesInterface[]>([])
    const [selectedRoomtypes, setSelectedRoomTypes] = useState<RoomtypesInterface>()

    const [filteredRooms, setFilteredRooms] = useState();
    const [isLoadingData, setIsLoadingData] = useState(true);
    const [filters, setFilters] = useState({
        size: 'all',
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
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
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

    const roomTypeItemCard = roomtypes.map((item, index) => {
        console.log(item)
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
                                        <Sun size={16} strokeWidth={2.2} />
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
                                        <Cloudy size={16} strokeWidth={2.2} />
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
                            </Box>

                            <Box>
                                <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                    Seating Capacity
                                </Typography>
                                <Grid container spacing={0.8}>
                                    {
                                        item.RoomTypeLayouts?.map((layout, index) => {
                                            let layoutStr
                                            if (layout.RoomLayout) {
                                                layoutStr = `${layout.RoomLayout?.LayoutName}: ${layout.Capacity} ${layout.Note ? `(${layout.Note})` : ''}`
                                            } else {
                                                layoutStr = layout.Note
                                            }

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
                    <DialogContentText sx={{ color: 'text.primary' }}>
                        <CardMedia
                            component="img"
                            image="https://www.hoteljosef.com/wp-content/uploads/2024/06/conference-rooms-prague-projector-690x470.jpg"
                            alt="green iguana"
                            sx={{ 
                                height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                borderRadius: 2 
                            }}
                        />
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

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Card sx={{ p: 2, mb: 3 }}>
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
                        </Card>
                    </Grid>

                    <Grid container spacing={2.5} size={{ xs: 12, md: 12 }}>
                        {roomTypeItemCard}
                    </Grid>
                </Grid>
            </Container>
        </Box>

    );
};

export default BookingRoom;