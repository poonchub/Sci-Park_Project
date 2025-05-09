import React, { useEffect, useState, ChangeEvent } from 'react';
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
import { useForm, Controller, set } from 'react-hook-form';  // Import useForm and Controller
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import SaveIcon from '@mui/icons-material/Save';
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import { UserInterface } from '../../interfaces/IUser';
import { RolesInterface } from '../../interfaces/IRoles';
import { GendersInterface } from '../../interfaces/IGenders';
import { PackagesInterface } from '../../interfaces/IPackages';
import { RequestTypeInterface } from '../../interfaces/IRequestTypes';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import {
  GetUserById,
  UpdateUserbyID,
  ListRoles,
  ListGenders,
  ListPackages,
  ListRequestTypes
} from '../../services/http';
import '../AddUser/AddUserForm.css';

interface EditUserPopupProps {
  userId: number;
  open: boolean;
  onClose: () => void;
}

const EditUserPopup: React.FC<EditUserPopupProps> = ({ userId, open, onClose }) => {
  const { control, handleSubmit, formState: { errors }, setValue, watch } = useForm();
  const [user, setUser] = useState<UserInterface | null>(null);
  const [roles, setRoles] = useState<RolesInterface[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [requiredTypes, setRequiredTypes] = useState<RequestTypeInterface[]>([]); // State for required types
  const [selectedRequestType, setSelectedRequestType] = useState<number | null>(null);
  const [selectedGender, setSelectedGender] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [packages, setPackages] = useState<PackagesInterface[]>([]);
  const [isemployee, setIsEmployee] = useState<boolean | undefined>(undefined);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]); // Alerts state

  const roleID = watch("RoleID");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (userId > 0) {
          const userData = await GetUserById(userId);
          setUser(userData);
          setValue('FirstName', userData.FirstName);
          setValue('LastName', userData.LastName);
          setValue('Email', userData.Email);
          setValue('Phone', userData.Phone);
          setValue('EmployeeID', userData.EmployeeID);
          setValue('CompanyName', userData.CompanyName);
          setValue('GenderID', userData.GenderID);
          setValue('RoleID', userData.RoleID);
          setValue('UserPackageID', userData.UserPackageID);
          setValue('RequestTypeID', userData.RequestTypeID);
          setIsEmployee(userData.IsEmployee);

          setSelectedGender(userData.GenderID ?? null);
          setSelectedRole(userData.RoleID ?? null);
          setSelectedPackage(userData.UserPackageID ?? null);
          setSelectedRequestType(userData.RequestTypeID ?? null);

        }



        const [roleData, genderData, packageData, requiredTypeData] = await Promise.all([
          ListRoles(),
          ListGenders(),
          ListPackages(),
          ListRequestTypes(),
        ]);

        setRoles(roleData);
        setGenders(genderData);
        setPackages(packageData);
        setRequiredTypes(requiredTypeData);

      } catch (error) {
        console.error('Error loading user data:', error);
        setAlerts(prev => [
          ...prev,
          { type: 'error', message: 'Failed to load user data. Please try again.' },
        ]);
      }
    };

    fetchData();
  }, [userId, setValue]);

  const handleSave = async (data: any) => {
    const formDataToSend = {
      UserID: user?.ID,
      FirstName: data.FirstName,
      LastName: data.LastName,
      Email: data.Email,
      Phone: data.Phone,
      CompanyName: data.CompanyName,
      BusinessDetail: data.BusinessDetail,
      EmployeeID: data.EmployeeID,
      GenderID: Number(selectedGender),
      RoleID: Number(selectedRole),
      UserPackageID: Number(selectedPackage),
      RequestTypeID: Number(selectedRequestType) || 1,
    };

    console.log('Form data to send:', formDataToSend);

    if(formDataToSend.RoleID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select a role.' },
      ]);
      return; 
    }
    if(formDataToSend.GenderID === 0) { 
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message  : 'Please select a gender.' },
      ]);
      return;
    }

    if(formDataToSend.RoleID === 3 && formDataToSend.RequestTypeID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select a request type.' },
      ]);
      return; 
    }       
      

    try {
      const response = await UpdateUserbyID(formDataToSend);
      if (response?.status === 'success') {
        setAlerts(prev => [
          ...prev,
          { type: 'success', message: 'User information updated successfully.' },
        ]);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setAlerts(prev => [
          ...prev,
          { type: 'error', message: response?.message || 'Failed to update user information.' },
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

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<unknown>) => {
    if ('target' in e) {
      const { name, value } = e.target;
      if (user && name) {
        setUser({
          ...user,
          [name]: value,
        });
      }
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
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">ชื่อ</Typography>
                <Controller
                  name="FirstName"
                  control={control}
                  defaultValue={user.FirstName || ''}
                  rules={{ required: 'กรุณากรอกชื่อ (ไม่มีคำนำหน้า)' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.FirstName}
                      helperText={String(errors.FirstName?.message) || ''}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">นามสกุล</Typography>
                <Controller
                  name="LastName"
                  control={control}
                  defaultValue={user.LastName || ''}
                  rules={{ required: 'กรุณากรอกนามสกุล' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.LastName}
                      helperText={String('กรุณากรอกนามสกุล') || ''}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">อีเมล</Typography>
                <Controller
                  name="Email"
                  control={control}
                  defaultValue={user.Email}
                  rules={{
                    required: 'กรุณากรอกอีเมล',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'กรุณากรอกอีเมลที่ถูกต้อง'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.Email}
                      helperText={String(errors.Email?.message) || ''}
                    />
                  )}
                />
              </Grid>


              {isemployee === true && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">รหัสพนักงาน</Typography>
                    <Controller
                      name="EmployeeID"
                      control={control}
                      defaultValue={user.EmployeeID}
                      rules={{
                        required: 'กรุณากรอกรหัสพนักงาน',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'กรุณากรอกรหัสพนักงานที่ถูกต้อง มีตัวเลข 6 ตัว'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.EmployeeID}
                          helperText={String(errors.EmployeeID?.message) || ''}
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">หมายเลข โทรศัพท์</Typography>
                <Controller
                  name="Phone"
                  control={control}
                  defaultValue={user.Phone}
                  rules={{
                    required: 'กรุณากรอกหมายเลขโทรศัพท์',
                    pattern: {
                      value: /^0[0-9]{9}$/,
                      message: 'หมายเลขโทรศัพท์ต้องเริ่มต้นด้วย 0 และมีทั้งหมด 10 หลัก'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth

                      error={!!errors.Phone}
                      helperText={String(errors.Phone?.message) || ''}
                    />
                  )}
                />
              </Grid>

              {isemployee === false && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">ชื่อบริษัท</Typography>
                    <Controller
                      name="CompanyName"
                      control={control}
                      defaultValue={user.CompanyName || ''}  // ตั้งค่า defaultValue เป็นชื่อบริษัท
                      rules={{ required: 'กรุณากรอกชื่อบริษัท' }} // เพิ่มข้อกำหนดให้กรอกชื่อบริษัท
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.CompanyName}
                          helperText={String(errors.CompanyName?.message) || 'กรุณากรอกชื่อบริษัท'}
                        />
                      )}
                    />
                  </Grid>



                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">คำอธิบายธุรกิจ</Typography>
                    <Controller
                      name="BusinessDetail"
                      control={control}
                      defaultValue={user.BusinessDetail || ''} // ตั้งค่า defaultValue เป็นคำอธิบายธุรกิจ
                      rules={{ required: 'กรุณากรอกคำอธิบายธุรกิจ' }} // เพิ่มข้อกำหนดให้กรอกคำอธิบายธุรกิจ
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.BusinessDetail}  // ใช้ errors จาก react-hook-form เพื่อตรวจสอบข้อผิดพลาด
                          helperText={String(errors.BusinessDetail?.message) || 'กรุณากรอกคำอธิบายธุรกิจ'}  // ข้อความช่วยเหลือ
                        />
                      )}
                    />
                  </Grid>

                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.GenderID}>
                  <Typography variant="body1" className="title-field">เพศ</Typography>
                  <Select
                    labelId="gender-label"
                    name="GenderID"
                    value={selectedGender ?? user.GenderID}
                    onChange={(e) => setSelectedGender(Number(e.target.value))}
                    displayEmpty
                  >
                    <MenuItem value={0}>
                      <em>-- กรุณาเลือกเพศ --</em>
                    </MenuItem>
                    {genders.map((gender) => (
                      <MenuItem key={gender.ID} value={gender.ID}>{gender.Name}</MenuItem>
                    ))}

                  </Select>
                  {errors.GenderID && <FormHelperText>{String(errors.GenderID.message)}</FormHelperText>}
                </FormControl>
              </Grid>

              {isemployee === true && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth error={!!errors.RoleID}>
                      <Typography variant="body1" className="title-field">ตำแหน่ง</Typography>
                      <Select
                        labelId="role-label"
                        name="RoleID"
                        value={selectedRole ?? user.RoleID}
                        onChange={(e) => setSelectedRole(Number(e.target.value))}
                        displayEmpty
                      >
                        <MenuItem value={0}>
                          <em>-- กรุณาเลือก ตำแหน่ง --</em>
                        </MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.ID} value={role.ID}>{role.Name}</MenuItem>
                        ))}
                      </Select>
                      {errors.RoleID && <FormHelperText>{String(errors.RoleID.message)}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {(roleID || selectedRole) === 3 && (
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth error={!!errors.RequestTypeID}>
          <Typography variant="body1" className="title-field">จัดการ</Typography>
          <Select
            labelId="request-type-label"
            name="RequestTypeID"
            defaultValue={1}
            value={selectedRequestType ?? user.RequestTypeID} // Optional: Modify value based on condition
            onChange={(e) => setSelectedRequestType(Number(e.target.value))}
            displayEmpty
          >
            <MenuItem value={0}>
              <em>-- กรุณาเลือก จัดการ --</em>
            </MenuItem>
            {requiredTypes.map((requiredType) => (
              <MenuItem key={requiredType.ID} value={requiredType.ID}>{requiredType.TypeName}</MenuItem>
            ))}
          </Select>
          {errors.RequestTypeID && <FormHelperText>{String(errors.RequestTypeID?.message)}</FormHelperText>}
        </FormControl>
      </Grid>
    )}
                </>


              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth >
                  <Typography variant="body1" className="title-field">สิทธิพิเศษ</Typography>
                  <Select
                    labelId="package-label"
                    name="UserPackageID"
                    value={selectedPackage ?? user.UserPackageID ?? 0} // Default to 0 if no package is selected
                    onChange={(e) => setSelectedPackage(Number(e.target.value))}
                    displayEmpty
                  >
                    <MenuItem value={0}><em>-- ไม่มี สิทธิพิเศษ --</em></MenuItem>
                    {packages.map((pkg) => (
                      <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button onClick={onClose} color="secondary">ยกเลิก</Button>
              <Button type="submit" variant="contained" startIcon={<SaveIcon />}>บันทึก</Button>
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

export default EditUserPopup;
