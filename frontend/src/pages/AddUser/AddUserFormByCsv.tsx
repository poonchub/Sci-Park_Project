import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Card,
  Typography,
  Grid,
  Dialog,
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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faCheck, faTimes, faFileCsv, faRotateRight, faBook } from "@fortawesome/free-solid-svg-icons";
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
  CreateUser
} from '../../services/http';
import './AddUserForm.css';

interface CsvUserData {
  id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  EmployeeID?: string;
  CompanyName?: string;
  BusinessDetail?: string;
  Gender: string;
  Role: string;
  UserPackage?: string;
  RequestType?: string;
  IsEmployee: boolean;
  isValid: boolean;
  errors: string[];
  // Converted IDs for API
  GenderID: number;
  RoleID: number;
  UserPackageID?: number;
  RequestTypeID?: number;
}

interface ConfirmUserFormData {
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  EmployeeID?: string;
  CompanyName?: string;
  BusinessDetail?: string;
  GenderID: number | string;
  RoleID: number | string;
  UserPackageID?: number;
  RequestTypeID?: number;
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
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CsvUserData | null>(null);
  const [selectedGender, setSelectedGender] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [selectedRequestType, setSelectedRequestType] = useState<number | null>(null);
  const [isEmployee, setIsEmployee] = useState<boolean>(true);

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
    const requiredHeaders = ['FirstName', 'LastName', 'Email', 'Phone', 'Gender', 'Role'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
    }

    // Define allowed values
    const allowedGenders = genders.map(g => g.Name);
    const allowedRoles = roles.map(r => r.Name);
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
      if (!row.Gender) errors.push('Gender is required');
      if (!row.Role) errors.push('Role is required');

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
      const userPackage = packages.find(p => p.PackageName === row.UserPackage);
      const requestType = requiredTypes.find(t => t.TypeName === row.RequestType);

      const csvUser: CsvUserData = {
        id: `row-${i}`,
        FirstName: row.FirstName || '',
        LastName: row.LastName || '',
        Email: row.Email || '',
        Phone: row.Phone || '',
        EmployeeID: row.EmployeeID || '',
        CompanyName: row.CompanyName || '',
        BusinessDetail: row.BusinessDetail || '',
        Gender: row.Gender || '', // Keep human-readable for display
        Role: row.Role || '', // Keep human-readable for display
        UserPackage: row.UserPackage || '', // Keep human-readable for display
        RequestType: row.RequestType || '', // Keep human-readable for display
        IsEmployee: isEmployee, // Automatically determined based on EmployeeID
        isValid: errors.length === 0,
        errors,
        // Converted IDs for API
        GenderID: gender?.ID || 0,
        RoleID: role?.ID || 0,
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
    if (genders.length === 0 || roles.length === 0 || packages.length === 0 || requiredTypes.length === 0) {
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
    EmployeeID?: string;
    CompanyName?: string;
    BusinessDetail?: string;
    GenderID: number | null;
    RoleID: number | null;
    IsEmployee: boolean;
  }): string[] => {
    const errors: string[] = [];

    // Validate required fields
    if (!data.FirstName) errors.push('First name is required');
    if (!data.LastName) errors.push('Last name is required');
    if (!data.Email) errors.push('Email is required');
    if (!data.Phone) errors.push('Phone is required');

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

    return errors;
  };

  const handleEditUser = (user: CsvUserData) => {
    setSelectedUser(user);
    setSelectedGender(user.GenderID);
    setSelectedRole(user.RoleID);
    setSelectedPackage(user.UserPackageID || null);
    setSelectedRequestType(user.RequestTypeID || null);
    setIsEmployee(user.IsEmployee);
    
    setValue('FirstName', user.FirstName);
    setValue('LastName', user.LastName);
    setValue('Email', user.Email);
    setValue('Phone', user.Phone);
    setValue('EmployeeID', user.EmployeeID);
    setValue('CompanyName', user.CompanyName);
    setValue('BusinessDetail', user.BusinessDetail);
    setValue('GenderID', user.GenderID);
    setValue('RoleID', user.RoleID);
    
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
        FirstName: data.FirstName,
        LastName: data.LastName,
        Email: data.Email,
        Phone: data.Phone,
        EmployeeID: data.EmployeeID,
        CompanyName: data.CompanyName,
        BusinessDetail: data.BusinessDetail,
        GenderID: selectedGender,
        RoleID: selectedRole,
        UserPackageID: selectedPackage,
        RequestTypeID: selectedRequestType,
        IsEmployee: isEmployee
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
      EmployeeID: data.EmployeeID,
      CompanyName: data.CompanyName,
      BusinessDetail: data.BusinessDetail,
      GenderID: selectedGender,
      RoleID: selectedRole,
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
          EmployeeID: data.EmployeeID || '',
          CompanyName: data.CompanyName || '',
          BusinessDetail: data.BusinessDetail || '',
          Gender: genders.find(g => g.ID === selectedGender)?.Name || '',
          Role: roles.find(r => r.ID === selectedRole)?.Name || '',
          UserPackage: packages.find(p => p.ID === selectedPackage)?.PackageName || '',
          RequestType: requiredTypes.find(t => t.ID === selectedRequestType)?.TypeName || '',
          IsEmployee: isEmployee,
          isValid: errors.length === 0, // Update validation status
          errors: errors, // Update error messages
          GenderID: selectedGender || 0,
          RoleID: selectedRole || 0,
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
            <FontAwesomeIcon icon={faCheck} style={{ color: 'green', fontSize: '16px' }} />
          ) : (
            <FontAwesomeIcon icon={faTimes} style={{ color: 'red', fontSize: '16px' }} />
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
          sx={{
            bgcolor: '#08aff1',
            color: '#fff',
            fontSize: '14px',
            "&:hover": {
              bgcolor: '#0698d4'
            }
          }}
        >
          Edit
        </Button>
      ),
    }
  ];

  return (
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
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>Add Users</Typography>
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
                  Upload a CSV file with user data. The file should include columns: FirstName, LastName, Email, Phone, EmployeeID (optional), CompanyName (optional), BusinessDetail (optional), Gender, Role, UserPackage (optional), RequestType (optional)
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  <strong>Note:</strong> IsEmployee is automatically determined - if EmployeeID is provided, user is marked as Employee (true), otherwise as External User (false).
                </Typography>
                <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                  <strong>Allowed values:</strong><br/>
                  Gender: {genders.map(g => g.Name).join(', ')}<br/>
                  Role: {roles.map(r => r.Name).join(', ')}<br/>
                  UserPackage: {packages.map(p => p.PackageName).join(', ')}<br/>
                  RequestType: {requiredTypes.map(t => t.TypeName).join(', ')}
                </Typography>
              </>
            )}
            
                         <Button
               variant="outlined"
               component="label"
               startIcon={<FontAwesomeIcon icon={faUpload} />}
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
               variant="text"
               startIcon={<FontAwesomeIcon icon={faFileCsv} />}
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
               variant="outlined"
               startIcon={<FontAwesomeIcon icon={faBook} />}
               disabled={isLoadingData}
               onClick={() => {
                 const link = document.createElement('a');
                 link.href = '/src/pages/AddUser/CSV_User_Manual.txt';
                 link.download = 'CSV_User_Manual.txt';
                 link.click();
               }}
             >
               Download Manual
             </Button>
             
             {csvData.length > 0 && (
               <Button
                 variant="outlined"
                 color="error"
                 startIcon={<FontAwesomeIcon icon={faRotateRight} />}
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
                        helperText={String(errors.FirstName?.message || '') }
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
                        helperText={String(errors.Phone?.message || '') }
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
                          helperText={String(errors.EmployeeID?.message || '') }
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

                    {(roleID || selectedRole) === 3 && (
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControl fullWidth error={!!errors.RequestTypeID}>
                          <Typography variant="body1" className="title-field">Request Type</Typography>
                          <Select
                            value={selectedRequestType ?? 0}
                            onChange={(e) => setSelectedRequestType(Number(e.target.value))}
                            displayEmpty
                          >
                            <MenuItem value={0}>
                              <em>-- Please select request type --</em>
                            </MenuItem>
                            {requiredTypes.map((type) => (
                              <MenuItem key={type.ID} value={type.ID}>{type.TypeName}</MenuItem>
                            ))}
                          </Select>
                          {errors.RequestTypeID && <FormHelperText>{String(errors.RequestTypeID?.message)}</FormHelperText>}
                        </FormControl>
                      </Grid>
                    )}
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
                            helperText={String(errors.CompanyName?.message || '') }
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
                            helperText={String(errors.BusinessDetail?.message || '' ) }
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
          <Button onClick={handleCancelEdit} color="secondary">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit(handleTemporarySave)} 
            variant="outlined" 
            color="primary"
          >
            Save Temporarily
          </Button>
          <Button 
            onClick={handleSubmit(handleSaveChanges)} 
            variant="contained" 
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <FontAwesomeIcon icon={faCheck} />}
          >
            {isLoading ? 'Saving...' : 'Save & Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default AddUserFormByCsv;
