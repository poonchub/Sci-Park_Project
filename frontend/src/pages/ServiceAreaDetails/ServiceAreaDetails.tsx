import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Container, Grid, Skeleton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

import "./ServiceAreaDetails.css";

import { GetServiceAreaDetailsByID, GetRequestStatuses, DownloadServiceRequestDocument, DownloadServiceContractDocument, DownloadAreaHandoverDocument, DownloadQuotationDocument, DownloadRefundGuaranteeDocument, DownloadCancellationDocument, DownloadBankAccountDocument, UpdateRequestServiceAreaStatus, ListBusinessGroups, RejectServiceAreaRequest } from "../../services/http";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";
import { BusinessGroupInterface } from "../../interfaces/IBusinessGroup";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import InfoCard from "../../components/InfoCard/InfoCard";
import ServiceAreaStepper from "../../components/ServiceAreaStepper/ServiceAreaStepper";
import ApproveServiceAreaController from "../../components/ApproveServiceAreaPopup/ApproveServiceAreaController";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import SubmitServiceAreaPopup from "../../components/SubmitServiceAreaPopup/SubmitServiceAreaPopup";
import EditCollaborationPlansPopup from "../../components/EditCollaborationPlansPopup/EditCollaborationPlansPopup";
import { ServiceAreaDetailsInterface } from "../../interfaces/IServiceAreaDetailsInterface";

import dateFormat from "../../utils/dateFormat";
import { isAdmin, isDocumentOperator } from "../../routes";

import { useSearchParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { ChevronLeft, NotebookText, Download, Check, X, Send, Edit } from "lucide-react";

// Interface for Service Area Details response


function ServiceAreaDetails() {
    // Request data
    const [serviceAreaDetails, setServiceAreaDetails] = useState<ServiceAreaDetailsInterface>();
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [requestStatusID, setRequestStatusID] = useState(0);
    const [businessGroups, setBusinessGroups] = useState<BusinessGroupInterface[]>([]);

    // UI state
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

    // Approve/Reject state
    const [openApprovePopup, setOpenApprovePopup] = useState(false);
    const [openRejectPopup, setOpenRejectPopup] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Submit/Cancel state for DocumentOperator
    const [openSubmitPopup, setOpenSubmitPopup] = useState(false);
    const [isSubmittingSubmit, setIsSubmittingSubmit] = useState(false);
    const [openCancelPopup, setOpenCancelPopup] = useState(false);
    
    // Request Cancellation state for Request Owner - removed as we now navigate to form
    // const [openRequestCancellationPopup, setOpenRequestCancellationPopup] = useState(false);
    // const [isSubmittingCancellationRequest, setIsSubmittingCancellationRequest] = useState(false);
    
    // Submit Cancellation state for DocumentOperator
    const [openSubmitCancellationPopup, setOpenSubmitCancellationPopup] = useState(false);
    const [isSubmittingCancellation, setIsSubmittingCancellation] = useState(false);

    // Edit Collaboration Plans state
    const [openEditCollaborationPlansPopup, setOpenEditCollaborationPlansPopup] = useState(false);
    const [isUpdatingCollaborationPlans, setIsUpdatingCollaborationPlans] = useState(false);

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Extract info for cards
    const approverName = serviceAreaDetails?.ApproverUserName;
    const taskUserName = serviceAreaDetails?.TaskUserName;
    const approvalNote = serviceAreaDetails?.ApprovalNote;
    const taskNote = serviceAreaDetails?.TaskNote;

    const approvalDate = serviceAreaDetails?.RequestedAt ? dateFormat(serviceAreaDetails.RequestedAt) : null;
    const taskDate = serviceAreaDetails?.RequestedAt ? dateFormat(serviceAreaDetails.RequestedAt) : null;

    const RequestStatus = requestStatuses.find(status => status.ID === serviceAreaDetails?.RequestStatusId)?.Name;
    const isUnsuccessful = RequestStatus === "Unsuccessful";
    const isPending = RequestStatus === "Pending";
    const isApproved = RequestStatus === "Approved";
    const isInProgress = RequestStatus === "In Progress";
    const isCompleted = RequestStatus === "Completed";
    const isCancellationInProgress = RequestStatus === "Cancellation In Progress";
    const isCancellationAssigned = RequestStatus === "Cancellation Assigned";
    const canShowAdminButtons = isAdmin() && isPending;
    const canShowDocumentOperatorButtons = isDocumentOperator() && (isApproved || isInProgress);
    
    // ตรวจสอบว่าเป็น User ปกติ (ไม่ใช่ Admin หรือ Operator) และสถานะเป็น Completed
    const userRole = localStorage.getItem('role') || '';
    const isRegularUser = userRole === 'User';
    const canShowCancellationRequestButton = isRegularUser && isCompleted;
    
    // ตรวจสอบว่าเป็น DocumentOperator และสถานะเป็น Cancellation In Progress หรือ Cancellation Assigned
    const canShowCancellationSubmitButton = isDocumentOperator() && (isCancellationInProgress || isCancellationAssigned);

    // Fetch service area details by ID
    const getServiceAreaDetails = async () => {
        try {
            const encodedId = searchParams.get("service_area_id");
            const serviceAreaID = encodedId ? Base64.decode(decodeURIComponent(encodedId)) : null;

            if (!serviceAreaID) {
                setAlerts((prev) => [...prev, { type: "error", message: "Service area ID not found" }]);
                return;
            }

            const res = await GetServiceAreaDetailsByID(Number(serviceAreaID));
            if (res) {
                console.log(res);
                setServiceAreaDetails(res);
                setRequestStatusID(res.RequestStatusId);
            }
        } catch (error) {
            console.error("Error fetching service area details:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to fetch service area details" }]);
        }
    };

    // Fetch all statuses for the stepper
    const getRequestStatuses = async () => {
        try {
            const res = await GetRequestStatuses();
            if (res) {
                setRequestStatuses(res);
            }
        } catch (error) {
            console.error("Error fetching request statuses:", error);
        }
    };

    // Fetch business groups for approve popup
    const getBusinessGroups = async () => {
        try {
            const res = await ListBusinessGroups();
            if (res) {
                setBusinessGroups(res);
            }
        } catch (error) {
            console.error("Error fetching business groups:", error);
        }
    };

    // Handle approve action
    const handleApprove = () => {
        setOpenApprovePopup(true);
    };

    // Handle reject action
    const handleReject = async (note?: string) => {
        if (!serviceAreaDetails?.RequestNo) return;
        
        try {
            setIsSubmitting(true);
            const userID = Number(localStorage.getItem('userId')) || 0;
            
            // ใช้ API ที่รองรับทั้ง Operator และ Admin
            await RejectServiceAreaRequest(serviceAreaDetails.RequestNo, userID, note || "", "Admin");
            
            // Refresh data
            await getServiceAreaDetails();
            setAlerts((prev) => [...prev, { type: "success", message: "Service area request rejected successfully" }]);
        } catch (error) {
            console.error("Error rejecting request:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to reject request" }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle submit action for DocumentOperator
    const handleSubmit = () => {
        setOpenSubmitPopup(true);
    };

    // Handle submit service area
    const handleSubmitServiceArea = async () => {
        try {
            setIsSubmittingSubmit(true);
            
            // อัพเดท status ID เป็น 6 (Complete) หลังจาก submit สำเร็จ
            const requestServiceAreaID = serviceAreaDetails?.RequestNo;
            if (requestServiceAreaID) {
                await UpdateRequestServiceAreaStatus(requestServiceAreaID, 6);
                
                // Refresh data
                await getServiceAreaDetails();
                setAlerts((prev) => [...prev, { type: "success", message: "Service area submitted successfully" }]);
                
                // ปิด Popup
                setOpenSubmitPopup(false);
            }
        } catch (error) {
            console.error("Error submitting service area:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to submit service area" }]);
        } finally {
            setIsSubmittingSubmit(false);
        }
    };

    // Handle cancel action for DocumentOperator
    const handleCancel = () => {
        setOpenCancelPopup(true);
    };

    // Handle cancel confirmation for DocumentOperator
    const handleCancelConfirm = async (note?: string) => {
        if (!serviceAreaDetails?.RequestNo) return;
        
        try {
            setIsSubmitting(true);
            const userID = Number(localStorage.getItem('userId')) || 0;
            
            // ใช้ API ที่รองรับทั้ง Operator และ Admin
            await RejectServiceAreaRequest(serviceAreaDetails.RequestNo, userID, note || "", "Operator");
            
            // Refresh data
            await getServiceAreaDetails();
            setAlerts((prev) => [...prev, { type: "success", message: "Service area request cancelled successfully" }]);
            
            // ปิด Popup
            setOpenCancelPopup(false);
        } catch (error) {
            console.error("Error cancelling request:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to cancel request" }]);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle request cancellation for Request Owner
    const handleRequestCancellation = () => {
        // Navigate to cancel request form instead of showing popup
        if (serviceAreaDetails?.RequestNo) {
            navigate(`/service-area/cancel-request?request_id=${serviceAreaDetails.RequestNo}`);
        }
    };

    // Handle edit collaboration plans
    const handleEditCollaborationPlans = () => {
        setOpenEditCollaborationPlansPopup(true);
    };

    // Handle collaboration plans update confirmation
    const handleCollaborationPlansConfirm = async (updatedPlans: any[]) => {
        try {
            setIsUpdatingCollaborationPlans(true);
            
            // TODO: เรียก API สำหรับอัปเดต Collaboration Plans
            console.log("Updated plans:", updatedPlans);
            // await UpdateCollaborationPlans(serviceAreaDetails?.RequestNo, updatedPlans);
            
            // Refresh data
            await getServiceAreaDetails();
            setAlerts((prev) => [...prev, { type: "success", message: "Collaboration plans updated successfully" }]);
            
            // ปิด Popup
            setOpenEditCollaborationPlansPopup(false);
        } catch (error) {
            console.error("Error updating collaboration plans:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to update collaboration plans" }]);
        } finally {
            setIsUpdatingCollaborationPlans(false);
        }
    };

    // Handle request cancellation confirmation for Request Owner - removed as we now navigate to form
    // const handleRequestCancellationConfirm = async () => {
    //     if (!serviceAreaDetails?.RequestNo) return;
    //     
    //     try {
    //         setIsSubmittingCancellationRequest(true);
    //         
    //         // TODO: เรียก API สำหรับสร้าง CancelRequestServiceArea
    //         // await CreateCancelRequestServiceArea(serviceAreaDetails.RequestNo, data);
    //         
    //         // Refresh data
    //         await getServiceAreaDetails();
    //         setAlerts((prev) => [...prev, { type: "success", message: "Cancellation request submitted successfully" }]);
    //         
    //         // ปิด Popup
    //         setOpenRequestCancellationPopup(false);
    //     } catch (error) {
    //         console.error("Error submitting cancellation request:", error);
    //         setAlerts((prev) => [...prev, { type: "error", message: "Failed to submit cancellation request" }]);
    //     } finally {
    //         setIsSubmittingCancellationRequest(false);
    //     }
    // };

    // Handle submit cancellation for DocumentOperator
    const handleSubmitCancellation = () => {
        setOpenSubmitCancellationPopup(true);
    };

    // Handle submit cancellation confirmation for DocumentOperator
    const handleSubmitCancellationConfirm = async () => {
        if (!serviceAreaDetails?.RequestNo) return;
        
        try {
            setIsSubmittingCancellation(true);
            
            // TODO: เรียก API สำหรับ submit cancellation (อัพเดท status เป็น Successfully Cancelled)
            // await SubmitCancellation(serviceAreaDetails.RequestNo);
            
            // Refresh data
            await getServiceAreaDetails();
            setAlerts((prev) => [...prev, { type: "success", message: "Cancellation submitted successfully" }]);
            
            // ปิด Popup
            setOpenSubmitCancellationPopup(false);
        } catch (error) {
            console.error("Error submitting cancellation:", error);
            setAlerts((prev) => [...prev, { type: "error", message: "Failed to submit cancellation" }]);
        } finally {
            setIsSubmittingCancellation(false);
        }
    };

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    // Load all necessary data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getServiceAreaDetails(), getRequestStatuses(), getBusinessGroups()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

    // Helpers for Collaboration Plans
    const getYearFromDate = (dateString: string): string => {
        const parsedDate = new Date(dateString);
        if (Number.isNaN(parsedDate.getTime())) {
            return "-";
        }
        return String(parsedDate.getFullYear());
    };

    const sortedCollaborationPlans = serviceAreaDetails?.CollaborationPlans
        ? [...serviceAreaDetails.CollaborationPlans].sort((a, b) => {
            const yearA = a?.ProjectStartDate ? new Date(a.ProjectStartDate).getFullYear() : Number.POSITIVE_INFINITY;
            const yearB = b?.ProjectStartDate ? new Date(b.ProjectStartDate).getFullYear() : Number.POSITIVE_INFINITY;
            return yearA - yearB;
        })
        : [];

    return (
        <Box className="service-area-details-page">
            {/* Alert messages */}
            <AlertGroup alerts={alerts} setAlerts={setAlerts} />

            {/* Header section with title and back button */}
            <Container maxWidth={"xl"} sx={{ padding: "0px 0px !important" }}>
                <Grid container spacing={3}>
                    <Grid container className="title-box" direction={"row"} size={{ xs: 5 }} sx={{ gap: 1 }}>
                        <NotebookText size={26} />
                        <Typography variant="h5" className="title" sx={{ fontWeight: 700 }}>
                            Service Area Request Details
                        </Typography>
                    </Grid>
                    <Grid container size={{ xs: 7, md: 7 }} sx={{ justifyContent: "flex-end" }}>
                        <Box>
                            <Button variant="outlinedGray" onClick={handleBack}>
                                <ChevronLeft size={20} style={{ minWidth: "20px", minHeight: "20px" }} />
                                <Typography variant="textButtonClassic">Back</Typography>
                            </Button>
                        </Box>
                    </Grid>

                    {isLoadingData ? (
                        <Skeleton variant="rectangular" width="100%" height={140} sx={{ borderRadius: 2 }} />
                    ) : (
                        <>
                            {/* Stepper showing request progress */}
                            <Grid size={{ xs: 12, lg: isUnsuccessful ? 10 : 8 }}>
                                <ServiceAreaStepper requestStatuses={requestStatuses} requestStatusID={requestStatusID} />
                            </Grid>

                            {/* Info cards for approval and assignment */}
                            {serviceAreaDetails && !isUnsuccessful ? (
                                <>
                                    <InfoCard type="approved" title="Approved By" name={approverName || null} date={approvalDate} />
                                    <InfoCard type="assigned" title="Assigned To" name={taskUserName || null} date={taskDate} />
                                </>
                            ) : (
                                <InfoCard type="unsuccessful" title="Rejected By" name={approverName || taskUserName || null} date={approvalDate} />
                            )}
                        </>
                    )}

                    {/* Main data section */}
                    {isLoadingData ? (
                        <Skeleton variant="rectangular" width="100%" height={250} sx={{ borderRadius: 2 }} />
                    ) : (
                        <Card className="data-card" sx={{ width: "100%", borderRadius: 2 }}>
                            <CardContent>
                                <Grid
                                    container
                                    spacing={{
                                        xs: 3,
                                    }}
                                    sx={{
                                        px: {
                                            xs: 2,
                                            md: 6,
                                        },
                                        py: {
                                            xs: 1,
                                            md: 4,
                                        },
                                    }}
                                >


                                    {/* Row 1: Service Area Information and Company Information (50/50 split) */}
                                    <Grid size={{ xs: 12, md: 12, lg: 6 }}>
                                        {/* Service Area Information */}
                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                            Service Area Information
                                        </Typography>

                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Request No.
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.RequestNo || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Requested At
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.RequestedAt ? dateFormat(serviceAreaDetails.RequestedAt) : '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Company Name
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.CompanyName || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Company Description
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.DescriptionCompany || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Purpose of Using Space
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.PurposeOfUsingSpace || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Activities in Building
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.ActivitiesInBuilding || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Supporting Activities for Science Park
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.SupportingActivitiesForSciencePark || '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                    </Grid>

                                    <Grid size={{ xs: 12, md: 12, lg: 6 }}>
                                        {/* Company Information */}
                                        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                            Company Information
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Business Group
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.BusinessGroupName || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Company Size
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.CompanySizeName || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Corporate Registration Number
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.CorporateRegistrationNumber || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Main Services
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.MainServices || '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Registered Capital
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.RegisteredCapital ? `฿${serviceAreaDetails.RegisteredCapital.toLocaleString()}` : '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Hiring Rate
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.HiringRate ? `${serviceAreaDetails.HiringRate}%` : '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    Research Investment Value
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.ResearchInvestmentValue ? `฿${serviceAreaDetails.ResearchInvestmentValue.toLocaleString()}` : '-'}
                                                </Typography>
                                            </Grid>

                                            <Grid size={{ xs: 12 }}>
                                                <Typography variant="body2" color="text.secondary">
                                                    3-Year Growth Forecast
                                                </Typography>
                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                    {serviceAreaDetails?.ThreeYearGrowthForecast ? `${serviceAreaDetails.ThreeYearGrowthForecast}%` : '-'}
                                                </Typography>
                                            </Grid>
                                        </Grid>

                                    </Grid>

                                    {/* Row 2: Collaboration Plans (full width) */}
                                    {sortedCollaborationPlans && sortedCollaborationPlans.length > 0 && (
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Collaboration Plans
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Edit size={16} />}
                                                        onClick={handleEditCollaborationPlans}
                                                        sx={{ 
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </Box>
                                                {sortedCollaborationPlans.map((plan, index) => (
                                                    <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < sortedCollaborationPlans.length - 1 ? "1px solid #e0e0e0" : "none" }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Plan {index + 1}
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {plan.CollaborationPlan || '-'}
                                                        </Typography>
                                                        {plan.CollaborationBudget && (
                                                            <Typography variant="body2" sx={{ mt: 1 }}>
                                                                Budget: ฿{plan.CollaborationBudget.toLocaleString()}
                                                            </Typography>
                                                        )}
                                                        {plan.ProjectStartDate && (
                                                            <Typography variant="body2">
                                                                Start Year: {getYearFromDate(plan.ProjectStartDate)}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Row 3: Service Area Documents and Contract Information */}
                                    {(serviceAreaDetails?.ServiceAreaDocumentId || serviceAreaDetails?.ServiceRequestDocument) && (
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Documents & Contract Information
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Edit size={16} />}
                                                        onClick={() => {/* TODO: Open Edit Documents & Contract Popup */}}
                                                        sx={{ 
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </Box>

                                                {/* Contract Information */}
                                                {(serviceAreaDetails?.ContractNumber || serviceAreaDetails?.ContractStartAt || serviceAreaDetails?.RoomNumber || serviceAreaDetails?.ServiceUserTypeName) && (
                                                    <Box sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                                                            Contract Details
                                                        </Typography>
                                                        <Grid container spacing={2}>
                                                            {serviceAreaDetails?.ContractNumber && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Contract Number
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {serviceAreaDetails.ContractNumber}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.FinalContractNumber && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Final Contract Number
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {serviceAreaDetails.FinalContractNumber}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.ContractStartAt && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Contract Start Date
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {dateFormat(serviceAreaDetails.ContractStartAt)}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.ContractEndAt && serviceAreaDetails.ContractEndAt !== "0001-01-01T00:00:00Z" && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Contract End Date
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {dateFormat(serviceAreaDetails.ContractEndAt)}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.RoomNumber && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Room Number
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {serviceAreaDetails.RoomNumber}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.ServiceUserTypeName && (
                                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Service User Type
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {serviceAreaDetails.ServiceUserTypeName}
                                                                    </Typography>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </Box>
                                                )}

                                                {/* Service Area Documents */}
                                                {(serviceAreaDetails?.ServiceContractDocument || serviceAreaDetails?.AreaHandoverDocument || serviceAreaDetails?.QuotationDocument) && (
                                                    <Box sx={{ mb: 3 }}>
                                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'black' }}>
                                                            Service Area Documents
                                                        </Typography>
                                                        <Grid container spacing={2}>
                                                            {serviceAreaDetails?.ServiceContractDocument && (
                                                                <Grid size={{ xs: 12, sm: 12 }}>
                                                                    <Grid container spacing={2} alignItems="center">
                                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                                            <Box>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    Service Contract Document:
                                                                                </Typography>
                                                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                    {serviceAreaDetails.ServiceContractDocument.split('/').pop()}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, sm: 8 }}>
                                                                            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                <Button size="small" variant="outlinedGray" onClick={() => DownloadServiceContractDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails?.ServiceContractDocument?.split('/').pop())}>
                                                                                    <Download size={16} style={{ marginRight: 6 }} />
                                                                                    Download
                                                                                </Button>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.AreaHandoverDocument && (
                                                                <Grid size={{ xs: 12, sm: 12 }}>
                                                                    <Grid container spacing={2} alignItems="center">
                                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                                            <Box>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    Area Handover Document:
                                                                                </Typography>
                                                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                    {serviceAreaDetails.AreaHandoverDocument.split('/').pop()}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, sm: 8 }}>
                                                                            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                <Button size="small" variant="outlinedGray" onClick={() => DownloadAreaHandoverDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails?.AreaHandoverDocument?.split('/').pop())}>
                                                                                    <Download size={16} style={{ marginRight: 6 }} />
                                                                                    Download
                                                                                </Button>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            )}
                                                            {serviceAreaDetails?.QuotationDocument && (
                                                                <Grid size={{ xs: 12, sm: 12 }}>
                                                                    <Grid container spacing={2} alignItems="center">
                                                                        <Grid size={{ xs: 12, sm: 4 }}>
                                                                            <Box>
                                                                                <Typography variant="body2" color="text.secondary">
                                                                                    Quotation Document:
                                                                                </Typography>
                                                                                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                    {serviceAreaDetails.QuotationDocument.split('/').pop()}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Grid>
                                                                        <Grid size={{ xs: 12, sm: 8 }}>
                                                                            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                <Button size="small" variant="outlinedGray" onClick={() => DownloadQuotationDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails?.QuotationDocument?.split('/').pop())}>
                                                                                    <Download size={16} style={{ marginRight: 6 }} />
                                                                                    Download
                                                                                </Button>
                                                                            </Box>
                                                                        </Grid>
                                                                    </Grid>
                                                                </Grid>
                                                            )}
                                                        </Grid>
                                                    </Box>
                                                )}

                                                {/* Service Request Document (if exists) */}
                                                {serviceAreaDetails?.ServiceRequestDocument && (
                                                    <Box>
                                                        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'black' }}>
                                                            Request Document
                                                        </Typography>
                                                        <Grid container spacing={2} alignItems="center">
                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                <Box>
                                                                    <Typography variant="body2" color="text.secondary">
                                                                        Request Document:
                                                                    </Typography>
                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                        {serviceAreaDetails.ServiceRequestDocument.split('/').pop()}
                                                                    </Typography>
                                                                </Box>
                                                            </Grid>
                                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                    <Button size="small" variant="outlinedGray" onClick={() => DownloadServiceRequestDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails?.ServiceRequestDocument?.split('/').pop())}>
                                                                        <Download size={16} style={{ marginRight: 6 }} />
                                                                        Download
                                                                    </Button>
                                                                </Box>
                                                            </Grid>
                                                        </Grid>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Cancellation Details Section (if exists) */}
                                    {serviceAreaDetails?.CancellationDetails && (
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        Cancellation Details
                                                    </Typography>
                                                    <Button
                                                        variant="outlined"
                                                        size="small"
                                                        startIcon={<Edit size={16} />}
                                                        onClick={() => {/* TODO: Open Edit Cancellation Details Popup */}}
                                                        sx={{ 
                                                            minWidth: 'auto',
                                                            px: 2,
                                                            py: 0.5,
                                                            fontSize: '0.875rem'
                                                        }}
                                                    >
                                                        Edit
                                                    </Button>
                                                </Box>
                                                
                                                <Grid container spacing={2}>
                                                    {/* Cancellation Requester Information */}
                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Cancellation Requester
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails.CancellationDetails.CancellationRequesterName}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Requester Email
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails.CancellationDetails.CancellationRequesterEmail}
                                                        </Typography>
                                                    </Grid>

                                                    <Grid size={{ xs: 12, sm: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Cancellation Date
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {dateFormat(serviceAreaDetails.CancellationDetails.CreatedAt)}
                                                        </Typography>
                                                    </Grid>

                                                    {/* Final Contract Number */}
                                                    {serviceAreaDetails?.FinalContractNumber && (
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Final Contract Number
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {serviceAreaDetails.FinalContractNumber}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {/* Purpose of Cancellation */}
                                                    <Grid size={{ xs: 12 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Purpose of Cancellation
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails.CancellationDetails.PurposeOfCancellation || '-'}
                                                        </Typography>
                                                    </Grid>

                                                    {/* Project Activities */}
                                                    {serviceAreaDetails.CancellationDetails.ProjectActivities && (
                                                        <Grid size={{ xs: 12 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Project Activities
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {serviceAreaDetails.CancellationDetails.ProjectActivities}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {/* Annual Income */}
                                                    {serviceAreaDetails.CancellationDetails.AnnualIncome && (
                                                        <Grid size={{ xs: 12, sm: 6 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Annual Income
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                ฿{serviceAreaDetails.CancellationDetails.AnnualIncome.toLocaleString()}
                                                            </Typography>
                                                        </Grid>
                                                    )}

                                                    {/* Cancellation Documents */}
                                                    {(serviceAreaDetails.CancellationDetails.CancellationDocument || serviceAreaDetails.CancellationDetails.BankAccountDocument || serviceAreaDetails?.RefundGuaranteeDocument) && (
                                                        <Grid size={{ xs: 12 }}>
                                                            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: 'black' }}>
                                                                Cancellation Documents
                                                            </Typography>
                                                            <Grid container spacing={2}>
                                                                {/* Refund Guarantee Document */}
                                                                {serviceAreaDetails?.RefundGuaranteeDocument && (
                                                                    <Grid size={{ xs: 12, sm: 12 }}>
                                                                        <Grid container spacing={2} alignItems="center">
                                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                                <Box>
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        Refund Guarantee Document:
                                                                                    </Typography>
                                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                        {serviceAreaDetails.RefundGuaranteeDocument.split('/').pop()}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Grid>
                                                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                                                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                    <Button size="small" variant="outlinedGray" onClick={() => DownloadRefundGuaranteeDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails?.RefundGuaranteeDocument?.split('/').pop())}>
                                                                                        <Download size={16} style={{ marginRight: 6 }} />
                                                                                        Download
                                                                                    </Button>
                                                                                </Box>
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Grid>
                                                                )}

                                                                {/* Cancellation Document */}
                                                                {serviceAreaDetails.CancellationDetails.CancellationDocument && (
                                                                    <Grid size={{ xs: 12, sm: 12 }}>
                                                                        <Grid container spacing={2} alignItems="center">
                                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                                <Box>
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        Cancellation Document:
                                                                                    </Typography>
                                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                        {serviceAreaDetails.CancellationDetails.CancellationDocument.split('/').pop()}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Grid>
                                                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                                                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                    <Button size="small" variant="outlinedGray" onClick={() => DownloadCancellationDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails.CancellationDetails?.CancellationDocument?.split('/').pop())}>
                                                                                        <Download size={16} style={{ marginRight: 6 }} />
                                                                                        Download
                                                                                    </Button>
                                                                                </Box>
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Grid>
                                                                )}

                                                                {/* Bank Account Document */}
                                                                {serviceAreaDetails.CancellationDetails.BankAccountDocument && (
                                                                    <Grid size={{ xs: 12, sm: 12 }}>
                                                                        <Grid container spacing={2} alignItems="center">
                                                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                                                <Box>
                                                                                    <Typography variant="body2" color="text.secondary">
                                                                                        Bank Account Document:
                                                                                    </Typography>
                                                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                                        {serviceAreaDetails.CancellationDetails.BankAccountDocument.split('/').pop()}
                                                                                    </Typography>
                                                                                </Box>
                                                                            </Grid>
                                                                            <Grid size={{ xs: 12, sm: 8 }}>
                                                                                <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
                                                                                    <Button size="small" variant="outlinedGray" onClick={() => DownloadBankAccountDocument(serviceAreaDetails?.RequestNo as number, serviceAreaDetails.CancellationDetails?.BankAccountDocument?.split('/').pop())}>
                                                                                        <Download size={16} style={{ marginRight: 6 }} />
                                                                                        Download
                                                                                    </Button>
                                                                                </Box>
                                                                            </Grid>
                                                                        </Grid>
                                                                    </Grid>
                                                                )}
                                                            </Grid>
                                                        </Grid>
                                                    )}
                                                </Grid>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Notes Section (if exists) */}
                                    {(approvalNote || taskNote) && (
                                        <Grid size={{ xs: 12, md: 12 }}>
                                            <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                                    Notes
                                                </Typography>
                                                {approvalNote && (
                                                    <Box sx={{ mb: 2 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                        Cancellation
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {approvalNote}
                                                        </Typography>
                                                    </Box>
                                                )}
                                                {taskNote && (
                                                    <Box>
                                                        <Typography variant="body2" color="text.secondary">
                                                        Cancellation
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {taskNote}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Action buttons for Admin when status is Pending */}
                                    <Grid container size={{ xs: 12, md: 12 }} spacing={2} sx={{ justifyContent: "flex-end", mt: 1 }}>
                                        {canShowAdminButtons && (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                {/* Reject button */}
                                                <Button
                                                    variant="outlinedCancel"
                                                    onClick={() => setOpenRejectPopup(true)}
                                                    disabled={isSubmitting}
                                                    sx={{
                                                        minWidth: "0px",
                                                        px: 2,
                                                        py: 1,
                                                    }}
                                                >
                                                    <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Reject</Typography>
                                                </Button>

                                                {/* Approve button */}
                                                <Button 
                                                    variant="contained" 
                                                    onClick={handleApprove}
                                                    disabled={isSubmitting}
                                                    sx={{ px: 4, py: 1 }}
                                                >
                                                    <Check size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Approve</Typography>
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Action buttons for DocumentOperator when status is Pending */}
                                        {canShowDocumentOperatorButtons && (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                {/* Cancel button */}
                                                <Button
                                                    variant="outlinedCancel"
                                                    onClick={handleCancel}
                                                    disabled={isSubmitting}
                                                    sx={{
                                                        minWidth: "0px",
                                                        px: 2,
                                                        py: 1,
                                                    }}
                                                >
                                                    <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Cancel</Typography>
                                                </Button>

                                                {/* Submit button */}
                                                <Button 
                                                    variant="contained" 
                                                    onClick={handleSubmit}
                                                    disabled={isSubmittingSubmit}
                                                    sx={{ px: 4, py: 1 }}
                                                >
                                                    <Send size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Submit</Typography>
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Action button for Request Owner when status is Completed */}
                                        {canShowCancellationRequestButton && (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                {/* Request Cancellation button */}
                                                <Button 
                                                    variant="contained" 
                                                    onClick={handleRequestCancellation}
                                                    sx={{ px: 4, py: 1 }}
                                                >
                                                    <X size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Cancel Service Area Request</Typography>
                                                </Button>
                                            </Box>
                                        )}

                                        {/* Action button for DocumentOperator when status is Cancellation In Progress or Cancellation Assigned */}
                                        {canShowCancellationSubmitButton && (
                                            <Box sx={{ gap: 1, display: "flex" }}>
                                                {/* Submit Cancellation button */}
                                                <Button 
                                                    variant="contained" 
                                                    onClick={handleSubmitCancellation}
                                                    disabled={isSubmittingCancellation}
                                                    sx={{ px: 4, py: 1 }}
                                                >
                                                    <Send size={18} style={{ minWidth: "18px", minHeight: "18px" }} />
                                                    <Typography variant="textButtonClassic">Submit Cancellation</Typography>
                                                </Button>
                                            </Box>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Container>

            {/* Approve Service Area Controller */}
            <ApproveServiceAreaController
                open={openApprovePopup}
                onClose={() => setOpenApprovePopup(false)}
                requestId={serviceAreaDetails?.RequestNo || null}
                businessGroupId={serviceAreaDetails?.BusinessGroupID || null}
                businessGroups={businessGroups}
                companyName={serviceAreaDetails?.CompanyName}
                onApproved={async () => {
                    await getServiceAreaDetails();
                    setAlerts((prev) => [...prev, { type: "success", message: "Service area request approved successfully" }]);
                }}
            />

            {/* Admin Reject Service Area Popup */}
            <ConfirmDialog
                open={openRejectPopup}
                setOpenConfirm={setOpenRejectPopup}
                handleFunction={handleReject}
                title="Reject Service Area Request"
                message={`Are you sure you want to reject the service area request for ${serviceAreaDetails?.CompanyName || 'this company'}? Please provide a reason for rejection.`}
                buttonActive={isSubmitting}
                showNoteField={true}
            />

            {/* DocumentOperator Cancel Service Area Popup */}
            <ConfirmDialog
                open={openCancelPopup}
                setOpenConfirm={setOpenCancelPopup}
                handleFunction={handleCancelConfirm}
                title="Cancel Service Area Request"
                message={`Are you sure you want to cancel the service area request for ${serviceAreaDetails?.CompanyName || 'this company'}? Please provide a reason for cancellation.`}
                buttonActive={isSubmitting}
                showNoteField={true}
            />

            {/* Submit Service Area Popup */}
            <SubmitServiceAreaPopup
                open={openSubmitPopup}
                onClose={() => setOpenSubmitPopup(false)}
                onConfirm={handleSubmitServiceArea}
                companyName={serviceAreaDetails?.CompanyName}
                buttonActive={isSubmittingSubmit}
                requestServiceAreaID={serviceAreaDetails?.RequestNo || 0}
            />

            {/* Edit Collaboration Plans Popup */}
            <EditCollaborationPlansPopup
                open={openEditCollaborationPlansPopup}
                onClose={() => setOpenEditCollaborationPlansPopup(false)}
                onConfirm={handleCollaborationPlansConfirm}
                existingPlans={sortedCollaborationPlans || []}
                requestServiceAreaID={serviceAreaDetails?.RequestNo || 0}
                buttonActive={isUpdatingCollaborationPlans}
            />

            {/* Request Cancellation Popup for Request Owner - removed as we now navigate to form */}
            {/* <ConfirmDialog
                open={openRequestCancellationPopup}
                setOpenConfirm={setOpenRequestCancellationPopup}
                handleFunction={handleRequestCancellationConfirm}
                title="Request Service Area Cancellation"
                message={`Are you sure you want to request cancellation for the service area request for ${serviceAreaDetails?.CompanyName || 'this company'}? Please provide a reason for cancellation.`}
                buttonActive={isSubmittingCancellationRequest}
                showNoteField={true}
            /> */}

            {/* Submit Cancellation Popup for DocumentOperator */}
            <ConfirmDialog
                open={openSubmitCancellationPopup}
                setOpenConfirm={setOpenSubmitCancellationPopup}
                handleFunction={handleSubmitCancellationConfirm}
                title="Submit Service Area Cancellation"
                message={`Are you sure you want to submit the cancellation for the service area request for ${serviceAreaDetails?.CompanyName || 'this company'}? This will mark the cancellation as successfully completed.`}
                buttonActive={isSubmittingCancellation}
                showNoteField={false}
            />
        </Box>
    );
}

export default ServiceAreaDetails;
