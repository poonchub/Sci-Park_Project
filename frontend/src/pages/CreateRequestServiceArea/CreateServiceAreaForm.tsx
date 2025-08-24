import React, { useState, useEffect } from 'react';
import { Button, MenuItem, FormControl, FormHelperText, Typography, Grid, Box } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import './CreateServiceAreaForm.css';
import { 
  CreateRequestServiceAreaAndAboutCompany, 
  ListBusinessGroups, 
  ListCompanySizes,
  ListServiceUserTypes,
  GetUserById,
  UpdateUserbyID,
  GetAboutCompanyByUserID
} from '../../services/http';
import { BusinessGroupInterface } from '../../interfaces/IBusinessGroup';
import { CompanySizeInterface } from '../../interfaces/ICompanySize';
import { ServiceUserTypeInterface } from '../../interfaces/IServiceUserType';
import { ServiceAreaFormData } from '../../interfaces/IServiceAreaForm';
import { CollaborationPlanData } from '../../interfaces/ICollaborationPlan';
import { GetUserInterface } from '../../interfaces/IGetUser';
import { AboutCompanyInterface } from '../../interfaces/IAboutCompany';
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
import PrivacyPolicyPopup from '../../components/PrivacyPolicyPopup/PrivacyPolicyPopup';
import { analyticsService, KEY_PAGES } from '../../services/analyticsService';
import { useInteractionTracker } from '../../hooks/useInteractionTracker';

const CreateServiceAreaForm: React.FC = () => {
  const { control, handleSubmit, reset, formState: { errors }, watch, trigger, setValue } = useForm<ServiceAreaFormData>();
  const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);
  const [companySizes, setCompanySizes] = useState<CompanySizeInterface[]>([]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1 = Company Info, 2 = Service Area Request
  const [collaborationPlans, setCollaborationPlans] = useState<CollaborationPlanData[]>([
    { plan: '', budget: 0, startDate: '' }
  ]);
  const [collaborationPlanErrors, setCollaborationPlanErrors] = useState<{ [key: number]: { plan?: string; budget?: string; startDate?: string } }>({});
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<FormData | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'th' | 'en'>('th');
  const [user, setUser] = useState<GetUserInterface | null>(null);
  const [aboutCompany, setAboutCompany] = useState<AboutCompanyInterface | null>(null);
  
  // Initialize interaction tracker
  const { getInteractionCount } = useInteractionTracker({
      pagePath: KEY_PAGES.CREATE_SERVICE_AREA,
      onInteractionChange: () => { },
  });
  
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
    if (watchedFields.SupportingActivitiesForSciencePark && watchedFields.SupportingActivitiesForSciencePark.length >= 20) {
      trigger('SupportingActivitiesForSciencePark');
    }
  }, [watchedFields.SupportingActivitiesForSciencePark, trigger]);

  // Real-time validation for dropdown fields
  useEffect(() => {
    if (watchedFields.BusinessGroupID !== undefined && watchedFields.BusinessGroupID !== null && watchedFields.BusinessGroupID !== 0) {
      trigger('BusinessGroupID');
    }
  }, [watchedFields.BusinessGroupID, trigger]);

  useEffect(() => {
    if (watchedFields.CompanySizeID !== undefined && watchedFields.CompanySizeID !== null && watchedFields.CompanySizeID !== 0) {
      trigger('CompanySizeID');
    }
  }, [watchedFields.CompanySizeID, trigger]);

  // Real-time validation for Company Name
  useEffect(() => {
    if (watchedFields.CompanyName && watchedFields.CompanyName.length > 0) {
      trigger('CompanyName');
    }
  }, [watchedFields.CompanyName, trigger]);

  // Real-time validation for Business Detail
  useEffect(() => {
    if (watchedFields.BusinessDetail && watchedFields.BusinessDetail.length > 0) {
      trigger('BusinessDetail');
    }
  }, [watchedFields.BusinessDetail, trigger]);

  // Set form values when user data is loaded
  useEffect(() => {
    if (user) {
      setValue('CompanyName', user.CompanyName || '');
      setValue('BusinessDetail', user.BusinessDetail || '');
    }
  }, [user, setValue]);

  // Set form values when about company data is loaded
  useEffect(() => {
    if (aboutCompany) {
      setValue('CorporateRegistrationNumber', aboutCompany.CorporateRegistrationNumber || '');
      setValue('BusinessGroupID', aboutCompany.BusinessGroupID || null);
      setValue('CompanySizeID', aboutCompany.CompanySizeID || null);
      setValue('MainServices', aboutCompany.MainServices || '');
      setValue('RegisteredCapital', aboutCompany.RegisteredCapital || 0);
      setValue('HiringRate', aboutCompany.HiringRate || 0);
      setValue('ResearchInvestmentValue', aboutCompany.ResearchInvestmentValue || 0);
      setValue('ThreeYearGrowthForecast', aboutCompany.ThreeYearGrowthForecast || '');
    }
  }, [aboutCompany, setValue]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          setAlerts([{ type: 'error', message: 'User not authenticated.' }]);
          return;
        }

        const [businessGroupData, companySizeData, userData] = await Promise.all([
          ListBusinessGroups(),
          ListCompanySizes(),
          GetUserById(parseInt(userId))
        ]);
        
        setBusinessGroups(businessGroupData);
        setCompanySizes(companySizeData);
        setUser(userData);

        // Try to fetch AboutCompany data if exists
        try {
          const aboutCompanyData = await GetAboutCompanyByUserID(parseInt(userId));
          setAboutCompany(aboutCompanyData);
          
          setAlerts([{ type: 'success', message: 'Previous company information loaded automatically!' }]);
        } catch (aboutCompanyError) {
          // If AboutCompany not found, it's okay - user will fill the form manually
          console.log('No existing AboutCompany data found, user will fill manually');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setAlerts([{ type: 'error', message: 'Failed to load form data.' }]);
      }
    };
    fetchData();
  }, []);

  // Analytics tracking
  useEffect(() => {
    const startTime = Date.now();
    let sent = false;

    // ส่ง request ตอนเข้า (duration = 0)
    analyticsService.trackPageVisit({
      user_id: Number(localStorage.getItem('userId')),
      page_path: KEY_PAGES.CREATE_SERVICE_AREA,
      page_name: 'Create Service Area Request',
      duration: 0, // ตอนเข้า duration = 0
      is_bounce: false,
    });

    // ฟังก์ชันส่ง analytics ตอนออก
    const sendAnalyticsOnLeave = (isBounce: boolean) => {
      if (sent) {
        return;
      }
      sent = true;
      const duration = Math.floor((Date.now() - startTime) / 1000);
      analyticsService.trackPageVisit({
        user_id: Number(localStorage.getItem('userId')),
        page_path: KEY_PAGES.CREATE_SERVICE_AREA,
        page_name: 'Create Service Area Request',
        duration,
        is_bounce: isBounce,
        interaction_count: getInteractionCount(),
      });
    };

    // ออกจากหน้าแบบปิด tab/refresh
    const handleBeforeUnload = () => {
      sendAnalyticsOnLeave(true);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ออกจากหน้าแบบ SPA (React)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      sendAnalyticsOnLeave(false);
    };
  }, []);

  const handleDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setDocumentFile(event.target.files[0]);
    }
  };

  const addCollaborationPlan = () => {
    setCollaborationPlans([...collaborationPlans, { plan: '', budget: 0, startDate: '' }]);
  };

  const removeCollaborationPlan = (index: number) => {
    if (collaborationPlans.length > 1) {
      setCollaborationPlans(collaborationPlans.filter((_, i) => i !== index));
      
      // Remove errors for the deleted plan
      if (collaborationPlanErrors[index]) {
        const updatedErrors = { ...collaborationPlanErrors };
        delete updatedErrors[index];
        // Reindex the errors
        const reindexedErrors: { [key: number]: { plan?: string; budget?: string; startDate?: string } } = {};
        Object.keys(updatedErrors).forEach(key => {
          const oldIndex = parseInt(key);
          if (oldIndex > index) {
            reindexedErrors[oldIndex - 1] = updatedErrors[oldIndex];
          } else {
            reindexedErrors[oldIndex] = updatedErrors[oldIndex];
          }
        });
        setCollaborationPlanErrors(reindexedErrors);
      }
    }
  };

  const updateCollaborationPlan = (index: number, field: keyof CollaborationPlanData, value: string | number) => {
    const updatedPlans = [...collaborationPlans];
    updatedPlans[index] = { ...updatedPlans[index], [field]: value };
    setCollaborationPlans(updatedPlans);
    
    // Clear error for this field when user starts typing
    if (collaborationPlanErrors[index]) {
      const updatedErrors = { ...collaborationPlanErrors };
      delete updatedErrors[index][field];
      if (Object.keys(updatedErrors[index]).length === 0) {
        delete updatedErrors[index];
      }
      setCollaborationPlanErrors(updatedErrors);
    }
  };

  const validateCollaborationPlans = () => {
    const errors: { [key: number]: { plan?: string; budget?: string; startDate?: string } } = {};
    
    collaborationPlans.forEach((plan, index) => {
      const planErrors: { plan?: string; budget?: string; startDate?: string } = {};
      
      if (!plan.plan.trim()) {
        planErrors.plan = 'Please enter collaboration plan description';
      } else if (plan.plan.length < 20) {
        planErrors.plan = 'Collaboration plan must be at least 20 characters long';
      }
      
      if (plan.budget < 0) {
        planErrors.budget = 'Budget cannot be negative';
      }
      
      if (!plan.startDate) {
        planErrors.startDate = 'Please select project start year';
      }
      
      if (Object.keys(planErrors).length > 0) {
        errors[index] = planErrors;
      }
    });
    
    setCollaborationPlanErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = async () => {
    // Trigger validation for all fields in step 1
    const step1Fields = [
      'CorporateRegistrationNumber',
      'BusinessGroupID', 
      'CompanySizeID',
      'MainServices',
      'RegisteredCapital',
      'HiringRate',
      'ResearchInvestmentValue',
      'ThreeYearGrowthForecast',
      'CompanyName',
      'BusinessDetail'
    ] as const;
    
    // Trigger validation for all step 1 fields
    const isValid = await trigger(step1Fields);
    
    if (!isValid) {
      // If validation fails, the form will show red error messages automatically
      // No need to show alert - just return and let the form display the errors
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
    
    // Prepare form data for submission
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setAlerts([{ type: 'error', message: 'User not authenticated.' }]);
      return;
    }

    // Check if we're on step 2 and validate required fields
    if (currentStep === 2) {
      const step2Fields = [
        'PurposeOfUsingSpace',
        'NumberOfEmployees',
        'ActivitiesInBuilding',
        'SupportingActivitiesForSciencePark'
      ] as const;
      
      // Check if document is uploaded
      if (!documentFile) {
        setAlerts([{ 
          type: 'error', 
          message: 'Please upload a service request document before submitting.' 
        }]);
        return;
      }
      
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
      
      // Validate collaboration plans
      const isCollaborationPlansValid = validateCollaborationPlans();
      
      const allErrors = [...step2Errors];
      
      if (allErrors.length > 0 || !isCollaborationPlansValid) {
        setAlerts([{ 
          type: 'error', 
          message: 'Please complete all required fields in Service Area Request before submitting.' 
        }]);
        return;
      }
    }

    // Create form data
    const formData = new FormData();
    formData.append('purpose_of_using_space', data.PurposeOfUsingSpace);
    formData.append('number_of_employees', data.NumberOfEmployees.toString());
    formData.append('activities_in_building', data.ActivitiesInBuilding);
    formData.append('supporting_activities_for_science_park', data.SupportingActivitiesForSciencePark);
    
    // Add collaboration plans as arrays
    collaborationPlans.forEach((plan, index) => {
      if (plan.plan.trim()) {
        formData.append('collaboration_plan[]', plan.plan);
        formData.append('collaboration_budgets[]', plan.budget.toString());
        formData.append('project_start_dates[]', plan.startDate);
      }
    });
    
    if (documentFile) {
      formData.append('service_request_document', documentFile);
    }
    
    formData.append('corporate_registration_number', data.CorporateRegistrationNumber);
    formData.append('business_group_id', (data.BusinessGroupID || 0).toString());
    formData.append('company_size_id', (data.CompanySizeID || 0).toString());
    formData.append('main_services', data.MainServices);
    formData.append('registered_capital', data.RegisteredCapital.toString());
    formData.append('hiring_rate', data.HiringRate.toString());
    formData.append('research_investment_value', data.ResearchInvestmentValue.toString());
    formData.append('three_year_growth_forecast', data.ThreeYearGrowthForecast);
    formData.append('company_name', data.CompanyName);
    formData.append('business_detail', data.BusinessDetail);

    // Store form data and show privacy policy popup
    setFormDataToSubmit(formData);
    setShowPrivacyPolicy(true);
  };

  const handlePrivacyPolicyAccept = async () => {
    if (!formDataToSubmit) return;
    
    setIsSubmitting(true);
    setShowPrivacyPolicy(false);
    
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        setAlerts([{ type: 'error', message: 'User not authenticated.' }]);
        return;
      }

      console.log('FormData entries:');
      for (let [key, value] of formDataToSubmit.entries()) {
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
      
      const response = await CreateRequestServiceAreaAndAboutCompany(parseInt(userId), formDataToSubmit);
      console.log('API Response:', response);

      // Check if response exists and has data
      if (response && response.message) {
        // Get form data from FormData
        const formDataObj = Object.fromEntries(formDataToSubmit.entries());
        const companyName = formDataObj.company_name as string;
        const businessDetail = formDataObj.business_detail as string;
        
        // Check if company information was updated
        const currentUser = await GetUserById(parseInt(userId));
        if (currentUser) {
          const companyNameChanged = currentUser.CompanyName !== companyName;
          const businessDetailChanged = currentUser.BusinessDetail !== businessDetail;
          
          if (companyNameChanged || businessDetailChanged) {
            // Update user information if company data changed
            const updateUserData = {
              UserID: parseInt(userId),
              CompanyName: companyName,
              BusinessDetail: businessDetail,
              FirstName: currentUser.FirstName || '',
              LastName: currentUser.LastName || '',
              Email: currentUser.Email || '',
              Phone: currentUser.Phone || '',
              GenderID: currentUser.GenderID || 1, // Default gender ID since it's not directly available
              RoleID: currentUser.RoleID || 1,
              RequestTypeID: currentUser.RequestTypeID || 1,
              EmployeeID: currentUser.EmployeeID || '',
              ImageCheck: currentUser.ImageCheck || '',
              SignatureCheck: currentUser.SignatureCheck || ''
            };
            
            const userUpdateResponse = await UpdateUserbyID(updateUserData);
            if (userUpdateResponse.status === 'success') {
              setAlerts([{ type: 'success', message: 'Service area request created and company information updated successfully!' }]);
            } else {
              setAlerts([{ type: 'success', message: 'Service area request created successfully! (Company information update failed)' }]);
            }
          } else {
            setAlerts([{ type: 'success', message: response.message || 'Service area request created successfully!' }]);
          }
        } else {
          setAlerts([{ type: 'success', message: response.message || 'Service area request created successfully!' }]);
        }
        
        reset();
        setDocumentFile(null);
        setCollaborationPlans([{ plan: '', budget: 0, startDate: '' }]);
        setCollaborationPlanErrors({});
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
      setFormDataToSubmit(null);
    }
  };

  const handlePrivacyPolicyDecline = () => {
    setShowPrivacyPolicy(false);
    setFormDataToSubmit(null);
  };

  return (
    <>
      {/* Privacy Policy Popup */}
      <PrivacyPolicyPopup
        open={showPrivacyPolicy}
        onAccept={handlePrivacyPolicyAccept}
        onDecline={handlePrivacyPolicyDecline}
        onClose={() => setShowPrivacyPolicy(false)}
        language={currentLanguage}
        onLanguageChange={setCurrentLanguage}
      />

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
                    {aboutCompany && (
                      <Typography variant="body2" sx={{ color: 'green', ml: 2, fontStyle: 'italic' }}>
                        ✓ Previous data loaded
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Company Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Company Name</Typography>
                  <Controller
                    name="CompanyName"
                    control={control}
                    defaultValue={user?.CompanyName || ""}
                    rules={{
                      required: 'Please enter company name',
                      minLength: { value: 2, message: 'Company name must be at least 2 characters long' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Enter company name"
                        fullWidth
                        error={!!errors.CompanyName}
                        helperText={
                          errors.CompanyName?.message || 
                          (field.value && field.value.length >= 2 ? 
                            `✓ Valid company name: ${field.value}` : 
                            field.value && field.value.length > 0 ? 
                              `${field.value.length}/2 characters (minimum required)` : 
                              "")
                        }
                        slotProps={{
                          inputLabel: { sx: { color: '#6D6E70' } }
                        }}
                        sx={{
                          '& .MuiFormHelperText-root': {
                            color: field.value && field.value.length >= 2 ? 'green' : undefined
                          }
                        }}
                      />
                    )}
                  />
                </Grid>

                {/* Corporate Registration Number */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Corporate Registration Number</Typography>
                  <Controller
                    name="CorporateRegistrationNumber"
                    control={control}
                    defaultValue={aboutCompany?.CorporateRegistrationNumber || ""}
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
                  <Typography variant="body1" className="title-field">Business Group</Typography>
                  <Controller
                    name="BusinessGroupID"
                    control={control}
                    defaultValue={aboutCompany?.BusinessGroupID || null}
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
                          value={field.value || ""}
                          displayEmpty
                          renderValue={(value) => {
                            if (!value || value === 0) {
                              return <em>-- Please select business group --</em>;
                            }
                            const selectedGroup = businessGroups.find(group => group.ID === value);
                            return selectedGroup ? selectedGroup.Name : <em>-- Please select business group --</em>;
                          }}
                        >
                          <MenuItem value="">
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
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Company Size */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Company Size</Typography>
                  <Controller
                    name="CompanySizeID"
                    control={control}
                    defaultValue={aboutCompany?.CompanySizeID || null}
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
                          value={field.value || ""}
                          displayEmpty
                          renderValue={(value) => {
                            if (!value || value === 0) {
                              return <em>-- Please select company size --</em>;
                            }
                            const selectedSize = companySizes.find(size => size.ID === value);
                            return selectedSize ? selectedSize.Name : <em>-- Please select company size --</em>;
                          }}
                        >
                          <MenuItem value="">
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
                      </FormControl>
                    )}
                  />
                </Grid>

                {/* Main Services */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body1" className="title-field">Main Services</Typography>
                  <Controller
                    name="MainServices"
                    control={control}
                    defaultValue={aboutCompany?.MainServices || ""}
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
                  <Typography variant="body1" className="title-field">Registered Capital (THB)</Typography>
                  <Controller
                    name="RegisteredCapital"
                    control={control}
                    defaultValue={aboutCompany?.RegisteredCapital || 0}
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
                  <Typography variant="body1" className="title-field">Hiring Rate (number of people)</Typography>
                  <Controller
                    name="HiringRate"
                    control={control}
                    defaultValue={aboutCompany?.HiringRate || 0}
                    rules={{
                      required: 'Please enter hiring rate',
                      min: { value: 0, message: 'Number of people to hire cannot be negative' }
                    }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Enter number of people to hire"
                        fullWidth
                        error={!!errors.HiringRate}
                        helperText={
                          errors.HiringRate?.message || 
                          (field.value && field.value >= 0 ? 
                            `✓ Valid hiring rate: ${field.value.toLocaleString()} people` : 
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
                  <Typography variant="body1" className="title-field">Research Investment Value (THB)</Typography>
                  <Controller
                    name="ResearchInvestmentValue"
                    control={control}
                    defaultValue={aboutCompany?.ResearchInvestmentValue || 0}
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
                        helperText={
                          errors.ResearchInvestmentValue?.message || 
                          (field.value && field.value >= 1 ? 
                            `✓ Valid amount: ${field.value.toLocaleString()} THB` : 
                            field.value && field.value > 0 ? 
                              `Current: ${field.value.toLocaleString()} THB (minimum: 1 THB)` : 
                              "")
                        }
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

                {/* Company Description */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Company Description</Typography>
                  <Controller
                    name="BusinessDetail"
                    control={control}
                    defaultValue={user?.BusinessDetail || ""}
                    rules={{ 
                      required: 'Please enter company description',
                      minLength: { value: 10, message: 'Company description must be at least 10 characters long' }
                    }}
                    render={({ field }) => (
                      <TextArea
                        {...field}
                        label="Please describe your company and business activities"
                        fullWidth
                        multiline
                        rows={3}
                        error={!!errors.BusinessDetail}
                        helperText={
                          errors.BusinessDetail?.message || 
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

                {/* Three Year Growth Forecast */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Three Year Growth Forecast</Typography>
                  <Controller
                    name="ThreeYearGrowthForecast"
                    control={control}
                    defaultValue={aboutCompany?.ThreeYearGrowthForecast || ""}
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
                  <Typography variant="body1" className="title-field">Purpose of Using Space</Typography>
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
                  <Typography variant="body1" className="title-field">Number of Employees</Typography>
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



                {/* Activities in Building */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Activities in Building</Typography>
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

                {/* Collaboration Plans */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body1" className="title-field">Collaboration Plans</Typography>
                    <Button
                      type="button"
                      variant="outlined"
                      size="small"
                      onClick={addCollaborationPlan}
                      sx={{ backgroundColor: '#ff6f00', color: 'white', '&:hover': { backgroundColor: '#e65100' } }}
                    >
                      Add Plan
                    </Button>
                  </Box>
                  
                  {collaborationPlans.map((plan, index) => (
                    <Box key={index} sx={{ border: '1px solid #ddd', borderRadius: 2, p: 2, mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#ff6f00' }}>
                          Collaboration Plan {index + 1}
                        </Typography>
                        {collaborationPlans.length > 1 && (
                          <Button
                            type="button"
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={() => removeCollaborationPlan(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Project Start Year"
                            type="number"
                            value={plan.startDate ? dayjs(plan.startDate).year() : ''}
                            onChange={(e) => {
                              const year = parseInt(e.target.value);
                              const currentYear = dayjs().year();
                              const maxYear = currentYear + 5;
                              if (year && year >= currentYear && year <= maxYear) {
                                const date = dayjs().year(year).startOf('year');
                                updateCollaborationPlan(index, 'startDate', date.format('YYYY-MM-DD'));
                              } else if (e.target.value === '') {
                                updateCollaborationPlan(index, 'startDate', '');
                              }
                            }}
                            inputProps={{
                              min: dayjs().year(),
                              max: dayjs().year() + 5,
                              step: 1
                            }}
                            fullWidth
                            error={!!collaborationPlanErrors[index]?.startDate}
                            helperText={
                              collaborationPlanErrors[index]?.startDate || 
                              (plan.startDate ? 
                                `✓ Start year: ${dayjs(plan.startDate).year()}` : 
                                `Please enter project start year (${dayjs().year()}-${dayjs().year() + 5})`)
                            }
                            sx={{
                              '& .MuiFormHelperText-root': {
                                color: collaborationPlanErrors[index]?.startDate ? 'red' : (plan.startDate ? 'green' : undefined)
                              }
                            }}
                          />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="Budget (THB)"
                            type="number"
                            value={plan.budget}
                            onChange={(e) => updateCollaborationPlan(index, 'budget', parseFloat(e.target.value) || 0)}
                            fullWidth
                            error={!!collaborationPlanErrors[index]?.budget}
                            helperText={
                              collaborationPlanErrors[index]?.budget || 
                              (plan.budget >= 0 ? 
                                `✓ Valid budget: ${plan.budget.toLocaleString()} THB` : 
                                "Please enter collaboration budget (cannot be negative)")
                            }
                            sx={{
                              '& .MuiFormHelperText-root': {
                                color: collaborationPlanErrors[index]?.budget ? 'red' : (plan.budget >= 0 ? 'green' : undefined)
                              }
                            }}
                          />
                        </Grid>
                        
                        <Grid size={{ xs: 12 }}>
                          <TextArea
                            label="Collaboration Plan Description"
                            value={plan.plan}
                            onChange={(e) => updateCollaborationPlan(index, 'plan', e.target.value)}
                            fullWidth
                            multiline
                            rows={3}
                            error={!!collaborationPlanErrors[index]?.plan}
                            helperText={
                              collaborationPlanErrors[index]?.plan || 
                              (plan.plan.length >= 20 ? 
                                `✓ Valid (${plan.plan.length} characters)` : 
                                plan.plan.length > 0 ? 
                                  `${plan.plan.length}/20 characters (minimum required)` : 
                                  "Please describe your collaboration plan (minimum 20 characters)")
                            }
                            sx={{
                              '& .MuiFormHelperText-root': {
                                color: collaborationPlanErrors[index]?.plan ? 'red' : (plan.plan.length >= 20 ? 'green' : undefined)
                              }
                            }}
                          />
                        </Grid>
                        
                        
                      </Grid>
                    </Box>
                  ))}
                </Grid>

                {/* Supporting Activities */}
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body1" className="title-field">Supporting Activities for Science Park</Typography>
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
                  <Typography variant="body1" className="title-field">Service Request Document</Typography>
                  <Button
                    variant="outlinedGray"
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
                  {documentFile ? (
                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                      ✓ Selected file: {documentFile.name}
                    </Typography>
                  ) : (
                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                      Please upload a service request document (.pdf, .doc, .docx)
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
