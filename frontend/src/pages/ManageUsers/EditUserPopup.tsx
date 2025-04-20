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
} from '@mui/material';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { UserInterface } from '../../interfaces/IUser';
import { RolesInterface } from '../../interfaces/IRoles';
import { GendersInterface } from '../../interfaces/IGenders';
import { PackagesInterface } from '../../interfaces/IPackages';
import Grid from '@mui/material/Grid2'; // Grid version 2
import {
  GetUserById,
  UpdateUserbyID,
  ListRoles,
  ListGenders,
  ListPackages
} from '../../services/http';
import '../AddUser/AddUserForm.css';

interface EditUserPopupProps {
  userId: number;
  open: boolean;
  onClose: () => void;
  setAlerts?: React.Dispatch<React.SetStateAction<{ type: string; message: string }[]>>;
}

const EditUserPopup: React.FC<EditUserPopupProps> = ({ userId, open, onClose, setAlerts }) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [roles, setRoles] = useState<RolesInterface[]>([]);
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [packages, setPackages] = useState<PackagesInterface[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId > 0) {
          const userData = await GetUserById(userId);
          setUser(userData);
        }

        const [roleData, genderData, packageData] = await Promise.all([
          ListRoles(),
          ListGenders(),
          ListPackages(),
        ]);

        setRoles(roleData);
        setGenders(genderData);
        setPackages(packageData);
      } catch (error) {
        console.error('Error loading user data:', error);
        setAlerts?.(prev => [
          ...prev,
          { type: 'error', message: 'Failed to load user data. Please try again.' },
        ]);
      }
    };

    fetchData();
  }, [userId, setAlerts]);

  const handleSave = async () => {
    if (!user) return;

    const formDataToSend = {
      UserID: user.ID,
      FirstName: user.FirstName || '',
      LastName: user.LastName || '',
      Email: user.Email || '',
      Phone: user.Phone || '',
      CompanyName: user.CompanyName || '',
      EmployeeID: user.EmployeeID || '',
      GenderID: Number(user.GenderID) || 0,
      RoleID: Number(user.RoleID) || 0,
      UserPackageID: Number(user.UserPackageID),
      Password: user.Password || '',
      BusinessDetail: user.BusinessDetail || '',
    };

    try {
      const response = await UpdateUserbyID(formDataToSend);

      if (response?.status === 'success') {
        setAlerts?.(prev => [
          ...prev,
          { type: 'success', message: 'User information updated successfully.' },
        ]);

        setTimeout(() => {
          onClose();
        }, 800);
      } else {
        setAlerts?.(prev => [
          ...prev,
          { type: 'error', message: response?.message || 'Failed to update user information.' },
        ]);
      }
    } catch (error) {
      console.error('Update error:', error);
      setAlerts?.(prev => [
        ...prev,
        { type: 'error', message: 'An unexpected error occurred. Please try again later.' },
      ]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    if (user && e.target.name) {
      setUser({
        ...user,
        [e.target.name]: e.target.value,
      });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className="add-user">
      <DialogTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <ManageAccountsOutlinedIcon style={{ fontSize: '32px', color: '#ff6f00' }} />
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            แก้ไขข้อมูลผู้ใช้งาน
          </Typography>
        </div>
      </DialogTitle>

      <DialogContent>
        {user && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">ชื่อ</Typography>
              <TextField name="FirstName" value={user.FirstName} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">นามสกุล</Typography>
              <TextField name="LastName" value={user.LastName} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">อีเมล</Typography>
              <TextField name="Email" value={user.Email} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">หมายเลขโทรศัพท์</Typography>
              <TextField name="Phone" value={user.Phone} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">ชื่อบริษัท</Typography>
              <TextField name="CompanyName" value={user.CompanyName} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">รหัสพนักงาน</Typography>
              <TextField name="EmployeeID" value={user.EmployeeID} onChange={handleChange} fullWidth margin="normal" />
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth margin="normal">
                <Typography variant="body1" className="title-field">เพศ</Typography>
                <Select
                  labelId="gender-label"
                  name="GenderID"
                  value={user.GenderID ?? ""}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>-- กรุณาเลือกเพศ --</em>
                  </MenuItem>
                  {genders.map((gender) => (
                    <MenuItem key={gender.ID} value={gender.ID}>
                      {gender.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth margin="normal">
                <Typography variant="body1" className="title-field">ตำแหน่ง</Typography>
                <Select
                  labelId="role-label"
                  name="RoleID"
                  value={user.RoleID ?? ""}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>-- กรุณาเลือกตำแหน่ง --</em>
                  </MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.ID} value={role.ID}>
                      {role.Name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth margin="normal">
                <Typography variant="body1" className="title-field">สิทธิพิเศษ</Typography>
                <Select
                  labelId="package-label"
                  name="UserPackageID"
                  value={user.UserPackageID ?? 0}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value={0}>
                    <em>-- ไม่พบสิทธิพิเศษ --</em>
                  </MenuItem>
                  {packages.length === 0 ? (
                    <MenuItem value={-1} disabled>
                      <em>ไม่พบสิทธิพิเศษ</em>
                    </MenuItem>
                  ) : (
                    packages.map((pkg) => (
                      <MenuItem key={pkg.ID} value={pkg.ID}>
                        {pkg.PackageName}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="secondary">
          ยกเลิก
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={<SaveIcon />}
          sx={{
            backgroundColor: '#ff6f00',
            color: '#fff',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#e65c00',
            },
          }}
        >
          บันทึก
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditUserPopup;