// src/pages/BookingRoom/BookingRoom.tsx
import { useEffect, useMemo, useState } from "react";
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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CardActionArea,
} from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExpand } from "@fortawesome/free-solid-svg-icons";
import { Clock12, Sun, Users, XCircle } from "lucide-react";
import Carousel from "react-material-ui-carousel";
import { useNavigate } from "react-router-dom";
import { Base64 } from "js-base64";

import { TextField } from "../../components/TextField/TextField";
import { ListRoomTypesForBooking } from "../../services/http";
import { equipmentConfig } from "../../constants/equipmentConfig";
import { analyticsService, KEY_PAGES } from "../../services/analyticsService";
import { useInteractionTracker } from "../../hooks/useInteractionTracker";
import type { RoomtypesInterface } from "../../interfaces/IRoomTypes";

/* ------------------ helpers ------------------ */
const API_BASE =
    (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/+$/, "") ||
    "http://localhost:8000";

const prefixImage = (p?: string) =>
    !p ? "" : /^https?:\/\//i.test(p) ? p : `${API_BASE}/${p.replace(/^\/+/, "")}`;

const formatTHB = (n?: number) =>
    typeof n === "number" ? `฿${n.toLocaleString("th-TH")}` : "-";

type RoomPriceLike = {
    Price?: number;
    TimeSlot?: { TimeSlotName?: string };
};

/** ราคาโดยดูชื่อ TimeSlot */
function getPriceBySlot(
    item: RoomtypesInterface | undefined,
    slotName: string
): number | undefined {
    if (!item || !Array.isArray((item as any).RoomPrices)) return undefined;
    const found = ((item as any).RoomPrices as RoomPriceLike[]).find(
        (p) => p?.TimeSlot?.TimeSlotName === slotName
    );
    return found?.Price;
}

/** Half-day = เอา Morning/Afteroon ที่หาได้ หรือ fallback ไป HalfDayRate */
function getHalfDayPrice(item: RoomtypesInterface | undefined): number | undefined {
    const m = getPriceBySlot(item, "Morning");
    const a = getPriceBySlot(item, "Afternoon");
    const candidates = [m, a].filter((x): x is number => typeof x === "number");
    if (candidates.length) return Math.min(...candidates);
    const halfFallback = (item as any)?.HalfDayRate;
    return typeof halfFallback === "number" ? halfFallback : undefined;
}

/** Full-day = ดู Fullday หรือ fallback ไป FullDayRate */
function getFullDayPrice(item: RoomtypesInterface | undefined): number | undefined {
    const full = getPriceBySlot(item, "Fullday");
    if (typeof full === "number") return full;
    const fullFallback = (item as any)?.FullDayRate;
    return typeof fullFallback === "number" ? fullFallback : undefined;
}

/** ดึงภาพแรกของ RoomType */
/** ดึงภาพแรกของ RoomType (safe for undefined) */
function getPrimaryImage(item?: RoomtypesInterface): string {
    const first = item?.RoomTypeImages?.[0]?.FilePath;
    return (
        prefixImage(first) ||
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80"
    );
}


/* ------------------ component ------------------ */
const BookingRoom = () => {
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [selectedRoomType, setSelectedRoomType] = useState<RoomtypesInterface>();
    const [openPopup, setOpenPopup] = useState(false);

    const [filters, setFilters] = useState({
        search: "",
        price: "all",
        capacity: "all",
    });

    const navigate = useNavigate();

    // analytics
    const { getInteractionCount } = useInteractionTracker({
        pagePath: KEY_PAGES.BOOKING_ROOM,
    });
    useEffect(() => {
        const start = Date.now();
        let sent = false;

        analyticsService.trackPageVisit({
            user_id: Number(localStorage.getItem("userId")),
            page_path: KEY_PAGES.BOOKING_ROOM,
            page_name: "Booking Room",
            duration: 0,
            is_bounce: false,
        });

        const send = (isBounce: boolean) => {
            if (sent) return;
            sent = true;
            analyticsService.trackPageVisit({
                user_id: Number(localStorage.getItem("userId")),
                page_path: KEY_PAGES.BOOKING_ROOM,
                page_name: "Booking Room",
                duration: Math.floor((Date.now() - start) / 1000),
                is_bounce: isBounce,
                interaction_count: getInteractionCount(),
            });
        };
        const onUnload = () => send(true);
        window.addEventListener("beforeunload", onUnload);
        return () => {
            window.removeEventListener("beforeunload", onUnload);
            send(false);
        };
    }, [getInteractionCount]);

    // fetch
    useEffect(() => {
        (async () => {
            try {
                const res = await ListRoomTypesForBooking();
                if (res) setRoomTypes(res);
            } catch (e) {
                console.error("Error fetching room types:", e);
            }
        })();
    }, []);

    // filters
    const handleFilterChange = (e: any) =>
        setFilters((s) => ({ ...s, [e.target.name]: e.target.value }));

    const filteredRoomTypes = useMemo(() => {
        const q = filters.search.trim().toLowerCase();
        return roomTypes.filter((rt) => {
            const name = rt.TypeName?.toLowerCase() || "";
            // (ตอนนี้กรองแค่ชื่อ; ถ้าจะใช้ price/capacity ค่อยเติม logic เพิ่ม)
            return q ? name.includes(q) : true;
        });
    }, [roomTypes, filters.search]);

    // actions
    const openCard = (rt: RoomtypesInterface) => {
        setSelectedRoomType(rt);
        setOpenPopup(true);
    };

    const goToBookingForm = (rt: RoomtypesInterface) => {
        const encodedId = Base64.encode(String(rt.ID));
        navigate(`/room-booking-form?roomtype_id=${encodeURIComponent(encodedId)}`);
    };

    console.log("filteredRoomTypes: ", filteredRoomTypes)

    /* ------------------ UI ------------------ */
    return (
        <Box className="booking-room-page">
            {/* Dialog: detail + carousel */}
            <Dialog
                open={openPopup}
                onClose={() => setOpenPopup(false)}
                slotProps={{ paper: { sx: { width: "70%", maxWidth: 1200 } } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedRoomType?.TypeName || "-"}
                </DialogTitle>

                <DialogContent sx={{ minWidth: 500 }}>
                    <Carousel
                        indicators
                        autoPlay
                        animation="slide"
                        duration={500}
                        navButtonsAlwaysVisible
                        navButtonsProps={{ style: { backgroundColor: "rgba(0,0,0,0.5)" } }}
                    >
                        {(selectedRoomType?.RoomTypeImages?.length
                            ? selectedRoomType.RoomTypeImages.map((it) => prefixImage(it.FilePath))
                            : [getPrimaryImage(selectedRoomType)]
                        )
                            .filter(Boolean)
                            .map((src, i) => (
                                <CardMedia
                                    key={`dialog-img-${i}`}
                                    component="img"
                                    image={src as string}
                                    alt={`roomtype-${i}`}
                                    sx={{
                                        height: { xs: 150, sm: 200, md: 300, lg: 450 },
                                        borderRadius: 2,
                                        objectFit: "cover",
                                    }}
                                />
                            ))}
                    </Carousel>

                    <DialogContentText
                        sx={{ color: "text.primary", display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
                    >
                        <Grid container spacing={2}>
                            {/* Room size */}
                            <Grid size={{ xs: 12, md: 6 }} sx={{ bgcolor: "#f9fafb", borderRadius: 2, p: 2 }}>
                                <Typography gutterBottom fontWeight={500}>
                                    Room Size
                                </Typography>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <FontAwesomeIcon icon={faExpand} style={{ width: 18, height: 18 }} />
                                    <Typography fontSize={18} fontWeight={600}>
                                        {selectedRoomType?.RoomSize
                                            ? `${Number(selectedRoomType.RoomSize).toLocaleString("th-TH")} sqm`
                                            : "-"}
                                    </Typography>
                                </Box>
                            </Grid>

                            {/* Pricing */}
                            <Grid size={{ xs: 12, md: 6 }} sx={{ bgcolor: "#f9fafb", borderRadius: 2, p: 2 }}>
                                <Typography gutterBottom fontWeight={500}>
                                    Pricing (THB)
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid
                                        size={{ xs: 12 }}
                                        sx={{ display: "flex", justifyContent: "space-between", color: "text.secondary" }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Clock12 size={16} strokeWidth={2.2} />
                                            <Typography>Half-day</Typography>
                                        </Box>
                                        <Typography fontSize={18} fontWeight={700} color="#2563eb">
                                            {formatTHB(getHalfDayPrice(selectedRoomType))}
                                        </Typography>
                                    </Grid>

                                    <Grid
                                        size={{ xs: 12 }}
                                        sx={{ display: "flex", justifyContent: "space-between", color: "text.secondary" }}
                                    >
                                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                            <Sun size={16} strokeWidth={2.2} />
                                            <Typography>Full-day</Typography>
                                        </Box>
                                        <Typography fontSize={18} fontWeight={700} color="#2563eb">
                                            {formatTHB(getFullDayPrice(selectedRoomType))}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>

                            {/* Seating Capacity */}
                            <Grid size={{ xs: 12, md: 6 }} sx={{ bgcolor: "#f9fafb", borderRadius: 2, p: 2 }}>
                                <Typography gutterBottom fontWeight={500} width="100%">
                                    Seating Capacity
                                </Typography>
                                <Grid container spacing={1}>
                                    {selectedRoomType?.RoomTypeLayouts?.map((layout, idx) => (
                                        <Grid
                                            size={{ xs: 12, md: 6 }}
                                            key={`layout-${idx}`}
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                bgcolor: "#fff",
                                                py: 1.4,
                                                px: 0.6,
                                                borderRadius: 1,
                                            }}
                                        >
                                            <Users size={18} strokeWidth={2.2} />
                                            <Typography variant="body2" fontWeight={500}>
                                                {layout.RoomLayout?.LayoutName || "-"}
                                            </Typography>
                                            <Typography fontSize={18} fontWeight={700} color="#2563eb">
                                                {layout.Capacity ?? "-"}
                                            </Typography>
                                            {layout.Note ? (
                                                <Typography color="text.secondary" fontSize={14}>
                                                    ({layout.Note})
                                                </Typography>
                                            ) : null}
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>

                            {/* Equipment */}
                            <Grid size={{ xs: 12, md: 6 }} sx={{ bgcolor: "#f9fafb", borderRadius: 2, p: 2 }}>
                                <Typography gutterBottom fontWeight={500}>
                                    Available Equipment
                                </Typography>
                                <Grid container spacing={1}>
                                    {selectedRoomType?.RoomEquipments?.length ? (
                                        selectedRoomType.RoomEquipments.map((re, i) => {
                                            const name = re.Equipment?.EquipmentName;
                                            const qty = re.Quantity;
                                            if (!name || !equipmentConfig[name]) return null;
                                            const Icon = equipmentConfig[name].icon;
                                            return (
                                                <Grid
                                                    size={{ xs: 12 }}
                                                    key={`eq-${i}`}
                                                    sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "space-between",
                                                        bgcolor: "#fff",
                                                        px: 1.6,
                                                        py: 1,
                                                        borderRadius: 1,
                                                    }}
                                                >
                                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                                        <Icon size={16} strokeWidth={2.2} />
                                                        <Typography variant="body2">{name}</Typography>
                                                    </Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {qty ?? "-"}
                                                    </Typography>
                                                </Grid>
                                            );
                                        })
                                    ) : (
                                        <Grid
                                            size={{ xs: 12 }}
                                            sx={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: 1,
                                                bgcolor: "#fff",
                                                px: 1.6,
                                                py: 1,
                                                borderRadius: 1,
                                            }}
                                        >
                                            <XCircle size={16} strokeWidth={2.2} />
                                            <Typography variant="body2">There is no equipment in this room.</Typography>
                                        </Grid>
                                    )}
                                </Grid>
                            </Grid>
                        </Grid>
                    </DialogContentText>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={() => {
                            if (selectedRoomType) {
                                setOpenPopup(false);
                                goToBookingForm(selectedRoomType);
                            }
                        }}
                        variant="contained"
                    >
                        Booking Room
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Page */}
            <Container maxWidth="xl" sx={{ padding: "0 !important" }}>
                <Grid container spacing={3}>
                    {/* Header */}
                    <Grid className="title-box" size={{ xs: 12 }}>
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Meeting Room Booking
                        </Typography>
                    </Grid>

                    {/* Search / Filters */}
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ p: 2 }}>
                            <Grid container spacing={2} alignItems="center">
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <TextField
                                        fullWidth
                                        name="search"
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        placeholder="ค้นหาประเภทห้องประชุม"
                                    />
                                </Grid>
                                {/* <Grid size={{ xs: 12, md: 3 }}>
                                    <FormControl fullWidth>
                                        <Select name="price" value={filters.price} onChange={handleFilterChange}>
                                            <MenuItem value="all">ทั้งหมด</MenuItem>
                                            <MenuItem value="half">Half-day only</MenuItem>
                                            <MenuItem value="full">Full-day only</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid size={{ xs: 12, md: 3 }}>
                                    <FormControl fullWidth>
                                        <Select name="capacity" value={filters.capacity} onChange={handleFilterChange}>
                                            <MenuItem value="all">ความจุทั้งหมด</MenuItem>
                                            <MenuItem value="small">≤ 30</MenuItem>
                                            <MenuItem value="medium">31–100</MenuItem>
                                            <MenuItem value="large">{">"}100</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid> */}
                            </Grid>
                        </Card>
                    </Grid>

                    {/* Cards */}
                    <Grid container spacing={2.5} size={{ xs: 12 }}>
                        {filteredRoomTypes.map((item, idx) => {
                            const halfDay = getHalfDayPrice(item);
                            const fullDay = getFullDayPrice(item);

                            return (
                                <Grid key={`rt-${idx}`} size={{ xs: 12, sm: 6, md: 4 }}>
                                    <Card
                                        sx={{
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "space-between",
                                        }}
                                    >
                                        <CardActionArea
                                            onClick={() => openCard(item)}
                                            slotProps={{ focusHighlight: { sx: { bgcolor: "transparent" } } }}
                                            sx={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="200"
                                                image={getPrimaryImage(item)}
                                                alt={item?.TypeName || "room type"}
                                                sx={{ objectFit: "cover" }}
                                            />
                                            <CardContent
                                                sx={{
                                                    display: "flex",
                                                    flexDirection: "column",
                                                    gap: 1,
                                                    px: 2.6,
                                                    width: "100%",
                                                }}
                                            >
                                                <Typography variant="h6">{item.TypeName}</Typography>

                                                {/* size */}
                                                <Box
                                                    sx={{
                                                        color: "text.secondary",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: 0.8,
                                                    }}
                                                >
                                                    <FontAwesomeIcon
                                                        icon={faExpand}
                                                        style={{ width: 16, height: 16, paddingBottom: 2 }}
                                                    />
                                                    <Typography variant="body2">
                                                        Size:{" "}
                                                        {item.RoomSize
                                                            ? `${Number(item.RoomSize).toLocaleString("th-TH")} sqm`
                                                            : "-"}
                                                    </Typography>
                                                </Box>

                                                {/* pricing */}
                                                <Box
                                                    sx={{
                                                        bgcolor: "rgba(8,175,241,0.06)",
                                                        borderRadius: 2,
                                                        px: 2,
                                                        py: 1.5,
                                                        my: 1,
                                                    }}
                                                >
                                                    <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                                        Pricing (THB)
                                                    </Typography>
                                                    <Grid container spacing={0.8}>
                                                        <Grid
                                                            size={{ xs: 12, sm: 6 }}
                                                            sx={{ display: "inline-flex", gap: 1, alignItems: "center" }}
                                                        >
                                                            <Clock12 size={16} strokeWidth={2.2} />
                                                            <Typography variant="body2">
                                                                Half-day: {formatTHB(halfDay)}
                                                            </Typography>
                                                        </Grid>
                                                        <Grid
                                                            size={{ xs: 12, sm: 6 }}
                                                            sx={{ display: "inline-flex", gap: 1, alignItems: "center" }}
                                                        >
                                                            <Sun size={16} strokeWidth={2.2} />
                                                            <Typography variant="body2">
                                                                Full-day: {formatTHB(fullDay)}
                                                            </Typography>
                                                        </Grid>
                                                    </Grid>
                                                </Box>

                                                {/* equipment (badges) */}
                                                <Box>
                                                    <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                                        Available Equipment
                                                    </Typography>
                                                    <Grid container spacing={0.8}>
                                                        {item.RoomEquipments?.length ? (
                                                            item.RoomEquipments.slice(0, 4).map((re, i) => {
                                                                const name = re.Equipment?.EquipmentName;
                                                                if (!name || !equipmentConfig[name]) return null;
                                                                const Icon = equipmentConfig[name].icon;

                                                                return (
                                                                    <Box
                                                                        key={`eq-badge-${i}`}
                                                                        sx={{
                                                                            display: "inline-flex",
                                                                            gap: 1,
                                                                            alignItems: "center",
                                                                            border: "1px solid #e2e8f0",
                                                                            px: 1.2,
                                                                            py: 0.6,
                                                                            borderRadius: 1,
                                                                        }}
                                                                    >
                                                                        <Icon size={16} strokeWidth={2.2} />
                                                                        <Typography variant="body2">{name}</Typography>
                                                                    </Box>
                                                                );
                                                            })
                                                        ) : (
                                                            <Box
                                                                sx={{
                                                                    display: "inline-flex",
                                                                    gap: 1,
                                                                    alignItems: "center",
                                                                    border: "1px solid #e2e8f0",
                                                                    px: 1.2,
                                                                    py: 0.6,
                                                                    borderRadius: 1,
                                                                }}
                                                            >
                                                                <XCircle size={16} strokeWidth={2.2} />
                                                                <Typography variant="body2">No equipment</Typography>
                                                            </Box>
                                                        )}
                                                    </Grid>
                                                </Box>

                                                {/* capacities (ย่อ) */}
                                                {item.RoomTypeLayouts?.length ? (
                                                    <Box>
                                                        <Typography gutterBottom sx={{ fontWeight: 500 }}>
                                                            Seating Capacity
                                                        </Typography>
                                                        <Grid container spacing={0.8}>
                                                            {item.RoomTypeLayouts.slice(0, 2).map((layout, i) => (
                                                                <Grid
                                                                    key={`cap-${i}`}
                                                                    size={{ xs: 12, sm: 6 }}
                                                                    sx={{
                                                                        display: "inline-flex",
                                                                        gap: 1,
                                                                        alignItems: "center",
                                                                        color: "text.secondary",
                                                                    }}
                                                                >
                                                                    <Users size={16} strokeWidth={2.2} />
                                                                    <Typography variant="body2">
                                                                        {layout.RoomLayout?.LayoutName}: {layout.Capacity}
                                                                        {layout.Note ? ` (${layout.Note})` : ""}
                                                                    </Typography>
                                                                </Grid>
                                                            ))}
                                                        </Grid>
                                                    </Box>
                                                ) : null}
                                            </CardContent>
                                        </CardActionArea>

                                        <CardActions sx={{ mb: 0.8, px: 2.6 }}>
                                            <Button onClick={() => goToBookingForm(item)} variant="contained" fullWidth>
                                                Booking Room
                                            </Button>
                                        </CardActions>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default BookingRoom;