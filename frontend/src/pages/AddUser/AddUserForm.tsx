import React, { useState } from 'react';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl, FormHelperText, Avatar, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import Grid from '@mui/material/Grid2'; // Grid version 2
import './AddUserForm.css';  // Import the updated CSS
import { FormControlLabel, Radio, RadioGroup } from '@mui/material';

type AddUserFormProps = {};

const AddUserForm: React.FC<AddUserFormProps> = () => {
  const { control, handleSubmit, formState: { errors } } = useForm();
  const [profileImage, setProfileImage] = useState<string | ArrayBuffer | null>(null);

  const onSubmit = (data: any) => {
    console.log(data);
  };

  const handleProfileImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="add-user">
      <form onSubmit={handleSubmit(onSubmit)} className="add-user-form">
        <Typography variant="h5" gutterBottom>
          เพิ่มผู้ใช้งาน
        </Typography>

        <Grid container spacing={2}>
          {/* Profile Image and Button */}

          <Grid size={{ xs: 12, sm: 6 }} container justifyContent="center" alignItems="center" textAlign="center">
  <FormControl fullWidth error={!!errors.role}>
    <div>เลือกบทบาท</div>
    <Controller
      name="role"
      control={control}
      defaultValue=""
      rules={{ required: 'กรุณาเลือกบทบาท' }}
      render={({ field }) => (
        <RadioGroup 
          {...field} 
          aria-labelledby="role-label" 
          sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center' }} // Ensure radio buttons are horizontally centered
        >
          <FormControlLabel 
            value="employee" 
            control={<Radio sx={{ color: 'var(--sut-orange)' }} />} 
            label="พนักงาน" 
            sx={{ color: 'var(--sut-gray)', marginRight: '20px' }} // Space between options
          />
          <FormControlLabel 
            value="outsider" 
            control={<Radio sx={{ color: 'var(--sut-orange)' }} />} 
            label="ผู้ประกอบการ" 
            sx={{ color: 'var(--sut-gray)' }}
          />
        </RadioGroup>
      )}
    />
  </FormControl>
</Grid>


          <Grid size={{ xs: 12, sm: 6 }} container direction="column" justifyContent="center" alignItems="center">
  <Avatar sx={{ width: 150, height: 150 }} src={profileImage as string} />
  <Button variant="outlined" component="label" className="upload-button" sx={{ marginTop: 2 }}>
    เพิ่มรูปภาพ
    <input type="file" hidden onChange={handleProfileImageChange} />
  </Button>
</Grid>

          

          {/* Name Fields */}
          <Grid size={{ xs: 12, sm: 12 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="firstName"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณากรอกชื่อ' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="ชื่อ (ไม่คำนำหน้า)"
                      fullWidth
                      error={!!errors.firstName}
                      helperText={String(errors.firstName?.message) || ""}
                      slotProps={{
                        inputLabel: {
                          sx: { color: 'var(--sut-gray)' } // Apply gray color to label
                        }
                      }}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="lastName"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณากรอกนามสกุล' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="นามสกุล"
                      fullWidth
                      error={!!errors.lastName}
                      helperText={String(errors.lastName?.message) || ""}
                      slotProps={{
                        inputLabel: {
                          sx: { color: 'var(--sut-gray)' } // Apply gray color to label
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Gender, Phone, Email */}
          <Grid size={{ xs: 12, sm: 12 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 3 }}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel sx={{ color: 'var(--sut-gray)' }}>เพศ</InputLabel>
                  <Controller
                    name="gender"
                    control={control}
                    defaultValue=""
                    rules={{ required: 'กรุณาเลือกเพศ' }}
                    render={({ field }) => (
                      <Select {...field} label="เพศ">
                        <MenuItem value="male">ชาย</MenuItem>
                        <MenuItem value="female">หญิง</MenuItem>
                      </Select>
                    )}
                  />
                  <FormHelperText>{String(errors.gender?.message)}</FormHelperText>
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 3 }}>
                <Controller
                  name="phone"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณากรอกหมายเลขโทรศัพท์' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="หมายเลข โทรศัพท์"
                      fullWidth
                      error={!!errors.phone}
                      helperText={String(errors.phone?.message) || ""}
                      slotProps={{
                        inputLabel: {
                          sx: { color: 'var(--sut-gray)' } // Apply gray color to label
                        }
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Email Field */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Controller
                  name="email"
                  control={control}
                  defaultValue=""
                  rules={{ required: 'กรุณากรอกอีเมล' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="อีเมล"
                      fullWidth
                      error={!!errors.email}
                      helperText={String(errors.email?.message) || ""}
                      slotProps={{
                        inputLabel: {
                          sx: { color: 'var(--sut-gray)' } // Apply gray color to label
                        }
                      }}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Role Selection - Horizontal Radio Button */}
          

          {/* Role and Special Permissions */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--sut-gray)' }}>ตำแหน่ง</InputLabel>
                  <Controller
                    name="role"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select {...field} label="ตำแหน่ง">
                        <MenuItem value="admin">Admin</MenuItem>
                        <MenuItem value="user">User</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <InputLabel sx={{ color: 'var(--sut-gray)' }}>สิทธิพิเศษ</InputLabel>
                  <Controller
                    name="specialPermission"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <Select {...field} label="สิทธิพิเศษ">
                        <MenuItem value="gold">Gold</MenuItem>
                        <MenuItem value="silver">Silver</MenuItem>
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Grid size={{ xs: 12 }}>
            <Button type="submit" variant="contained" color="primary" fullWidth>
              เพิ่มผู้ใช้งาน
            </Button>
          </Grid>
        </Grid>
      </form>
    </div>
  );
};

export default AddUserForm;
