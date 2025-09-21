import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Grid,
  Dialog,
  Container,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useForm, Controller } from 'react-hook-form';
import { Upload, Check, X, FileText, RotateCcw, BookOpen } from "lucide-react";
import { TextField } from "../../components/TextField/TextField";
import { Select } from "../../components/Select/Select";
import {


  UserRoundPlus,

} from "lucide-react";
import { TextArea } from '../../components/TextField/TextArea';
import { RolesInterface } from '../../interfaces/IRoles';
import { GendersInterface } from '../../interfaces/IGenders';
import { PackagesInterface } from '../../interfaces/IPackages';
import { RequestTypeInterface } from '../../interfaces/IRequestTypes';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import InfoAlert from '../../components/Alert/InfoAlert';
import {
  ListRoles,
  ListGenders,
  ListPackages,
  ListRequestTypes,
  ListJobPositions,
  ListTitlePrefixes,
  CreateUser
} from '../../services/http';
import './AddUserForm.css';

interface CsvUserData {
  id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Password: string;
  EmployeeID?: string;
  CompanyName?: string;
  BusinessDetail?: string;
  Gender: string;
  Role: string;
  JobPosition: string;
  TitlePrefix: string;
  UserPackage?: string;
  RequestType?: string;
  IsEmployee: boolean;
  IsBusinessOwner: boolean;
  isValid: boolean;
  errors: string[];
  // Converted IDs for API
  GenderID: number;
  RoleID: number;
  JobPositionID: number;
  PrefixID: number;
  UserPackageID?: number;
  RequestTypeID?: number;
}

interface ConfirmUserFormData {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Password: string;
  EmployeeID?: string;
  CompanyName?: string;
  BusinessDetail?: string;
  GenderID: number | string;
  RoleID: number | string;
  JobPositionID: number | string;
  PrefixID: number | string;
  UserPackageID?: number;
  RequestTypeID?: number;
  IsBusinessOwner: boolean;
}

const AddUserFormByCsv: React.FC = () => {
  const { control, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<ConfirmUserFormData>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [csvData, setCsvData] = useState<CsvUserData[]>(() => {
    // Load data from localStorage on component mount
    const savedData = localStorage.getItem('csvUserData');
    return savedData ? JSON.parse(savedData) : [];
  });
  const [roles, setRoles] = useState<RolesInterface[]>([]);
  const [genders, setGenders] = useState<GendersInterface[]>([]);
  const [packages, setPackages] = useState<PackagesInterface[]>([]);
  const [requiredTypes, setRequiredTypes] = useState<RequestTypeInterface[]>([]);
  const [jobPositions, setJobPositions] = useState<any[]>([]);
  const [titlePrefixes, setTitlePrefixes] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CsvUserData | null>(null);
  const [selectedGender, setSelectedGender] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedJobPosition, setSelectedJobPosition] = useState<number | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<number | null>(null);
  const [isEmployee, setIsEmployee] = useState<boolean>(true);
  const [isBusinessOwner, setIsBusinessOwner] = useState<boolean>(false);

  const roleID = watch("RoleID");

  // Save data to localStorage whenever csvData changes
  React.useEffect(() => {
    if (csvData.length > 0) {
      localStorage.setItem('csvUserData', JSON.stringify(csvData));
    }
  }, [csvData]);

  // Load reference data
  React.useEffect(() => {
    const loadReferenceData = async () => {
      try {
        setIsLoadingData(true);
        const [roleData, genderData, packageData, requiredTypeData, jobPositionsData, titlePrefixesData] = await Promise.all([
          ListRoles(),
          ListGenders(),
          ListPackages(),
          ListRequestTypes(),
          ListJobPositions(),
          ListTitlePrefixes()
        ]);
        setRoles(roleData);
        setGenders(genderData);
        setPackages(packageData);
        setRequiredTypes(requiredTypeData);
        setJobPositions(jobPositionsData?.data || jobPositionsData || []);
        setTitlePrefixes(titlePrefixesData?.data || titlePrefixesData || []);
      } catch (error) {
        console.error('Error loading reference data:', error);
        setAlerts(prev => [...prev, { type: 'error', message: 'Failed to load reference data' }]);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadReferenceData();
  }, []);

  const parseCSV = (csvText: string): CsvUserData[] => {
    const lines = csvText.split('\n');

    // Find the header line (skip comment lines starting with #)
    let headerIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim() && !lines[i].trim().startsWith('#')) {
        headerIndex = i;
        break;
      }
    }

    const headers = lines[headerIndex].split(',').map(h => h.trim());
    const data: CsvUserData[] = [];

    // Validate required headers
    const requiredHeaders = ['FirstName', 'LastName', 'Email', 'Phone', 'Password', 'Gender', 'Role', 'JobPosition', 'TitlePrefix'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Define allowed values
    const allowedGenders = genders.map(g => g.Name);
    const allowedRoles = roles.map(r => r.Name);
    const allowedJobPositions = jobPositions.map(j => j.Name);
    const allowedTitlePrefixes = titlePrefixes.map(t => t.PrefixTH);
    const allowedPackages = packages.map(p => p.PackageName);
    const allowedRequestTypes = requiredTypes.map(t => t.TypeName);

    for (let i = headerIndex + 1; i < lines.length; i++) {
      if (lines[i].trim() === '' || lines[i].trim().startsWith('#')) continue;

      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      const errors: string[] = [];

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Validate required fields
      if (!row.FirstName) errors.push('First name is required');
      if (!row.LastName) errors.push('Last name is required');
      if (!row.Email) errors.push('Email is required');
      if (!row.Phone) errors.push('Phone is required');
      if (!row.Password) errors.push('Password is required');
      if (!row.Gender) errors.push('Gender is required');
      if (!row.Role) errors.push('Role is required');
      if (!row.JobPosition) errors.push('Job position is required');
      if (!row.TitlePrefix) errors.push('Title prefix is required');

      // Automatically determine IsEmployee based on EmployeeID presence
      const hasEmployeeID = row.EmployeeID && row.EmployeeID.trim() !== '';
      const isEmployee = hasEmployeeID;

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (row.Email && !emailRegex.test(row.Email)) {
        errors.push('Invalid email format');
      }

      // Validate phone format (Thai format)
      const phoneRegex = /^0[0-9]{9}$/;
      if (row.Phone && !phoneRegex.test(row.Phone)) {
        errors.push('Phone must start with 0 and have 10 digits');
      }

      // Validate employee ID format if provided
      if (hasEmployeeID) {
        const employeeIdRegex = /^[0-9]{6}$/;
        if (!employeeIdRegex.test(row.EmployeeID)) {
          errors.push('Employee ID must be 6 digits');
        }
      }

      // Validate external user requirements
      if (!isEmployee) {
        if (!row.CompanyName) {
          errors.push('Company name is required for external users');
        }
        if (!row.BusinessDetail) {
          errors.push('Business detail is required for external users');
        }
      }

      // Validate gender
      if (row.Gender && !allowedGenders.includes(row.Gender)) {
        errors.push(`Invalid gender. Allowed values: ${allowedGenders.join(', ')}`);
      }

      // Validate role
      if (row.Role && !allowedRoles.includes(row.Role)) {
        errors.push(`Invalid role. Allowed values: ${allowedRoles.join(', ')}`);
      }

      // Validate job position
      if (row.JobPosition && !allowedJobPositions.includes(row.JobPosition)) {
        errors.push(`Invalid job position. Allowed values: ${allowedJobPositions.join(', ')}`);
      }

      // Validate title prefix
      if (row.TitlePrefix && !allowedTitlePrefixes.includes(row.TitlePrefix)) {
        errors.push(`Invalid title prefix. Allowed values: ${allowedTitlePrefixes.join(', ')}`);
      }

      // Validate package
      if (row.UserPackage && !allowedPackages.includes(row.UserPackage)) {
        errors.push(`Invalid package. Allowed values: ${allowedPackages.join(', ')}`);
      }

      // Validate request type
      if (row.RequestType && !allowedRequestTypes.includes(row.RequestType)) {
        errors.push(`Invalid request type. Allowed values: ${allowedRequestTypes.join(', ')}`);
      }

      // Validate request type is only used for Manager role
      if (row.RequestType && row.Role !== 'Manager') {
        errors.push('Request type can only be specified for Manager role');
      }

      // Convert human-readable values to IDs
      const gender = genders.find(g => g.Name === row.Gender);
      const role = roles.find(r => r.Name === row.Role);
      const jobPosition = jobPositions.find(j => j.Name === row.JobPosition);
      const titlePrefix = titlePrefixes.find(t => t.PrefixTH === row.TitlePrefix);
      const userPackage = packages.find(p => p.PackageName === row.UserPackage);
      const requestType = requiredTypes.find(t => t.TypeName === row.RequestType);

      const csvUser: CsvUserData = {
        id: `row-${i}`,
        FirstName: row.FirstName || '',
        LastName: row.LastName || '',
        Email: row.Email || '',
        Phone: row.Phone || '',
        Password: row.Password || '',
        EmployeeID: row.EmployeeID || '',
        CompanyName: row.CompanyName || '',
        BusinessDetail: row.BusinessDetail || '',
        Gender: row.Gender || '', // Keep human-readable for display
        Role: row.Role || '', // Keep human-readable for display
        JobPosition: row.JobPosition || '', // Keep human-readable for display
        TitlePrefix: row.TitlePrefix || '', // Keep human-readable for display
        UserPackage: row.UserPackage || '', // Keep human-readable for display
        RequestType: row.RequestType || '', // Keep human-readable for display
        IsEmployee: isEmployee, // Automatically determined based on EmployeeID
        IsBusinessOwner: row.IsBusinessOwner === 'true' || row.IsBusinessOwner === true,
        isValid: errors.length === 0,
        errors,
        // Converted IDs for API
        GenderID: gender?.ID || 0,
        RoleID: role?.ID || 0,
        JobPositionID: jobPosition?.ID || 0,
        PrefixID: titlePrefix?.ID || 0,
        UserPackageID: userPackage?.ID || undefined,
        RequestTypeID: requestType?.ID || undefined,
      };

      data.push(csvUser);
    }

    return data;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setAlerts(prev => [...prev, { type: 'error', message: 'Please select a CSV file' }]);
      return;
    }

    // Check if reference data is loaded
    if (genders.length === 0 || roles.length === 0 || jobPositions.length === 0 || titlePrefixes.length === 0 || packages.length === 0 || requiredTypes.length === 0) {
      setAlerts(prev => [...prev, { type: 'error', message: 'Please wait for reference data to load before uploading CSV' }]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const parsedData = parseCSV(csvText);
        setCsvData(parsedData);

        if (parsedData.length === 0) {
          setAlerts(prev => [...prev, { type: 'warning', message: 'No valid data found in CSV file' }]);
        } else {
          const validCount = parsedData.filter(row => row.isValid).length;
          setAlerts(prev => [...prev, {
            type: 'info',
            message: `Imported ${parsedData.length} rows. ${validCount} valid, ${parsedData.length - validCount} with errors.`
          }]);
        }
      } catch (error) {
        console.error('Error parsing CSV:', error);
        setAlerts(prev => [...prev, {
          type: 'error',
          message: `Error parsing CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
        }]);
      }
    };
    reader.readAsText(file);
  };

  // Validation function that can be reused
  const validateUserData = (data: {
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
    Password?: string;
    EmployeeID?: string;
    CompanyName?: string;
    BusinessDetail?: string;
    GenderID: number | null;
    RoleID: number | null;
    JobPositionID?: number | null;
    PrefixID?: number | null;
    RequestTypeID?: number | null;
    IsEmployee: boolean;
  }): string[] => {
    const errors: string[] = [];

    // Validate required fields
    if (!data.FirstName) errors.push('First name is required');
    if (!data.LastName) errors.push('Last name is required');
    if (!data.Email) errors.push('Email is required');
    if (!data.Phone) errors.push('Phone is required');
    if (!data.Password) errors.push('Password is required');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.Email && !emailRegex.test(data.Email)) {
      errors.push('Invalid email format');
    }

    // Validate phone format (Thai format)
    const phoneRegex = /^0[0-9]{9}$/;
    if (data.Phone && !phoneRegex.test(data.Phone)) {
      errors.push('Phone must start with 0 and have 10 digits');
    }

    // Validate employee ID format if provided
    if (data.IsEmployee && data.EmployeeID) {
      const employeeIdRegex = /^[0-9]{6}$/;
      if (!employeeIdRegex.test(data.EmployeeID)) {
        errors.push('Employee ID must be 6 digits');
      }
    }

    // Validate external user requirements
    if (!data.IsEmployee) {
      if (!data.CompanyName) {
        errors.push('Company name is required for external users');
      }
      if (!data.BusinessDetail) {
        errors.push('Business detail is required for external users');
      }
    }

    // Validate gender and role selections
    if (!data.GenderID) errors.push('Gender is required');
    if (!data.RoleID) errors.push('Role is required');
    if (!data.JobPositionID) errors.push('Job position is required');
    if (!data.PrefixID) errors.push('Title prefix is required');

    // Validate management for Manager (3) and Admin (4) roles
    if ((data.RoleID === 4 || data.RoleID === 5) && !data.RequestTypeID) {
      errors.push('Management is required for Manager and Admin roles');
    }

    return errors;
  };

  const handleEditUser = (user: CsvUserData) => {
    setSelectedUser(user);
    setSelectedGender(user.GenderID);
    setSelectedRole(user.RoleID);
    setSelectedJobPosition(user.JobPositionID);
    setSelectedPrefix(user.PrefixID);
    setSelectedPackage(user.UserPackageID || null);
    setSelectedRequestType(user.RequestTypeID || null);
    setIsEmployee(user.IsEmployee);
    setIsBusinessOwner(user.IsBusinessOwner);

    setValue('FirstName', user.FirstName);
    setValue('LastName', user.LastName);
    setValue('Email', user.Email);
    setValue('Phone', user.Phone);
    setValue('Password', user.Password);
    setValue('EmployeeID', user.EmployeeID);
    setValue('CompanyName', user.CompanyName);
    setValue('BusinessDetail', user.BusinessDetail);
    setValue('GenderID', user.GenderID);
    setValue('RoleID', user.RoleID);
    setValue('JobPositionID', user.JobPositionID);
    setValue('PrefixID', user.PrefixID);
    setValue('IsBusinessOwner', user.IsBusinessOwner);

    setConfirmDialogOpen(true);

    // Trigger validation immediately when popup opens
    setTimeout(() => {
      // Force validation on all fields to show errors immediately
      trigger();
    }, 100); // Small delay to ensure form is rendered
  };

  const handleSaveChanges = async (data: ConfirmUserFormData) => {
    if (!selectedUser) return;

    setIsLoading(true);
    try {
      const userData = {
        first_name: data.FirstName,
        last_name: data.LastName,
        email: data.Email,
        phone: data.Phone,
        password: data.Password,
        employee_id: data.EmployeeID,
        company_name: data.CompanyName,
        business_detail: data.BusinessDetail,
        gender_id: selectedGender,
        role_id: selectedRole,
        job_position_id: selectedJobPosition,
        prefix_id: selectedPrefix,
        package_id: selectedPackage,
        request_type_id: selectedRequestType,
        is_employee: isEmployee,
        is_business_owner: isBusinessOwner
      };


      const response = await CreateUser(userData);

      if (response?.status === 'success') {
        setAlerts(prev => [...prev, { type: 'success', message: 'User created successfully' }]);

        // Remove the row from the table after successful creation
        setCsvData(prev => prev.filter(row => row.id !== selectedUser.id));

        setConfirmDialogOpen(false);
        setSelectedUser(null);
      } else {
        setAlerts(prev => [...prev, {
          type: 'error',
          message: response?.message || 'Failed to create user'
        }]);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setAlerts(prev => [...prev, { type: 'error', message: 'An unexpected error occurred' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    // Just close the dialog without saving any changes
    setConfirmDialogOpen(false);
    setSelectedUser(null);
  };

  const handleTemporarySave = (data: ConfirmUserFormData) => {
    if (!selectedUser) return;

    // Use the shared validation function
    const validationData = {
      FirstName: data.FirstName,
      LastName: data.LastName,
      Email: data.Email,
      Phone: data.Phone,
      Password: data.Password,
      EmployeeID: data.EmployeeID,
      CompanyName: data.CompanyName,
      BusinessDetail: data.BusinessDetail,
      GenderID: selectedGender,
      RoleID: selectedRole,
      JobPositionID: selectedJobPosition,
      PrefixID: selectedPrefix,
      RequestTypeID: selectedRequestType,
      IsEmployee: isEmployee,
    };

    const errors = validateUserData(validationData);

    // Update the user data in the table with the edited information (temporary)
    setCsvData(prev => prev.map(row => {
      if (row.id === selectedUser.id) {
        return {
          ...row,
          FirstName: data.FirstName,
          LastName: data.LastName,
          Email: data.Email,
          Phone: data.Phone,
          Password: data.Password,
          EmployeeID: data.EmployeeID || '',
          CompanyName: data.CompanyName || '',
          BusinessDetail: data.BusinessDetail || '',
          Gender: genders.find(g => g.ID === selectedGender)?.Name || '',
          Role: roles.find(r => r.ID === selectedRole)?.Name || '',
          JobPosition: jobPositions.find(j => j.ID === selectedJobPosition)?.Name || '',
          TitlePrefix: titlePrefixes.find(t => t.ID === selectedPrefix)?.PrefixTH || '',
          UserPackage: packages.find(p => p.ID === selectedPackage)?.PackageName || '',
          RequestType: requiredTypes.find(t => t.ID === selectedRequestType)?.TypeName || '',
          IsEmployee: isEmployee,
          IsBusinessOwner: isBusinessOwner,
          isValid: errors.length === 0, // Update validation status
          errors: errors, // Update error messages
          GenderID: selectedGender || 0,
          RoleID: selectedRole || 0,
          JobPositionID: selectedJobPosition || 0,
          PrefixID: selectedPrefix || 0,
          UserPackageID: selectedPackage || undefined,
          RequestTypeID: selectedRequestType || undefined,
        } as CsvUserData;
      }
      return row;
    }));

    setConfirmDialogOpen(false);
    setSelectedUser(null);
  };

  const handleResetData = () => {
    // Clear data from localStorage and state
    localStorage.removeItem('csvUserData');
    setCsvData([]);
    setAlerts(prev => [...prev, { type: 'info', message: 'Data has been reset successfully' }]);
  };



  const columns: GridColDef[] = [
    {
      field: 'FirstName',
      headerName: 'First Name',
      flex: 1,
    },
    {
      field: 'LastName',
      headerName: 'Last Name',
      flex: 1,
    },
    {
      field: 'Email',
      headerName: 'Email',
      flex: 1.2,
    },
    {
      field: 'Phone',
      headerName: 'Phone',
      flex: 1,
    },
    {
      field: 'EmployeeID',
      headerName: 'Employee ID',
      flex: 1,

    },
    {
      field: 'Gender',
      headerName: 'Gender',
      flex: 0.8,

    },
    {
      field: 'Role',
      headerName: 'Role',
      flex: 1,

    },
    {
      field: 'IsEmployee',
      headerName: 'Employee',
      flex: 0.8,

    },
    {
      field: 'UserPackage',
      headerName: 'Package',
      flex: 1,

    },

    {
      field: 'isValid',
      headerName: 'Status',
      flex: 0.8,
      renderCell: (params) => (
        <Box sx={{
          display: 'flex',
          alignItems: 'center',

          width: '100%',
          height: '100%'
        }}>
          {params.value ? (
            <Check size={16} style={{ color: 'green' }} />
          ) : (
            <X size={16} style={{ color: 'red' }} />
          )}
        </Box>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 1,
      renderCell: (params) => (
        <Button
          onClick={() => handleEditUser(params.row)}
          disabled={false}
          variant="contained"
        >
          Edit
        </Button>
      ),
    }
  ];

  return (
    <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
      <div className="add-user-csv-page">
        {/* Alerts */}
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

        <Grid container spacing={3}>
          <Grid className='title-box' size={{ xs: 10, md: 12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UserRoundPlus size={26} />
              <Typography variant="titlePage" className="title">Add Users</Typography>
            </Box>

          </Grid>

          {/* Upload Section */}
          <Grid size={{ xs: 12, md: 12 }}>
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Upload CSV File</Typography>

              {isLoadingData ? (
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CircularProgress size={20} sx={{ mr: 2 }} />
                  <Typography variant="body2" color="text.secondary">
                    Loading reference data...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    Upload a CSV file with user data. The file should include columns: FirstName, LastName, Email, Phone, Password, EmployeeID (optional), CompanyName (optional), BusinessDetail (optional), Gender, Role, JobPosition, TitlePrefix, UserPackage (optional), RequestType (optional), IsBusinessOwner (optional)
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    <strong>Note:</strong> IsEmployee is automatically determined - if EmployeeID is provided, user is marked as Employee (true), otherwise as External User (false).
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                    <strong>Allowed values:</strong><br />
                    Gender: {genders.map(g => g.Name).join(', ')}<br />
                    Role: {roles.map(r => r.Name).join(', ')}<br />
                    JobPosition: {jobPositions.map(j => j.Name).join(', ')}<br />
                    TitlePrefix: {titlePrefixes.map(t => t.PrefixTH).join(', ')}<br />
                    UserPackage: {packages.map(p => p.PackageName).join(', ')}<br />
                    RequestType: {requiredTypes.map(t => t.TypeName).join(', ')}
                  </Typography>
                </>
              )}

              <Button
                variant="contained"
                component="label"
                startIcon={<Upload size={20} />}
                disabled={isLoadingData}
                sx={{ mr: 2 }}
              >
                Choose CSV File
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileUpload}
                />
              </Button>

              <Button
                variant="contained"

                startIcon={<FileText size={20} />}
                disabled={isLoadingData}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/src/pages/AddUser/user_template.csv';
                  link.download = 'user_template.csv';
                  link.click();
                }}
                sx={{ mr: 2 }}
              >
                Download Template
              </Button>

              <Button
                variant="contained"
                startIcon={<BookOpen size={20} />}
                disabled={isLoadingData}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/src/pages/AddUser/CSV_User_Manual.txt';
                  link.download = 'CSV_User_Manual.txt';
                  link.click();
                }}
                sx={{ mr: 2 }}
              >
                Download Manual
              </Button>

              {csvData.length > 0 && (
                <Button
                  variant="outlinedCancel"
                  color="error"
                  startIcon={<RotateCcw size={20} />}
                  onClick={handleResetData}
                  sx={{ ml: 2 }}
                >
                  Reset Data
                </Button>
              )}

              {csvData.length > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  {csvData.length} users loaded. Valid users can be edited and saved.
                </Alert>
              )}
            </Card>
          </Grid>

          {/* Data Table */}
          {csvData.length > 0 && (
            <Grid size={{ xs: 12, md: 12 }}>
              <Card sx={{ width: "100%", borderRadius: 2 }}>
                <DataGrid
                  rows={csvData}
                  columns={columns}
                  getRowId={(row) => row.id}
                  pageSizeOptions={[5, 10, 20]}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 10 },
                    },
                  }}
                  disableRowSelectionOnClick
                  loading={isLoadingData}
                  sx={{
                    width: "100%",
                    borderRadius: 2,
                  }}
                />
              </Card>
            </Grid>
          )}
        </Grid>

        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle>
            <Typography variant="h6">Confirm User Details</Typography>
          </DialogTitle>

          <DialogContent>
            {selectedUser && (
              <form onSubmit={handleSubmit(handleSaveChanges)}>
                <Grid container spacing={2}>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Title Prefix</Typography>
                    <Controller
                      name="PrefixID"
                      control={control}
                      defaultValue={selectedUser?.PrefixID || 0}
                      rules={{
                        required: 'Title prefix is required',
                        validate: (value) => {
                          if (!value || value === 0) return 'Title prefix is required';
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.PrefixID}>
                          <Select
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setSelectedPrefix(value);
                            }}
                            displayEmpty
                          >
                            <MenuItem value={0}>
                              <em>-- Please select title prefix --</em>
                            </MenuItem>
                            {titlePrefixes.map((prefix) => (
                              <MenuItem key={prefix.ID} value={prefix.ID}>{prefix.PrefixEN}</MenuItem>
                            ))}
                          </Select>
                          {errors.PrefixID && <FormHelperText>{String(errors.PrefixID.message)}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">First Name</Typography>
                    <Controller
                      name="FirstName"
                      control={control}
                      defaultValue={selectedUser.FirstName}
                      rules={{ required: 'First name is required' }}
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
                      defaultValue={selectedUser.LastName}
                      rules={{ required: 'Last name is required' }}
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
                      defaultValue={selectedUser.Email}
                      rules={{
                        required: 'Email is required',
                        pattern: {
                          value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                          message: 'Please enter a valid email'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.Email}
                          helperText={String(errors.Email?.message || '')}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Phone</Typography>
                    <Controller
                      name="Phone"
                      control={control}
                      defaultValue={selectedUser.Phone}
                      rules={{
                        required: 'Phone is required',
                        pattern: {
                          value: /^0[0-9]{9}$/,
                          message: 'Phone must start with 0 and have 10 digits'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          error={!!errors.Phone}
                          helperText={String(errors.Phone?.message || '')}
                        />
                      )}
                    />
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Password</Typography>
                    <Controller
                      name="Password"
                      control={control}
                      defaultValue={selectedUser.Password}
                      rules={{
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        },
                        pattern: {
                          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                          message: 'Password must contain at least 1 lowercase, 1 uppercase, 1 number, and 1 special character'
                        }
                      }}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          type="password"
                          fullWidth
                          error={!!errors.Password}
                          helperText={String(errors.Password?.message || '')}
                        />
                      )}
                    />
                  </Grid>

                  {isEmployee && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body1" className="title-field">Employee ID</Typography>
                      <Controller
                        name="EmployeeID"
                        control={control}
                        defaultValue={selectedUser.EmployeeID}
                        rules={{
                          required: 'Employee ID is required',
                          pattern: {
                            value: /^[0-9]{6}$/,
                            message: 'Employee ID must be 6 digits'
                          }
                        }}
                        render={({ field }) => (
                          <TextField
                            {...field}
                            fullWidth
                            error={!!errors.EmployeeID}
                            helperText={String(errors.EmployeeID?.message || '')}
                          />
                        )}
                      />
                    </Grid>
                  )}



                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Gender</Typography>
                    <Controller
                      name="GenderID"
                      control={control}
                      defaultValue={selectedUser?.GenderID || 0}
                      rules={{
                        required: 'Gender is required',
                        validate: (value) => {
                          if (!value || value === 0) return 'Gender is required';
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.GenderID}>
                          <Select
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setSelectedGender(value);
                            }}
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

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Job Position</Typography>
                    <Controller
                      name="JobPositionID"
                      control={control}
                      defaultValue={selectedUser?.JobPositionID || 0}
                      rules={{
                        required: 'Job position is required',
                        validate: (value) => {
                          if (!value || value === 0) return 'Job position is required';
                          return true;
                        }
                      }}
                      render={({ field }) => (
                        <FormControl fullWidth error={!!errors.JobPositionID}>
                          <Select
                            {...field}
                            value={field.value || 0}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              field.onChange(value);
                              setSelectedJobPosition(value);
                            }}
                            displayEmpty
                          >
                            <MenuItem value={0}>
                              <em>-- Please select job position --</em>
                            </MenuItem>
                            {jobPositions.map((position) => (
                              <MenuItem key={position.ID} value={position.ID}>{position.Name}</MenuItem>
                            ))}
                          </Select>
                          {errors.JobPositionID && <FormHelperText>{String(errors.JobPositionID.message)}</FormHelperText>}
                        </FormControl>
                      )}
                    />
                  </Grid>



                  {isEmployee && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body1" className="title-field">Role</Typography>
                        <Controller
                          name="RoleID"
                          control={control}
                          defaultValue={selectedUser?.RoleID || 0}
                          rules={{
                            required: 'Role is required',
                            validate: (value) => {
                              if (!value || value === 0) return 'Role is required';
                              return true;
                            }
                          }}
                          render={({ field }) => (
                            <FormControl fullWidth error={!!errors.RoleID}>
                              <Select
                                {...field}
                                value={field.value || 0}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  field.onChange(value);
                                  setSelectedRole(value);
                                }}
                                displayEmpty
                              >
                                <MenuItem value={0}>
                                  <em>-- Please select role --</em>
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

                       {(roleID || selectedRole) === 4 || (roleID || selectedRole) === 5 ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <FormControl fullWidth error={!!errors.RequestTypeID}>
                            <Typography variant="body1" className="title-field">Management</Typography>
                            <Select
                              value={selectedRequestType ?? 0}
                              onChange={(e) => setSelectedRequestType(Number(e.target.value))}
                              displayEmpty
                            >
                              <MenuItem value={0}>
                                <em>-- Please select management --</em>
                              </MenuItem>
                              {requiredTypes.map((type) => (
                                <MenuItem key={type.ID} value={type.ID}>{type.TypeName}</MenuItem>
                              ))}
                            </Select>
                            {errors.RequestTypeID && <FormHelperText>{String(errors.RequestTypeID?.message)}</FormHelperText>}
                          </FormControl>
                        </Grid>
                      ) : null}
                    </>
                  )}



                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <Typography variant="body1" className="title-field">Package</Typography>
                      <Select
                        value={selectedPackage ?? 0}
                        onChange={(e) => setSelectedPackage(Number(e.target.value))}
                        displayEmpty
                      >
                        <MenuItem value={0}><em>-- No package --</em></MenuItem>
                        {packages.map((pkg) => (
                          <MenuItem key={pkg.ID} value={pkg.ID}>{pkg.PackageName}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body1" className="title-field">Is Business Owner</Typography>
                    <Controller
                      name="IsBusinessOwner"
                      control={control}
                      defaultValue={selectedUser?.IsBusinessOwner || false}
                      render={({ field }) => (
                        <FormControl fullWidth>
                          <Select
                            {...field}
                            value={field.value ? 'true' : 'false'}
                            onChange={(e) => {
                              const value = e.target.value === 'true';
                              field.onChange(value);
                              setIsBusinessOwner(value);
                            }}
                          >
                            <MenuItem value="false">No</MenuItem>
                            <MenuItem value="true">Yes</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    />
                  </Grid>
                  {!isEmployee && (
                    <>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body1" className="title-field">Company Name</Typography>
                        <Controller
                          name="CompanyName"
                          control={control}
                          defaultValue={selectedUser.CompanyName}
                          rules={{ required: 'Company name is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              fullWidth
                              error={!!errors.CompanyName}
                              helperText={String(errors.CompanyName?.message || '')}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="body1" className="title-field">Business Detail</Typography>
                        <Controller
                          name="BusinessDetail"
                          control={control}
                          defaultValue={selectedUser.BusinessDetail}
                          rules={{ required: 'Business detail is required' }}
                          render={({ field }) => (
                            <TextArea
                              {...field}
                              fullWidth
                              multiline
                              rows={3}
                              error={!!errors.BusinessDetail}
                              helperText={String(errors.BusinessDetail?.message || '')}
                            />
                          )}
                        />
                      </Grid>
                    </>
                  )}
                </Grid>
              </form>
            )}
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCancelEdit} variant="outlinedCancel">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit(handleTemporarySave)}
              variant="outlinedGray"
            >
              Save Temporarily
            </Button>
            <Button
              onClick={handleSubmit(handleSaveChanges)}
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : <Check size={20} />}
            >
              {isLoading ? 'Saving...' : 'Save & Create User'}
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </Container>
  );
};

export default AddUserFormByCsv;
