import React, { useEffect, useState } from 'react';
import {
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  MenuItem,
  FormControl,
  SelectChangeEvent,
  FormHelperText,
  Grid,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { RoomsInterface } from '../../interfaces/IRooms';
import { RoomtypesInterface } from '../../interfaces/IRoomTypes';
import { FloorsInterface } from '../../interfaces/IFloors';
import { RoomStatusInterface } from '../../interfaces/IRoomStatus';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import {
  GetRoomByID,
  UpdateRoom,
  GetRoomTypes,
  GetRoomStatus,
  GetFloors,
} from '../../services/http';
import '../AddUser/AddUserForm.css';

interface EditRoomPopupProps {
  roomID: number;
  open: boolean;
  onClose: () => void;
}

const EditRoomPopup: React.FC<EditRoomPopupProps> = ({ roomID, open, onClose }) => {
  const { control, handleSubmit, formState: { errors }, setValue } = useForm();
  const [room, setRoom] = useState<RoomsInterface | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
  const [floors, setFloors] = useState<FloorsInterface[]>([]);
  const [roomStatus, setRoomStatus] = useState<RoomStatusInterface[]>([]);
  const [selectedFloor, setSelectedFloor] = useState<number | null>(null);
  const [selectedRoomType, setSelectedRoomType] = useState<number | null>(null);
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<number | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (roomID > 0) {
          const roomData = await GetRoomByID(roomID);
          setRoom(roomData);
          setValue('RoomNumber', roomData.RoomNumber);
          setValue('Capacity', roomData.Capacity);
          setValue('RoomStatusID', roomData.RoomStatusID);
          setValue('FloorID', roomData.FloorID);
          setValue('RoomTypeID', roomData.RoomTypeID);

          setSelectedFloor(roomData.FloorID);
          setSelectedRoomType(roomData.RoomTypeID);
          setSelectedRoomStatus(roomData.RoomStatusID);
        }

        const [roomTypeData, floorData, roomStatusData] = await Promise.all([
          GetRoomTypes(),
          GetFloors(),
          GetRoomStatus(),
        ]);

        setRoomTypes(normalizeArray<RoomtypesInterface>(roomTypeData));
        setFloors(normalizeArray<FloorsInterface>(floorData));
        setRoomStatus(normalizeArray<RoomStatusInterface>(roomStatusData));
      } catch (error) {
        console.error('Error loading room data:', error);
        setAlerts(prev => [...prev, { type: 'error', message: 'Failed to load room data. Please try again.' }]);
      }
    };

    fetchData();
  }, [roomID, setValue]);


  // ใส่ไว้ในไฟล์นี้ (เหนือ useEffect ก็ได้)
  function normalizeArray<T>(input: unknown): T[] {
    if (Array.isArray(input)) return input as T[];
    // รองรับเคส backend ส่ง { data: [...] }
    if (input && typeof input === "object" && Array.isArray((input as any).data)) {
      return (input as any).data as T[];
    }
    return []; // กันตก
  }


  const handleSave = async (data: RoomsInterface) => {
    const formDataToSend = {
      ID: roomID,
      RoomNumber: data.RoomNumber,
      Capacity: Number(data.Capacity),
      RoomStatusID: selectedRoomStatus || 0,
      FloorID: selectedFloor || 0,
      RoomTypeID: selectedRoomType || 0,
    };

    console.log('Form data to send:', formDataToSend);

    if (formDataToSend.FloorID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select a floor' },
      ]);
      return;
    }
    if (formDataToSend.RoomStatusID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select room status' },
      ]);
      return;
    }
    if (formDataToSend.RoomTypeID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select room type' },
      ]);
      return;
    }

    try {
      const response = await UpdateRoom(formDataToSend);
      console.log('Update response:', response);
      if (response?.status === 'success') {
        setAlerts(prev => [
          ...prev,
          { type: 'success', message: 'Room updated successfully.' },
        ]);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setAlerts(prev => [
          ...prev,
          { type: 'error', message: response?.message || 'Failed to update room.' },
        ]);
      }
    } catch (error) {
      console.error('Update error:', error);
      setAlerts(prev => [
        ...prev,
        { type: 'error', message: 'An unexpected error occurred. Please try again later.' },
      ]);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="edit-room-popup">
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ManageAccountsOutlinedIcon style={{ fontSize: '32px', color: '#ff6f00' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600, color: 'primary.main'}}>
            Edit Room Information
          </Typography>
        </div>
      </DialogTitle>

      <DialogContent>
        {room && (
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">Room Number</Typography>
                <Controller
                  name="RoomNumber"
                  control={control}
                  defaultValue={room.RoomNumber || ''}
                  rules={{ required: 'Please enter room number' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.RoomNumber}
                      helperText={String(errors.RoomNumber?.message) || ''}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">Room Capacity (persons)</Typography>
                <Controller
                  name="Capacity"
                  control={control}
                  defaultValue={room.Capacity || 0}
                  disabled
                  rules={{
                    required: 'Please enter room capacity',
                    min: {
                      value: 1,
                      message: 'Room capacity must be greater than 0'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      type="number"
                      error={!!errors.Capacity}
                      helperText={String(errors.Capacity?.message) || ''}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.RoomStatusID}>
                  <Typography variant="body1" className="title-field">Room Status</Typography>
                  <Select
                    labelId="room-status-label"
                    name="RoomStatusID"
                    value={selectedRoomStatus ?? room.RoomStatusID}
                    onChange={(e) => setSelectedRoomStatus(Number(e.target.value))}
                    displayEmpty
                  >
                    <MenuItem value={0}><em>-- Please select status --</em></MenuItem>
                    {roomStatus.map((status) => (
                      <MenuItem key={status.ID} value={status.ID}>{status.StatusName}</MenuItem>
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
                    value={selectedFloor ?? room.FloorID}
                    onChange={(e) => setSelectedFloor(Number(e.target.value))}
                    displayEmpty
                  >
                    <MenuItem value={0}><em>-- Please select floor --</em></MenuItem>
                    {floors.map((floor) => (
                      <MenuItem key={floor.ID} value={floor.ID}>{`Floor ${floor.Number}`}</MenuItem>
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
                    value={selectedRoomType ?? room.RoomTypeID}
                    onChange={(e) => setSelectedRoomType(Number(e.target.value))}
                    displayEmpty
                  >
                    <MenuItem value={0}><em>-- Please select room type --</em></MenuItem>
                    {roomTypes.map((type) => (
                      <MenuItem key={type.ID} value={type.ID}>{type.TypeName}</MenuItem>
                    ))}
                  </Select>
                  {errors.RoomTypeID && <FormHelperText>{String(errors.RoomTypeID?.message)}</FormHelperText>}
                </FormControl>
              </Grid>
            </Grid>

            <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button onClick={onClose} color="secondary"  variant="outlinedGray">Cancel</Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />}>Save</Button>
            </DialogActions>
          </form>
        )}
      </DialogContent>

      {/* Show alert here */}
      {alerts.length > 0 && (
        <div>
          {alerts.map((alert, index) => (
            <React.Fragment key={index}>
              {alert.type === 'success' && (
                <SuccessAlert
                  message={alert.message}
                  onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                  index={index}
                  totalAlerts={alerts.length}
                />
              )}
              {alert.type === 'error' && (
                <ErrorAlert
                  message={alert.message}
                  onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                  index={index}
                  totalAlerts={alerts.length}
                />
              )}
              {alert.type === 'warning' && (
                <WarningAlert
                  message={alert.message}
                  onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                  index={index}
                  totalAlerts={alerts.length}
                />
              )}
              {alert.type === 'info' && (
                <InfoAlert
                  message={alert.message}
                  onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                  index={index}
                  totalAlerts={alerts.length}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </Dialog>
  );
};

export default EditRoomPopup;
