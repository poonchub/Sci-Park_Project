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
import { TitlePrefix } from '../../interfaces/ITitlePrefix';
import { JobPositionInterface } from '../../interfaces/IJobPosition';
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
  ListRequestTypes,
  ListTitlePrefixes,
  ListJobPositions
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
  const [selectedPrefix, setSelectedPrefix] = useState<number | null>(null);
  const [selectedJobPosition, setSelectedJobPosition] = useState<number | null>(null);
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [packages, setPackages] = useState<PackagesInterface[]>([]);
  const [titlePrefixes, setTitlePrefixes] = useState<TitlePrefix[]>([]);
  const [jobPositions, setJobPositions] = useState<JobPositionInterface[]>([]);
  const [isemployee, setIsEmployee] = useState<boolean | undefined>(undefined);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]); // Alerts state
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const roleID = watch("RoleID");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let userData = null;
        if (userId > 0) {
          userData = await GetUserById(userId);

          console.log(userData);
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
          setValue('PrefixID', userData.PrefixID);
          setValue('JobPositionID', userData.JobPositionID);
          setIsEmployee(userData.IsEmployee);
        }



        const [roleData, genderData, packageData, requiredTypeData, titlePrefixData, jobPositionData] = await Promise.all([
          ListRoles(),
          ListGenders(),
          ListPackages(),
          ListRequestTypes(),
          ListTitlePrefixes(),
          ListJobPositions(),
        ]);

        setRoles(roleData);
        setGenders(genderData);
        setPackages(packageData);
        setRequiredTypes(requiredTypeData);
        setTitlePrefixes(titlePrefixData.data || []);
        setJobPositions(jobPositionData.data || []);

        // Set selected values after data is loaded
        if (userData) {
          setSelectedGender(userData.GenderID ?? null);
          setSelectedRole(userData.RoleID ?? null);
          setSelectedPackage(userData.PackageID ?? null);
          setSelectedRequestType(userData.RequestTypeID ?? null);
          setSelectedPrefix(userData.PrefixID ?? null);
          setSelectedJobPosition(userData.JobPositionID ?? null);
        }

      } catch (error) {
        console.error('Error loading user data:', error);
        setAlerts(prev => [
          ...prev,
          { type: 'error', message: 'Failed to load user data. Please try again.' },
        ]);
      } finally {
        setIsLoading(false);
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
      PrefixID: Number(selectedPrefix) || 1,
      JobPositionID: isemployee === true ? Number(selectedJobPosition) || 0 : 0,
    };

    

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

    if(formDataToSend.PrefixID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select title prefix.' },
      ]);
      return;
    }

    if(isemployee === true && formDataToSend.JobPositionID === 0) {
      setAlerts(prev => [
        ...prev,
        { type: 'warning', message: 'Please select job position.' },
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ManageAccountsOutlinedIcon style={{ fontSize: '32px', color: '#ff6f00' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              Edit User Information
            </Typography>
          </div>

        </div>
      </DialogTitle>

      <DialogContent>
        {user && (
          <form onSubmit={handleSubmit(handleSave)}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <Typography variant="body1" className="title-field">Title Prefix</Typography>
                  {!isLoading && (
                    <Select
                      labelId="prefix-label"
                      name="PrefixID"
                      value={selectedPrefix ?? 0}
                      onChange={(e) => setSelectedPrefix(Number(e.target.value))}
                      displayEmpty
                    >
                      <MenuItem value={0}>
                        <em>-- Title prefix --</em>
                      </MenuItem>
                      {titlePrefixes.map((prefix) => (
                        <MenuItem key={prefix.ID} value={prefix.ID}>{prefix.PrefixEN}</MenuItem>
                      ))}
                    </Select>
                  )}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.GenderID}>
                  <Typography variant="body1" className="title-field">Gender</Typography>
                  {!isLoading && (
                    <Select
                      labelId="gender-label"
                      name="GenderID"
                      value={selectedGender ?? 0}
                      onChange={(e) => setSelectedGender(Number(e.target.value))}
                      displayEmpty
                    >
                      <MenuItem value={0}>
                        <em>-- Please select gender --</em>
                      </MenuItem>
                      {genders.map((gender) => (
                        <MenuItem key={gender.ID} value={gender.ID}>{gender.Name}</MenuItem>
                      ))}
                    </Select>
                  )}
                  {errors.GenderID && <FormHelperText>{String(errors.GenderID.message|| '')}</FormHelperText>}
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">First Name</Typography>
                <Controller
                  name="FirstName"
                  control={control}
                  defaultValue={user.FirstName || ''}
                  rules={{ required: 'Please enter first name (no prefix)' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.FirstName}
                      helperText={String(errors.FirstName?.message || '')}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">Last Name</Typography>
                <Controller
                  name="LastName"
                  control={control}
                  defaultValue={user.LastName || ''}
                  rules={{ required: 'Please enter last name' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.LastName}
                      helperText={String(errors.LastName?.message || '')}
                    />
                  )}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">Email</Typography>
                <Controller
                  name="Email"
                  control={control}
                  defaultValue={user.Email}
                  rules={{
                    required: 'Please enter email',
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                      message: 'Please enter a valid email address'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      error={!!errors.Email}
                      helperText={String(errors.Email?.message|| '')}
                    />
                  )}
                />
              </Grid>


              {isemployee === true && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Employee ID</Typography>
                    <Controller
                      name="EmployeeID"
                      control={control}
                      defaultValue={user.EmployeeID}
                      rules={{
                        required: 'Please enter employee ID',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Please enter a valid employee ID (6 digits)'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.EmployeeID}
                          helperText={String(errors.EmployeeID?.message || '') }
                        />
                      )}
                    />
                  </Grid>
                </>
              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="body1" className="title-field">Phone Number</Typography>
                <Controller
                  name="Phone"
                  control={control}
                  defaultValue={user.Phone}
                  rules={{
                    required: 'Please enter phone number',
                    pattern: {
                      value: /^0[0-9]{9}$/,
                      message: 'Phone number must start with 0 and have 10 digits'
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth

                      error={!!errors.Phone}
                      helperText={String(errors.Phone?.message|| '') }
                    />
                  )}
                />
              </Grid>

              {isemployee === false && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Company Name</Typography>
                    <Controller
                      name="CompanyName"
                      control={control}
                      defaultValue={user.CompanyName || ''}  // ตั้งค่า defaultValue เป็นชื่อบริษัท
                      rules={{ required: 'Please enter company name' }} // เพิ่มข้อกำหนดให้กรอกชื่อบริษัท
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.CompanyName}
                          helperText={String(errors.CompanyName?.message|| '')}
                        />
                      )}
                    />
                  </Grid>



                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Business Description</Typography>
                    <Controller
                      name="BusinessDetail"
                      control={control}
                      defaultValue={user.BusinessDetail || ''} // ตั้งค่า defaultValue เป็นคำอธิบายธุรกิจ
                      rules={{ required: 'Please enter business description' }} // เพิ่มข้อกำหนดให้กรอกคำอธิบายธุรกิจ
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.BusinessDetail}  // ใช้ errors จาก react-hook-form เพื่อตรวจสอบข้อผิดพลาด
                          helperText={String(errors.BusinessDetail?.message|| '')}  // ข้อความช่วยเหลือ
                        />
                      )}
                    />
                  </Grid>

                </>
              )}

              

              {isemployee === true && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth error={!!errors.RoleID}>
                      <Typography variant="body1" className="title-field">Position</Typography>
                      {!isLoading && (
                        <Select
                          labelId="role-label"
                          name="RoleID"
                          value={selectedRole ?? 0}
                          onChange={(e) => setSelectedRole(Number(e.target.value))}
                          displayEmpty
                        >
                          <MenuItem value={0}>
                            <em>-- Please select position --</em>
                          </MenuItem>
                          {roles.map((role) => (
                            <MenuItem key={role.ID} value={role.ID}>{role.Name}</MenuItem>
                          ))}
                        </Select>
                      )}
                      {errors.RoleID && <FormHelperText>{String(errors.RoleID.message|| '')}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {/* Job Position Dropdown - Only for Internal Users */}
                  {isemployee === true && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <Typography variant="body1" className="title-field">Job Position</Typography>
                        {!isLoading && (
                          <Select
                            labelId="job-position-label"
                            name="JobPositionID"
                            value={selectedJobPosition ?? 0}
                            onChange={(e) => setSelectedJobPosition(Number(e.target.value))}
                            displayEmpty
                          >
                            <MenuItem value={0}>
                              <em>-- Please select job position --</em>
                            </MenuItem>
                            {jobPositions.map((jobPosition) => (
                              <MenuItem key={jobPosition.ID} value={jobPosition.ID}>{jobPosition.Name}</MenuItem>
                            ))}
                          </Select>
                        )}
                      </FormControl>
                    </Grid>
                  )}

                  {(roleID || selectedRole) === 3 && (
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth error={!!errors.RequestTypeID}>
          <Typography variant="body1" className="title-field">Management</Typography>
          {!isLoading && (
            <Select
              labelId="request-type-label"
              name="RequestTypeID"
              defaultValue={1}
              value={selectedRequestType ?? 0} // Optional: Modify value based on condition
              onChange={(e) => setSelectedRequestType(Number(e.target.value))}
              displayEmpty
            >
              <MenuItem value={0}>
                <em>-- Please select management --</em>
              </MenuItem>
              {requiredTypes.map((requiredType) => (
                <MenuItem key={requiredType.ID} value={requiredType.ID}>{requiredType.TypeName}</MenuItem>
              ))}
            </Select>
          )}
          {errors.RequestTypeID && <FormHelperText>{String(errors.RequestTypeID?.message)}</FormHelperText>}
        </FormControl>
      </Grid>
    )}
                </>


              )}

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth >
                  <Typography variant="body1" className="title-field">Privileges</Typography>
                  {!isLoading && (
                    <Select
                      labelId="package-label"
                      name="PackageID"
                      value={selectedPackage ?? 0} // Default to 0 if no package is selected
                      onChange={(e) => setSelectedPackage(Number(e.target.value))}
                      displayEmpty
                    >
                      <MenuItem value={0}><em>-- No privileges --</em></MenuItem>
                      {packages.map((pkg) => (
                        <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                      ))}
                    </Select>
                  )}
                </FormControl>
              </Grid>
            </Grid>

            <DialogActions sx={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button onClick={onClose} variant="outlinedCancel">Cancel</Button>
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

export default EditUserPopup;
