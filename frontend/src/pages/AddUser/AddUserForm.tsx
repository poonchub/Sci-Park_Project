import React, { useState, useEffect } from 'react';
import { Button, MenuItem, InputLabel, FormControl, FormHelperText, Avatar, Typography, IconButton, RadioGroup, FormControlLabel, Radio, Grid } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import './AddUserForm.css';  // Import the updated CSS
import { ListRoles, ListGenders, ListPackages, CreateUser, ListRequestTypes } from '../../services/http';  // Assuming these are your API functions
import { GendersInterface } from '../../interfaces/IGenders';
import { RolesInterface } from '../../interfaces/IRoles';
import { PackagesInterface } from '../../interfaces/IPackages';
import { UserInterface } from '../../interfaces/IUser';
import { RequestTypeInterface } from '../../interfaces/IRequestTypes';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from '../../components/TextField/TextArea';


const AddUserForm: React.FC = () => {
  const { control, handleSubmit, reset, formState: { errors }, watch } = useForm();
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [roles, setRoles] = useState<RolesInterface[]>([]);
  const [requiredTypes, setRequiredTypes] = useState<RequestTypeInterface[]>([]); // เก็บประเภทที่ต้องการ
  const [packages, setPackages] = useState<PackagesInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);  // เก็บไฟล์เดียว
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  // Fetch data when component mounts
  const [showPassword, setShowPassword] = useState(false); // สถานะของการเปิด/ปิดการแสดงรหัสผ่าน
  const [userType, setUserType] = useState<string>('internal');
  const roleID = watch('RoleID');  // Watching RoleID value

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev); // เปลี่ยนสถานะการแสดงรหัสผ่าน
  };



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      let selectedFiles = Array.from(event.target.files).filter(isValidImage);

      // ตรวจสอบว่าเลือกไฟล์ได้แค่ 1 ไฟล์
      if (selectedFiles.length > 1) {
        selectedFiles = selectedFiles.slice(0, 1);
        alert("You can only select 1 file.");
      }

      // แปลงไฟล์เป็น Base64
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);  // เก็บ Base64 string ของรูปภาพ
      };

      if (selectedFiles[0]) {
        reader.readAsDataURL(selectedFiles[0]);
        setFile(selectedFiles[0]);  // เก็บไฟล์เดียว
      }
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const genderData = await ListGenders();
      const roleData = await ListRoles();
      const packageData = await ListPackages();
      const requiredTypeData = await ListRequestTypes();  // Assuming you have a function to fetch request types

      setGenders(genderData);
      setRoles(roleData);
      setPackages(packageData);
      setRequiredTypes(requiredTypeData);

    };
    fetchData();
  }, []);

  const onSubmit = async (data: UserInterface) => {

    const formData = {
      ...data,
      Profile_Image: file,  // Adding the profile image data to the form data
      IsEmployee: userType === "internal" ? "true" : "false",  // Set IsEmployee based on userType

    };

    // Call CreateUser function to send data

    try {
      const response = await CreateUser(formData);
      

      if (response.status === "success") {
        setAlerts((prevAlerts) => [
          ...prevAlerts,
          { type: 'success', message: response.message },
        ]);

        reset(); // Reset form data to initial state
        setFile(null);  // Reset file state
        setProfileImage(null);  // Reset profile image state
      } else {
        setAlerts((prevAlerts) => [
          ...prevAlerts,
          { type: 'error', message: response.message },
        ]);
      }
    } catch (error) {
      console.error('Error creating user', error);
      setAlerts((prevAlerts) => [
        ...prevAlerts,
        { type: 'error', message: 'An unexpected error occurred.' },
      ]);
    }

  };



  const isValidImage = (file: File) => {
    return file.type.startsWith("image/");
  };




  return (
    <>
      {/* Show Alerts */}
      {alerts.map((alert, index) => {
        return (
          <React.Fragment key={index}>
            {alert.type === 'success' && (
              <SuccessAlert
                message={alert.message}
                onClose={() => setAlerts(alerts.filter((_, i) => i !== index))}
                index={Number(index)}
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
          </React.Fragment>
        );
      })}
      <Typography
        variant="h6"
        className="title"
        style={{ marginBottom: '20px', marginTop: '10px' }}
      >
        Add User
      </Typography>

      <div className="add-user">

        <form onSubmit={handleSubmit(onSubmit)} className="add-user-form">

          <Grid container spacing={2}>

            {/* User Type Selection (บุคคลภายใน/บุคคลภายนอก) */}
            <Grid size={{ xs: 6, md: 6 }}>
              <Typography variant="body1" className="title-field">User Type</Typography>
              <FormControl>
                <RadioGroup
                  row
                  name="userType"
                  value={userType}
                  onChange={(e) => {
                    setUserType(e.target.value);  // Set the value of the selected radio button
                    reset();  // Reset form data to initial state
                    setFile(null);  // Reset file state
                    setProfileImage(null);  // Reset profile image state

                  }}
                >
                  <FormControlLabel
                    value="internal"
                    control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: 'e65c00' } }} />}
                    label="Internal User"
                  />
                  <FormControlLabel
                    value="external"
                    control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: 'e65c00' } }} />}
                    label="External User"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>



            {/* Profile Image and Button */}
            <Grid size={{ xs: 12, sm: 6 }} container direction="column" justifyContent="center" alignItems="center" textAlign="center">
              {/* แสดงภาพโปรไฟล์ */}
              <Avatar sx={{ width: 150, height: 150 }} src={profileImage || ''} />

              {/* ปุ่มเลือกไฟล์ */}
              <Button variant="outlined" component="label" className="upload-button" sx={{ marginTop: 2 }}>
                Add Photo
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
            </Grid>



            




            {/* Name Fields */}
            <Grid size={{ xs: 12, sm: 12 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }} >
                  <Typography variant="body1" className="title-field">First Name</Typography>
                  <Controller
                    name="FirstName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Please enter first name' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Please enter first name (without title)"
                        fullWidth
                        error={!!errors.FirstName}
                        helperText={String(errors.FirstName?.message || "") }
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Last Name</Typography>
                  <Controller
                    name="LastName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Please enter last name' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Please enter last name"
                        fullWidth
                        error={!!errors.LastName}
                        helperText={String(errors.LastName?.message || "") }
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Phone and Email Fields */}
            <Grid size={{ xs: 12, sm: 12 }}>
              <Grid container spacing={2}>
                {/* Gender Dropdown */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body1" className="title-field">Gender</Typography>
                  <FormControl fullWidth error={!!errors.gender}>
                    <InputLabel sx={{ color: '#6D6E70' }}>Please select gender</InputLabel>
                    <Controller
                      name="GenderID"
                      control={control}
                      defaultValue=""
                      rules={{ required: 'Please select gender' }}
                      render={({ field }) => (
                        <Select {...field} label="Please select gender">
                          {genders.map((gender) => (
                            <MenuItem key={gender.ID} value={gender.ID}>{gender.Name}</MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    <FormHelperText>{String(errors.Gender?.message || "")}</FormHelperText>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body1" className="title-field">Phone Number</Typography>
                  <Controller
                    name="Phone"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please enter phone number',
                      pattern: {
                        value: /^0[0-9]{9}$/,  // เริ่มต้นด้วย 0 และตามด้วยตัวเลข 9 ตัว
                        message: 'Phone number must start with 0 and have 10 digits'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Please enter phone number"
                        fullWidth
                        error={!!errors.Phone}
                        helperText={String(errors.Phone?.message || "")}
                        
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Email Field */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body1" className="title-field">Email</Typography>
                  <Controller
                    name="Email"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please enter email',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression สำหรับตรวจสอบอีเมล
                        message: 'Please enter a valid email'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Please enter email"
                        fullWidth
                        error={!!errors.Email}
                        helperText={String(errors.Email?.message || "")}
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />
                    )}
                  />
                </Grid>


                {/* Password Field */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body1" className="title-field">Password</Typography>
                  <Controller
                    name="Password"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please enter password',
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])[A-Za-z\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}$/,  // ต้องมีตัวเล็ก, ตัวใหญ่, ตัวเลข, และอักขระพิเศษ, อย่างน้อย 8 ตัว
                        message: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 special character with minimum 8 characters'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Please enter password"
                        type={showPassword ? 'text' : 'password'}  // ทำให้รหัสผ่านแสดง/ซ่อน
                        fullWidth
                        error={!!errors.Password}
                        helperText={String(errors.Password?.message || "")}
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          },
                          input: {endAdornment: (
                            <IconButton
                              onClick={handleClickShowPassword}  // ฟังก์ชันเปิด/ปิดการแสดงรหัสผ่าน
                              edge="end"
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          )

                          }
                        }}
                        
                      />
                    )}
                  />
                </Grid>

              </Grid>
            </Grid>

            {/* Role Dropdown */}
            {userType === 'internal' && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body1" className="title-field">Position</Typography>
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel sx={{ color: '#6D6E70' }}>Please select position</InputLabel>
                  <Controller
                    name="RoleID"
                    control={control}
                    defaultValue="" // <-- Use empty string as default
                    rules={{ required: 'Please select position' }}
                    render={({ field }) => (
                      <Select {...field} label="Please select position">
                        {roles.map((role) => (
                          <MenuItem key={role.ID} value={role.ID}>{role.Name}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{String(errors.Role?.message || "")}</FormHelperText>
                </FormControl>
              </Grid>
            )}

            {/* Conditional Rendering for Manager (RoleID === 3) */}
            {userType === 'internal' && (roleID === 3 || roleID === 4) && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body1" className="title-field">Management</Typography>
                <FormControl fullWidth error={!!errors.RequestTypeID}>
                  <InputLabel sx={{ color: '#6D6E70' }}>Please select management</InputLabel>
                  <Controller
                    name="RequestTypeID"
                    control={control}
                    defaultValue={0}
                    rules={{ required: 'Please select management' }}
                    render={({ field }) => (
                      <Select {...field} label="Please select management">
                        {requiredTypes.map((requiredType) => (
                          <MenuItem key={requiredType.ID} value={requiredType.ID}>{requiredType.TypeName}</MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                  <FormHelperText>{String(errors.RequestTypeID?.message || "")}</FormHelperText>
                </FormControl>
              </Grid>
            )}


            {/* EmployeeID Field */}
            {userType === 'internal' && <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body1" className="title-field">Employee ID</Typography>
              <Controller
                name="EmployeeID"
                control={control}
                defaultValue=""
                rules={{
                  required: 'Please enter employee ID',
                  pattern: {
                    value: /^[0-9]{6}$/, // Regular expression สำหรับตรวจสอบรหัสพนักงาน
                    message: 'Please enter a valid employee ID with 6 digits'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Please enter employee ID"
                    fullWidth
                    error={!!errors.EmployeeID}  // เปลี่ยนจาก errors.Email เป็น errors.EmployeeID
                    helperText={String(errors.EmployeeID?.message || "" )}
                    slotProps={{
                      inputLabel: {
                        sx: { color: '#6D6E70' }
                      }
                    }}
                  />
                )}
              />
            </Grid>
            }


            {/* Package Dropdown */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body1" className="title-field">Privileges</Typography>
              <FormControl fullWidth error={!!errors.package}>
                <InputLabel sx={{ color: '#6D6E70' }}>Please select privileges (optional)</InputLabel>
                <Controller
                  name="UserPackageID"
                  control={control}
                  defaultValue=""

                  render={({ field }) => (
                    <Select {...field} label="Please select privileges (optional)">
                      {packages.map((pkg) => (
                        <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                      ))}
                    </Select>
                  )}
                />
                <FormHelperText>{String(errors.Package?.message || "")}</FormHelperText>
              </FormControl>
            </Grid>

            {/* Conditional Rendering based on User Type */}
            {userType === 'external' && (
              <>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" className="title-field">Company Name</Typography>
                  <Controller
                    name="CompanyName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Please enter company name' }}
                    render={({ field }) => (
                      <TextField {...field} label="Please enter company name" fullWidth error={!!errors.CompanyName} helperText={String(errors.CompanyName?.message || "")}
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />

                    )}
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" className="title-field">Business Description</Typography>
                  <Controller
                    name="BusinessDetail"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'Please enter business description' }}
                    render={({ field }) => (
                      <TextArea {...field} label="Please enter business description" fullWidth multiline rows={3} error={!!errors.BusinessDetail} helperText={String(errors.BusinessDetail?.message || "") }
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                      />

                    )}

                  />
                </Grid>
              </>
            )}

            {/* Submit Button */}
            <Grid size={{ xs: 12 }} className="submit-button-container">
              {/* ปุ่ม Reset */}
              <Button
                type="reset"
                variant="outlined"
                color="secondary"
                sx={{ marginRight: 2 }}
                onClick={() => { reset(); setProfileImage(""); }} // เรียกใช้ reset() เพื่อรีเซ็ตฟอร์ม
              >
                Reset
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Add User
              </Button>


            </Grid>

          </Grid>
        </form>
      </div>
    </>
  );
};

export default AddUserForm;