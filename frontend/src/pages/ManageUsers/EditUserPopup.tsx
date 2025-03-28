// EditUserPopup.tsx
import React, { useEffect, useState } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button } from '@mui/material';
import { UserInterface } from '../../interfaces/IUser'; // Import the interface for User data
import { GetUserById, UpdateUserbyID } from '../../services/http/index'; // Import the functions for fetching and updating User data

interface EditUserPopupProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

const EditUserPopup: React.FC<EditUserPopupProps> = ({ userId, open, onClose }) => {
  const [user, setUser] = useState<UserInterface | null>(null);

  // Fetch user data when the component is mounted or userId changes
  useEffect(() => {
    if (userId > 0) {
        GetUserById(userId).then((data) => {
        setUser(data);
      });
    }
  }, [userId]);

  const handleSave = () => {
    if (user) {
        UpdateUserbyID(user).then(() => {
        onClose(); // Close the pop-up after saving
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (user) {
      setUser({
        ...user,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>แก้ไขข้อมูลผู้ใช้งาน</DialogTitle>
      <DialogContent>
        {user && (
          <>
            <TextField
              name="firstName"
              label="ชื่อ"
              value={user.FirstName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="lastName"
              label="นามสกุล"
              value={user.LastName}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="email"
              label="อีเมล"
              value={user.Email}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            <TextField
              name="phone"
              label="เบอร์โทรศัพท์"
              value={user.Phone}
              onChange={handleChange}
              fullWidth
              margin="normal"
            />
            {/* เพิ่มฟิลด์ที่ต้องการให้แก้ไขที่นี่ */}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">ยกเลิก</Button>
        <Button onClick={handleSave} color="primary">บันทึก</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserPopup;
