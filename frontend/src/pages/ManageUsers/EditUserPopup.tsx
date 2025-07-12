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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
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
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const roleID = watch("RoleID");

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let userData = null;
        if (userId > 0) {
          userData = await GetUserById(userId);
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

        // Set selected values after data is loaded
        if (userData) {
          setSelectedGender(userData.GenderID ?? null);
          setSelectedRole(userData.RoleID ?? null);
          setSelectedPackage(userData.UserPackageID ?? null);
          setSelectedRequestType(userData.RequestTypeID ?? null);
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <ManageAccountsOutlinedIcon style={{ fontSize: '32px', color: '#ff6f00' }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
              แก้ไขข้อมูลผู้ใช้งาน
            </Typography>
          </div>
          <Button
            variant="text"
            size="small"
            startIcon={<FontAwesomeIcon icon={faBook} />}
            onClick={() => {
              const manualContent = `===========================================
EDIT USER MANUAL
===========================================

This manual explains how to edit user information using the Edit User popup.

===========================================
ACCESSING THE EDIT USER POPUP
===========================================

1. Navigate to the Manage Users page
2. Find the user you want to edit in the table
3. Click the "Edit" button in the "Manage" column
4. The Edit User popup will open with current user data

===========================================
POPUP OVERVIEW
===========================================

The Edit User popup contains:

1. HEADER SECTION
   - Title: "แก้ไขข้อมูลผู้ใช้งาน" (Edit User Information)
   - Icon: Manage accounts icon
   - Close button (X)

2. FORM SECTION
   - User information fields
   - Validation messages
   - Dynamic fields based on user type

3. ACTION BUTTONS
   - "บันทึก" (Save) button with save icon
   - "ยกเลิก" (Cancel) button

4. ALERTS SECTION
   - Success, error, warning, and info messages
   - Auto-dismissing success alerts

===========================================
FORM FIELDS BY USER TYPE
===========================================

COMMON FIELDS (All User Types):

1. First Name (ชื่อ)
   - Description: User's first name
   - Required: Yes
   - Validation: Cannot be empty
   - Error message: "กรุณากรอกชื่อ (ไม่มีคำนำหน้า)"

2. Last Name (นามสกุล)
   - Description: User's last name
   - Required: Yes
   - Validation: Cannot be empty
   - Error message: "กรุณากรอกนามสกุล"

3. Email (อีเมล)
   - Description: User's email address
   - Required: Yes
   - Validation: Must be valid email format
   - Error message: "กรุณากรอกอีเมลที่ถูกต้อง"
   - Pattern: user@domain.com

4. Phone Number (หมายเลขโทรศัพท์)
   - Description: User's phone number
   - Required: Yes
   - Validation: Must start with 0 and have 10 digits
   - Error message: "หมายเลขโทรศัพท์ต้องเริ่มต้นด้วย 0 และมีทั้งหมด 10 หลัก"
   - Pattern: 0XXXXXXXXX

5. Gender (เพศ)
   - Description: User's gender
   - Required: Yes
   - Options: Male, Female
   - Default: "-- กรุณาเลือกเพศ --"
   - Validation: Must select one option

6. Privileges (สิทธิพิเศษ)
   - Description: User's subscription package
   - Required: No
   - Options: None, Silver, Gold, Platinum, Diamond
   - Default: "-- ไม่มี สิทธิพิเศษ --"

INTERNAL USER FIELDS (Employees):

7. Employee ID (รหัสพนักงาน)
   - Description: Employee identification number
   - Required: Yes (for internal users)
   - Validation: Must be exactly 6 digits
   - Error message: "กรุณากรอกรหัสพนักงานที่ถูกต้อง มีตัวเลข 6 ตัว"
   - Pattern: 123456

8. Position (ตำแหน่ง)
   - Description: User's role in the system
   - Required: Yes (for internal users)
   - Options: User, Operator, Manager, Admin
   - Default: "-- กรุณาเลือก ตำแหน่ง --"
   - Validation: Must select one option

9. Management (จัดการ)
   - Description: Type of management access
   - Required: Yes (only for Manager role)
   - Options: Internal, External, Both
   - Default: "-- กรุณาเลือก จัดการ --"
   - Note: Only appears when Position is Manager

EXTERNAL USER FIELDS (Non-Employees):

10. Company Name (ชื่อบริษัท)
    - Description: Company name
    - Required: Yes (for external users)
    - Validation: Cannot be empty
    - Error message: "กรุณากรอกชื่อบริษัท"

11. Business Description (คำอธิบายธุรกิจ)
    - Description: Business description
    - Required: Yes (for external users)
    - Validation: Cannot be empty
    - Error message: "กรุณากรอกคำอธิบายธุรกิจ"

===========================================
DYNAMIC FIELD BEHAVIOR
===========================================

FIELD VISIBILITY RULES:

1. Employee ID Field:
   - Shows: Only for internal users (isemployee = true)
   - Hides: For external users (isemployee = false)

2. Position Field:
   - Shows: Only for internal users
   - Hides: For external users

3. Management Field:
   - Shows: Only when Position is Manager (RoleID = 3)
   - Hides: For all other positions

4. Company Name Field:
   - Shows: Only for external users (isemployee = false)
   - Hides: For internal users

5. Business Description Field:
   - Shows: Only for external users
   - Hides: For internal users

===========================================
VALIDATION RULES
===========================================

REQUIRED FIELD VALIDATION:
1. First Name: Cannot be empty
2. Last Name: Cannot be empty
3. Email: Must be valid format
4. Phone: Must be 10 digits starting with 0
5. Gender: Must be selected
6. Employee ID: Must be 6 digits (internal users only)
7. Position: Must be selected (internal users only)
8. Management: Must be selected (managers only)
9. Company Name: Cannot be empty (external users only)
10. Business Description: Cannot be empty (external users only)

FORMAT VALIDATION:
1. Email: user@domain.com pattern
2. Phone: 0XXXXXXXXX pattern (10 digits)
3. Employee ID: 6-digit number pattern

CONDITIONAL VALIDATION:
1. Management field required only for Manager role
2. Company/Business fields required only for external users
3. Employee ID required only for internal users

===========================================
STEP-BY-STEP EDITING PROCESS
===========================================

STEP 1: Open Edit Popup
1. Find user in Manage Users table
2. Click "Edit" button
3. Wait for popup to load with user data

STEP 2: Review Current Data
1. Check all fields are populated correctly
2. Note which fields are required (marked with *)
3. Verify user type (internal/external)

STEP 3: Make Changes
1. Edit desired fields
2. Pay attention to validation messages
3. Ensure required fields are completed
4. Check format requirements (email, phone, etc.)

STEP 4: Save Changes
1. Click "บันทึก" (Save) button
2. Wait for validation to complete
3. Check for success/error alerts
4. Popup will close automatically on success

STEP 5: Cancel (if needed)
1. Click "ยกเลิก" (Cancel) button
2. All changes will be discarded
3. Popup will close without saving

===========================================
ALERTS AND MESSAGES
===========================================

SUCCESS ALERTS:
- Message: "User information updated successfully"
- Color: Green background
- Behavior: Auto-closes after 2 seconds
- Action: Popup closes automatically

ERROR ALERTS:
- Color: Red background
- Examples:
  * "Failed to load user data. Please try again."
  * "Failed to update user information."
  * "An unexpected error occurred. Please try again later."
- Behavior: Manual close required

WARNING ALERTS:
- Color: Yellow background
- Examples:
  * "Please select a role."
  * "Please select a gender."
  * "Please select a request type."
- Behavior: Manual close required

INFO ALERTS:
- Color: Blue background
- Behavior: Manual close required

===========================================
COMMON EDITING SCENARIOS
===========================================

CHANGING USER ROLE:
1. For internal users, select new Position
2. If changing to Manager, select Management type
3. Save changes

UPDATING CONTACT INFORMATION:
1. Edit Email field (ensure valid format)
2. Edit Phone field (ensure 10 digits starting with 0)
3. Save changes

CHANGING PRIVILEGES:
1. Select new Privileges from dropdown
2. Can be set to "No privileges"
3. Save changes

UPDATING COMPANY INFORMATION (External Users):
1. Edit Company Name
2. Edit Business Description
3. Save changes

===========================================
TROUBLESHOOTING
===========================================

POPUP NOT LOADING:
1. Check if user data exists
2. Try refreshing the page
3. Check browser console for errors
4. Contact administrator if issue persists

VALIDATION ERRORS:
1. Check all required fields are filled
2. Verify email format is correct
3. Ensure phone number starts with 0 and has 10 digits
4. Confirm Employee ID is exactly 6 digits (internal users)
5. Select required dropdown options

SAVE NOT WORKING:
1. Check for validation errors
2. Ensure all required fields are completed
3. Verify data formats match requirements
4. Check for duplicate email addresses
5. Ensure proper role-specific fields are filled

FIELDS NOT SHOWING:
1. Check user type (internal/external)
2. Verify role selection for conditional fields
3. Refresh popup if fields don't appear
4. Check if user data loaded correctly

===========================================
BEST PRACTICES
===========================================

1. ALWAYS VERIFY DATA:
   - Check email format before saving
   - Verify phone number format
   - Ensure Employee ID is correct (internal users)

2. ROLE-SPECIFIC CHECKS:
   - Managers must have Management type selected
   - External users must have Company and Business info
   - Internal users must have Employee ID

3. VALIDATION AWARENESS:
   - Pay attention to error messages
   - Fix validation errors before saving
   - Don't ignore warning alerts

4. DATA INTEGRITY:
   - Don't change critical fields unnecessarily
   - Verify changes before saving
   - Use Cancel if unsure about changes

===========================================
SUPPORT
===========================================

If you encounter issues:
1. Check the alerts for specific error messages
2. Verify all required fields are completed
3. Ensure data formats match requirements
4. Try refreshing the popup if it becomes unresponsive
5. Contact system administrator for technical support

===========================================`;
              const blob = new Blob([manualContent], { type: 'text/plain' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'EditUser_Manual.txt';
              document.body.appendChild(a);
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
            }}
          >
            Download Manual
          </Button>
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
                  {!isLoading && (
                    <Select
                      labelId="gender-label"
                      name="GenderID"
                      value={selectedGender ?? 0}
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
                  )}
                  {errors.GenderID && <FormHelperText>{String(errors.GenderID.message)}</FormHelperText>}
                </FormControl>
              </Grid>

              {isemployee === true && (
                <>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth error={!!errors.RoleID}>
                      <Typography variant="body1" className="title-field">ตำแหน่ง</Typography>
                      {!isLoading && (
                        <Select
                          labelId="role-label"
                          name="RoleID"
                          value={selectedRole ?? 0}
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
                      )}
                      {errors.RoleID && <FormHelperText>{String(errors.RoleID.message)}</FormHelperText>}
                    </FormControl>
                  </Grid>

                  {(roleID || selectedRole) === 3 && (
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth error={!!errors.RequestTypeID}>
          <Typography variant="body1" className="title-field">จัดการ</Typography>
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
                <em>-- กรุณาเลือก จัดการ --</em>
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
                  <Typography variant="body1" className="title-field">สิทธิพิเศษ</Typography>
                  {!isLoading && (
                    <Select
                      labelId="package-label"
                      name="UserPackageID"
                      value={selectedPackage ?? 0} // Default to 0 if no package is selected
                      onChange={(e) => setSelectedPackage(Number(e.target.value))}
                      displayEmpty
                    >
                      <MenuItem value={0}><em>-- ไม่มี สิทธิพิเศษ --</em></MenuItem>
                      {packages.map((pkg) => (
                        <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                      ))}
                    </Select>
                  )}
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
