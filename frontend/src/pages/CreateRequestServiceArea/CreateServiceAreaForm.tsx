import React, { useState, useEffect } from 'react';
import { Button, MenuItem, FormControl, FormHelperText, Typography, Grid, Box } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import './CreateServiceAreaForm.css';
import { 
  CreateRequestServiceAreaAndAboutCompany, 
  ListBusinessGroups, 
  ListCompanySizes,
  ListServiceUserTypes 
} from '../../services/http';
import { BusinessGroupInterface } from '../../interfaces/IBusinessGroup';
import { CompanySizeInterface } from '../../interfaces/ICompanySize';
import { ServiceUserTypeInterface } from '../../interfaces/IServiceUserType';
import SuccessAlert from '../../components/Alert/SuccessAlert';
import ErrorAlert from '../../components/Alert/ErrorAlert';
import WarningAlert from '../../components/Alert/WarningAlert';
import { Select } from "../../components/Select/Select";
import { TextField } from "../../components/TextField/TextField";
import { TextArea } from '../../components/TextField/TextArea';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight, faBook, faFileUpload } from "@fortawesome/free-solid-svg-icons";
import { Building2 } from "lucide-react";
import { DatePicker } from '../../components/DatePicker/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { validateCorporateRegistrationNumber } from '../../utils/corporateRegistrationValidator';

interface ServiceAreaFormData {
  PurposeOfUsingSpace: string;
  NumberOfEmployees: number;
  ActivitiesInBuilding: string;
  CollaborationPlan: string;
  CollaborationBudget: number;
  ProjectStartDate: string;
  ProjectEndDate: string;
  SupportingActivitiesForSciencePark: string;
  ServiceRequestDocument?: File;
  CorporateRegistrationNumber: string;
  BusinessGroupID: number;
  CompanySizeID: number;
  MainServices: string;
  RegisteredCapital: number;
  HiringRate: number;
  ResearchInvestmentValue: number;
  ThreeYearGrowthForecast: string;
}

const CreateServiceAreaForm: React.FC = () => {
  const { control, handleSubmit, reset, formState: { errors }, watch, trigger } = useForm<ServiceAreaFormData>();
  const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);
  const [companySizes, setCompanySizes] = useState<CompanySizeInterface[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Company Info, 2 = Service Area Request
  
  // Watch all form fields for real-time validation
  const watchedFields = watch();

  // Real-time validation for Corporate Registration Number
  useEffect(() => {
    if (watchedFields.CorporateRegistrationNumber && watchedFields.CorporateRegistrationNumber.length === 13) {
      trigger('CorporateRegistrationNumber');
    }
  }, [watchedFields.CorporateRegistrationNumber, trigger]);

  // Real-time validation for Registered Capital
  useEffect(() => {
    if (watchedFields.RegisteredCapital !== undefined && watchedFields.RegisteredCapital !== 0) {
      trigger('RegisteredCapital');
    }
  }, [watchedFields.RegisteredCapital, trigger]);

  // Real-time validation for Research Investment Value
  useEffect(() => {
    if (watchedFields.ResearchInvestmentValue !== undefined && watchedFields.ResearchInvestmentValue !== 0) {
      trigger('ResearchInvestmentValue');
    }
  }, [watchedFields.ResearchInvestmentValue, trigger]);

  // Real-time validation for Hiring Rate
  useEffect(() => {
    if (watchedFields.HiringRate !== undefined) {
      trigger('HiringRate');
    }
  }, [watchedFields.HiringRate, trigger]);

  // Real-time validation for Number of Employees
  useEffect(() => {
    if (watchedFields.NumberOfEmployees !== undefined && watchedFields.NumberOfEmployees !== 0) {
      trigger('NumberOfEmployees');
    }
  }, [watchedFields.NumberOfEmployees, trigger]);

  // Real-time validation for Collaboration Budget
  useEffect(() => {
    if (watchedFields.CollaborationBudget !== undefined && watchedFields.CollaborationBudget !== 0) {
      trigger('CollaborationBudget');
    }
  }, [watchedFields.CollaborationBudget, trigger]);

  // Real-time validation for text fields with minimum length
  useEffect(() => {
    if (watchedFields.MainServices && watchedFields.MainServices.length >= 10) {
      trigger('MainServices');
    }
  }, [watchedFields.MainServices, trigger]);

  useEffect(() => {
    if (watchedFields.ThreeYearGrowthForecast && watchedFields.ThreeYearGrowthForecast.length >= 10) {
      trigger('ThreeYearGrowthForecast');
    }
  }, [watchedFields.ThreeYearGrowthForecast, trigger]);

  useEffect(() => {
    if (watchedFields.PurposeOfUsingSpace && watchedFields.PurposeOfUsingSpace.length >= 10) {
      trigger('PurposeOfUsingSpace');
    }
  }, [watchedFields.PurposeOfUsingSpace, trigger]);

  useEffect(() => {
    if (watchedFields.ActivitiesInBuilding && watchedFields.ActivitiesInBuilding.length >= 10) {
      trigger('ActivitiesInBuilding');
    }
  }, [watchedFields.ActivitiesInBuilding, trigger]);

  useEffect(() => {
    if (watchedFields.CollaborationPlan && watchedFields.CollaborationPlan.length >= 20) {
      trigger('CollaborationPlan');
    }
  }, [watchedFields.CollaborationPlan, trigger]);

  useEffect(() => {
    if (watchedFields.SupportingActivitiesForSciencePark && watchedFields.SupportingActivitiesForSciencePark.length >= 20) {
      trigger('SupportingActivitiesForSciencePark');
    }
  }, [watchedFields.SupportingActivitiesForSciencePark, trigger]);

  // Real-time validation for dropdown fields
  useEffect(() => {
    if (watchedFields.BusinessGroupID !== undefined && watchedFields.BusinessGroupID !== 0) {
      trigger('BusinessGroupID');
    }
  }, [watchedFields.BusinessGroupID, trigger]);

  useEffect(() => {
    if (watchedFields.CompanySizeID !== undefined && watchedFields.CompanySizeID !== 0) {
      trigger('CompanySizeID');
    }
  }, [watchedFields.CompanySizeID, trigger]);

  // Real-time validation for dates
  useEffect(() => {
    if (watchedFields.ProjectStartDate) {
      trigger('ProjectStartDate');
    }
  }, [watchedFields.ProjectStartDate, trigger]);

  useEffect(() => {
    if (watchedFields.ProjectEndDate && watchedFields.ProjectStartDate) {
      trigger('ProjectEndDate');
    }
  }, [watchedFields.ProjectEndDate, watchedFields.ProjectStartDate, trigger]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [businessGroupData, companySizeData] = await Promise.all([
          ListBusinessGroups(),
          ListCompanySizes()
        ]);
        setBusinessGroups(businessGroupData);
        setCompanySizes(companySizeData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlerts([{ type: 'error', message: 'Failed to load form data.' }]);
      }
    };
    fetchData();
  }, []);

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocumentFile(event.target.files[0]);
    }
  };

  const handleNext = () => {
    // Trigger validation for all fields in step 1
    const step1Fields = [
      'CorporateRegistrationNumber',
      'BusinessGroupID', 
      'CompanySizeID',
      'MainServices',
      'RegisteredCapital',
      'HiringRate',
      'ResearchInvestmentValue',
      'ThreeYearGrowthForecast'
    ] as const;
    
    // Check if all required fields in step 1 are valid
    const step1Errors = step1Fields.map(field => {
      const fieldValue = watch(field);
      const fieldError = errors[field];
      
      // Check if field is empty or has validation errors
      if (fieldError) {
        return fieldError;
      }
      
      // Additional validation for specific fields
      if (field === 'BusinessGroupID' && (!fieldValue || fieldValue === 0)) {
        return { message: 'Please select business group' };
      }
      
      if (field === 'CompanySizeID' && (!fieldValue || fieldValue === 0)) {
        return { message: 'Please select company size' };
      }
      
      if (field === 'CorporateRegistrationNumber' && !fieldValue) {
        return { message: 'Please enter corporate registration number' };
      }
      
      if (field === 'CorporateRegistrationNumber' && fieldValue && !validateCorporateRegistrationNumber(fieldValue)) {
        return { message: 'Invalid corporate registration number. Please check the 13-digit number.' };
      }
      
      if (field === 'MainServices' && !fieldValue) {
        return { message: 'Please enter main services' };
      }
      
      if (field === 'RegisteredCapital' && (!fieldValue || (typeof fieldValue === 'number' && fieldValue < 10))) {
        return { message: 'Registered capital must be at least 10 THB' };
      }
      
      if (field === 'HiringRate' && (typeof fieldValue === 'number' && fieldValue < 0)) {
        return { message: 'Hiring rate cannot be negative' };
      }
      
      if (field === 'ResearchInvestmentValue' && (!fieldValue || (typeof fieldValue === 'number' && fieldValue < 1))) {
        return { message: 'Research investment value must be at least 1 THB' };
      }
      
      if (field === 'ThreeYearGrowthForecast' && !fieldValue) {
        return { message: 'Please enter three year growth forecast' };
      }
      
      return null;
    }).filter(error => error !== null);
    
    if (step1Errors.length > 0) {
      // Show error alert if there are validation errors
      setAlerts([{ 
        type: 'error', 
        message: 'Please complete all required fields in Company Information before proceeding.' 
      }]);
      return;
    }
    
    // If all validations pass, proceed to next step
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const onSubmit = async (data: ServiceAreaFormData) => {
    console.log('Form submission started...', data);
    console.log('Form errors:', errors);
    
    // Check if there are any form validation errors
    if (Object.keys(errors).length > 0) {
      console.log('Form has validation errors:', errors);
      setAlerts([{ 
        type: 'error', 
        message: 'Please fix all validation errors before submitting.' 
      }]);
      return;
    }
    
    setIsSubmitting(true);
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setAlerts([{ type: 'error', message: 'User not authenticated.' }]);
        return;
      }
      console.log('User ID:', userId);

      // Check if we're on step 2 and validate required fields
      if (currentStep === 2) {
        const step2Fields = [
          'PurposeOfUsingSpace',
          'NumberOfEmployees',
          'ActivitiesInBuilding',
          'CollaborationPlan',
          'CollaborationBudget',
          'ProjectStartDate',
          'ProjectEndDate',
          'SupportingActivitiesForSciencePark'
        ] as const;
        
        const step2Errors = step2Fields.map(field => {
          const fieldValue = data[field];
          const fieldError = errors[field];
          
          if (fieldError) {
            return fieldError;
          }
          
          if (!fieldValue || (typeof fieldValue === 'string' && fieldValue.trim() === '') || 
              (typeof fieldValue === 'number' && fieldValue === 0)) {
            return { message: `Please complete ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}` };
          }
          
          return null;
        }).filter(error => error !== null);
        
        if (step2Errors.length > 0) {
          setAlerts([{ 
            type: 'error', 
            message: 'Please complete all required fields in Service Area Request before submitting.' 
          }]);
          setIsSubmitting(false);
          return;
        }
      }

      const formData = new FormData();
      formData.append('purpose_of_using_space', data.PurposeOfUsingSpace);
      formData.append('number_of_employees', data.NumberOfEmployees.toString());
      formData.append('activities_in_building', data.ActivitiesInBuilding);
      formData.append('collaboration_plan', data.CollaborationPlan);
      formData.append('collaboration_budget', data.CollaborationBudget.toString());
      formData.append('project_start_date', data.ProjectStartDate);
      formData.append('project_end_date', data.ProjectEndDate);
      formData.append('supporting_activities_for_science_park', data.SupportingActivitiesForSciencePark);
      
      if (documentFile) {
        formData.append('service_request_document', documentFile);
      }
      
      formData.append('corporate_registration_number', data.CorporateRegistrationNumber);
      formData.append('business_group_id', data.BusinessGroupID.toString());
      formData.append('company_size_id', data.CompanySizeID.toString());
      formData.append('main_services', data.MainServices);
      formData.append('registered_capital', data.RegisteredCapital.toString());
      formData.append('hiring_rate', data.HiringRate.toString());
      formData.append('research_investment_value', data.ResearchInvestmentValue.toString());
      formData.append('three_year_growth_forecast', data.ThreeYearGrowthForecast);

      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

          console.log('Submitting from step:', currentStep);
    
    // Trigger validation for all fields before submitting
    const isValid = await trigger();
    if (!isValid) {
      console.log('Form validation failed');
      setAlerts([{ 
        type: 'error', 
        message: 'Please fix all validation errors before submitting.' 
      }]);
      setIsSubmitting(false);
      return;
    }
    
    const response = await CreateRequestServiceAreaAndAboutCompany(parseInt(userId), formData);
    console.log('API Response:', response);

      // Check if response exists and has data
      if (response && response.message) {
        setAlerts([{ type: 'success', message: response.message || 'Service area request created successfully!' }]);
        reset();
        setDocumentFile(null);
        setCurrentStep(1); // Reset to first step
      } else {
        setAlerts([{ type: 'error', message: 'Failed to create request. Please try again.' }]);
      }
    } catch (error: any) {
      console.error('Error:', error);
      if (error.response) {
        // Server responded with error
        console.error('Server error:', error.response.data);
        setAlerts([{ 
          type: 'error', 
          message: error.response.data?.error || error.response.data?.message || 'Server error occurred.' 
        }]);
      } else if (error.request) {
        // Network error
        console.error('Network error:', error.request);
        setAlerts([{ 
          type: 'error', 
          message: 'Network error. Please check your connection and try again.' 
        }]);
      } else {
        // Other error
        setAlerts([{ 
          type: 'error', 
          message: 'An unexpected error occurred. Please try again.' 
        }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {alerts.map((alert, index) => (
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
      ))}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Building2 size={26} />
          <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>Create Service Area Request</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FontAwesomeIcon icon={faBook} />}
          onClick={() => {
            const manualContent = `CREATE SERVICE AREA REQUEST MANUAL\n\nThis form allows you to create a service area request with company information.`;
            const blob = new Blob([manualContent], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'CreateServiceAreaRequest_Manual.txt';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }}
        >
          Download Manual
        </Button>
      </div>

      <div className="create-service-area">
        <form onSubmit={handleSubmit(onSubmit)} className="create-service-area-form">
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Grid container spacing={3}>
            
            {/* Step Indicator */}
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: currentStep >= 1 ? '#ff6f00' : '#ccc'
                }}>
                  <Box sx={{ 
                    width: 30, 
                    height: 30, 
                    borderRadius: '50%', 
                    backgroundColor: currentStep >= 1 ? '#ff6f00' : '#ccc',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    1
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: currentStep >= 1 ? 600 : 400 }}>
                    Company Information
                  </Typography>
                </Box>
                <Box sx={{ width: 50, height: 2, backgroundColor: currentStep >= 2 ? '#ff6f00' : '#ccc' }} />
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1,
                  color: currentStep >= 2 ? '#ff6f00' : '#ccc'
                }}>
                  <Box sx={{ 
                    width: 30, 
                    height: 30, 
                    borderRadius: '50%', 
                    backgroundColor: currentStep >= 2 ? '#ff6f00' : '#ccc',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    2
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: currentStep >= 2 ? 600 : 400 }}>
                    Service Area Request
                  </Typography>
                </Box>
              </Box>
            </Grid>

                        {/* Company Information Section - Step 1 */}
            {currentStep === 1 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Building2 size={24} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff6f00' }}>
                      Company Information
                    </Typography>
                  </Box>
                </Grid>

                {/* Corporate Registration Number */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Corporate Registration Number *</Typography>
                  <Controller
                    name="CorporateRegistrationNumber"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please enter corporate registration number',
                      pattern: {
                        value: /^[0-9]{13}$/,
                        message: 'Corporate registration number must be exactly 13 digits'
                      },
                      validate: (value) => {
                        if (!value) return 'Please enter corporate registration number';
                        if (!validateCorporateRegistrationNumber(value)) {
                          return 'Invalid corporate registration number. Please check the 13-digit number.';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Enter corporate registration number"
                        fullWidth
                        error={!!errors.CorporateRegistrationNumber}
                        helperText={
                          errors.CorporateRegistrationNumber?.message || 
                          (field.value && field.value.length === 13 && !errors.CorporateRegistrationNumber ? 
                            "✓ Valid corporate registration number" : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/13 digits entered` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length === 13 && !errors.CorporateRegistrationNumber ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Business Group */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Business Group *</Typography>
                  <Controller
                    name="BusinessGroupID"
                    control={control}
                    defaultValue={1}
                    rules={{ 
                      required: 'Please select business group',
                      validate: (value) => {
                        if (!value || value === 0) return 'Please select business group';
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.BusinessGroupID}>
                        <Select
                          {...field}
                          value={field.value || 0}
                          displayEmpty
                          renderValue={(value) => {
                            if (value === 0 || !value) {
                              return <em>-- Please select business group --</em>;
                            }
                            const selectedGroup = businessGroups.find(group => group.ID === value);
                            return selectedGroup ? selectedGroup.Name : <em>-- Please select business group --</em>;
                          }}
                        >
                          <MenuItem value={0}>
                            <em>-- Please select business group --</em>
                          </MenuItem>
                          {businessGroups.map((group) => (
                            <MenuItem key={group.ID} value={group.ID}>{group.Name}</MenuItem>
                          ))}
                        </Select>
                        {errors.BusinessGroupID && <FormHelperText>{String(errors.BusinessGroupID.message)}</FormHelperText>}
                        {!errors.BusinessGroupID && field.value && field.value !== 0 && (
                          <FormHelperText sx={{ color: 'green' }}>
                            ✓ Business group selected
                          </FormHelperText>
                        )}
                        {/* Hide the default field value display */}
                        <div style={{ display: 'none' }}>{field.value}</div>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Company Size */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Company Size *</Typography>
                  <Controller
                    name="CompanySizeID"
                    control={control}
                    defaultValue={1}
                    rules={{ 
                      required: 'Please select company size',
                      validate: (value) => {
                        if (!value || value === 0) return 'Please select company size';
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.CompanySizeID}>
                        <Select
                          {...field}
                          value={field.value || 0}
                          displayEmpty
                          renderValue={(value) => {
                            if (!value || value === 0) {
                              return <em>-- Please select company size --</em>;
                            }
                            const selectedSize = companySizes.find(size => size.ID === value);
                            return selectedSize ? selectedSize.Name : <em>-- Please select company size --</em>;
                          }}
                        >
                          <MenuItem value={0}>
                            <em>-- Please select company size --</em>
                          </MenuItem>
                          {companySizes.map((size) => (
                            <MenuItem key={size.ID} value={size.ID}>{size.Name}</MenuItem>
                          ))}
                        </Select>
                        {errors.CompanySizeID && <FormHelperText>{String(errors.CompanySizeID.message)}</FormHelperText>}
                        {!errors.CompanySizeID && field.value && field.value !== 0 && (
                          <FormHelperText sx={{ color: 'green' }}>
                            ✓ Company size selected
                          </FormHelperText>
                        )}
                        {/* Hide the default field value display */}
                        <div style={{ display: 'none' }}>{field.value}</div>
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Main Services */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Main Services *</Typography>
                  <Controller
                    name="MainServices"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter main services',
                      minLength: { value: 10, message: 'Main services description must be at least 10 characters long' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Enter main services provided by your company"
                        fullWidth
                        error={!!errors.MainServices}
                        helperText={
                          errors.MainServices?.message || 
                          (field.value && field.value.length >= 10 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/10 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 10 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Registered Capital */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Registered Capital (THB) *</Typography>
                  <Controller
                    name="RegisteredCapital"
                    control={control}
                    defaultValue={0}
                    rules={{
                      required: 'Please enter registered capital',
                      min: { value: 10, message: 'Registered capital must be at least 10 THB' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter registered capital in THB"
                        fullWidth
                        error={!!errors.RegisteredCapital}
                        helperText={
                          errors.RegisteredCapital?.message || 
                          (field.value && field.value >= 10 ? 
                            `Valid amount: ${field.value.toLocaleString()} THB` : 
                            field.value && field.value > 0 ? 
                              `Current: ${field.value.toLocaleString()} THB (minimum: 10 THB)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value >= 10 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Hiring Rate */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Hiring Rate (per person) *</Typography>
                  <Controller
                    name="HiringRate"
                    control={control}
                    defaultValue={0}
                    rules={{
                      required: 'Please enter hiring rate',
                      min: { value: 0, message: 'Hiring rate cannot be negative' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter hiring rate per person"
                        fullWidth
                        error={!!errors.HiringRate}
                        helperText={
                          errors.HiringRate?.message || 
                          (field.value && field.value >= 0 ? 
                            `✓ Valid hiring rate: ${field.value.toLocaleString()} THB per person` : 
                            "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value >= 0 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Research Investment Value */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Research Investment Value (THB) *</Typography>
                  <Controller
                    name="ResearchInvestmentValue"
                    control={control}
                    defaultValue={0}
                    rules={{
                      required: 'Please enter research investment value',
                      min: { value: 1, message: 'Research investment value must be at least 1 THB' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter annual R&D investment in THB"
                        fullWidth
                        error={!!errors.ResearchInvestmentValue}
                        helperText={String(errors.ResearchInvestmentValue?.message || "")}
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value >= 1 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Three Year Growth Forecast */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Three Year Growth Forecast *</Typography>
                  <Controller
                    name="ThreeYearGrowthForecast"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter three year growth forecast',
                      minLength: { value: 10, message: 'Growth forecast must be at least 10 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe your three year growth forecast"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.ThreeYearGrowthForecast}
                        helperText={
                          errors.ThreeYearGrowthForecast?.message || 
                          (field.value && field.value.length >= 10 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/10 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 10 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Next Button for Step 1 */}
                <Grid size={{ xs: 12 }} className="submit-button-container">
                  <Button
                    type="button"
                    variant="contained"
                    color="primary"
                    onClick={handleNext}
                    sx={{ backgroundColor: '#ff6f00' }}
                  >
                    Next: Service Area Request
                  </Button>
                </Grid>
              </>
            )}

            {/* Service Area Request Section - Step 2 */}
            {currentStep === 2 && (
              <>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Building2 size={24} />
                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff6f00' }}>
                      Service Area Request Information
                    </Typography>
                  </Box>
                </Grid>

                {/* Purpose of Using Space */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Purpose of Using Space *</Typography>
                  <Controller
                    name="PurposeOfUsingSpace"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter purpose of using space',
                      minLength: { value: 10, message: 'Purpose must be at least 10 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe the purpose of using this service area"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.PurposeOfUsingSpace}
                        helperText={
                          errors.PurposeOfUsingSpace?.message || 
                          (field.value && field.value.length >= 10 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/10 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 10 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Number of Employees and Collaboration Budget */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Number of Employees *</Typography>
                  <Controller
                    name="NumberOfEmployees"
                    control={control}
                    defaultValue={0}
                    rules={{
                      required: 'Please enter number of employees',
                      min: { value: 1, message: 'Number of employees must be at least 1' },
                      max: { value: 1000, message: 'Number of employees cannot exceed 1000' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter number of employees"
                        fullWidth
                        error={!!errors.NumberOfEmployees}
                        helperText={
                          errors.NumberOfEmployees?.message || 
                          (field.value && field.value >= 1 && field.value <= 1000 ? 
                            `✓ Valid: ${field.value.toLocaleString()} employees` : 
                            field.value && field.value > 0 ? 
                              `Current: ${field.value.toLocaleString()} employees (range: 1-1000)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value >= 1 && field.value <= 1000 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Collaboration Budget (THB) *</Typography>
                  <Controller
                    name="CollaborationBudget"
                    control={control}
                    defaultValue={0}
                    rules={{
                      required: 'Please enter collaboration budget',
                      min: { value: 1000, message: 'Collaboration budget must be at least 1,000 THB' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter collaboration budget in THB"
                        fullWidth
                        error={!!errors.CollaborationBudget}
                        helperText={
                          errors.CollaborationBudget?.message || 
                          (field.value && field.value >= 1000 ? 
                            `✓ Valid budget: ${field.value.toLocaleString()} THB` : 
                            field.value && field.value > 0 ? 
                              `Current: ${field.value.toLocaleString()} THB (minimum: 1,000 THB)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value >= 1000 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Activities in Building */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Activities in Building *</Typography>
                  <Controller
                    name="ActivitiesInBuilding"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter activities in building',
                      minLength: { value: 10, message: 'Activities description must be at least 10 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe the activities that will be conducted in the building"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.ActivitiesInBuilding}
                        helperText={
                          errors.ActivitiesInBuilding?.message || 
                          (field.value && field.value.length >= 10 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/10 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 10 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Collaboration Plan */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Collaboration Plan *</Typography>
                  <Controller
                    name="CollaborationPlan"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter collaboration plan',
                      minLength: { value: 20, message: 'Collaboration plan must be at least 20 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe your plan for collaboration with Science Park"
                        fullWidth
                        multiline
                        rows={4}
                        error={!!errors.CollaborationPlan}
                        helperText={
                          errors.CollaborationPlan?.message || 
                          (field.value && field.value.length >= 20 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/20 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 20 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Project Dates */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Project Start Date *</Typography>
                  <Controller
                    name="ProjectStartDate"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please select project start date',
                      validate: (value) => {
                        if (!value) return 'Please select project start date';
                        const startDate = dayjs(value);
                        const today = dayjs();
                        if (startDate.isBefore(today, 'day')) {
                          return 'Project start date must be in the future';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          {...field}
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                          label="Select project start date"
                        />
                        {errors.ProjectStartDate && (
                          <FormHelperText error>{errors.ProjectStartDate.message}</FormHelperText>
                        )}
                        {!errors.ProjectStartDate && field.value && (
                          <FormHelperText sx={{ color: 'green' }}>
                            ✓ Project start date selected: {dayjs(field.value).format('DD/MM/YYYY')}
                          </FormHelperText>
                        )}
                      </>
                    )}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Project End Date *</Typography>
                  <Controller
                    name="ProjectEndDate"
                    control={control}
                    defaultValue=""
                    rules={{
                      required: 'Please select project end date',
                      validate: (value) => {
                        if (!value) return 'Please select project end date';
                        const endDate = dayjs(value);
                        const startDate = dayjs(watch('ProjectStartDate'));
                        if (endDate.isBefore(startDate, 'day')) {
                          return 'Project end date must be after start date';
                        }
                        return true;
                      }
                    }}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          {...field}
                          value={field.value ? dayjs(field.value) : null}
                          onChange={(date) => field.onChange(date ? date.format('YYYY-MM-DD') : '')}
                          label="Select project end date"
                        />
                        {errors.ProjectEndDate && (
                          <FormHelperText error>{errors.ProjectEndDate.message}</FormHelperText>
                        )}
                        {!errors.ProjectEndDate && field.value && (
                          <FormHelperText sx={{ color: 'green' }}>
                            ✓ Project end date selected: {dayjs(field.value).format('DD/MM/YYYY')}
                          </FormHelperText>
                        )}
                      </>
                    )}
                  />
                </Grid>

                {/* Supporting Activities */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Supporting Activities for Science Park *</Typography>
                  <Controller
                    name="SupportingActivitiesForSciencePark"
                    control={control}
                    defaultValue=""
                    rules={{ 
                      required: 'Please enter supporting activities',
                      minLength: { value: 20, message: 'Supporting activities description must be at least 20 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe how your activities will support Science Park"
                        fullWidth
                        multiline
                        rows={4}
                        error={!!errors.SupportingActivitiesForSciencePark}
                        helperText={
                          errors.SupportingActivitiesForSciencePark?.message || 
                          (field.value && field.value.length >= 20 ? 
                            `✓ Valid (${field.value.length} characters)` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/20 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 20 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Document Upload */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Service Request Document (Optional)</Typography>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<FontAwesomeIcon icon={faFileUpload} />}
                    sx={{ marginTop: 1 }}
                  >
                    Upload Document
                    <input
                      type="file"
                      hidden
                      accept=".pdf,.doc,.docx"
                      onChange={handleDocumentChange}
                    />
                  </Button>
                  {documentFile && (
                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                      Selected file: {documentFile.name}
                    </Typography>
                  )}
                </Grid>

                {/* Submit Buttons for Step 2 */}
                <Grid size={{ xs: 12 }} className="submit-button-container">
                  <Button
                    type="button"
                    variant="outlined"
                    startIcon={<FontAwesomeIcon icon={faRotateRight} />}
                    sx={{ marginRight: 2 }}
                    onClick={handleBack}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    disabled={isSubmitting}
                    sx={{ backgroundColor: '#ff6f00' }}
                  >
                    {isSubmitting ? 'Creating Request...' : 'Create Request'}
                  </Button>
                </Grid>
              </>
                        )}

            </Grid>
          </LocalizationProvider>
        </form>
      </div>
    </>
  );
};

export default CreateServiceAreaForm;
