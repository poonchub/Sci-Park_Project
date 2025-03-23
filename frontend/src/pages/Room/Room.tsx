import React, { useState } from "react";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Snackbar,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
} from "@mui/material";
import { Add, Edit, Delete } from "@mui/icons-material";

interface Room {
  id: number;
  roomNumber: string;
  capacity: number;
  roomStatus: { statusName: string };
  floor: { number: number };
  roomType: { typeName: string };
}

const roomStatuses = ["Available", "In Use", "Under Maintenance"];
const floors = [1, 2, 3, 4, 5];
const roomTypes = ["Standard", "Conference", "Deluxe"];

const mockRooms: Room[] = [
  {
    id: 1,
    roomNumber: "101",
    capacity: 10,
    roomStatus: { statusName: "Available" },
    floor: { number: 1 },
    roomType: { typeName: "Standard" },
  },
  {
    id: 2,
    roomNumber: "202",
    capacity: 20,
    roomStatus: { statusName: "In Use" },
    floor: { number: 2 },
    roomType: { typeName: "Conference" },
  },
];

const ManageRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomNumber, setRoomNumber] = useState("");
  const [capacity, setCapacity] = useState<number | "">("");
  const [roomStatus, setRoomStatus] = useState("");
  const [floor, setFloor] = useState<number | "">("");
  const [roomType, setRoomType] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleOpen = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
      setRoomNumber(room.roomNumber);
      setCapacity(room.capacity);
      setRoomStatus(room.roomStatus.statusName);
      setFloor(room.floor.number);
      setRoomType(room.roomType.typeName);
    } else {
      setEditingRoom(null);
      setRoomNumber("");
      setCapacity("");
      setRoomStatus("");
      setFloor("");
      setRoomType("");
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSave = () => {
    if (!roomNumber || !capacity || !roomStatus || !floor || !roomType) return;

    if (editingRoom) {
      setRooms(
        rooms.map((room) =>
          room.id === editingRoom.id
            ? {
                ...room,
                roomNumber,
                capacity: Number(capacity),
                roomStatus: { statusName: roomStatus },
                floor: { number: Number(floor) },
                roomType: { typeName: roomType },
              }
            : room
        )
      );
    } else {
      const newRoom: Room = {
        id: rooms.length + 1,
        roomNumber,
        capacity: Number(capacity),
        roomStatus: { statusName: roomStatus },
        floor: { number: Number(floor) },
        roomType: { typeName: roomType },
      };
      setRooms([...rooms, newRoom]);
    }
    setOpen(false);
    setSnackbarOpen(true);
  };

  return (
    <Container>
      <Typography variant="h4" sx={{ marginBottom: 3, textAlign: "center" }}>
        จัดการข้อมูลห้องประชุม
      </Typography>
      <Box display="flex" justifyContent="flex-end" marginBottom={2}>
        <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>
          เพิ่มห้อง
        </Button>
      </Box>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>หมายเลขห้อง</TableCell>
              <TableCell>ความจุ</TableCell>
              <TableCell>สถานะห้อง</TableCell>
              <TableCell>ชั้น</TableCell>
              <TableCell>ประเภทห้อง</TableCell>
              <TableCell>การจัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rooms.map((room) => (
              <TableRow key={room.id}>
                <TableCell>{room.roomNumber}</TableCell>
                <TableCell>{room.capacity}</TableCell>
                <TableCell>{room.roomStatus.statusName}</TableCell>
                <TableCell>{room.floor.number}</TableCell>
                <TableCell>{room.roomType.typeName}</TableCell>
                <TableCell>
                  <Button startIcon={<Edit />} onClick={() => handleOpen(room)}>
                    แก้ไข
                  </Button>
                  <Button startIcon={<Delete />} color="error">
                    ลบ
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{editingRoom ? "แก้ไขห้อง" : "เพิ่มห้อง"}</DialogTitle>
        <DialogContent>
          <TextField
            label="หมายเลขห้อง"
            fullWidth
            margin="dense"
            value={roomNumber}
            onChange={(e) => setRoomNumber(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="ความจุ"
            type="number"
            fullWidth
            margin="dense"
            value={capacity}
            onChange={(e) => setCapacity(Number(e.target.value) || "")}
            InputLabelProps={{ shrink: true }}
            
          />
          <FormControl fullWidth margin="dense">
            <InputLabel style={{ color: "#FF7043" }}>สถานะห้อง</InputLabel>
            <Select value={roomStatus} onChange={(e) => setRoomStatus(e.target.value)}>
              {roomStatuses.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>ชั้น</InputLabel>
            <Select value={floor} onChange={(e) => setFloor(Number(e.target.value))}>
              {floors.map((num) => (
                <MenuItem key={num} value={num}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="dense">
            <InputLabel>ประเภทห้อง</InputLabel>
            <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
              {roomTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>ยกเลิก</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            บันทึก
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ManageRooms;



// import React, { useState, useEffect } from "react";
// import {
//   Container,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
//   TextField,
//   Snackbar,
//   Typography,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Box,
// } from "@mui/material";
// import { Add, Edit, Delete } from "@mui/icons-material";
// import {
//   GetRooms,
//   CreateRoom,
//   UpdateRoom,
//   DeleteRoom,
// } from "../../services/http"; // Import services

// interface Room {
//   id: number;
//   roomNumber: string;
//   capacity: number;
//   roomStatus: { statusName: string };
//   floor: { number: number };
//   roomType: { typeName: string };
// }

// const roomStatuses = ["Available", "In Use", "Under Maintenance"];
// const floors = [1, 2, 3, 4, 5];
// const roomTypes = ["Standard", "Conference", "Deluxe"];

// const ManageRooms: React.FC = () => {
//   const [rooms, setRooms] = useState<Room[]>([]);
//   const [open, setOpen] = useState(false);
//   const [editingRoom, setEditingRoom] = useState<Room | null>(null);
//   const [roomNumber, setRoomNumber] = useState("");
//   const [capacity, setCapacity] = useState<number | "">("");
//   const [roomStatus, setRoomStatus] = useState("");
//   const [floor, setFloor] = useState<number | "">("");
//   const [roomType, setRoomType] = useState("");
//   const [snackbarOpen, setSnackbarOpen] = useState(false);

//   // ฟังก์ชันสำหรับดึงข้อมูลห้อง
//   const fetchRooms = async () => {
//     const data = await GetRooms();
//     if (data) {
//       setRooms(data);
//     }
//   };

//   // ฟังก์ชันสำหรับเปิด Dialog
//   const handleOpen = (room?: Room) => {
//     if (room) {
//       setEditingRoom(room);
//       setRoomNumber(room.roomNumber);
//       setCapacity(room.capacity);
//       setRoomStatus(room.roomStatus.statusName);
//       setFloor(room.floor.number);
//       setRoomType(room.roomType.typeName);
//     } else {
//       setEditingRoom(null);
//       setRoomNumber("");
//       setCapacity("");
//       setRoomStatus("");
//       setFloor("");
//       setRoomType("");
//     }
//     setOpen(true);
//   };

//   // ฟังก์ชันสำหรับปิด Dialog
//   const handleClose = () => {
//     setOpen(false);
//   };

//   // ฟังก์ชันสำหรับบันทึกห้อง
//   const handleSave = async () => {
//     if (!roomNumber || !capacity || !roomStatus || !floor || !roomType) return;

//     const roomData = {
//       roomNumber,
//       capacity: Number(capacity),
//       roomStatus: { statusName: roomStatus },
//       floor: { number: Number(floor) },
//       roomType: { typeName: roomType },
//     };

//     if (editingRoom) {
//       // อัปเดตห้อง
//       const updatedRoom = await UpdateRoom(editingRoom.id, roomData);
//       if (updatedRoom) {
//         fetchRooms(); // ดึงข้อมูลห้องใหม่หลังจากอัปเดต
//       }
//     } else {
//       // สร้างห้องใหม่
//       const newRoom = await CreateRoom(roomData);
//       if (newRoom) {
//         fetchRooms(); // ดึงข้อมูลห้องใหม่หลังจากสร้าง
//       }
//     }
//     setOpen(false);
//     setSnackbarOpen(true);
//   };

//   // ฟังก์ชันสำหรับลบห้อง
//   const handleDelete = async (id: number) => {
//     const result = await DeleteRoom(id);
//     if (result) {
//       fetchRooms(); // ดึงข้อมูลห้องใหม่หลังจากลบ
//     }
//   };

//   useEffect(() => {
//     fetchRooms(); // เรียกใช้ฟังก์ชันดึงข้อมูลห้องทั้งหมดเมื่อเริ่มต้น
//   }, []);

//   return (
//     <Container>
//       <Typography variant="h4" sx={{ marginBottom: 3, textAlign: "center" }}>
//         จัดการข้อมูลห้องประชุม
//       </Typography>
//       <Box display="flex" justifyContent="flex-end" marginBottom={2}>
//         <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpen()}>
//           เพิ่มห้อง
//         </Button>
//       </Box>
//       <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
//               <TableCell>หมายเลขห้อง</TableCell>
//               <TableCell>ความจุ</TableCell>
//               <TableCell>สถานะห้อง</TableCell>
//               <TableCell>ชั้น</TableCell>
//               <TableCell>ประเภทห้อง</TableCell>
//               <TableCell>การจัดการ</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {rooms.map((room) => (
//               <TableRow key={room.id}>
//                 <TableCell>{room.roomNumber}</TableCell>
//                 <TableCell>{room.capacity}</TableCell>
//                 <TableCell>{room.roomStatus.statusName}</TableCell>
//                 <TableCell>{room.floor.number}</TableCell>
//                 <TableCell>{room.roomType.typeName}</TableCell>
//                 <TableCell>
//                   <Button startIcon={<Edit />} onClick={() => handleOpen(room)}>
//                     แก้ไข
//                   </Button>
//                   <Button startIcon={<Delete />} color="error" onClick={() => handleDelete(room.id)}>
//                     ลบ
//                   </Button>
//                 </TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>
//       <Dialog open={open} onClose={handleClose}>
//         <DialogTitle>{editingRoom ? "แก้ไขห้อง" : "เพิ่มห้อง"}</DialogTitle>
//         <DialogContent>
//           <TextField
//             label="หมายเลขห้อง"
//             fullWidth
//             margin="dense"
//             value={roomNumber}
//             onChange={(e) => setRoomNumber(e.target.value)}
//             InputLabelProps={{ shrink: true }}
//           />
//           <TextField
//             label="ความจุ"
//             type="number"
//             fullWidth
//             margin="dense"
//             value={capacity}
//             onChange={(e) => setCapacity(Number(e.target.value) || "")}
//             InputLabelProps={{ shrink: true }}
//           />
//           <FormControl fullWidth margin="dense">
//             <InputLabel style={{ color: "#FF7043" }}>สถานะห้อง</InputLabel>
//             <Select value={roomStatus} onChange={(e) => setRoomStatus(e.target.value)}>
//               {roomStatuses.map((status) => (
//                 <MenuItem key={status} value={status}>
//                   {status}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//           <FormControl fullWidth margin="dense">
//             <InputLabel>ชั้น</InputLabel>
//             <Select value={floor} onChange={(e) => setFloor(Number(e.target.value))}>
//               {floors.map((num) => (
//                 <MenuItem key={num} value={num}>
//                   {num}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//           <FormControl fullWidth margin="dense">
//             <InputLabel>ประเภทห้อง</InputLabel>
//             <Select value={roomType} onChange={(e) => setRoomType(e.target.value)}>
//               {roomTypes.map((type) => (
//                 <MenuItem key={type} value={type}>
//                   {type}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleClose}>ยกเลิก</Button>
//           <Button onClick={handleSave} variant="contained" color="primary">
//             บันทึก
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Container>
//   );
// };

// export default ManageRooms;
