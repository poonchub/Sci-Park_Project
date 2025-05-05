import React, { useState, useEffect } from 'react';
import { Button, MenuItem, InputLabel, FormControl, FormHelperText, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import '../AddUser/AddUserForm.css';  // Import the updated CSS
import { GetRoomTypes, GetFloors,CreateRoom } from '../../services/http';  // Assuming these are your API functions
import { FloorsInterface } from '../../interfaces/IFloors';
import { RoomtypesInterface } from '../../interfaces/IRoomTypes';
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";
import Grid from '@mui/material/Grid2';  // Grid version 2
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import AddFloorDialog from './FloorPopup'; // Import the new FloorPopup component
import AddRoomTypeDialogProps from './RoomTypePopup'; // Import the new RoomTypePopup component
import { RoomsInterface } from '../../interfaces/IRooms';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
const AddRoomForm: React.FC = () => {
  const [floors, setFloors] = useState<FloorsInterface[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomtypesInterface[]>([]);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [openFloorDialog, setOpenFloorDialog] = useState(false);
  const [openRoomTypeDialog, setOpenRoomTypeDialog] = useState(false);

  // Fetch Floors and Room Types on component mount
  useEffect(() => {
    FecthFloors();  // Fetch floors data
    FecthRoomTypes();  // Fetch room types data
  }, []);

  const FecthFloors = async () => {
    try {
      const res = await GetFloors();  // Get floors from API
      if (res) {
        setFloors(res);
      }
    } catch (error) {
      console.error("Error fetching floors:", error);
    }
  };

  const FecthRoomTypes = async () => {
    try {
      const res = await GetRoomTypes();  // Get room types from API
      if (res) {
        setRoomTypes(res);
      }
    } catch (error) {
      console.error("Error fetching room types:", error);
    }
  };

  // Form submission handler
  const onSubmit = async (data:RoomsInterface) => {
    data.RoomStatusID = 1; // Set default room status to 1 (available)
    data.Capacity = Number(data.Capacity); // Ensure capacity is a number
    console.log(data);

    const response = await CreateRoom(data);

    if (response) {
      if (response.error) {
        setAlerts([...alerts, { type: 'error', message: response.error }]);
      } else {
        setAlerts([...alerts, { type: 'success', message: 'Room added successfully.' }]);
        reset();  // Reset the form after successful submission
      }
    } else {
      setAlerts([...alerts, { type: 'error', message: 'Failed to add room.' }]);
    }
  };

  const ShowPopupNewFloor = () => {
    setOpenFloorDialog(true); // Open the AddFloorDialog
  };

  const ShowPopupNewRoomType = () => {
    setOpenRoomTypeDialog(true); // Open the AddFloorDialog
  };

  return (
    <>
      {/* Show Alerts */}
      {alerts.map((alert, index) => (
        <React.Fragment key={index}>
          {alert.type === 'success' && (
            <SuccessAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
          )}
          {alert.type === 'error' && (
            <ErrorAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
          )}
        </React.Fragment>
      ))}

      <Typography variant="h6" className="title" style={{ marginBottom: '20px', marginTop: '10px' }}>
        เพิ่มห้องใหม่
      </Typography>

      <div className="add-user">
        <form onSubmit={handleSubmit(onSubmit)} className="add-user-form">
          <Grid container spacing={2}>
            {/* Floor Selection */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body1" className="title-field">ชั้น</Typography>
              <FormControl fullWidth error={!!errors.FloorID}>
                <InputLabel sx={{ color: '#6D6E70' }}>กรุณาเลือกชั้น</InputLabel>
                <Controller
                  name="FloorID"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณาเลือกชั้น' }}
                  render={({ field }) => (
                    <Select {...field} label="กรุณาเลือกชั้น">
                      {floors.map((floor) => (
                        <MenuItem key={floor.ID} value={floor.ID}>{floor.Number}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>{String(errors.FloorID?.message)}</FormHelperText>
              </FormControl>
            </Grid>

            {/* Button to open floor dialog */}
            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                onClick={ShowPopupNewFloor}
                sx={{
                  minWidth: 0,
                  marginTop: '32px',
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  border: '1px solid rgb(109, 110, 112, 0.4)',
                  "&:hover": {
                    boxShadow: 'none',
                    borderColor: 'primary.main',
                    backgroundColor: 'transparent'
                  },
                }}
              >
                เพิ่มชั้นใหม่ <LayersOutlinedIcon />
              </Button>
            </Grid>

            {/* Room Type Selection */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <Typography variant="body1" className="title-field">ประเภทห้อง</Typography>
              <FormControl fullWidth error={!!errors.RoomTypeID}>
                <InputLabel sx={{ color: '#6D6E70' }}>กรุณาเลือกประเภทห้อง</InputLabel>
                <Controller
                  name="RoomTypeID"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณาเลือกประเภทห้อง' }}
                  render={({ field }) => (
                    <Select {...field} label="กรุณาเลือกประเภทห้อง">
                      {roomTypes.map((roomType) => (
                        <MenuItem key={roomType.ID} value={roomType.ID}>{roomType.TypeName}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>{String(errors.RoomTypeID?.message)}</FormHelperText>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 2 }}>
              <Button
                onClick={ShowPopupNewRoomType}
                sx={{
                  minWidth: 0,
                  marginTop: '32px',
                  width: '100%',
                  height: '46px',
                  borderRadius: '10px',
                  border: '1px solid rgb(109, 110, 112, 0.4)',
                  "&:hover": {
                    boxShadow: 'none',
                    borderColor: 'primary.main',
                    backgroundColor: 'transparent'
                  },
                }}
              >
                เพิ่มประเภทห้อง <LayersOutlinedIcon />
              </Button>
            </Grid>

            {/* Room Name Field */}
<Grid size={{ xs: 12, sm: 6 }}>
<Typography variant="body1" className="title-field">ชื่อห้อง</Typography>
  <Controller
    name="RoomNumber"
    control={control}
    defaultValue=""
    rules={{ required: 'กรุณากรอกชื่อห้อง' }}
    render={({ field }) => (
      <TextField 
        {...field} 
        label="กรุณากรอกชื่อห้อง ตัวอย่าง (A102,B110)" 
        fullWidth 
        error={!!errors.RoomNumber} 
        helperText={String(errors.RoomNumber?.message) || ""} 
        slotProps={{
          inputLabel: {
            sx: {
              color: '#6D6E70' // Set label color to gray
            }
          }
        }}
      />
    )}
  />
</Grid>

{/* Capacity Field */}
<Grid size={{ xs: 12, sm: 6 }}>
<Typography variant="body1" className="title-field">ความจุห้อง (คน)</Typography>
  <Controller
    name="Capacity"
    control={control}
    defaultValue=""
    rules={{ required: 'กรุณากรอกความจุห้อง' }}
    render={({ field }) => (
      <TextField 
        {...field} 
        label="กรุณากรอกความจุห้อง ตัวอย่าง (40,100)" 
        fullWidth 
        type="number" 
        error={!!errors.Capacity} 
        helperText={String(errors.Capacity?.message) || ""} 
        slotProps={{
          inputLabel: {
            sx: {
              color: '#6D6E70' // Set label color to gray
            }
          }
        }}
      />
    )}
  />
</Grid>


            {/* Submit Button */}
            <Grid size={{ xs: 12 }} className="submit-button-container">
              <Button type="reset" variant="outlined" color="secondary" sx={{ marginRight: 2 }} onClick={() => reset()}>
                รีเซ็ต
              </Button>
              <Button type="submit" variant="contained" color="primary">
                เพิ่มห้อง
              </Button>
            </Grid>
          </Grid>
        </form>
      </div>

      {/* AddFloorDialog */}
      <AddFloorDialog
        open={openFloorDialog}
        handleClose={() => setOpenFloorDialog(false)}
        refreshFloors={FecthFloors}  // Refresh the floor list after adding a new floor
      />

      {/* AddRoomTypeDialog */}
      <AddRoomTypeDialogProps
        open={openRoomTypeDialog}
        handleClose={() => setOpenRoomTypeDialog(false)}
        refreshRoomTypes={FecthRoomTypes}  // Refresh the room type list after adding a new room type
      />
    </>
  );
};

export default AddRoomForm;
