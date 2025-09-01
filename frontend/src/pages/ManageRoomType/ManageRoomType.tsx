import { Container, Dialog, Grid, IconButton, Tooltip } from "@mui/material";
import { Box, Button, Card, FormControl, InputAdornment, MenuItem, Typography } from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { Search, RefreshCw, Check, } from "lucide-react";
import React, { useEffect, useState } from "react";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { ListRoomTypes, GetRoomTypes, apiUrl } from "../../services/http";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { SearchOff } from "@mui/icons-material";
import EditRoomPopup from "./EditRoomTypePopup";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

function ManageRoomType() {
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [selectRoomType, setSelectRoomType] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [total, setTotal] = useState(0);
    const [openPopup, setOpenPopup] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");


    interface Props {
        images: { FilePath: string }[];
    }


    const ImageGalleryCell: React.FC<Props> = ({ images }) => {
        const [open, setOpen] = useState(false);
        const [current, setCurrent] = useState(0);


        const handlePrev = () => setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
        const handleNext = () => setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));

        return (
            <>
                {/* Preview รูปแรก */}
                <img
                    src={`${apiUrl}/${images[0].FilePath.replace(/^uploads/, "images")}`}
                    alt="room preview"
                    style={{
                        width: 100,
                        height: 80,
                        objectFit: "cover",
                        borderRadius: 6,
                        cursor: "pointer",
                    }}
                    onClick={() => setOpen(true)}
                />

                {/* Dialog แสดง Gallery */}
                <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md">
                    <Box sx={{ position: "relative", bgcolor: "black" }}>
                        <img
                            src={`${apiUrl}/${images[current].FilePath.replace(/^uploads/, "images")}`}
                            alt={`room ${current + 1}`}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "80vh",
                                margin: "auto",
                                display: "block",
                                borderRadius: 8,
                            }}
                        />

                        {/* ปุ่มปิด */}
                        <IconButton
                            onClick={() => setOpen(false)}
                            sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(0, 0, 0, 0.5)", color: "white" }}
                        >
                            <X size={28} />
                        </IconButton>

                        {/* ปุ่มเลื่อนซ้าย */}
                        <IconButton
                            onClick={handlePrev}
                            sx={{ position: "absolute", top: "50%", left: 8, bgcolor: "rgba(0, 0, 0, 0.5)", color: "white" }}
                        >
                            <ChevronLeft size={32} />
                        </IconButton>

                        {/* ปุ่มเลื่อนขวา */}
                        <IconButton
                            onClick={handleNext}
                            sx={{ position: "absolute", top: "50%", right: 8, bgcolor: "rgba(0, 0, 0, 0.5)", color: "white" }}
                        >
                            <ChevronRight size={32} />
                        </IconButton>
                    </Box>

                    {/* Thumbnails */}
                    <Box sx={{ display: "flex", justifyContent: "center", p: 2, gap: 1, flexWrap: "wrap" }}>
                        {images.map((img: { FilePath: string; }, index: number) => (
                            <img
                                key={index}
                                src={`${apiUrl}/${img.FilePath.replace(/^uploads/, "images")}`}
                                alt={`thumb-${index}`}
                                style={{
                                    width: 60,
                                    height: 40,
                                    objectFit: "cover",
                                    borderRadius: 4,
                                    cursor: "pointer",
                                    border: index === current ? "2px solid #ff6f00" : "2px solid transparent",
                                }}
                                onClick={() => setCurrent(typeof index === 'number' ? index : 0)}
                            />
                        ))}
                    </Box>
                </Dialog>
            </>
        );
    };

    const columns: GridColDef<RoomtypesInterface>[] = [
        { field: "ID", headerName: "ID", flex: 0.3 },
        { field: "TypeName", headerName: "Room Type Name", flex: 1.2 },
        { field: "RoomSize", headerName: "Room Size (sq.m.)", flex: 0.8 },
        // {
        //     field: "ForRental",
        //     headerName: "For Rental",
        //     flex: 0.8,
        //     renderCell: (params) =>
        //         params.row.ForRental ? (
        //             <span style={{ color: "green", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
        //                 <Check size={16} /> Yes
        //             </span>
        //         ) : (
        //             <span style={{ color: "red", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
        //                 <X size={16} /> No
        //             </span>
        //         ),
        // },
        // {
        //     field: "HasMultipleSizes",
        //     headerName: "Multiple Sizes",
        //     flex: 0.8,
        //     renderCell: (params) =>
        //         params.row.HasMultipleSizes ? (
        //             <span style={{ color: "green", display: "flex", alignItems: "center", gap: 4 }}>
        //                 <Check size={16} /> Yes
        //             </span>
        //         ) : (
        //             <span style={{ color: "gray", display: "flex", alignItems: "center", gap: 4 }}>
        //                 <X size={16} /> No
        //             </span>
        //         ),
        // },
        {
            field: "Rooms",
            headerName: "Rooms Count",
            flex: 0.7,
            valueGetter: (_value, row) => (row.Rooms ? row.Rooms.length : 0),
        },
        // {
        //     field: "RoomPrices",
        //     headerName: "Prices",
        //     flex: 1,
        //     renderCell: (params) => {
        //         const prices = params.row.RoomPrices || [];
        //         const shortText = prices
        //             .slice(0, 2)
        //             .map(p => `${(p.TimeSlot as any)?.TimeSlotName}: ${p.Price}฿`)
        //             .join(", ");
        //         const moreCount = prices.length > 2 ? ` (+${prices.length - 2} more)` : "";

        //         return (
        //             <Tooltip
        //                 title={
        //                     <Box sx={{ display: "flex", flexDirection: "column" }}>
        //                         {prices.map((p, i) => (
        //                             <Typography key={i} variant="body2">
        //                                 {(p.TimeSlot as any)?.TimeSlotName}: {p.Price}฿
        //                             </Typography>
        //                         ))}
        //                     </Box>
        //                 }
        //                 arrow
        //                 placement="top"
        //             >
        //                 <Typography variant="body2" sx={{ cursor: "help" }}>
        //                     {shortText}{moreCount}
        //                 </Typography>
        //             </Tooltip>
        //         );
        //     },
        // }
        // ,

        {
            field: "RoomTypeImages",
            headerName: "Images",
            flex: 1,
            renderCell: (params) => {
                const images = params.row.RoomTypeImages?.map((image) => ({ FilePath: image.FilePath ?? '' })) || [];
                return images.length > 0 ? (
                    <ImageGalleryCell images={images} />
                ) : (
                    "-"
                );
            },
        }


        ,
        {
            field: "actions",
            headerName: "Actions",
            flex: 0.6,
            renderCell: (params) => (
                <Button
                    variant="contained"
                    size="small"
                    sx={{ backgroundColor: "#00AEEF", textTransform: "none" }}
                    onClick={() => handleOpenPopup(params.row.ID ?? 0)}
                >
                    Edit
                </Button>
            ),
        },
    ];

    const ListRoomTypesData = async () => {
        try {
            const res = await ListRoomTypes({ page, limit, search: debouncedSearchText });
            console.log("📥 API Response:", res);

            if (res && Array.isArray(res.data)) {
                setRoomTypes(res.data);   // ✅ ใช้ res.data ไม่ใช่ res ตรงๆ
                setTotal(res.total);      // ✅ ใช้ total จาก backend
            } else {
                setRoomTypes([]);
                setTotal(0);
            }
        } catch (error) {
            console.error("Error fetching room types:", error);
        }
    };


    const handleOpenPopup = (roomTypeID: number) => {
        setSelectRoomType(roomTypeID);
        setOpenPopup(true);
    };

    const handleClosePopup = () => {
        setOpenPopup(false);
        setSelectRoomType(0);
        ListRoomTypesData();
    };

    const handleClearFilter = () => {
        setSelectRoomType(0);
        setSearchText("");
        setPage(1);
        ListRoomTypesData();
    };

    useEffect(() => {
        ListRoomTypesData();
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchText(searchText);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    useEffect(() => {
        ListRoomTypesData();
    }, [selectRoomType, page, limit, debouncedSearchText]);

    return (
        <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
            <div className="manage-roomtype-page">
                <Grid container spacing={3}>
                    <Grid className="title-box" size={{ xs: 12 }}>
                        <Typography variant="h6" className="title">
                            Manage Room Types
                        </Typography>
                    </Grid>

                    {/* Search + Filter */}
                    <Grid container spacing={2} size={{ xs: 12 }} sx={{ alignItems: "flex-end" }}>
                        {/* Search Box */}
                        <Grid size={{ xs: 12, md: 5 }}>
                            <TextField
                                fullWidth
                                placeholder="Search (Room Type Name)"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                <Search size={18} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                            />
                        </Grid>

                        {/* Room Type Filter */}
                        {/* <Grid size={{ xs: 12, md: 2 }}>
                        <FormControl fullWidth>
                            <Select value={selectRoomType} onChange={(e) => setSelectRoomType(Number(e.target.value))} displayEmpty>
                                <MenuItem value={0}>All Types</MenuItem>
                                {roomTypes.map((item, index) => (
                                    <MenuItem key={index} value={item.ID}>
                                        {item.TypeName}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid> */}

                        <Grid size={{ xs: 12, md: 1 }}>
                            <Button
                                onClick={handleClearFilter}
                                sx={{
                                    minWidth: 0,
                                    width: "100%",
                                    height: "45px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(109,110,112,0.4)",
                                }}
                            >
                                <RefreshCw size={18} color="gray" />
                            </Button>
                        </Grid>
                    </Grid>

                    {/* DataGrid */}
                    <Grid size={{ xs: 12 }}>
                        <Card sx={{ width: "100%", borderRadius: 2 }}>
                            <DataGrid
                                rows={roomTypes || []}
                                columns={columns}
                                pageSizeOptions={[5, 10, 20, 50, 100]}
                                paginationMode="server"
                                rowCount={total}
                                getRowId={(row) => String(row.ID)}
                                onPaginationModelChange={(params) => {
                                    setPage(params.page + 1);
                                    setLimit(params.pageSize);
                                }}
                                slots={{
                                    noRowsOverlay: () => (
                                        <Box
                                            sx={{
                                                display: "flex",
                                                flexDirection: "column",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                height: "100%",
                                                color: "gray",
                                            }}
                                        >
                                            <SearchOff sx={{ fontSize: 50, color: "gray" }} />
                                            <Typography variant="body1" sx={{ mt: 1 }}>
                                                No room types found
                                            </Typography>
                                        </Box>
                                    ),
                                }}
                            />
                        </Card>
                    </Grid>

                    {openPopup && selectRoomType !== null && (
                        <EditRoomPopup roomTypeID={selectRoomType} open={openPopup} onClose={handleClosePopup} />
                    )}
                </Grid>
            </div>
        </Container>
    );
}


export default ManageRoomType;
