import React, { useState, useEffect } from "react";
import {
    Container,
    Typography,
    Grid,
    Card,
    Box,
    Button,
    Alert,
    CircularProgress,
} from "@mui/material";
import { TextField } from "../../components/TextField/TextField";
import { ArrowLeft, X, Building2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileUpload } from "@fortawesome/free-solid-svg-icons";
import theme from "../../styles/Theme";
import { GetRequestServiceAreaByID, CancelRequestServiceArea as CancelRequestServiceAreaAPI } from "../../services/http";
import { RequestServiceAreaInterface } from "../../interfaces/IRequestServiceArea";
import { TextArea } from "../../components/TextField/TextArea";
import SuccessAlert from "../../components/Alert/SuccessAlert";
import ErrorAlert from "../../components/Alert/ErrorAlert";
import { validateCorporateRegistrationNumber } from "../../utils/corporateRegistrationValidator";

// Interface for cancel form data
interface CancelFormData {
    CompanyName: string;
    CorporateRegistrationNumber: string;
    PurposeOfCancellation: string;
    ProjectActivities: string;
    AnnualIncome: number;
}

const CancelRequestServiceArea: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const requestId = searchParams.get("request_id");
    
    const { control, handleSubmit, formState: { errors }, setValue, watch, trigger } = useForm<CancelFormData>();
    
    const [requestData, setRequestData] = useState<RequestServiceAreaInterface | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alerts, setAlerts] = useState<{ type: string, message: string }[]>([]);
    const [cancellationDocument, setCancellationDocument] = useState<File | null>(null);
    const [bankAccountDocument, setBankAccountDocument] = useState<File | null>(null);

    // Watch all form fields for real-time validation
    const watchedFields = watch();

    // Real-time validation for Corporate Registration Number
    useEffect(() => {
        if (watchedFields.CorporateRegistrationNumber && watchedFields.CorporateRegistrationNumber.length === 13) {
            trigger('CorporateRegistrationNumber');
        }
    }, [watchedFields.CorporateRegistrationNumber, trigger]);

    // Real-time validation for Purpose of Cancellation
    useEffect(() => {
        if (watchedFields.PurposeOfCancellation && watchedFields.PurposeOfCancellation.length >= 10) {
            trigger('PurposeOfCancellation');
        }
    }, [watchedFields.PurposeOfCancellation, trigger]);

    // Real-time validation for Project Activities (optional field)
    useEffect(() => {
        if (watchedFields.ProjectActivities && watchedFields.ProjectActivities.length >= 10) {
            trigger('ProjectActivities');
        }
    }, [watchedFields.ProjectActivities, trigger]);

    // Real-time validation for Annual Income
    useEffect(() => {
        if (watchedFields.AnnualIncome !== undefined && watchedFields.AnnualIncome >= 0) {
            trigger('AnnualIncome');
        }
    }, [watchedFields.AnnualIncome, trigger]);

    // Fetch request data and about company
    useEffect(() => {
        const fetchData = async () => {
            if (!requestId) {
                setAlerts([{ type: 'error', message: 'Request ID not found' }]);
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                
                // Fetch request data
                const response = await GetRequestServiceAreaByID(Number(requestId));
                if (response) {
                    setRequestData(response);
                    
                    // Auto-fill form with company data from API response
                    if (response.data) {
                        setValue('CompanyName', response.data.CompanyName || '');
                        setValue('CorporateRegistrationNumber', response.data.CorporateRegistrationNumber || '');
                        
                        setAlerts([{ type: 'success', message: 'Company information loaded automatically!' }]);
                    }
                } else {
                    setAlerts([{ type: 'error', message: 'Request not found' }]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setAlerts([{ type: 'error', message: 'Failed to load request data' }]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [requestId, setValue]);

    // File upload handlers
    const handleCancellationDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setCancellationDocument(event.target.files[0]);
        }
    };

    const handleBankAccountDocumentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setBankAccountDocument(event.target.files[0]);
        }
    };

    const onSubmit = async (data: CancelFormData) => {
        // Check if required documents are uploaded
        if (!cancellationDocument || !bankAccountDocument) {
            setAlerts([{ 
                type: 'error', 
                message: 'Please upload both required documents before submitting.' 
            }]);
            return;
        }

        try {
            setIsSubmitting(true);
            setAlerts([]);
            
            // Create FormData for API call
            const formData = new FormData();
            formData.append('company_name', data.CompanyName);
            formData.append('corporate_registration_number', data.CorporateRegistrationNumber);
            formData.append('purpose_of_cancellation', data.PurposeOfCancellation);
            formData.append('project_activities', data.ProjectActivities || '');
            formData.append('annual_income', data.AnnualIncome.toString());
            formData.append('cancellation_document', cancellationDocument);
            formData.append('bank_account_document', bankAccountDocument);
            
            // Call API
            const response = await CancelRequestServiceAreaAPI(Number(requestId), formData);
            
            setAlerts([{ 
                type: 'success', 
                message: `Service area request cancelled successfully! Status updated to: ${response.data?.status_name || 'Cancellation In Progress'}` 
            }]);
            
            // Navigate back to My Account after 2 seconds
            setTimeout(() => {
                navigate("/my-account");
            }, 2000);
            
        } catch (error: any) {
            console.error("Error cancelling request:", error);
            const errorMessage = error.response?.data?.error || 'Failed to cancel service area request. Please try again.';
            setAlerts([{ type: 'error', message: errorMessage }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoBack = () => {
        navigate("/my-account");
    };

    if (isLoading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
                    <CircularProgress />
                    <Typography sx={{ ml: 2 }}>Loading request details...</Typography>
                </Box>
            </Container>
        );
    }

    if (!requestData) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Alert severity="error" sx={{ mb: 3 }}>
                    Request details not available.
                </Alert>
                <Button
                    variant="outlined"
                    startIcon={<ArrowLeft size={20} />}
                    onClick={handleGoBack}
                >
                    Back to My Account
                </Button>
            </Container>
        );
    }

    return (
        <>
            {/* Alerts */}
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
                </React.Fragment>
            ))}

            <Container maxWidth="lg" sx={{ py: 4 }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', marginTop: '10px' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Building2 size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>Cancel Service Area Request</Typography>
                    </Box>
                    <Button
                        variant="outlinedGray"
                        startIcon={<ArrowLeft size={20} />}
                        onClick={handleGoBack}
                        disabled={isSubmitting}
                    >
                        Back
                    </Button>
                </div>

                

                {/* Cancellation Form */}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <Card sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3, color: theme.palette.primary.main }}>
                            Cancellation Form
                        </Typography>
                        
                        <Grid container spacing={3}>
                            {/* Field 1: Company Name */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body1" className="title-field">Company Name</Typography>
                                <Controller
                                    name="CompanyName"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: 'Please enter company name',
                                        minLength: { value: 2, message: 'Company name must be at least 2 characters long' }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            placeholder="Enter company name"
                                            fullWidth
                                            disabled
                                            error={!!errors.CompanyName}
                                            helperText={errors.CompanyName?.message || "Note: Cannot be edited. To modify, please go to My Account > Edit Profile"}
                                            slotProps={{
                                                inputLabel: { sx: { color: '#6D6E70' } }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Field 2: Corporate Registration Number */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body1" className="title-field">Corporate Registration Number</Typography>
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
                                            placeholder="Enter corporate registration number"
                                            fullWidth
                                            error={!!errors.CorporateRegistrationNumber}
                                            helperText={errors.CorporateRegistrationNumber?.message}
                                            slotProps={{
                                                inputLabel: { sx: { color: '#6D6E70' } }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Field 3: Purpose of Cancellation */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body1" className="title-field">Purpose of Requesting Cancellation of Service Area Usage</Typography>
                                <Controller
                                    name="PurposeOfCancellation"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        required: 'Please enter purpose of cancellation',
                                        minLength: { value: 10, message: 'Purpose must be at least 10 characters long' }
                                    }}
                                    render={({ field }) => (
                                        <TextArea
                                            {...field}
                                            
                                            placeholder="Please describe the purpose of cancelling this service area"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            error={!!errors.PurposeOfCancellation}
                                            helperText={errors.PurposeOfCancellation?.message}
                                            slotProps={{
                                                inputLabel: { sx: { color: '#6D6E70' } }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Field 4: Project Activities */}
                            <Grid size={{ xs: 12 }}>
                                <Typography variant="body1" className="title-field">Projects, Activities, or Products Developed in Collaboration with Science Park (if any)</Typography>
                                <Controller
                                    name="ProjectActivities"
                                    control={control}
                                    defaultValue=""
                                    rules={{
                                        minLength: { value: 10, message: 'Project activities must be at least 10 characters long' }
                                    }}
                                    render={({ field }) => (
                                        <TextArea
                                            {...field}
                                            
                                            placeholder="Please describe any projects, activities, or products developed with Science Park"
                                            fullWidth
                                            multiline
                                            rows={3}
                                            error={!!errors.ProjectActivities}
                                            helperText={errors.ProjectActivities?.message || "Optional field"}
                                            slotProps={{
                                                inputLabel: { sx: { color: '#6D6E70' } }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Field 5: Annual Income */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Typography variant="body1" className="title-field">Annual Income During Service Provision in Science Park</Typography>
                                <Controller
                                    name="AnnualIncome"
                                    control={control}
                                    defaultValue={0}
                                    rules={{
                                        min: { value: 0, message: 'Annual income cannot be negative' }
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            type="number"
                                            
                                            placeholder="Enter annual income in THB"
                                            fullWidth
                                            error={!!errors.AnnualIncome}
                                            helperText={errors.AnnualIncome?.message || "Enter 0 if no income"}
                                            slotProps={{
                                                inputLabel: { sx: { color: '#6D6E70' } }
                                            }}
                                        />
                                    )}
                                />
                            </Grid>

                            {/* Field 6: Cancellation Document Upload */}
                            <Grid size={{ xs: 12, sm: 12 }}>
                                <Typography variant="body1" className="title-field">Attach Documents Showing Intention to Cancel Service Area Usage</Typography>
                                <Button
                                    variant="outlinedGray"
                                    component="label"
                                    startIcon={<FontAwesomeIcon icon={faFileUpload} />}
                                    sx={{ marginTop: 1 }}
                                >
                                    Upload Cancellation Document
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf"
                                        onChange={handleCancellationDocumentChange}
                                    />
                                </Button>
                                {cancellationDocument ? (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                                        ✓ Selected file: {cancellationDocument.name}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                                        Please upload cancellation document (.pdf)
                                    </Typography>
                                )}
                            </Grid>

                            {/* Field 7: Bank Account Document Upload */}
                            <Grid size={{ xs: 12, sm: 12 }}>
                                <Typography variant="body1" className="title-field">Attach Copy of Bank Account for Receiving Security Deposit Refund</Typography>
                                <Button
                                    variant="outlinedGray"
                                    component="label"
                                    startIcon={<FontAwesomeIcon icon={faFileUpload} />}
                                    sx={{ marginTop: 1 }}
                                >
                                    Upload Bank Account Document
                                    <input
                                        type="file"
                                        hidden
                                        accept=".pdf"
                                        onChange={handleBankAccountDocumentChange}
                                    />
                                </Button>
                                {bankAccountDocument ? (
                                    <Typography variant="body2" sx={{ mt: 1, color: 'green' }}>
                                        ✓ Selected file: {bankAccountDocument.name}
                                    </Typography>
                                ) : (
                                    <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
                                        Please upload bank account document (.pdf)
                                    </Typography>
                                )}
                            </Grid>

                            {/* Action Buttons */}
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="error"
                                        startIcon={isSubmitting ? <CircularProgress size={20} /> : <X size={20} />}
                                        disabled={isSubmitting}
                                        sx={{ backgroundColor: '#ff6f00' }}
                                    >
                                        {isSubmitting ? "Cancelling..." : "Cancel Request"}
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>
                    </Card>
                </form>
            </Container>
        </>
    );
};

export default CancelRequestServiceArea;
