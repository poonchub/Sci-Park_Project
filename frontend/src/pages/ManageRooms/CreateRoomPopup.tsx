// pages/ManageRooms/CreateRoomPopup.tsx
import React, { useEffect, useState } from "react";
import {
    Typography, Dialog, DialogActions, DialogContent, DialogTitle,
    Button, MenuItem, FormControl, FormHelperText, Grid
} from "@mui/material";
import { useForm, Controller } from "react-hook-form";
import AddHomeWorkOutlinedIcon from "@mui/icons-material/AddHomeWorkOutlined";
import SaveIcon from "@mui/icons-material/Save";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { RoomsInterface } from "../../interfaces/IRooms";
import { RoomtypesInterface } from "../../interfaces/IRoomTypes";
import { FloorsInterface } from "../../interfaces/IFloors";
import { RoomStatusInterface } from "../../interfaces/IRoomStatus";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import WarningAlert from "../../components/Alert/WarningAlert";
import InfoAlert from "../../components/Alert/InfoAlert";
import { GetRoomTypes, GetRoomStatus, GetFloors } from "../../services/http";
import { CreateRoom } from "../../services/http";

interface CreateRoomPopupProps {
    open: boolean;
    onClose: () => void;
    onCreated: () => void; // callback ให้ parent refresh list
}

const CreateRoomPopup: React.FC<CreateRoomPopupProps> = ({ open, onClose, onCreated }) => {
    const { control, handleSubmit, formState: { errors }, reset } = useForm();
    const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
    const [floors, setFloors] = useState<FloorsInterface[]>([]);
    const [roomStatus, setRoomStatus] = useState<RoomStatusInterface[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<number>(0);
    const [selectedRoomType, setSelectedRoomType] = useState<number>(0);
    const [selectedRoomStatus, setSelectedRoomStatus] = useState<number>(0);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);

    function normalizeArray<T>(input: unknown): T[] {
        if (Array.isArray(input)) return input as T[];
        if (input && typeof input === "object" && Array.isArray((input as any).data)) {
            return (input as any).data as T[];
        }
        return [];
    }

    useEffect(() => {
        if (!open) return;
        (async () => {
            try {
                const [roomTypeData, floorData, roomStatusData] = await Promise.all([
                    GetRoomTypes(),
                    GetFloors(),
                    GetRoomStatus(),
                ]);
                setRoomTypes(normalizeArray<RoomtypesInterface>(roomTypeData));
                setFloors(normalizeArray<FloorsInterface>(floorData));
                setRoomStatus(normalizeArray<RoomStatusInterface>(roomStatusData));
                // reset state
                reset({ RoomNumber: "", Capacity: 0, RoomSize: 0 });
                setSelectedFloor(0);
                setSelectedRoomType(0);
                setSelectedRoomStatus(0);
                setAlerts([]);
            } catch (e) {
                setAlerts(prev => [...prev, { type: "error", message: "Failed to load master data." }]);
            }
        })();
    }, [open, reset]);

    const onSubmit = async (data: RoomsInterface) => {
        if (!data?.RoomNumber?.trim()) {
            setAlerts(prev => [...prev, { type: "warning", message: "Please enter room number" }]);
            return;
        }
        if (!selectedFloor) {
            setAlerts(prev => [...prev, { type: "warning", message: "Please select floor" }]);
            return;
        }
        if (!selectedRoomType) {
            setAlerts(prev => [...prev, { type: "warning", message: "Please select room type" }]);
            return;
        }
        if (!selectedRoomStatus) {
            setAlerts(prev => [...prev, { type: "warning", message: "Please select room status" }]);
            return;
        }

        const payload = {
            RoomNumber: data.RoomNumber.trim(),
            RoomStatusID: selectedRoomStatus,
            FloorID: selectedFloor,
            RoomTypeID: selectedRoomType,
        };

        const res = await CreateRoom(payload);
        if (res.ok) {
            setAlerts(prev => [...prev, { type: "success", message: "Room created successfully." }]);
            setTimeout(() => {
                onClose();
                onCreated(); // refresh list
            }, 1200);
        } else {
            setAlerts(prev => [...prev, { type: "error", message: res.message || "Create failed." }]);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <AddHomeWorkOutlinedIcon style={{ fontSize: 32, color: "#2e7d32" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                        Create New Room
                    </Typography>
                </div>
            </DialogTitle>

            <DialogContent>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Grid container spacing={2}>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="body1" className="title-field">Room Number</Typography>
                            <Controller
                                name="RoomNumber"
                                control={control}
                                defaultValue={""}
                                rules={{ required: "Please enter room number" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        fullWidth
                                        error={!!errors.RoomNumber}
                                        helperText={String(errors.RoomNumber?.message || "")}
                                    />
                                )}
                            />
                        </Grid>

               

                        {/* ถ้า UI คุณต้องการ Capacity ก็เปิดใช้ได้เหมือนกัน */}
                        {/* <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">Room Capacity (persons)</Typography>
              <Controller
                name="Capacity"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <TextField
                    {...field}
                    fullWidth
                    type="number"
                    inputProps={{ min: 0 }}
                  />
                )}
              />
            </Grid> */}

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth error={!!errors.RoomStatusID}>
                                <Typography variant="body1" className="title-field">Room Status</Typography>
                                <Select
                                    labelId="room-status-label"
                                    name="RoomStatusID"
                                    value={selectedRoomStatus}
                                    onChange={(e) => setSelectedRoomStatus(Number(e.target.value))}
                                    displayEmpty
                                >
                                    <MenuItem value={0}><em>-- Please select status --</em></MenuItem>
                                    {roomStatus.map((s) => (
                                        <MenuItem key={s.ID} value={s.ID}>{s.StatusName}</MenuItem>
                                    ))}
                                </Select>
                                {errors.RoomStatusID && <FormHelperText>{String(errors.RoomStatusID?.message)}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth error={!!errors.FloorID}>
                                <Typography variant="body1" className="title-field">Floor</Typography>
                                <Select
                                    labelId="floor-label"
                                    name="FloorID"
                                    value={selectedFloor}
                                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                                    displayEmpty
                                >
                                    <MenuItem value={0}><em>-- Please select floor --</em></MenuItem>
                                    {floors.map((f) => (
                                        <MenuItem key={f.ID} value={f.ID}>
                                            {f.Number ? `Floor ${f.Number}` : `ID ${f.ID}`}
                                        </MenuItem>
                                    ))}
                                </Select>
                                {errors.FloorID && <FormHelperText>{String(errors.FloorID?.message)}</FormHelperText>}
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth error={!!errors.RoomTypeID}>
                                <Typography variant="body1" className="title-field">Room Type</Typography>
                                <Select
                                    labelId="room-type-label"
                                    name="RoomTypeID"
                                    value={selectedRoomType}
                                    onChange={(e) => setSelectedRoomType(Number(e.target.value))}
                                    displayEmpty
                                >
                                    <MenuItem value={0}><em>-- Please select room type --</em></MenuItem>
                                    {roomTypes.map((t) => (
                                        <MenuItem key={t.ID} value={t.ID}>{t.TypeName}</MenuItem>
                                    ))}
                                </Select>
                                {errors.RoomTypeID && <FormHelperText>{String(errors.RoomTypeID?.message)}</FormHelperText>}
                            </FormControl>
                        </Grid>

                    </Grid>

                    <DialogActions sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                        <Button onClick={onClose} color="secondary" variant="outlinedGray">Cancel</Button>
                        <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Create</Button>
                    </DialogActions>
                </form>
            </DialogContent>

            {alerts.length > 0 && (
                <div>
                    {alerts.map((a, i) => (
                        <React.Fragment key={i}>
                            {a.type === "success" && <SuccessAlert message={a.message} onClose={() => setAlerts(alerts.filter((_, idx) => idx !== i))} index={i} totalAlerts={alerts.length} />}
                            {a.type === "error" && <ErrorAlert message={a.message} onClose={() => setAlerts(alerts.filter((_, idx) => idx !== i))} index={i} totalAlerts={alerts.length} />}
                            {a.type === "warning" && <WarningAlert message={a.message} onClose={() => setAlerts(alerts.filter((_, idx) => idx !== i))} index={i} totalAlerts={alerts.length} />}
                            {a.type === "info" && <InfoAlert message={a.message} onClose={() => setAlerts(alerts.filter((_, idx) => idx !== i))} index={i} totalAlerts={alerts.length} />}
                        </React.Fragment>
                    ))}
                </div>
            )}
        </Dialog>
    );
};

export default CreateRoomPopup;
