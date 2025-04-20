import React, { useState, useEffect } from 'react';
import { Button, MenuItem, InputLabel, FormControl, FormHelperText, Avatar, Typography, IconButton, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid2'; // Grid version 2
import './AddUserForm.css';  // Import the updated CSS
import { ListRoles, ListGenders, ListPackages, CreateUser } from '../../services/http';  // Assuming these are your API functions
import { GendersInterface } from '../../interfaces/IGenders';
import { RolesInterface } from '../../interfaces/IRoles';
import { PackagesInterface } from '../../interfaces/IPackages';
import { UserInterface } from '../../interfaces/IUser';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";

type AddUserFormProps = {};

const AddUserForm: React.FC<AddUserFormProps> = () => {
  const { control, handleSubmit, reset, formState: { errors } } = useForm();
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [roles, setRoles] = useState<RolesInterface[]>([]);
  const [packages, setPackages] = useState<PackagesInterface[]>([]);
  const [file, setFile] = useState<File | null>(null);  // เก็บไฟล์เดียว
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  // Fetch data when component mounts
  const [showPassword, setShowPassword] = useState(false); // สถานะของการเปิด/ปิดการแสดงรหัสผ่าน
  const [userType, setUserType] = useState<string>('internal');

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev); // เปลี่ยนสถานะการแสดงรหัสผ่าน
  };



  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      let selectedFiles = Array.from(event.target.files).filter(isValidImage);

      // ตรวจสอบว่าเลือกไฟล์ได้แค่ 1 ไฟล์
      if (selectedFiles.length > 1) {
        selectedFiles = selectedFiles.slice(0, 1);
        alert("สามารถเลือกได้แค่ 1 ไฟล์เท่านั้น");
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
      setGenders(genderData);
      setRoles(roleData);
      setPackages(packageData);
    };
    fetchData();
  }, []);

  const onSubmit = async (data: UserInterface) => {

    const formData = {
      ...data,
      Profile_Image: file,  // Adding the profile image data to the form data
      ...(userType === "external" && { RoleID: 2 }) // Conditionally add RoleID if userType is "external"
    };


    // Call CreateUser function to send data

    try {
      const response = await CreateUser(formData);
      console.log('User created successfully', response);

      if (response.status === "success") {
        setAlerts((prevAlerts) => [
          ...prevAlerts,
          { type: 'success', message: response.message },
        ]);
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
        เพิ่มผู้ใช้งาน
      </Typography>

      <div className="add-user">

        <form onSubmit={handleSubmit(onSubmit)} className="add-user-form">

          <Grid container spacing={2}>

            {/* User Type Selection (บุคคลภายใน/บุคคลภายนอก) */}
            <Grid size={{ xs: 6, md: 6 }}>
              <Typography variant="body1" className="title-field">ประเภทผู้ใช้</Typography>
              <FormControl>
                <RadioGroup
                  row
                  name="userType"
                  value={userType}
                  onChange={(e) => setUserType(e.target.value)} // Set the value of the selected radio button
                >
                  <FormControlLabel
                    value="internal"
                    control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: 'e65c00' } }} />}
                    label="บุคคลภายใน"
                  />
                  <FormControlLabel
                    value="external"
                    control={<Radio sx={{ color: 'black', '&.Mui-checked': { color: 'e65c00' } }} />}
                    label="บุคคลภายนอก"
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
                เพิ่มรูปภาพ
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
            </Grid>



            {/* Conditional Rendering based on User Type */}
            {userType === 'external' && (
              <>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="body1" className="title-field">ชื่อบริษัท</Typography>
                  <Controller
                    name="CompanyName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณากรอกชื่อบริษัท' }}
                    render={({ field }) => (
                      <TextField {...field} label="ชื่อบริษัท" fullWidth error={!!errors.CompanyName} helperText={String(errors.CompanyName?.message) || ""}
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
                  <Typography variant="body1" className="title-field">คำอธิบายธุรกิจ</Typography>
                  <Controller
                    name="BusinessDetail"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณากรอกคำอธิบายธุรกิจ' }}
                    render={({ field }) => (
                      <TextField {...field} label="คำอธิบายธุรกิจ" fullWidth error={!!errors.BusinessDetail} helperText={String(errors.BusinessDetail?.message) || ""}
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




            {/* Name Fields */}
            <Grid size={{ xs: 12, sm: 12 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }} >
                  <Typography variant="body1" className="title-field">ชื่อ</Typography>
                  <Controller
                    name="FirstName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณากรอกชื่อ' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="ชื่อจริง (ไม่มีคำนำหน้า)"
                        fullWidth
                        error={!!errors.FirstName}
                        helperText={String(errors.FirstName?.message) || ""}
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
                  <Typography variant="body1" className="title-field">นามสกุล</Typography>
                  <Controller
                    name="LastName"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณากรอกนามสกุล' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="นามสกุล"
                        fullWidth
                        error={!!errors.LastName}
                        helperText={String(errors.LastName?.message) || ""}
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
  <Typography variant="body1" className="title-field">เพศ</Typography>
  <FormControl fullWidth error={!!errors.GenderID}>
    <Controller
      name="GenderID"
      control={control}
      defaultValue=""
      rules={{ required: 'กรุณาเลือกเพศ' }}
      render={({ field }) => (
        <Select
          {...field}
          displayEmpty
        >
          <MenuItem value="">
            <em>-- กรุณาเลือกเพศ --</em>
          </MenuItem>

          {genders.length === 0 ? (
            <MenuItem value="-1" disabled>
              <em>ไม่พบข้อมูลเพศ</em>
            </MenuItem>
          ) : (
            genders.map((gender) => (
              <MenuItem key={gender.ID} value={gender.ID}>
                {gender.Name}
              </MenuItem>
            ))
          )}
        </Select>
      )}
    />
    <FormHelperText>{String(errors.GenderID?.message)}</FormHelperText>
  </FormControl>
</Grid>


                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body1" className="title-field">หมายเลข โทรศัพท์</Typography>
                  <Controller
                    name="Phone"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณากรอกหมายเลขโทรศัพท์' }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="หมายเลข โทรศัพท์"
                        fullWidth
                        error={!!errors.Phone}
                        helperText={String(errors.Phone?.message) || ""}
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
                  <Typography variant="body1" className="title-field">อีเมล</Typography>
                  <Controller
                    name="Email"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'กรุณากรอกอีเมล',
                      pattern: {
                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Regular expression สำหรับตรวจสอบอีเมล
                        message: 'กรุณากรอกอีเมลที่ถูกต้อง'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="กรุณากรอก อีเมล"
                        fullWidth
                        error={!!errors.Email}
                        helperText={String(errors.Email?.message) || ""}
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
                  <Typography variant="body1" className="title-field">รหัสผ่าน</Typography>
                  <Controller
                    name="Password"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'กรุณากรอกรหัสผ่าน',
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/,  // ต้องมีตัวเล็ก, ตัวใหญ่, และตัวเลข, อย่างน้อย 8 ตัว
                        message: 'รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก, พิมพ์ใหญ่ และตัวเลขอย่างน้อย 8 ตัว'
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="กรุณากรอกรหัสผ่าน"
                        type={showPassword ? 'text' : 'password'}  // ทำให้รหัสผ่านแสดง/ซ่อน
                        fullWidth
                        error={!!errors.Password}
                        helperText={String(errors.Password?.message) || ""}
                        slotProps={{
                          inputLabel: {
                            sx: { color: '#6D6E70' }
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton
                              onClick={handleClickShowPassword}  // ฟังก์ชันเปิด/ปิดการแสดงรหัสผ่าน
                              edge="end"
                            >
                              {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                          )
                        }}
                      />
                    )}
                  />
                </Grid>

              </Grid>
            </Grid>

            {/* Role Dropdown (previously Radio Buttons) */}
            {userType === 'internal' && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body1" className="title-field">ตำแหน่ง</Typography>
                <FormControl fullWidth error={!!errors.RoleID}>
                  <Controller
                    name="RoleID"
                    control={control}
                    defaultValue={1} // ถ้าอยากให้บังคับเลือกเอง ให้เปลี่ยนเป็น ""
                    rules={{ required: 'กรุณาเลือกตำแหน่ง' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        displayEmpty

                      >
                        <MenuItem value="">
                          <em>-- กรุณาเลือกตำแหน่ง --</em>
                        </MenuItem>

                        {roles.length === 0 ? (
                          <MenuItem value={-1} disabled>
                            <em>ไม่พบข้อมูลตำแหน่ง</em>
                          </MenuItem>
                        ) : (
                          roles.map((role) => (
                            <MenuItem key={role.ID} value={role.ID}>
                              {role.Name}
                            </MenuItem>
                          ))
                        )}
                      </Select>
                    )}
                  />
                  <FormHelperText>{String(errors.RoleID?.message)}</FormHelperText>
                </FormControl>
              </Grid>
            )}


            {/* EmployeeID Field */}
            {userType === 'internal' && <Grid size={{ xs: 12, sm: 3 }}>
              <Typography variant="body1" className="title-field">รหัสพนักงาน</Typography>
              <Controller
                name="EmployeeID"
                control={control}
                defaultValue=""
                rules={{
                  required: 'กรุณากรอกรหัสพนักงาน',
                  pattern: {
                    value: /^[A-Z]{1}[0-9]{5}$/, // Regular expression สำหรับตรวจสอบรหัสพนักงาน
                    message: 'กรุณากรอกรหัสพนักงานที่ถูกต้อง ขึ้นต้นด้วยพิมพ์ใหญ่ ตามด้วยตัวเลข 5 ตัว'
                  }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="กรุณากรอกรหัสพนักงาน"
                    fullWidth
                    error={!!errors.EmployeeID}  // เปลี่ยนจาก errors.Email เป็น errors.EmployeeID
                    helperText={String(errors.EmployeeID?.message) || ""}
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
              <Typography variant="body1" className="title-field">สิทธิพิเศษ</Typography>
              <FormControl fullWidth error={!!errors.UserPackageID}>

                <Controller
                  name="UserPackageID"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <Select
                      {...field}
                      displayEmpty

                    >
                      <MenuItem value="">
                        <em>-- กรุณาเลือกสิทธิพิเศษ(หากไม่มีไม่จำเป็นต้องเลือก) --</em>
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
                  )}
                />
                <FormHelperText>{String(errors.UserPackageID?.message)}</FormHelperText>
              </FormControl>
            </Grid>


            {/* Submit Button */}
            <Grid size={{ xs: 12 }} spacing={2} className="submit-button-container" sx={{ justifyContent: "flex-end", mt: 1 }}>
              {/* ปุ่ม Reset */}
              <Button
                type="reset"
                sx={{ marginRight: 2 }}
                onClick={() => { reset(); setProfileImage(""); }} // เรียกใช้ reset() เพื่อรีเซ็ตฟอร์ม
              >
                รีเซ็ต
              </Button>
              <Button type="submit" variant="contained" color="primary">
                เพิ่มผู้ใช้งาน
              </Button>


            </Grid>

          </Grid>
        </form>
      </div>
    </>
  );
};

export default AddUserForm;
