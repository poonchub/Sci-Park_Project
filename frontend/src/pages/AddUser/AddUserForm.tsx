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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight, faBook } from "@fortawesome/free-solid-svg-icons";


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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
        <Typography
          variant="h6"
          className="title"
        >
          Add User
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FontAwesomeIcon icon={faBook} />}
          onClick={() => {
            const manualContent = `===========================================
ADD USER MANUAL
===========================================

This manual explains how to add users manually using the Add User form.

===========================================
ACCESSING THE ADD USER PAGE
===========================================

1. Navigate to the Add User page from the main menu
2. The page will load with the form ready for data entry
3. All required fields will show validation errors immediately

===========================================
USER TYPE SELECTION
===========================================

The form supports two types of users:

INTERNAL USER (Employee):
- Has an Employee ID
- Can have any role: User, Operator, Manager, Admin
- Can have privileges/packages
- Company name and business detail are optional

EXTERNAL USER (Non-Employee):
- No Employee ID
- Can only have role: User
- Can have privileges/packages
- Company name and business detail are REQUIRED

===========================================
FORM FIELDS AND REQUIREMENTS
===========================================

REQUIRED FIELDS (All User Types):

1. User Type
   - Description: Select whether user is Internal or External
   - Options: Internal User, External User
   - Validation: Must select one option

2. First Name
   - Description: User's first name (without title)
   - Format: Text only
   - Example: John, Mary, สมชาย
   - Validation: Cannot be empty

3. Last Name
   - Description: User's last name
   - Format: Text only
   - Example: Smith, Johnson, ใจดี
   - Validation: Cannot be empty

4. Gender
   - Description: User's gender
   - Options: Male, Female
   - Validation: Must select one option

5. Phone Number
   - Description: User's phone number
   - Format: Thai mobile number starting with 0
   - Example: 0812345678, 0898765432
   - Validation: Must start with 0 and have exactly 10 digits

6. Email
   - Description: User's email address
   - Format: Valid email format
   - Example: john.smith@company.com, user@domain.co.th
   - Validation: Must be valid email format

7. Password
   - Description: User's login password
   - Format: Complex password requirements
   - Requirements: 
     * At least 8 characters
     * At least 1 lowercase letter
     * At least 1 uppercase letter
     * At least 1 number
     * At least 1 special character
   - Example: MyPass123!
   - Validation: Must meet all complexity requirements

INTERNAL USER ADDITIONAL FIELDS:

8. Employee ID
   - Description: Employee identification number
   - Format: 6-digit number
   - Example: 123456, 789012
   - Validation: Must be exactly 6 digits
   - Note: Only required for Internal Users

9. Position (Role)
   - Description: User's role in the system
   - Options: User, Operator, Manager, Admin
   - Validation: Must select one option
   - Note: Only required for Internal Users

10. Management (Request Type)
    - Description: Type of management access (Manager only)
    - Options: Internal, External, Both
    - Validation: Required only when Position is Manager
    - Note: Only appears when Manager role is selected

EXTERNAL USER ADDITIONAL FIELDS:

11. Company Name
    - Description: Company name (for external users)
    - Format: Text
    - Example: ABC Corporation, XYZ Company
    - Validation: Required for External Users

12. Business Description
    - Description: Business description (for external users)
    - Format: Text
    - Example: Software Development, Consulting Services
    - Validation: Required for External Users

OPTIONAL FIELDS (All User Types):

13. Profile Photo
    - Description: User's profile picture
    - Format: Image file (JPG, PNG, etc.)
    - Validation: Optional, must be valid image file
    - Note: Only one file can be selected

14. Privileges (Package)
    - Description: User's subscription package
    - Options: None, Silver, Gold, Platinum, Diamond
    - Validation: Optional
    - Note: Can be left as "No privileges"

===========================================
FORM VALIDATION RULES
===========================================

1. Email Format: Must be valid email (user@domain.com)
2. Phone Format: Must start with 0 and have 10 digits
3. Employee ID: Must be exactly 6 digits (Internal Users only)
4. Password: Must meet complexity requirements
5. Company Name: Required for External Users
6. Business Description: Required for External Users
7. Position: Required for Internal Users
8. Management: Required when Position is Manager

===========================================
STEP-BY-STEP INSTRUCTIONS
===========================================

STEP 1: Select User Type
1. Choose "Internal User" or "External User"
2. Form will automatically show/hide relevant fields

STEP 2: Add Profile Photo (Optional)
1. Click "Add Photo" button
2. Select an image file
3. Photo will appear in the avatar preview

STEP 3: Fill Personal Information
1. Enter First Name (required)
2. Enter Last Name (required)
3. Select Gender from dropdown (required)
4. Enter Phone Number (required, 10 digits starting with 0)
5. Enter Email (required, valid format)
6. Enter Password (required, complex)

STEP 4: Fill Role-Specific Information

For Internal Users:
1. Enter Employee ID (6 digits)
2. Select Position from dropdown
3. If Manager role selected, select Management type
4. Select Privileges (optional)

For External Users:
1. Enter Company Name
2. Enter Business Description
3. Select Privileges (optional)

STEP 5: Submit Form
1. Review all entered information
2. Click "Add User" to create the user
3. Or click "Reset" to clear all fields

===========================================
COMMON ERRORS TO AVOID
===========================================

❌ WRONG:
- Phone: 812345678 (missing leading 0)
- Phone: 081234567 (only 9 digits)
- Email: john.smith (missing @domain.com)
- Employee ID: 12345 (only 5 digits)
- Password: password (too simple)
- External user without company name
- Manager without management type

✅ CORRECT:
- Phone: 0812345678
- Email: john.smith@company.com
- Employee ID: 123456
- Password: MyPass123!
- Company name for external users
- Management type for managers

===========================================
FORM FEATURES
===========================================

1. Real-time Validation
   - Errors appear immediately when page loads
   - Validation updates as you type
   - Clear error messages for each field

2. Dynamic Form Fields
   - Fields show/hide based on user type
   - Management field appears only for Manager role
   - Employee ID required only for Internal Users

3. Password Visibility Toggle
   - Click eye icon to show/hide password
   - Helps verify password entry

4. Profile Photo Upload
   - Supports common image formats
   - Preview shows selected image
   - Only one file allowed

5. Reset Functionality
   - Reset button clears all fields
   - Removes profile photo
   - Returns to initial state

===========================================
TROUBLESHOOTING
===========================================

If form submission fails:

1. Check that all required fields are filled
2. Verify email format is correct
3. Ensure phone number starts with 0 and has 10 digits
4. Confirm Employee ID is exactly 6 digits (Internal Users)
5. Check that password meets complexity requirements
6. For External Users, ensure Company Name and Business Description are filled
7. For Managers, ensure Management type is selected

===========================================
SUCCESS INDICATORS
===========================================

When user is successfully created:
1. Success alert will appear
2. Form will automatically reset
3. Profile photo will be cleared
4. All fields will return to initial state
5. You can immediately add another user

===========================================
SUPPORT
===========================================

If you encounter issues:
1. Check the validation errors shown on the form
2. Ensure all required fields are completed
3. Verify data formats match requirements
4. Try refreshing the page if form becomes unresponsive
5. Contact system administrator for technical support

===========================================`;
            const blob = new Blob([manualContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'AddUser_Manual.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        >
          Download Manual
        </Button>
      </div>

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
                  <Controller
                    name="GenderID"
                    control={control}
                    defaultValue={0}
                    rules={{ 
                      required: 'Please select gender',
                      validate: (value) => {
                        if (!value || value === 0) return 'Please select gender';
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.GenderID}>
                        <Select
                          {...field}
                          value={field.value || 0}
                          displayEmpty
                        >
                          <MenuItem value={0}>
                            <em>-- Please select gender --</em>
                          </MenuItem>
                          {genders.map((gender) => (
                            <MenuItem key={gender.ID} value={gender.ID}>{gender.Name}</MenuItem>
                          ))}
                        </Select>
                        {errors.GenderID && <FormHelperText>{String(errors.GenderID.message)}</FormHelperText>}
                      </FormControl>
                    )}
                  />
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
                <Controller
                  name="RoleID"
                  control={control}
                  defaultValue={0}
                  rules={{ 
                    required: 'Please select position',
                    validate: (value) => {
                      if (!value || value === 0) return 'Please select position';
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.RoleID}>
                      <Select
                        {...field}
                        value={field.value || 0}
                        displayEmpty
                      >
                        <MenuItem value={0}>
                          <em>-- Please select position --</em>
                        </MenuItem>
                        {roles.map((role) => (
                          <MenuItem key={role.ID} value={role.ID}>{role.Name}</MenuItem>
                        ))}
                      </Select>
                      {errors.RoleID && <FormHelperText>{String(errors.RoleID.message)}</FormHelperText>}
                    </FormControl>
                  )}
                />
              </Grid>
            )}

            {/* Conditional Rendering for Manager (RoleID === 3) */}
            {userType === 'internal' && (roleID === 3 || roleID === 4) && (
              <Grid size={{ xs: 12, sm: 3 }}>
                <Typography variant="body1" className="title-field">Management</Typography>
                <Controller
                  name="RequestTypeID"
                  control={control}
                  defaultValue={0}
                  rules={{ 
                    required: 'Please select management',
                    validate: (value) => {
                      if (!value || value === 0) return 'Please select management';
                      return true;
                    }
                  }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.RequestTypeID}>
                      <Select
                        {...field}
                        value={field.value || 0}
                        displayEmpty
                      >
                        <MenuItem value={0}>
                          <em>-- Please select management --</em>
                        </MenuItem>
                        {requiredTypes.map((requiredType) => (
                          <MenuItem key={requiredType.ID} value={requiredType.ID}>{requiredType.TypeName}</MenuItem>
                        ))}
                      </Select>
                      {errors.RequestTypeID && <FormHelperText>{String(errors.RequestTypeID.message)}</FormHelperText>}
                    </FormControl>
                  )}
                />
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
              <Controller
                name="UserPackageID"
                control={control}
                defaultValue={0}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.UserPackageID}>
                    <Select
                      {...field}
                      value={field.value || 0}
                      displayEmpty
                    >
                      <MenuItem value={0}>
                        <em>-- No privileges --</em>
                      </MenuItem>
                      {packages.map((pkg) => (
                        <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                      ))}
                    </Select>
                    {errors.UserPackageID && <FormHelperText>{String(errors.UserPackageID.message)}</FormHelperText>}
                  </FormControl>
                )}
              />
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
              {/* Reset Button */}
              <Button
                type="reset"
                variant="outlined"
                startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                sx={{ marginRight: 2 }}
                onClick={() => { reset(); setProfileImage(""); }} // Reset form and profile image
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