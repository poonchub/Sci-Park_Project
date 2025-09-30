// import React, { useState } from 'react';
// import { Dialog,Typography, DialogActions, DialogContent, DialogTitle, Button, Slide } from '@mui/material';
// import { CreateFloor } from '../../services/http'; // Assuming this is your API function
// import { FloorsInterface } from '../../interfaces/IFloors'; // Assuming this is your interface for floors
// import { TextField } from "../../components/TextField/TextField";
// import SuccessAlert from '../../components/Alert/SuccessAlert';
// import ErrorAlert from '../../components/Alert/ErrorAlert';

// interface AddFloorDialogProps {
//   open: boolean;
//   handleClose: () => void;
//   refreshFloors: () => void; // Function to refresh floors list after new floor is added
// }

// const AddFloorDialog: React.FC<AddFloorDialogProps> = ({ open, handleClose, refreshFloors }) => {
//   const [newFloorNumber, setNewFloorNumber] = useState<string>(''); // Use string for floor number input
//   const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
//   const [showConfirmation, setShowConfirmation] = useState(false); // To show the confirmation popup

//   const handleCreateFloor = async () => {
//     if (newFloorNumber.trim() && !isNaN(Number(newFloorNumber)) && Number(newFloorNumber) >= 0) {
//       const floorData: FloorsInterface = {
//         Number: parseInt(newFloorNumber), // Convert the number from string to number
//       };

//       // Show confirmation dialog
//       setShowConfirmation(true);
//     }
//   };

//   const handleConfirmAddFloor = async () => {
//     const floorData: FloorsInterface = {
//       Number: parseInt(newFloorNumber),
//     };
//     const response = await CreateFloor(floorData);

//     if (response) {
//       if (response.error) {
//         setAlerts([...alerts, { type: 'error', message: response.error }]);
//       } else {
//         setAlerts([...alerts, { type: 'success', message: 'New floor has been added successfully.' }]);
//         setNewFloorNumber('');
//         refreshFloors();
//         handleClose();
//       }
//     }
//     setShowConfirmation(false); // Close the confirmation popup
//   };

//   return (
//     <div>
//       {alerts.map((alert, index) => (
//         <React.Fragment key={index}>
//           {alert.type === 'success' && (
//             <SuccessAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
//           )}
//           {alert.type === 'error' && (
//             <ErrorAlert message={alert.message} onClose={() => setAlerts(alerts.filter((_, i) => i !== index))} index={index} totalAlerts={alerts.length} />
//           )}
//         </React.Fragment>
//       ))}
      
//       {/* Main Floor Creation Dialog */}
//       <Dialog open={open} onClose={handleClose}>
//         <DialogTitle>เพิ่มชั้นใหม่</DialogTitle>
//         <DialogContent>
//           <div style={{ marginTop: '8px' }}>
//             <TextField
//               label="หมายเลขชั้น"
//               value={newFloorNumber}
//               onChange={(e) => setNewFloorNumber(e.target.value)}
//               fullWidth
//               autoFocus
//               type="number"
//               slotProps={{
//                 htmlInput: {
//                   inputMode: 'numeric',
//                   pattern: '[0-9]*',
//                 }
//               }}
//               error={newFloorNumber.trim() && (isNaN(Number(newFloorNumber)) || Number(newFloorNumber) <= 0) || false}
//               helperText={newFloorNumber.trim() && (isNaN(Number(newFloorNumber)) || Number(newFloorNumber) < 0) ? "กรุณากรอกหมายเลขชั้นเป็นตัวเลขที่ไม่ติดลบ" : ""}
//               sx={{
//                 '& .MuiInputLabel-root': {
//                   color: '#6D6E70'
//                 },
//                 '& .MuiFormHelperText-root': {
//                   color: 'red'
//                 },
//                 marginTop: '10px',
//               }}
//             />
//           </div>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleClose} color="secondary">
//             ยกเลิก
//           </Button>
//           <Button onClick={handleCreateFloor} color="primary" variant='contained' disabled={!newFloorNumber.trim() || isNaN(Number(newFloorNumber)) || Number(newFloorNumber) <= 0}>
//             เพิ่มชั้น
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Confirmation Pop-up with animation */}
//       <Dialog open={showConfirmation} onClose={() => setShowConfirmation(false)}>
//         <DialogTitle>ยืนยันการเพิ่มชั้น</DialogTitle>
//         <DialogContent>
//           <Slide direction="up" in={showConfirmation} mountOnEnter unmountOnExit>
//             <div>
//               <Typography variant="body1">
//                 คุณยืนยันที่จะเพิ่มชั้นหรือไม่? หากเพิ่มชั้นแล้วระบบจะไม่อนุญาตให้คุณลบชั้นนี้ออก โปรดตรวจสอบความถูกต้องก่อนทำการยืนยัน
//               </Typography>
//             </div>
//           </Slide>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setShowConfirmation(false)} color="secondary">
//             ยกเลิก
//           </Button>
//           <Button onClick={handleConfirmAddFloor} color="primary" variant="contained">
//             ยืนยัน
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </div>
//   );
// };

// export default AddFloorDialog;
