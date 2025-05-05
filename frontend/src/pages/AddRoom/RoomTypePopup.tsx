import React, { useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Slide, Typography } from '@mui/material';
import { CreateRoomType } from '../../services/http'; // Assuming this is your API function
import { RoomtypesInterface } from '../../interfaces/IRoomTypes'; // Assuming this is your interface for room types
import { TextField } from "../../components/TextField/TextField";
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';

interface AddRoomTypeDialogProps {
  open: boolean;
  handleClose: () => void;
  refreshRoomTypes: () => void; // Function to refresh room types list after a new room type is added
}

const AddRoomTypeDialog: React.FC<AddRoomTypeDialogProps> = ({ open, handleClose, refreshRoomTypes }) => {
  const [newRoomTypeName, setNewRoomTypeName] = useState<string>(''); // Room type name input
  const [newHalfDayRate, setNewHalfDayRate] = useState<string>(''); // Half day rate input
  const [newFullDayRate, setNewFullDayRate] = useState<string>(''); // Full day rate input
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false); // To show the confirmation popup

  const handleCreateRoomType = () => {
    if (newRoomTypeName.trim() && !isNaN(Number(newHalfDayRate)) && !isNaN(Number(newFullDayRate)) && Number(newHalfDayRate) >= 0 && Number(newFullDayRate) >= 0) {
      const roomTypeData: RoomtypesInterface = {
        TypeName: newRoomTypeName,
        HalfDayRate: parseFloat(newHalfDayRate),
        FullDayRate: parseFloat(newFullDayRate),
      };

      // Show confirmation dialog
      setShowConfirmation(true);
    }
  };

  const handleConfirmAddRoomType = async () => {
    const roomTypeData: RoomtypesInterface = {
      TypeName: newRoomTypeName,
      HalfDayRate: parseFloat(newHalfDayRate),
      FullDayRate: parseFloat(newFullDayRate),
    };

    const response = await CreateRoomType(roomTypeData);

    if (response) {
      if (response.error) {
        setAlerts([...alerts, { type: 'error', message: response.error }]);
      } else {
        setAlerts([...alerts, { type: 'success', message: 'New room type has been added successfully.' }]);
        setNewRoomTypeName('');
        setNewHalfDayRate('');
        setNewFullDayRate('');
        refreshRoomTypes();
        handleClose();
      }
    }
    setShowConfirmation(false); // Close the confirmation popup
  };

  return (
    <div>
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
      
      {/* Main Room Type Creation Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>เพิ่มประเภทห้องใหม่</DialogTitle>
        <DialogContent>
          <div style={{ marginTop: '8px' }}>
            <TextField
              label="ชื่อประเภทห้อง"
              value={newRoomTypeName}
              onChange={(e) => setNewRoomTypeName(e.target.value)}
              fullWidth
              autoFocus
              type="text"
              error={newRoomTypeName.trim() === ''}
              helperText={newRoomTypeName.trim() === '' ? "กรุณากรอกชื่อประเภทห้อง" : ""}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#6D6E70'
                },
                '& .MuiFormHelperText-root': {
                  color: 'red'
                },
                marginTop: '10px',
              }}
            />
            <TextField
              label="ราคาครึ่งวัน"
              value={newHalfDayRate}
              onChange={(e) => setNewHalfDayRate(e.target.value)}
              fullWidth
              type="number"
              error={newHalfDayRate.trim() && (isNaN(Number(newHalfDayRate)) || Number(newHalfDayRate) < 0) || false}
              helperText={newHalfDayRate.trim() && (isNaN(Number(newHalfDayRate)) || Number(newHalfDayRate) < 0) ? "กรุณากรอกราคาครึ่งวันที่ไม่ติดลบ" : ""}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#6D6E70'
                },
                '& .MuiFormHelperText-root': {
                  color: 'red'
                },
                marginTop: '10px',
              }}
            />
            <TextField
              label="ราคาทั้งวัน"
              value={newFullDayRate}
              onChange={(e) => setNewFullDayRate(e.target.value)}
              fullWidth
              type="number"
              error={newFullDayRate.trim() && (isNaN(Number(newFullDayRate)) || Number(newFullDayRate) < 0) || false}
              helperText={newFullDayRate.trim() && (isNaN(Number(newFullDayRate)) || Number(newFullDayRate) < 0) ? "กรุณากรอกราคาทั้งวันที่ไม่ติดลบ" : ""}
              sx={{
                '& .MuiInputLabel-root': {
                  color: '#6D6E70'
                },
                '& .MuiFormHelperText-root': {
                  color: 'red'
                },
                marginTop: '10px',
              }}
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            ยกเลิก
          </Button>
          <Button onClick={handleCreateRoomType} color="primary" variant='contained' disabled={!newRoomTypeName.trim() || isNaN(Number(newHalfDayRate)) || isNaN(Number(newFullDayRate)) || Number(newHalfDayRate) <= 0 || Number(newFullDayRate) <= 0}>
            เพิ่มประเภทห้อง
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Pop-up with animation */}
      <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <DialogTitle>ยืนยันการเพิ่มประเภทห้อง</DialogTitle>
        <DialogContent>
          <Slide direction="up" in={showConfirmation} mountOnEnter unmountOnExit>
            <div>
              <Typography variant="body1">
                คุณยืนยันที่จะเพิ่มประเภทห้องนี้หรือไม่? หากเพิ่มประเภทห้องแล้วระบบจะไม่อนุญาตให้คุณลบประเภทห้องนี้ออก โปรดตรวจสอบความถูกต้องก่อนทำการยืนยัน
              </Typography>
            </div>
          </Slide>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmation(false)} color="secondary">
            ยกเลิก
          </Button>
          <Button onClick={handleConfirmAddRoomType} color="primary" variant="contained">
            ยืนยัน
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddRoomTypeDialog;
