import { useEffect, useState } from "react";
import { Box, Button, Card, CardContent, Container, Grid, Skeleton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleLeft, faCheck, faPaperPlane, faRepeat, faXmark } from "@fortawesome/free-solid-svg-icons";

import "./ServiceAreaDetails.css";

import { apiUrl, GetServiceAreaDetailsByID, GetRequestStatuses } from "../../services/http";
import { RequestStatusesInterface } from "../../interfaces/IRequestStatuses";

import AlertGroup from "../../components/AlertGroup/AlertGroup";
import ConfirmDialog from "../../components/ConfirmDialog/ConfirmDialog";
import InfoCard from "../../components/InfoCard/InfoCard";
import RequestStepper from "../../components/RequestStepper/RequestStepper";

import dateFormat from "../../utils/dateFormat";

import { useSearchParams } from "react-router-dom";
import { Base64 } from "js-base64";
import { Check, ChevronLeft, NotebookText, Repeat, Send, X, Eye } from "lucide-react";

// Interface for Service Area Details response
interface ServiceAreaDetailsInterface {
    RequestNo: number;
    RequestedAt: string;
    RequestStatusId: number;
    CompanyName: string;
    DescriptionCompany: string;
    PurposeOfUsingSpace: string;
    ActivitiesInBuilding: string;
    SupportingActivitiesForSciencePark: string;
    ServiceRequestDocument: string;
    CollaborationPlans: any[];
    CorporateRegistrationNumber?: string;
    BusinessGroupName?: string;
    CompanySizeName?: string;
    MainServices?: string;
    RegisteredCapital?: number;
    HiringRate?: number;
    ResearchInvestmentValue?: number;
    ThreeYearGrowthForecast?: number;
    ApproverUserName?: string;
    ApprovalNote?: string;
    TaskUserName?: string;
    TaskNote?: string;
    ServiceAreaDocumentId?: number;
}

function ServiceAreaDetails() {
    // Request data
    const [serviceAreaDetails, setServiceAreaDetails] = useState<ServiceAreaDetailsInterface>();
    const [requestStatuses, setRequestStatuses] = useState<RequestStatusesInterface[]>([]);
    const [requestStatusID, setRequestStatusID] = useState(0);

    // UI state
    const [alerts, setAlerts] = useState<{ type: "warning" | "error" | "success"; message: string }[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);

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
    const isPending = RequestStatus === "Pending";
    const isApproved = RequestStatus === "Approved";
    const isInProgress = RequestStatus === "In Progress";
    const isCompleted = RequestStatus === "Completed";
    const isUnsuccessful = RequestStatus === "Unsuccessful";

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

    // Handle back navigation
    const handleBack = () => {
        navigate(-1);
    };

    // Load all necessary data on mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                await Promise.all([getServiceAreaDetails(), getRequestStatuses()]);
                setIsLoadingData(false);
            } catch (error) {
                console.error("Error fetching initial data:", error);
            }
        };

        fetchInitialData();
    }, []);

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
                            <Button variant="outlined" onClick={handleBack}>
                                <ChevronLeft size={20} style={{ minWidth: "20px", minHeight: "20px" }}/>
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
                                <RequestStepper requestStatuses={requestStatuses} requestStatusID={requestStatusID} />
                            </Grid>

                            {/* Info cards for approval and assignment */}
                            {serviceAreaDetails && !isUnsuccessful ? (
                                <>
                                    <InfoCard type="approved" title="Approved By" name={approverName || null} date={approvalDate} />
                                    <InfoCard type="assigned" title="Assigned To" name={taskUserName || null} date={taskDate} />
                                </>
                            ) : (
                                <InfoCard type="unsuccessful" title="Cancelled By" name={approverName || taskUserName || null} date={approvalDate} />
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
                                    <Grid size={{ xs: 12, md: 12 }}>
                                        <Typography variant="body1" sx={{ fontSize: 18, fontWeight: 600 }}>
                                            Information
                                        </Typography>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 12, lg: 6 }}>
                                        {/* Service Area Information Table */}
                                        <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, p: 2 }}>
                                            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                                Service Area Information
                                            </Typography>
                                            
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 6 }}>
                                                    <Typography variant="body2" color="text.secondary">
                                                        Request No.
                                                    </Typography>
                                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                        {serviceAreaDetails?.RequestNo || '-'}
                                                    </Typography>
                                                </Grid>
                                                
                                                <Grid size={{ xs: 6 }}>
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
                                        </Box>
                                    </Grid>

                                    <Grid container size={{ xs: 12, md: 12, lg: 6 }} direction="column">
                                        {/* Company Information */}
                                        <Grid size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
                                            <Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
                                                Company Information
                                            </Typography>
                                            <Box sx={{ border: "1px solid #08aff1", borderRadius: 2, px: 2, py: 2 }}>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Business Group
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails?.BusinessGroupName || '-'}
                                                        </Typography>
                                                    </Grid>
                                                    
                                                    <Grid size={{ xs: 6 }}>
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
                                                    
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Registered Capital
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails?.RegisteredCapital ? `฿${serviceAreaDetails.RegisteredCapital.toLocaleString()}` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                    
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Hiring Rate
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails?.HiringRate ? `${serviceAreaDetails.HiringRate}%` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                    
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Research Investment Value
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails?.ResearchInvestmentValue ? `฿${serviceAreaDetails.ResearchInvestmentValue.toLocaleString()}` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                    
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            3-Year Growth Forecast
                                                        </Typography>
                                                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                            {serviceAreaDetails?.ThreeYearGrowthForecast ? `${serviceAreaDetails.ThreeYearGrowthForecast}%` : '-'}
                                                        </Typography>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Grid>

                                        {/* Collaboration Plans */}
                                        {serviceAreaDetails?.CollaborationPlans && serviceAreaDetails.CollaborationPlans.length > 0 && (
                                            <Grid size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
                                                <Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
                                                    Collaboration Plans
                                                </Typography>
                                                <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, px: 2, py: 2 }}>
                                                    {serviceAreaDetails.CollaborationPlans.map((plan, index) => (
                                                        <Box key={index} sx={{ mb: 2, pb: 2, borderBottom: index < serviceAreaDetails.CollaborationPlans.length - 1 ? "1px solid #e0e0e0" : "none" }}>
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
                                                                    Start Date: {dateFormat(plan.ProjectStartDate)}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    ))}
                                                </Box>
                                            </Grid>
                                        )}

                                        {/* Notes Section */}
                                        {(approvalNote || taskNote) && (
                                            <Grid size={{ xs: 12, md: 12 }} sx={{ pt: 2 }}>
                                                <Typography className="title-list" variant="body1" sx={{ pb: 1 }}>
                                                    Notes
                                                </Typography>
                                                <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 2, px: 2, py: 2 }}>
                                                    {approvalNote && (
                                                        <Box sx={{ mb: 2 }}>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Approval Note
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {approvalNote}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                    {taskNote && (
                                                        <Box>
                                                            <Typography variant="body2" color="text.secondary">
                                                                Task Note
                                                            </Typography>
                                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                                {taskNote}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Grid>
                                        )}
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Container>
        </Box>
    );
}

export default ServiceAreaDetails;
