// pages/ManageRooms/index.tsx (ไฟล์เดิมของคุณ — โค้ดเต็มพร้อมคลีน)
import { Box, Button, Card, FormControl, Grid, InputAdornment, MenuItem, Typography, Container } from "@mui/material";
import { faRotateRight, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import PublishedWithChangesOutlinedIcon from "@mui/icons-material/PublishedWithChangesOutlined";
import VerticalSplitOutlinedIcon from "@mui/icons-material/VerticalSplitOutlined";
import React, { useEffect, useMemo, useState } from "react";
import { DataGrid, GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { ListSetRooms, GetRoomTypes, GetRoomStatus, GetFloors } from "../../services/http";
import { RoomsInterface } from "../../interfaces/IRooms";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import { SearchOff } from "@mui/icons-material";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import InfoAlert from "../../components/Alert/InfoAlert";
import { roomStatusConfig } from "../../constants/roomStatusConfig";
import LayersOutlinedIcon from "@mui/icons-material/LayersOutlined";
import EditRoomPopup from "./EditRoomPopup";
import CreateRoomPopup from "./CreateRoomPopup";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import { DeleteRoom as DeleteRoomAPI } from "../../services/http";
import { House, Plus } from "lucide-react";

function ManageRooms() {
    const [rooms, setRooms] = useState<RoomsInterface[]>([]);
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatusInterface[]>([]);
    const [selectRoomType, setSelectRoomType] = useState(0);
    const [selectRoomStatus, setSelectRoomStatus] = useState(0);
    const [selectFloor, setSelectFloors] = useState(0);
    const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
    const [total, setTotal] = useState(0);
    const [openEditPopup, setOpenEditPopup] = useState(false);
    const [openCreatePopup, setOpenCreatePopup] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [debouncedSearchText, setDebouncedSearchText] = useState("");
    const [selectedRoomID, setSelectedRoomID] = useState<number | null>(null);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [openConfirm, setOpenConfirm] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);


    // Debounce search 500ms
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearchText(searchText.trim()), 500);
        return () => clearTimeout(t);
    }, [searchText]);

    // โหลด master ครั้งแรก
    useEffect(() => {
        (async () => {
            try {
                const [rs, ft, st] = await Promise.all([GetRoomTypes(), GetFloors(), GetRoomStatus()]);
                setRoomTypes(normalizeArray<RoomtypesInterface>(rs));
                setFloors(normalizeArray<FloorsInterface>(ft));
                setRoomStatus(normalizeArray<RoomStatusInterface>(st));
            } catch {
                setAlerts(prev => [...prev, { type: "error", message: "Failed to load master data." }]);
            }
        })();
    }, []);

    // โหลดรายการตาม filter/pagination/search
    useEffect(() => {
        listRooms();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectFloor, selectRoomStatus, selectRoomType, paginationModel.page, paginationModel.pageSize, debouncedSearchText]);

    function normalizeArray<T>(input: unknown): T[] {
        if (Array.isArray(input)) return input as T[];
        if (input && typeof input === "object" && Array.isArray((input as any).data)) {
            return (input as any).data as T[];
        }
        return [];
    }

    const listRooms = async () => {
        try {
            const page = paginationModel.page + 1; // API 1-based
            const limit = paginationModel.pageSize;
            const res = await ListSetRooms({
                floor: selectFloor,
                roomType: selectRoomType,
                roomStatus: selectRoomStatus,
                page,
                limit,
                search: debouncedSearchText,
            });
            setRooms(res?.data ?? []);
            setTotal(res?.total ?? res?.data?.length ?? 0);
        } catch (error) {
            console.error("Error fetching rooms:", error);
            setAlerts(prev => [...prev, { type: "error", message: "Failed to fetch rooms." }]);
        }
    };

    const handleOpenEdit = (roomID: number) => {
        setSelectedRoomID(roomID);
        setOpenEditPopup(true);
    };

    const handleCloseEdit = () => {
        setOpenEditPopup(false);
        setSelectedRoomID(null);
        listRooms();
    };

    const handleOpenCreate = () => setOpenCreatePopup(true);
    const handleCloseCreate = () => setOpenCreatePopup(false);
    const handleCreated = () => {
        setOpenCreatePopup(false);
        // reset paging กลับหน้าแรกเพื่อให้เห็น record ล่าสุดง่าย ๆ
        setPaginationModel(p => ({ ...p, page: 0 }));
        setTimeout(() => listRooms(), 0);
    };

    // กดปุ่มลบ -> เปิดไดอะล็อก
    const askDelete = (id: number) => {
        setDeleteId(id);
        setOpenConfirm(true);
    };
    const doDelete = async (_note?: string) => {
        if (!deleteId) return;
        try {
            setDeleting(true);
            const res = await DeleteRoomAPI(deleteId);
            if (res.ok) {
                setAlerts(prev => [...prev, { type: "success", message: "Room deleted successfully." }]);
                setPaginationModel(p => ({ ...p, page: 0 }));
                await listRooms();
            } else {
                setAlerts(prev => [...prev, { type: "error", message: res.message || "Delete failed." }]);
            }
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };


    const handleClearFilter = () => {
        setSelectRoomType(0);
        setSelectRoomStatus(0);
        setSelectFloors(0);
        setSearchText("");
        setPaginationModel({ page: 0, pageSize: paginationModel.pageSize });
    };

    const columns: GridColDef[] = useMemo(() => ([
        {
            field: "RoomNumber",
            headerName: "Room Number",
            flex: 1,
            valueGetter: (_val, row: RoomsInterface) => row.RoomNumber ?? "-",
        },
        {
            field: "RoomType",
            headerName: "Room Type",
            flex: 1,
            valueGetter: (_val, row: RoomsInterface) => (row as any)?.RoomType?.TypeName || row.RoomType || "-",
        },
        {
            field: "RoomStatus",
            headerName: "Room Status",
            flex: 1.2,
            sortable: false,
            renderCell: (params) => {
                const statusName = (params.row as any)?.RoomStatus?.StatusName || params.row.RoomStatus || "Not Reserved";
                const statusKey = statusName as keyof typeof roomStatusConfig;
                const { color, colorLite } = roomStatusConfig[statusKey] ?? { color: "#FFF", colorLite: "#000" };
                return (
                    <Box sx={{ display: "flex", alignItems: "center", height: "100%" }}>
                        <Box sx={{ bgcolor: colorLite, borderRadius: 10, px: 1.5, py: 0.5, display: "flex", gap: 1, color, alignItems: "center" }}>
                            <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{statusName}</Typography>
                        </Box>
                    </Box>
                );
            },
        },
        {
            field: "Capacity",
            headerName: "Room Capacity (persons)",
            flex: 1.2,
            valueGetter: (_val, row: RoomsInterface) => (row as any)?.Capacity ?? "-",
        },
        {
            field: "actions",
            headerName: "Actions",
            sortable: false,
            filterable: false,
            width: 160,
            renderCell: (params) => (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 , marginTop: 1}}>
                    <Button
                        onClick={() => handleOpenEdit(params.row.ID)}
                        variant="contained"
                        sx={{ fontSize: "14px", "&:hover": { borderColor: "transparent" } }}
                    >
                        Edit
                    </Button>
                    <Button
                        variant="outlinedGray"
                        sx={{ fontSize: "14px", "&:hover": { borderColor: "transparent" }}}
                        onClick={() => askDelete(params.row.ID)}>
                        Delete
                    </Button>
                </Box >

            ),
        },
    ]), []);

    return (
        <Container maxWidth="xl" sx={{ padding: "0px 0px !important" }}>
            <div className="manage-users-page">
                {alerts.map((alert, index) => (
                    <React.Fragment key={index}>
                        {alert.type === "success" && <SuccessAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                        {alert.type === "error" && <ErrorAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                        {alert.type === "warning" && <WarningAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                        {alert.type === "info" && <InfoAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />}
                    </React.Fragment>
                ))}

                <Grid container spacing={3}>
                    <Grid container className="title-box" direction="row" size={{ xs: 12 }} sx={{ gap: 1, alignItems: "center", justifyContent: "space-between" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <House size={26} />
                            <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>Manage Rooms</Typography>
                        </Box>
                        <Button variant="contained" startIcon={<Plus size={18} />} onClick={handleOpenCreate}>
                            Add Room
                        </Button>
                    </Grid>

                    <Grid container size={{ xs: 10, md: 12 }} spacing={3}>
                        <Grid container spacing={2} className="filter-section" size={{ xs: 10, md: 12 }} sx={{ alignItems: "flex-end" }}>
                            <Grid size={{ xs: 10, md: 5 }}>
                                <TextField
                                    fullWidth
                                    className="search-box"
                                    variant="outlined"
                                    placeholder="Search (Room Number)"
                                    margin="none"
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                    slotProps={{
                                        input: {
                                            startAdornment: (
                                                <InputAdornment position="start" sx={{ px: 0.5 }}>
                                                    <FontAwesomeIcon icon={faMagnifyingGlass} size="xl" />
                                                </InputAdornment>
                                            ),
                                        },
                                    }}
                                />
                            </Grid>

                            <Grid size={{ xs: 10, md: 2 }}>
                                <FormControl fullWidth>
                                    <Select
                                        value={selectFloor}
                                        onChange={(e) => setSelectFloors(Number(e.target.value))}
                                        displayEmpty
                                        startAdornment={<InputAdornment position="start" sx={{ pl: 0.5 }}><LayersOutlinedIcon /></InputAdornment>}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value={0}>All Floors</MenuItem>
                                        {floors.map((f) => (
                                            <MenuItem key={f.ID} value={f.ID}>{f.Number ? `Floor ${f.Number}` : f.ID}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 10, md: 2 }}>
                                <FormControl fullWidth>
                                    <Select
                                        value={selectRoomType}
                                        onChange={(e) => setSelectRoomType(Number(e.target.value))}
                                        displayEmpty
                                        startAdornment={<InputAdornment position="start" sx={{ pl: 0.5 }}><VerticalSplitOutlinedIcon /></InputAdornment>}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value={0}>All Types</MenuItem>
                                        {roomTypes.map((t) => (
                                            <MenuItem key={t.ID} value={t.ID}>{t.TypeName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 10, md: 2 }}>
                                <FormControl fullWidth>
                                    <Select
                                        value={selectRoomStatus}
                                        onChange={(e) => setSelectRoomStatus(Number(e.target.value))}
                                        displayEmpty
                                        startAdornment={<InputAdornment position="start" sx={{ pl: 0.5 }}><PublishedWithChangesOutlinedIcon /></InputAdornment>}
                                        sx={{ borderRadius: 2 }}
                                    >
                                        <MenuItem value={0}>All Status</MenuItem>
                                        {roomStatus.map((s) => (
                                            <MenuItem key={s.ID} value={s.ID} style={{ color: "gray" }}>{s.StatusName}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid size={{ xs: 10, md: 1 }}>
                                <Button
                                    onClick={handleClearFilter}
                                    sx={{
                                        minWidth: 0, width: "100%", height: 45, borderRadius: 2,
                                        border: "1px solid rgb(109,110,112,0.4)",
                                        "&:hover": { boxShadow: "none", borderColor: "primary.main", backgroundColor: "transparent" },
                                    }}
                                >
                                    <FontAwesomeIcon icon={faRotateRight} size="lg" style={{ color: "gray" }} />
                                </Button>
                            </Grid>
                        </Grid>
                    </Grid>

                    <Grid size={{ xs: 12, md: 12 }}>
                        <Card sx={{ width: "100%", borderRadius: 2 }}>
                            <DataGrid
                                rows={rooms ?? []}
                                columns={columns}
                                getRowId={(row) => String(row.ID)}
                                paginationMode="server"
                                rowCount={total}
                                paginationModel={paginationModel}
                                onPaginationModelChange={(m) => setPaginationModel(m)}
                                pageSizeOptions={[5, 10, 20]}
                                slots={{
                                    noRowsOverlay: () => (
                                        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "gray" }}>
                                            <SearchOff sx={{ fontSize: 50, color: "gray" }} />
                                            <Typography variant="body1" sx={{ mt: 1 }}>No details match your search</Typography>
                                        </Box>
                                    ),
                                }}
                            />
                        </Card>
                    </Grid>
                </Grid>

                {/* Popups */}
                {openEditPopup && selectedRoomID !== null && (
                    <EditRoomPopup roomID={selectedRoomID} open={openEditPopup} onClose={handleCloseEdit} />
                )}

                {openCreatePopup && (
                    <CreateRoomPopup open={openCreatePopup} onClose={handleCloseCreate} onCreated={handleCreated} />
                )}
            </div>


            <ConfirmDialog
                open={openConfirm}
                setOpenConfirm={setOpenConfirm}
                handleFunction={doDelete}            // จะถูกเรียกเมื่อกด Confirm
                title="Delete this room?"
                message="ห้องนี้จะถูกซ่อนออกจากรายการ และไม่สามารถใช้งานได้จนกว่าจะกู้คืน"
                buttonActive={deleting}              // ใช้ปิดปุ่มระหว่างกำลังลบ
                showNoteField={false}                // ถ้าอยากให้ใส่เหตุผล ลอง true ได้
            />



        </Container>


    );
}

export default ManageRooms;
